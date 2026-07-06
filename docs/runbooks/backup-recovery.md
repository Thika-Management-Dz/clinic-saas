# Backup & Recovery Runbook

- **Owner:** ops_superuser (the single named role with `BYPASSRLS` — ADR-001)
- **Strategy:** 3-2-1-1-0 rule on top of PostgreSQL continuous WAL archiving
- **Blueprint reference:** §13, §12.1
- **RPO target:** ≤ 15 minutes (continuous WAL archive)
- **RTO target:** ≤ 4 hours (single clinic can revert to paper that long)
- **PITR granularity:** ≤ 5 minutes

---

## 1. Strategy overview

The 3-2-1-1-0 rule:

| Component | Meaning |
|---|---|
| **3** copies of the data | Production + 2 backups |
| **2** different media types | S3-compatible object storage + offline HDD |
| **1** offsite copy | CERIST S3 (different provider than primary) |
| **1** immutable / air-gapped copy | Weekly encrypted external HDD in the clinic safe |
| **0** errors verified by restore test | Quarterly restore test per NIST SP 800-34 |

### Repositories

| Repo | Location | Type | Tooling | Encryption |
|---|---|---|---|---|
| Repo 1 (primary) | **Djezzy Cloud S3** | s3 | `repo1-type=s3` | AES-256-CBC client-side |
| Repo 2 (secondary) | **CERIST object storage** (different provider) | s3 | `repo2-type=s3` | AES-256-CBC client-side |
| Repo 3 (offline) | **Weekly encrypted external HDD** in clinic safe | posix | SFTP push | AES-256-CBC client-side |
| DR replica | **Algérie Télécom Constantine DC** | streaming | PostgreSQL streaming replication (async) | in-transit TLS + at-rest LUKS |

### Schedule

| Backup type | Frequency | Retention |
|---|---|---|
| Full | Nightly at 02:00 Algeria time | 4 weeks |
| Differential | Every 6 hours | 2 weeks |
| Incremental | Every hour (optional) | 7 days |
| WAL archive | Continuous (per segment) | 30 days |
| Monthly full | 1st of month | 12 months |
| Yearly full | 1 January | 7 years |

### Encryption

- **AES-256-CBC client-side** via pgBackRest — even if a backup repository
  is compromised, the data is unintelligible without the passphrase.
- The pgBackRest AES passphrase is stored in the **OS keyring** (or a
  self-hosted HashiCorp Vault on a separate Algerian VPS), **NEVER** in the
  repo config, **NEVER** in env files committed to git, **NEVER** on the
  same host as the backup repository.

> ⚠️ **WARNING**: If both the AES passphrase and a backup repository live on
> the same host, ransomware compromises both. Use OS keyring or KMS on a
> separate VM. Document the passphrase-recovery procedure below (§6).

---

## 2. pgBackRest configuration (reference)

```ini
# /etc/pgbackrest/pgbackrest.conf on the Postgres VM
[global]
repo1-type=s3
repo1-s3-endpoint=s3.djezzy-cloud.dz
repo1-s3-bucket=clinic-saas-backup
repo1-s3-region=dz-algiers
repo1-retention-full=4
repo1-retention-diff=2
repo1-retention-incr=7
repo1-cipher-type=aes-256-cbc
repo1-cipher-pass=<FROM OS KEYRING — never inline>

repo2-type=s3
repo2-s3-endpoint=s3.cerist.dz
repo2-s3-bucket=clinic-saas-backup-secondary
repo2-s3-region=dz
repo2-retention-full=4
repo2-retention-diff=2
repo2-cipher-type=aes-256-cbc
repo2-cipher-pass=<FROM OS KEYRING — never inline>

log-level-console=info
log-level-file=detail
process-max=4
compress-type=lz4

[clinic-saas]
pg1-host=/var/run/postgresql
pg1-port=5432
pg1-user=postgres
pg1-database=postgres
```

WAL archiving is enabled in `postgresql.conf`:

```ini
archive_mode = on
archive_command = 'pgbackrest --stanza=clinic-saas archive-push %p'
wal_level = replica
```

---

## 3. Standard backup commands

```bash
# Full backup (nightly 02:00 via cron / systemd timer)
sudo -u postgres pgbackrest --stanza=clinic-saas --type=full backup

# Differential (every 6h)
sudo -u postgres pgbackrest --stanza=clinic-saas --type=diff backup

# Incremental (hourly, optional)
sudo -u postgres pgbackrest --stanza=clinic-saas --type=incr backup

# Verify backup integrity
sudo -u postgres pgbackrest --stanza=clinic-saas verify

# Show backup status
sudo -u postgres pgbackrest --stanza=clinic-saas info
```

The Drôme Télécom Constantine DC DR replica uses PostgreSQL streaming
replication (async) — a `primary_conninfo` on the DR VM points at the
primary. It is **not** a pgBackRest target; it provides hot-standby
read-only replication with sub-second lag under normal conditions.

---

## 4. Restore procedure

### 4.1 PITR restore to a point in time (≤ 5 min granularity)

> Use this when you need to recover from a destructive operation (DROP
> TABLE, accidental DELETE without WHERE, ransomware encryption before
> containment). The target time is the moment **before** the destructive
> event.

```bash
# Step 1: Stop Postgres on the recovery VM (or the primary if it's the only host)
sudo systemctl stop postgresql@17-main

# Step 2: Move the existing data dir aside (DO NOT DELETE — forensic evidence)
sudo mv /var/lib/postgresql/17/main /var/lib/postgresql/17/main.pre-restore.$(date +%s)

# Step 3: Restore from pgBackRest to a target timestamp
sudo -u postgres pgbackrest --stanza=clinic-saas \
  --type=time \
  --target='2026-07-06 14:23:00+01' \
  --target-action=promote \
  restore

# Step 4: Start Postgres — it replays WAL up to the target and then promotes
sudo systemctl start postgresql@17-main

# Step 5: Verify
sudo -u postgres psql -c "SELECT count(*) FROM patient;"
sudo -u postgres psql -c "SELECT pg_current_wal_lsn();"

# Step 6: Re-run Drizzle migrations to ensure schema is at the latest version
# (only if the backup predates a migration that was applied after the target time)
pnpm --filter @clinic-saas/db drizzle-kit migrate

# Step 7: Smoke tests (see §5)
```

### 4.2 Full restore to latest committed transaction

> Use this when the primary is lost (hardware failure, VM corruption) and
> you want the latest possible state.

```bash
sudo systemctl stop postgresql@17-main
sudo mv /var/lib/postgresql/17/main /var/lib/postgresql/17/main.pre-restore.$(date +%s)

# No --type=time → restore to end of WAL archive (latest)
sudo -u postgres pgbackrest --stanza=clinic-saas restore

sudo systemctl start postgresql@17-main
```

### 4.3 Restore to a different VM (disaster recovery)

> Use this when the primary VM is unrecoverable. Provision a new CERIST
> Cloud VPS with the same PostgreSQL 17 + pgBackRest setup, then:

```bash
# Install pgBackRest config (same as §2, same AES passphrase from keyring)
# Then:
sudo -u postgres pgbackrest --stanza=clinic-saas restore
sudo systemctl start postgresql@17-main

# Re-point the NestJS backend DATABASE_URL to the new VM via env / config
# Re-point the DR streaming-replica primary_conninfo to the new VM
# Smoke tests (§5)
```

### 4.4 Decrypting an offline HDD backup (last resort)

> Use this only if both Djezzy Cloud S3 and CERIST S3 are unavailable
> (extreme scenario: sovereign-cloud outage). The weekly HDD in the clinic
> safe holds the same encrypted backup set.

```bash
# Mount the HDD
sudo mount /dev/sdX1 /mnt/hdd-backup

# Configure a posix repo in pgBackRest
# repo3-type=posix
# repo3-path=/mnt/hdd-backup
# repo3-cipher-pass=<FROM KEYRING>

sudo -u postgres pgbackrest --stanza=clinic-saas --repo=3 restore
sudo systemctl start postgresql@17-main
```

---

## 5. Quarterly restore test (NIST SP 800-34)

Per Blueprint §13 and NIST SP 800-34 7-step ISCP, **once per quarter** the
operator restores the latest backup to the staging VM and runs smoke tests.
This is the **"0 errors"** in 3-2-1-1-0.

### Procedure

1. Provision a fresh staging VM (or wipe the existing one).
2. Install PostgreSQL 17 + pgBackRest with the same config as production
   (§2).
3. Run `pgbackrest restore` (latest full + WAL replay to end of archive).
4. Start Postgres.
5. Run `pnpm --filter @clinic-saas/db drizzle-kit migrate` (should be a
   no-op if the schema is already at the latest).
6. Run smoke tests:
   ```bash
   # Schema integrity
   psql -c "\dt"                                              # all tenant-scoped tables present
   psql -c "SELECT count(*) FROM clinic;"                     # ≥ 1 tenant
   psql -c "SELECT count(*) FROM patient WHERE deleted_at IS NULL;"
   psql -c "SELECT count(*) FROM audit_log;"                  # audit log intact

   # Hash-chain integrity (Blueprint §9.7)
   psql -c "SELECT audit.verify_hash_chain();"                # custom function

   # RLS sanity
   psql -c "SET app.current_tenant = '00000000-0000-0000-0000-000000000000';
            SELECT count(*) FROM patient;"  # must be 0 (no such tenant)

   # App-level smoke (NestJS + Next.js)
   pnpm --filter @clinic-saas/api dev &
   pnpm --filter @clinic-saas/web dev &
   curl http://localhost:3000/api/health   # 200 OK
   ```
7. Document the result in `docs/runbooks/restore-test-log.md`:
   - Date, operator, VM used.
   - Backup set restored (full + diff + WAL range).
   - Restore time (target: ≤ 4 hours RTO).
   - Smoke test results (pass/fail per check).
   - Issues encountered and remediation.

**If any smoke test fails:** the backup is **not** considered verified; the
operator MUST diagnose, fix the backup/restore pipeline, and re-run the
test within 2 weeks. The "0 errors" property is non-negotiable.

---

## 6. Passphrase recovery procedure

If the OS keyring becomes inaccessible (VM rebuild, keyring corruption):

1. **Primary**: retrieve the AES passphrase from the **secondary keyring**
   on a separate Algerian VPS (HashiCorp Vault sealed/unsealed with
   Shamir's secret sharing held by 2 of 3 operator-appointed keyholders).
2. **Secondary**: if the Vault is also lost, retrieve the passphrase from
   the **paper backup** stored in a sealed envelope in the clinic safe
   (access requires clinic_admin + DPO both present, signed access log
   entry).
3. **Last resort**: if all of the above fail, the backup is **unrecoverable**
   — this is a catastrophic incident; activate `docs/runbooks/breach-response.md`
   (an unrecoverable backup of health data is a notifiable availability
   breach under Law 25-11).

The passphrase recovery procedure is tested annually as part of the
breach-response drill (§8 of `breach-response.md`).

---

## 7. Common pitfalls

| Pitfall | Mitigation |
|---|---|
| AES passphrase committed to git | Pre-commit hook + git-secrets; CI greps the repo for high-entropy strings |
| WAL archive falls behind (disk full on S3, network issue) | Prometheus alert on `pg_stat_archiver.last_archived_time > 15 min ago` |
| Restore succeeds but Drizzle migrations are out of sync | Always run `drizzle-kit migrate` post-restore; CI gates on schema diff |
| Backup looks successful but is corrupted (silent bit rot) | `pgbackrest verify` runs nightly; quarterly restore test catches the rest |
| DR replica falls behind | Alert on `pg_stat_replication.replay_lag > 60s` |
| PgBouncer breaks `SET LOCAL` for the recovery session | Use `pool_mode=session` for the recovery VM, or psql direct (§7.1.1 ADR-001) |
| `archive_command` returns non-zero silently | `log_level-file=detail` + log shipping to Grafana Loki; alert on any non-zero exit |

---

## 8. Reference

- pgBackRest documentation: https://pgbackrest.org
- NIST SP 800-34 Rev 1 (Contingency Planning Guide): https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final
- PostgreSQL 17 continuous archiving: https://www.postgresql.org/docs/17/continuous-archiving.html
