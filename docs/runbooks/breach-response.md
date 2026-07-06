# Breach-Response Runbook

- **Owner:** DPO (مسؤول حماية المعطيات)
- **Legal basis:** Law 18-07 of 10 June 2018; Law 25-11 of 24 July 2025 (5-day breach-notification SLA to ANPDP); Law 18-07 Article 34 (appropriate technical and organizational measures)
- **Blueprint reference:** §11.3
- **Activation:** 24/7 — this runbook applies outside clinic hours as well as during.

> **THE CLOCK STARTS AT DETECTION.** Law 25-11 mandates notification to ANPDP
> **within 5 days** of becoming aware of a personal-data breach. The internal
> target is **72 hours** to file the ANPDP notification, leaving a 2-day
> buffer before the legal deadline. Every hour matters.

---

## 1. What constitutes a notifiable breach

A **personal-data breach** under Law 18-07 / Law 25-11 is any breach of
security leading to the **accidental or unlawful destruction, loss,
alteration, unauthorized disclosure of, or access to** personal data
(especially the **sensitive health data** stored in this clinic SaaS).
Notifiable scenarios include, but are not limited to:

| Category | Examples |
|---|---|
| **Confidentiality breach** | Unauthorized access to patient-identifiable data (confirmed OR suspected); exfiltration of patient data to an unauthorized destination; a query that returns another tenant's rows (RLS bypass); a lost or stolen laptop/tablet/phone with an active clinic SaaS session. |
| **Integrity breach** | Unauthorized alteration of clinical records; tampering with the `audit_log` hash chain; an SQL injection that modifies patient data. |
| **Availability breach** | Ransomware encryption of any clinic SaaS component (Postgres, Orthanc, the NestJS server, backups); a destructive `DROP TABLE` that escapes staging; loss of access to the only copy of a backup. |
| **Credential compromise** | Compromise of ANY credential with access to clinical data: DB password, JWT signing key, Better Auth session secret, Chargily Pay API key, SMS gateway API key, SSH key for the production VPS, pgBackRest encryption passphrase, AWS Paris CI/CD runner token (if it can reach Algerian infra). |

**If unsure whether an incident is notifiable:** treat it as notifiable and
let the DPO downgrade in writing. Under-notification is a legal liability;
over-notification is not.

**NOT notifiable** (but still log in `audit_log`): a single failed login
attempt; a routine 4xx error; a phishing email reported and not clicked.

---

## 2. Response timeline (ANPDP 5-day SLA)

| Time | Phase | Actions | Owner |
|---|---|---|---|
| **Hour 0** | **Detect & Triage** | (a) Whoever detects the incident (engineer, on-call, audit-log alert, Sentry alert, user report) **immediately** notifies the DPO + clinic_admin via the on-call channel. (b) Open an incident ticket (template: `INC-<YYYYMMDD>-<short>`). (c) Log the incident in `audit_log` with `action='incident.detected'`, `entity_type='incident'`, `outcome='success'` (the detection succeeded — the breach itself is recorded in `before_jsonb`/`after_jsonb`). | On-call engineer |
| **Hours 0–4** | **Contain** | (a) Revoke compromised credentials: rotate JWT signing key, rotate Better Auth session secret, force-logout all sessions via `session` table truncate (RLS-protected), rotate DB password, rotate Chargily Pay / SMS gateway API keys, rotate pgBackRest passphrase **if** passphrase compromise is plausible. (b) Remotely wipe lost/stolen devices (MDM). (c) Block source IPs at the Nginx/Caddy WAF. (d) Disable the compromised user account (`app_user.is_disabled = true`). (e) **Preserve evidence**: snapshot the affected Postgres cluster (pgBackRest `backup --type=full` to a new repo), capture the last 30 days of `audit_log` to a read-only export, take VM disk snapshots, preserve nginx access/error logs. (f) If ransomware: **do not** power off affected VMs (forensic state in RAM matters) — isolate network only. | On-call engineer + DPO |
| **Hours 4–24** | **Assess scope** | (a) DPO assesses: which patients are affected, what data categories (NIN, diagnoses, prescriptions, invoices, images), how many records, what is the risk to data subjects (re-identification, discrimination, financial fraud, physical safety). (b) Draft the ANPDP notification (see §4 for the template). (c) Decide on data-subject notification (mandatory if **high risk** to data subjects under Law 25-11; recommended otherwise). (d) Decide on processor-notification (Chargily Pay, SMS gateway, hosting provider — per reinforced processor contracts, §3.1.1 obligation #6). | DPO |
| **Hours 24–72** | **Notify ANPDP** | (a) File the ANPDP notification via the **ANPDP online platform** (`https://anpdp.dz`). (b) **AND** file physically at the ANPDP HQ: Cité Sahli, El Biar, Alger (per §3.1.5 — both online and physical filing are required). (c) Send written acknowledgment of filing to the incident ticket. (d) If high-risk: notify affected data subjects (bilingual AR/FR) within the same window — see §5. | DPO |
| **Hours 72–336 (day 3 → day 5)** | **Buffer** | The 5-day legal deadline (Law 25-11) is **day 5 from detection**. The internal 72-hour target leaves a 2-day buffer for ANPDP platform unavailability, missing information, or scope expansion. If new information expands scope between hour 72 and day 5, file a **supplemental notification** to ANPDP. | DPO |
| **Days 5–30** | **Remediate** | (a) Implement the permanent fix (patch, config change, RLS policy addition, key rotation automation, MFA enforcement). (b) Verify the fix with a regression test. (c) Monitor for recurrence (Sentry alert, audit-log anomaly detector). (d) Update the ANPDP notification if scope changes materially. | On-call engineer |
| **Within 1 week of containment** | **Post-mortem** | (a) Blameless post-mortem written by the incident commander. (b) Review with DPO + clinic_admin. (c) Document root cause, timeline, what worked, what failed, action items with owners and due dates. (d) File in the incident registry. | Incident commander |
| **Quarterly** | **Review** | The DPO reviews all incidents from the quarter, identifies systemic patterns, and updates this runbook + the security controls. | DPO |

---

## 3. ANPDP contact

| Channel | Value |
|---|---|
| Website | https://anpdp.dz |
| Online notification platform | https://anpdp.dz (file **both** online and physically) |
| HQ (physical filing) | Cité Sahli, El Biar, Alger, Algeria |
| Filing mode | **Online AND physical** — both required per §3.1.5 |

---

## 4. ANPDP notification template (draft within hour 24)

> This is a template; the DPO completes it with the specific facts of the
> incident. The notification is filed in **French** (Algerian administrative
> language) with an Arabic summary if requested by ANPDP.

```
NOTIFICATION DE VIOLATION DE DONNÉES À CARACTÈRE PERSONNEL
(Article — Loi 25-11 du 24 juillet 2025)

1. Responsable du traitement
   - Raison sociale: <clinic legal name>
   - NIF: <supplier_nif> | NIS: <supplier_nis> | RC: <supplier_rc>
   - DPO: <name, email, phone>

2. Description de la violation
   - Date de détection: <YYYY-MM-DD HH:mm>
   - Date présumée de la violation: <YYYY-MM-DD HH:mm>
   - Nature: <confidentialité / intégrité / disponibilité / combinaison>
   - Cause: <intrusion externe / erreur interne / perte de support / etc.>

3. Données concernées
   - Catégories: <NIN, diagnostics, prescriptions, factures, images, etc.>
   - Nombre approximatif de personnes concernées: <N>
   - Nombre approximatif d'enregistrements: <N>

4. Conséquences probables pour les personnes concernées
   - <ré-identification / discrimination / fraude financière / sécurité physique / etc.>

5. Mesures prises
   - Contention: <révocation des identifiants, blocage IP, etc.>
   - Remédiation: <correctif appliqué, rotation des clés, etc.>
   - Mesures communiquées aux personnes concernées: <oui/non, description>

6. Coordonnée pour échange avec l'ANPDP
   - <DPO name, email, phone>

7. Documentation complémentaire disponible
   - Journal d'audit (extrait hash-chainé): <référence>
   - Rapport d'incident interne: <référence>
```

---

## 5. Data-subject notification (if high risk)

If the DPO assesses the breach as **high risk to data subjects** (e.g.,
exfiltration of NIN + diagnoses that could enable discrimination or
identity theft), Law 25-11 requires notifying the affected data subjects
in addition to ANPDP. Notification is **bilingual (AR + FR)** and delivered
via the patient's preferred contact channel (SMS, email, or postal mail
for patients without electronic contact on file).

### Template (bilingual)

> **FR:** Madame, Monsieur, Nous vous informons qu'une violation de données
> à caractère personnel concernant votre dossier médical a été détectée le
> <date>. Les données suivantes sont concernées : <catégories>. Nous avons
> notifié l'ANPDP conformément à la loi 25-11. Les mesures suivantes ont
> été prises : <mesures>. Pour toute question, contactez notre DPO au
> <contact>. Nous vous prions de nous excuser pour ce incident.
>
> **AR:** سيدتي، سيدي، نعلمكم أنه تم رصد خرق للمعطيات ذات الطابع الشخصي
> المتعلق بملفكم الطبي بتاريخ <التاريخ>. المعطيات المعنية هي: <الفئات>.
> لقد قمنا بإخطار السلطة الوطنية لحماية المعطيات (ANPDP) طبقا للقانون
> 25-11. تم اتخاذ التدابير التالية: <التدابير>. لأي استفسار، يرجى الاتصال
> بمسؤول حماية المعطيات على <الاتصال>. نعتذر لكم عن هذا الحادث.

---

## 6. Incident registry

Every incident is recorded in the **incident registry** (a Drizzle
`incident` table, RLS-protected, append-only after closure). The registry
is the artifact ANPDP inspectors will ask to see. Fields:

- `id`, `tenant_id` (or NULL for SaaS-operator-level incidents),
  `detected_at`, `contained_at`, `resolved_at`,
  `severity` (low/medium/high/critical),
  `categories_affected` (array),
  `records_affected` (int),
  `anpdp_notified_at`, `anpdp_notification_ref`,
  `data_subjects_notified_at`,
  `root_cause`, `remediation`, `post_mortem_url`.

The registry is separate from `audit_log` (which records events) — the
registry records incidents as first-class entities with their own lifecycle.

---

## 7. Legal basis (verbatim from Blueprint §11.3)

- **Law 25-11 of 24 July 2025** — breach notification within 5 days to ANPDP.
- **Law 18-07 Article 34** — data controllers must implement appropriate
  technical and organizational measures.
- **Law 18-07 Article 65** — controller violation of Arts. 38–39 sanctions:
  fine 200,000 – 500,000 DZD.
- **Law 18-07 Article 58** — sensitive-data violation sanctions: 6 months –
  1 year imprisonment + fine; maximum criminal sanction up to 5 years
  (Gide law-firm analysis).

---

## 8. Drills

- The DPO runs a **tabletop breach-response drill** at least once per year
  (and before go-live as part of Phase 17 readiness).
- The drill exercises this runbook end-to-end against a hypothetical
  scenario; the post-drill report is filed in the incident registry and
  feeds runbook revisions.
