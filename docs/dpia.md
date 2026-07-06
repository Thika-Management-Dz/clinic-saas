# Data Protection Impact Assessment (DPIA)

- **Document type:** DPIA stub — to be completed with the DPO before go-live (Roadmap Phase 17).
- **Legal basis:** Law 18-07 of 10 June 2018 (amended by Law 25-11 of 24 July 2025), which mandates a DPIA for **high-risk processing** of personal data — health data is **sensitive personal data** under Law 18-07 §3.1.2 and unambiguously meets the high-risk threshold.
- **Blueprint reference:** §3.1, §3.1.2, §11.3, §12.3, §12.4
- **ANPDP reference:** ANPDP DPIA guidance (anpdp.dz) — to be consulted at the time of filing; the regulator may publish a sector-specific template for health-data DPIAs.
- **Status:** **STUB — NOT YET FILED.** The DPIA must be (a) completed by the operator with the DPO, (b) reviewed by ANPDP if requested, and (c) available for inspection from the moment processing begins.

> ⚠️ **A DPIA is mandatory before go-live.** Operating the clinic SaaS without
> a completed DPIA is a violation of Law 25-11 and exposes the operator to
> the sanctions in §3.1.3 (Art. 65 fine 200,000–500,000 DZD; Art. 58
> sensitive-data violation: 6 months – 1 year imprisonment + fine).

---

## 1. Processing description

### 1.1 Controller and processor

| Role | Entity | Contact |
|---|---|---|
| **Data controller** | <clinic legal name> (the operating clinic; one DPIA per clinic, or a master DPIA + per-clinic addenda for multi-clinic operators) | <address, NIF, NIS, RC> |
| **Data processor** (SaaS operator) | <SaaS operator legal entity> | <address, NIF, NIS, RC> |
| **DPO** | <DPO name, email, phone — filed with ANPDP per §3.1.5> | <contact> |
| **Sub-processors** | hosting provider (CERIST / Djezzy Cloud), Chargily Pay (payment), SMS gateway (BulkGate / Sobersys / Africala), Orthanc (imaging, self-hosted) | reinforced-contract B2B addenda on file |

### 1.2 Purposes of processing

| Purpose | Lawful basis (Law 18-07 Art. 7) | Data categories | Retention |
|---|---|---|---|
| **Clinical care** — patient demographics, encounters, observations, problems, allergies, medications, immunizations, dental odontogram, perio charts, SOAP notes | Express, written, withdrawable patient consent + healthcare provision | All clinical categories | 20-year default (15-yr legal floor + 5-yr buffer) — §3.1.2 |
| **Billing & invoicing** — invoices, payments, refunds, cash drawer sessions | Legal obligation (CGI Article 51 — DGI mandatory mentions) + contract | Invoice line items, NIF, NIS, RC, payment method (NOT card PAN) | 10 years (tax prescription) |
| **Audit & accountability** — append-only hash-chained `audit_log` of all mutations | Legal obligation (Law 25-11 — mandatory processing register + automated operation logs) | Actor, action, entity, before/after JSONB, IP, user agent | 6 years (§9.7) |
| **Patient communication** — appointment reminders, prescription-ready notifications | Consent (withdrawable) | Phone number, appointment time | Withdrawn immediately on patient request |
| **Analytics (pseudonymized)** — nightly extract for operational reporting | Legitimate interest + pseudonymization per §12.4 | Pseudonymized patient ID, year-of-birth, ICD-10 chapter | Rolling 24 months |
| **Anonymized research / published statistics** (if ever pursued) | ANPDP sign-off required (health data is sensitive) | k-anonymity k≥5 on quasi-identifier set | n/a — anonymized = outside Law 18-07 |

### 1.3 Data subjects

- **Patients** (adults and minors via legal guardians) — primary data subjects.
- **Staff** (physicians, dentists, nurses, receptionists, billing) — `app_user` table, audit-log actors.
- **Contractors / suppliers** — contact details in `clinic` table.

### 1.4 Data flows

```
Patient → Front-desk reception (PWA, in-clinic)
       → Doctor tablet (PWA, chair-side)
       → Admin desktop (PWA, back-office)
       ↘ HTTPS + WebSocket ↗
         NestJS modular monolith (CERIST / Djezzy Cloud VPS, Algeria)
         ↘ PostgreSQL 17 + RLS (same VM or adjacent, Algeria)
         ↘ Orthanc DICOM (Docker, Algeria, S3 backend on Djezzy Cloud OSS)
         ↘ pgBackRest backups (Djezzy Cloud S3 + CERIST S3 + weekly HDD; all Algeria)
         ↘ DR replica (Algérie Télécom Constantine DC, Algeria — streaming)
         ↗ Optional: Chargily Pay (Algerian — payment data, no clinical data)
         ↗ Optional: SMS gateway (Algerian or international — phone + message only, no clinical data)
         ↗ Optional: AWS Paris (CI/CD + observability — NO personal data; EgressGuard interceptor)
```

**All clinical data stays in Algeria** (Law 18-07 §3.1.6 cross-border
transfer restriction). The optional AWS Paris egress is for non-personal
workloads only and is enforced by an EgressGuard interceptor (§8.3).

### 1.5 Scale

- **Initial scale**: 2 clinics, ~120 patients/day/clinic → ~240
  patient-encounters/day, ~87,600/year.
- **MVP scale**: up to 50 clinics → ~2.2M patient-encounters/year.
- **Storage**: estimated < 1 TB at MVP (lean schema, ADR-006; DICOM imaging
  in Orthanc, separate). Below the > 5 TB Citus trigger (ADR-001).

---

## 2. Necessity and proportionality

### 2.1 Necessity

The processing is **necessary** for:

- Provision of healthcare (Law 18-11 — clinical records are a legal
  obligation for licensed clinics in Algeria).
- Compliance with Algerian tax law (CGI Article 51 — DGI mandatory invoice
  mentions; e-invoicing reform expected 2027, §9.6.2).
- Compliance with Law 25-11 mandatory processing register + automated
  operation logs (the `audit_log`).
- The clinic's legitimate interest in operating efficiently
  (appointments, billing, inventory).

### 2.2 Proportionality

The clinic SaaS applies the following **data-minimization** and
**purpose-limitation** measures:

| Measure | Where | Reference |
|---|---|---|
| RLS on every tenant-scoped table — a clinic cannot read another clinic's data | DB layer | ADR-001, §7.1 |
| Soft deletes only on clinical records (no hard deletes except via documented retention-expiry) | Every tenant-scoped table | §9.1 |
| NIN encrypted at column level with pgcrypto + tenant-specific key (optional for MVP, designed for) | `patient.nin` | §12.1 |
| Pseudonymization for staging/dev environments (faker-seeded replacement) | staging | §12.4 |
| Anonymization (k≥5) for any external research / published statistics | analytics warehouse | §12.4 — requires ANPDP sign-off |
| EgressGuard interceptor blocks any payload containing personal-data fields from reaching AWS Paris | API layer | §8.3 |
| Retention policies: 20-yr clinical (default), 6-yr audit, 10-yr billing | per data category | §9.7, §3.1.2 |
| Patient consent capture UI with timestamped audit-log entry | patient module | §3.1.1 obligation #2, §11.4 |
| Data-subject-rights workflow (access, rectification, erasure, objection, withdrawal) | patient portal / admin workflow | §11.4 |

### 2.3 Less-intrusive alternatives considered

- **Paper records**: rejected — Algeria does not mandate paper; electronic
  records with audit trail are safer and required for Law 25-11 operation
  logs.
- **On-prem only (no cloud DR)**: rejected — single-VM failure with no DR
  would mean total clinical-record loss; the Constantine DC streaming
  replica is a proportionate resilience measure.
- **Hosted on AWS Paris with ANPDP transfer authorization**: rejected — the
  multi-month authorization process and ongoing residency liability are
  disproportionate when Algerian sovereign infrastructure (CERIST / Djezzy
  Cloud) satisfies the same needs.

---

## 3. Risks to data subjects

| # | Risk | Likelihood | Impact | Affected data subjects |
|---|---|---|---|---|
| R1 | **Unauthorized cross-tenant data access** (RLS misconfiguration, forgotten `FORCE ROW LEVEL SECURITY`, app-role granted `BYPASSRLS` by mistake) | Low | Critical (clinical-record disclosure) | All patients of all tenants |
| R2 | **Ransomware encryption** of Postgres, Orthanc, or backups | Medium (rising trend in healthcare) | Critical (availability loss + possible confidentiality breach if exfiltrated pre-encryption) | All patients of affected tenant(s) |
| R3 | **Credential compromise** (DB password, JWT signing key, Better Auth session secret) | Medium | Critical | All patients of affected tenant(s) |
| R4 | **Lost/stolen device** (laptop/tablet with active clinic SaaS session and cached Dexie data) | Medium | High (clinical-record disclosure to finder) | Patients whose data is cached on device |
| R5 | **Cross-border transfer by mistake** (engineer runs a debug query from a non-Algerian VM; Sentry SaaS inadvertently captures a patient field in an error payload) | Low (EgressGuard + PII scrubbing) | High (regulatory + data-subject harm) | Patients whose data was transferred |
| R6 | **Re-identification from pseudonymized analytics extract** (joining pseudonymized patient ID with quasi-identifiers) | Low | Medium | Patients in the extract |
| R7 | **Inference of health status from appointment patterns** (e.g., a receptionist infers a patient's HIV status from appointment frequency with a specific specialist) | Medium | High (discrimination, social harm) | Patients with stigmatized conditions |
| R8 | **Backup passphrase loss** (operator loses AES passphrase AND Vault AND paper backup) | Very Low | Catastrophic (total clinical-record loss) | All patients |
| R9 | **Audit-log hash-chain tampering** (privileged actor with table-owner rights modifies `audit_log` rows and recomputes the chain) | Low | High (defeats accountability) | All patients |
| R10 | **PowerSync migration (v1→v2) data divergence** — two devices showing different patient states after sync | Medium (during migration window) | High (clinical-decision harm) | Patients of clinics mid-migration |

---

## 4. Mitigations

| Risk | Mitigations | Residual risk |
|---|---|---|
| R1 RLS bypass | (a) `FORCE ROW LEVEL SECURITY` on every tenant-scoped table; (b) app role MUST NOT have `BYPASSRLS`; (c) CI test asserts both (see `docs/conventions/testing.md` §3.2); (d) `REVOKE TRUNCATE` from app role; (e) only `ops_superuser` has `BYPASSRLS` and is used only for cross-tenant analytics with `audit_log` entry. | Low |
| R2 Ransomware | (a) AES-256-CBC client-side encrypted backups (passphrase off-host); (b) 3-2-1-1-0 strategy with offline HDD in clinic safe; (c) DR streaming replica at Algérie Télécom Constantine DC; (d) quarterly restore test per NIST SP 800-34; (e) immutable S3 bucket versioning on Djezzy Cloud; (f) breach-response runbook (§11.3) activated on detection. | Medium (ransomware is rising; backups + DR reduce but do not eliminate) |
| R3 Credential compromise | (a) MFA (TOTP) mandatory for any role with `clinic:manage_users` or `audit:read`; (b) credential rotation procedure in breach-response runbook; (c) secrets in OS keyring / HashiCorp Vault, never in env files committed to git; (d) Better Auth session table RLS-protected. | Low |
| R4 Lost/stolen device | (a) PWA session timeout (15 min idle); (b) MDM-enforced remote wipe; (c) Dexie data scoped to the user's role (receptionist caches appointments, not full clinical records); (d) force-logout-all capability via `session` table truncate. | Medium (mobile devices are inherently riskier) |
| R5 Cross-border transfer | (a) EgressGuard interceptor blocks personal-data fields from AWS Paris payloads; (b) Sentry SaaS with PII scrubbing configured; (c) CI test that asserts no personal-data fields are in observability payloads; (d) breach-response runbook covers accidental transfer as a notifiable breach. | Low |
| R6 Re-identification | (a) k-anonymity k≥5 on quasi-identifier set (5-digit geographic code, year of birth, gender, ICD-10 chapter); (b) suppress small cells <5; (c) re-identification key kept in separate KMS-encrypted table accessible only to clinic_admin; (d) ANPDP sign-off before any external research extract. | Low |
| R7 Inference from appointment patterns | (a) RBAC restricts appointment visibility to receptionist + assigned practitioner; (b) audit_log records every appointment view; (c) staff training on confidentiality. | Medium (inference is hard to fully prevent) |
| R8 Backup passphrase loss | (a) Shamir's secret sharing (2-of-3) for HashiCorp Vault unseal; (b) paper backup in sealed envelope in clinic safe with dual-keyholder access (clinic_admin + DPO); (c) annual passphrase-recovery drill. | Very Low |
| R9 Audit-log tampering | (a) `REVOKE UPDATE, DELETE ON audit_log FROM app_role` — only INSERT allowed; (b) hash-chained rows (`hash_curr = SHA-256(prev_hash \|\| canonical_json(this_row))`) — tampering breaks the chain visibly; (c) nightly integrity-check job verifies the chain; (d) monthly cold archive of audit_log to encrypted S3 (append-only WORM bucket). | Low |
| R10 PowerSync migration divergence | (a) dual-write period with reconciliation (Phase 4 of `dexie-to-powersync-migration.md`); (b) per-clinic cutover (not all clinics at once); (c) 30-day rollback window with Dexie read-only fallback; (d) DPO sign-off on cutover. | Low (post-migration); Medium (during migration window) |

---

## 5. Residual risk

After the mitigations in §4 are applied, the **residual risk** is assessed
as **Medium** — dominated by:

- R2 ransomware (Medium) — a societal risk to healthcare; the 3-2-1-1-0
  backup posture reduces but cannot eliminate it.
- R4 lost/stolen device (Medium) — inherent to mobile clinical workflows.
- R7 inference from appointment patterns (Medium) — RBAC + audit reduce but
  cannot eliminate inference by authorized staff.
- R10 PowerSync migration window (Medium, time-bounded) — zero outside the
  migration window.

The operator accepts this residual risk as proportionate to the clinical
and operational benefits of the SaaS. The DPO must sign off in §6.

**Recommendation**: revisit this DPIA annually, after any major
architecture change (e.g., ADR-001 Citus migration, ADR-005 PowerSync
cutover), and after any notifiable breach (per `breach-response.md`).

---

## 6. DPO sign-off

> To be completed before go-live (Roadmap Phase 17). The DPO's signature
> below confirms that: (a) the processing described in §1 is accurate;
> (b) the necessity/proportionality analysis in §2 is sound; (c) the
> mitigations in §4 are in place or scheduled before go-live; (d) the
> residual risk in §5 is acceptable; (e) this DPIA will be filed with
> ANPDP if requested and is available for inspection from the moment
> processing begins.

| Field | Value |
|---|---|
| DPO name | <to complete> |
| DPO appointment date (filed with ANPDP per §3.1.5) | <to complete> |
| DPIA completion date | <to complete — target: before go-live, Roadmap Phase 17> |
| DPIA review date (annual) | <to complete> |
| DPO signature | <to complete> |
| Operator (controller) signature | <to complete> |
| SaaS operator (processor) signature | <to complete> |
| Filed with ANPDP? | ☐ Yes (date: ___) ☐ No (reason: ___) ☐ Requested by ANPDP (date: ___) |

---

## 7. Reference and cross-links

- **ANPDP** (Autorité Nationale de Protection des Données à caractère
  Personnel): https://anpdp.dz
- **ANPDP DPIA guidance**: to be consulted at filing time; the regulator
  may publish a sector-specific template for health-data DPIAs.
- **Blueprint §3.1** — full Law 18-07 / Law 25-11 obligations table.
- **Blueprint §3.1.3** — sanctions for non-compliance.
- **Blueprint §11.3** — breach-response runbook (`docs/runbooks/breach-response.md`).
- **Blueprint §12.3** — ANPDP compliance checklist (DPIA is line item #5).
- **Blueprint §12.4** — anonymization vs pseudonymization.
- **Related ADRs**: ADR-001 (RLS), ADR-004 (Better Auth), ADR-005
  (offline-first sync), ADR-006 (lean schema + interop adapter).
- **Related runbooks**: `docs/runbooks/breach-response.md`,
  `docs/runbooks/backup-recovery.md`,
  `docs/runbooks/dexie-to-powersync-migration.md`.
