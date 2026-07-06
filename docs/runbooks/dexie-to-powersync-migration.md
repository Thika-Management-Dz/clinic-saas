# Dexie-to-PowerSync Migration Runbook (v1 → v2)

- **Owner:** lead engineer + DPO (health-data sync change requires sign-off)
- **Trigger ADR:** ADR-005
- **Blueprint reference:** §10.4
- **Estimated duration:** 2–3 weeks of dedicated work
- **Rollback window:** 30 days after cutover (Dexie kept as read-only fallback)

---

## 1. When to migrate

Migrate from Dexie + manual sync (v1) to PowerSync Open Edition (v2) when
**ANY** of the following triggers is observed and sustained:

| Trigger condition | Threshold | How measured |
|---|---|---|
| Concurrent editors per patient record | **> 5 per clinic** | Outbox conflict log + per-patient write-rate metric |
| Manual conflict-resolution effort | **> 1 hour / week** | DPO/lead-engineer time tracking on conflict tickets |
| Data-divergence incidents | **Observed** — two devices showing different patient states after sync | Sentry alerts + user reports |
| PowerSync dependency maturity | PowerSync Open Edition has shipped a stable Postgres-native build with FSL→Apache conversion date < 18 months away | PowerSync changelog |

Crossing a trigger does **not** mandate migration; it mandates *evaluation*,
recorded in a new ADR. If two triggers fire simultaneously, migration is
recommended.

**v1 must remain viable.** The migration is non-trivial; do not abandon the
Dexie code path until v2 has run stably for 30 days post-cutover.

---

## 2. Migration phases

### Phase 0 — Pre-Migration (Week 0)

1. **Provision PowerSync infrastructure** on Algerian sovereign
   infrastructure:
   - CERIST Cloud VPS Small running PowerSync Open Edition.
   - A second CERIST Cloud VPS Small running MongoDB (PowerSync metadata
     store).
2. **Configure PowerSync Service** to read from the production Postgres via
   a **read replica**, not the primary (PowerSync's polling load should not
   compete with clinic write traffic).
3. **Define PowerSync sync rules** — which tables sync to which client
   device, filtered by `tenant_id` and user role. Example:
   ```yaml
   # powersync-sync-rules.yaml
   bucket_definitions:
     by_tenant:
       parameters: select tenant_id from app_user where id = request.user_id
       data:
         - select id, tenant_id, family_name, given_name, deleted_at, updated_at
             from patient where tenant_id = bucket.tenant_id
         - select id, tenant_id, patient_id, status, start_ts, end_ts, deleted_at, updated_at
             from appointment where tenant_id = bucket.tenant_id
         # … one entry per synced table
   ```
4. **Test sync in staging** with **pseudonymized data** (per §12.4 — never
   real patient data in a new sync path until validated).
5. **Add a CI test** that asserts every sync rule includes a `tenant_id`
   filter — the most common PowerSync pitfall is forgetting this filter
   and leaking cross-tenant data (§10.4 "PowerSync Sync-Rules Language
   Pitfalls").

### Phase 1 — Outbox Draining (Week 1)

Before any client switches to PowerSync, **drain ALL pending outbox entries
from Dexie** across every client device.

1. Add a "Sync Status" widget to the admin dashboard showing outbox depth
   per device (`outbox.depth`, `outbox.oldest_pending_at`).
2. Run `drainOutbox()` on every client device until the outbox table is
   empty. This may require visiting clinics in person for offline-only
   devices.
3. Verify **zero pending entries** across all devices in the admin
   dashboard. Document the verification with a screenshot in the migration
   ticket.

> ⚠️ If any device has an unfixable stuck entry (e.g., a dead-lettered
> operation), resolve it manually BEFORE cutover. PowerSync will not
> replay Dexie outbox entries.

### Phase 2 — Client ID Namespacing (Week 1)

PowerSync requires a **stable `client_id` per device**. Reuse the existing
Dexie `client_id` (already namespaced per device via `getClientId()`) to
avoid creating duplicate client states.

1. Each Dexie `client_id` maps 1:1 to a PowerSync `client_id` during the
   first PowerSync sync.
2. The mapping is logged for audit: `audit_log.action='migration.client_id_map'`.

### Phase 3 — Schema Reconciliation (Week 1–2)

PowerSync expects every synced table to have:
- `id UUID PK`
- `tenant_id UUID`
- `updated_at TIMESTAMPTZ`
- `deleted_at TIMESTAMPTZ`

The v1 schema already has these (designed for PowerSync compatibility from
day 1 — ADR-005). Verification:

1. For every Drizzle schema file, verify `updated_at` and `deleted_at` are
   present with defaults.
2. Add a Drizzle migration to backfill `updated_at` on any rows that have
   NULL (should be none if the schema was followed, but verify):
   ```sql
   UPDATE patient SET updated_at = created_at WHERE updated_at IS NULL;
   -- repeat for every tenant-scoped table
   ```
3. Add a CI test asserting every tenant-scoped table has all four columns.

### Phase 4 — Dual-Write Period (Week 2)

> Optional but recommended for risk-averse operators. Skip only if the
> staging validation in Phase 0 was exhaustive.

1. Ship a PWA build that **dual-writes**: every mutation goes to **both**
   the Dexie outbox (v1 path) **and** the PowerSync local SQLite (v2 path).
2. Reads still come from Dexie (v1 path remains the source of truth).
3. A background reconciliation job compares Dexie vs PowerSync local state
   every 5 minutes; any divergence logs a Sentry warning.
4. Run dual-write for **1 week** in production. If divergence warnings
   exceed 0.1% of operations, abort the migration and investigate.

### Phase 5 — Client Cutover (Week 2)

1. Ship a new PWA build that uses PowerSync as the **primary** sync layer.
   On first launch after the update, the PWA:
   - (a) Drains any remaining Dexie outbox entries.
   - (b) Initializes the PowerSync client (with the mapped `client_id`).
   - (c) Performs an initial full sync (download all synced rows for this
     tenant + role).
   - (d) Switches the UI's data source from Dexie to PowerSync's local
     SQLite (via OPFS or WASM SQLite).
2. **Keep Dexie as a read-only fallback for 30 days.** If PowerSync fails,
   the app can still read from Dexie while the operator investigates. This
   is the rollback safety net.
3. Roll out cutover **per-clinic** (not all clinics at once): clinic A on
   Monday, clinic B on Wednesday, … so a PowerSync bug affects one clinic
   at a time.

### Phase 6 — Sync-Rules Pitfalls (Week 2)

Common PowerSync sync-rules pitfalls (per Blueprint §10.4):

| Pitfall | Mitigation |
|---|---|
| Forgetting `tenant_id` filter in a sync rule → cross-tenant data leak | CI test asserting every sync rule has `where tenant_id = bucket.tenant_id` |
| Syncing too much data to low-powered tablets → perf degradation | Sync only the current day's appointments + the patient's last 90 days of encounters; lazy-load older data on demand |
| PowerSync `updated_at` column not present or not monotonic → infinite re-sync loops | Schema reconciliation (Phase 3) + a CI test on `updated_at` monotonicity |
| `deleted_at` rows filtered out by sync rules → soft-deleted rows "resurrect" on re-sync | Sync rules MUST include `deleted_at IS NOT NULL` rows (PowerSync then deletes them locally) |

### Phase 7 — Post-Migration (after 30 stable days)

1. Remove the Dexie dependency from the codebase.
2. Remove the foreground outbox drain logic (PowerSync handles this
   natively).
3. Remove the dual-write code path (if Phase 4 was used).
4. Update the architecture diagram in §7.3 of the blueprint to reflect
   PowerSync as the sync layer.
5. Decommission the Dexie read-only fallback.
6. Update ADR-005 to mark v2 as the current implementation; supersede v1
   notes with a "v1 retired on <date>" annotation.

---

## 3. Rollback Plan

If PowerSync fails catastrophically within the first 30 days:

1. **Roll back the PWA build** to the last Dexie-based version. Patients
   and clinic staff see the old UI on next reload (service worker update
   flow — see `docs/conventions/rtl.md` and AGENTS.md Do-NOT list:
   `self.skipWaiting()` is forbidden; users reload explicitly).
2. **PowerSync's local SQLite database can be discarded** — the next Dexie
   sync repopulates from Postgres (which remains the source of truth).
3. **Investigate the failure** before re-attempting the migration. Update
   this runbook with the root cause.
4. **Notify the DPO** if the failure caused any data divergence that
   affected clinical decisions (this could be a notifiable availability
   breach under Law 25-11 — see `docs/runbooks/breach-response.md`).

---

## 4. DPO sign-off

Because this migration changes the sync path for **sensitive health data**,
the DPO must sign off on:

- [ ] Phase 0 staging validation report (no real patient data was used).
- [ ] Phase 4 dual-write divergence report (if applicable).
- [ ] Phase 5 per-clinic cutover plan.
- [ ] Phase 7 post-migration decommissioning of Dexie.

DPO sign-off is recorded in `audit_log` as
`action='migration.dpo_signoff'` with the migration ticket reference in
`after_jsonb`.

---

## 5. Reference

- PowerSync documentation: https://docs.powersync.com
- PowerSync sync rules reference: https://docs.powersync.com/sync-rules/reference
- FSL-1.1-ALv2 license (auto-converts to Apache-2.0 after 2 years): https://fsl.software
