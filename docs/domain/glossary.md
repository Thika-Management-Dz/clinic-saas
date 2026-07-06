# Trilingual Domain Glossary (FR · AR · EN)

- **Source of truth for terminology** across the Clinic Management SaaS.
- **Audience:** AI coding agents, human contributors, translators, clinicians.
- **Blueprint references:** §9.3 (Patient & Encounter), §9.4 (Dental), §9.5 (Appointment), §9.6 (Billing).
- **Rule:** message keys in `apps/web/messages/{ar-DZ,fr-DZ}.json` (see `docs/conventions/i18n.md`) MUST use these terms verbatim. No synonyms, no paraphrases. A receptionist switching locales must see the same concept under the same name family.

## How to read this table

| Term (EN) | FR (français) | AR (العربية) | Notes |
|---|---|---|---|
| The canonical English term used in code comments, ADRs, and `docs/` | The French string used in `fr-DZ.json` message files and on the French UI | The Arabic string used in `ar-DZ.json` message files and on the Arabic UI (with diacritics stripped per Algerian convention) | Cross-references to the blueprint, the Drizzle table that backs it, and any FHIR mapping (ADR-006) |

---

## Clinical core

| Term (EN) | FR | AR | Notes |
|---|---|---|---|
| **patient** | patient | مريض | `patient` table. FHIR `Patient`. AR plural: مرضى. |
| **appointment** | rendez-vous | موعد | `appointment` table. FHIR `Appointment`. State machine per §9.5: proposed → pending → booked → arrived → in-progress → fulfilled \| cancelled \| no-show. |
| **encounter** | consultation | استشارة | `encounter` table. FHIR `Encounter`. In Algerian French medical usage, "consultation" is the standard term for a clinical encounter (not "visite" or "rencontre"). AR استشارة mirrors this. |
| **practitioner** | praticien | ممارس صحي | `practitioner` table. FHIR `Practitioner`. Covers physician, dentist, nurse, dental assistant. Use ممارس صحي as the generic; specific roles below. |
| **physician** | médecin | طبيب | Role in RBAC hierarchy (§9.2). طبيب = physician (medical). |
| **dentist** | dentiste | طبيب أسنان | Role in RBAC hierarchy. طبيب أسنان = "tooth doctor". |
| **dental assistant** | assistant dentaire | مساعد طبيب أسنان | Role in RBAC hierarchy. |
| **nurse** | infirmier | ممرض | Role. AR female: ممرضة. |
| **receptionist** | réceptionniste | موظف الاستقبال | Role. |
| **billing clerk** | agent de facturation | موظف الفوترة | Role. |
| **operatory** | salle de soins | غرفة العلاج | `operatory` table. The room/chair where treatment happens. AR literally "treatment room". FR Algerian usage is "salle de soins" (not "box" or "cabinet"). |
| **vitals** | constantes vitales | العلامات الحيوية | `vital_signs` table. FHIR `Observation` (kind=vital). AR also: المؤشرات الحيوية. |
| **allergy** | allergie | حساسية | `allergy` table. FHIR `AllergyIntolerance`. Feeds CDS allergy-checking (§11.1). |
| **medication** | médicament | دواء | `medication` table. FHIR `MedicationRequest`. AR plural: أدوية. Feeds CDS interaction-checking. |
| **immunization** | vaccination | تطعيم | `immunization` table. FHIR `Immunization`. AR also: تحصين. |
| **problem list** | liste des problèmes | قائمة المشاكل | `problem_list` table. FHIR `Condition`. Status: active / resolved / chronic. |
| **SOAP note** | note SOAP | ملاحظة SOAP | `soap_note` table. 4 columns (subjective, objective, assessment, plan) or one JSONB. SOAP kept as acronym in both locales — universally understood by clinicians. |
| **observation** | observation | ملاحظة سريرية | `observation` table. FHIR `Observation`. Most versatile FHIR resource — vitals, labs, perio, imaging findings all map here. AR ملاحظة سريرية = "clinical observation" to disambiguate from generic "note". |
| **lab result** | résultat d'analyse | نتيجة تحليل | `lab_result` table. FHIR `Observation` + `DiagnosticReport`. Lab integration deferred (§11.2). |
| **prescription** | ordonnance | وصفة طبية | FHIR `MedicationRequest` (the prescription is the request). AR وصفة طبية = "medical prescription"; short form وصفة. |

## Dental

| Term (EN) | FR | AR | Notes |
|---|---|---|---|
| **odontogram** | odontogramme | مخطط أسنان | AR literally "teeth chart". The visual chart of all 32 permanent + 20 primary teeth, showing each tooth's status. |
| **tooth (FDI)** | dent (FDI) | سن (FDI) | `tooth_fdi INT` column (ADR-007). AR singular سن, plural أسنان. FDI = ISO 3950:2016. |
| **tooth surface** | face dentaire | سطح السن | `surfaces_bitfield INT` column (§9.4.2). Five canonical surfaces: M, O, D, B, L (anterior: I replaces O; upper: P replaces L). AR سطح السن = "tooth surface". |
| **mesial** | mésial | إنسي | Surface bit M = 1. Toward midline. |
| **distal** | distal | وحشي | Surface bit D = 4. Away from midline. AR وحشي / distal both understood; standard anatomical term. |
| **occlusal** | occlusal | إطباقي | Surface bit O = 2. Chewing surface (posterior). |
| **buccal** | vestibulaire | شدقي | Surface bit B = 8. Toward cheek. FR Algerian usage: "vestibulaire" is the academic term; "buccal" is also understood. |
| **lingual** | lingual | لساني | Surface bit L = 16. Toward tongue. For upper teeth, also called palatal. |
| **incisal** | incisal | حافي | Surface bit I = 32. Chewing edge (anterior). |
| **palatal** | palatin | حنكي | Surface bit P = 64. Toward palate (upper teeth only). |
| **periodontal chart** | bilan parodontal | مخطط دواعم الأسنان | `perio_exam` table, JSONB 6×32 matrix (§9.4.4). AR دواعم = periodontium (literally "the supports"). |
| **probing depth** | profondeur de sondage | عمق التحسس | PD per site. Clinical threshold ≥ 5 mm = potential attachment loss. |
| **bleeding on probing** | saignement au sondage | نزيف عند التحسس | BOP per site (boolean). |
| **clinical attachment level** | niveau d'attache clinique | مستوى الارتباط السريري | CAL = PD + recession. |
| **treatment plan** | plan de traitement | خطة العلاج | Multi-step sequence of procedures for a patient. AR خطة العلاج = "treatment plan". |
| **procedure (CDT)** | acte (CDT) | إجراء (CDT) | `procedure` table. CDT codes (D####) + local escape hatch (§9.4.3). AR إجراء = "procedure/intervention". |

## Billing & administration

| Term (EN) | FR | AR | Notes |
|---|---|---|---|
| **invoice** | facture | فاتورة | `invoice` table. AR فاتورة = "invoice/bill". |
| **invoice line** | ligne de facture | بند الفاتورة | `invoice_line` table. AR بند = "line item". |
| **payment** | paiement | دفعة | `payment` table. Methods: cash, CIB, Edahabia, cheque, bank_transfer, other (§9.6). AR دفعة = "payment/installment". |
| **refund** | remboursement | استرداد | `refund` table. AR استرداد = "reimbursement/refund". |
| **cash drawer** | caisse | درج النقود | `cash_drawer_session` table. AR درج النقود = "cash drawer". FR "caisse" is the standard Algerian front-desk term. |
| **cash drawer session** | session de caisse | جلسة الدرج | One open→close cycle of the cash drawer, with opening/expected/actual balances and discrepancy tracking. |
| **TVA (VAT)** | TVA | ضريبة القيمة المضافة | Algerian VAT. Rates: 0% (medical-exempt), 9% (reduced), 19% (standard) per §9.6.1. AR ضريبة القيمة المضافة = "value-added tax". |
| **HT (hors taxe)** | HT | بدون ضريبة | Pre-tax amount. AR بدون ضريبة = "without tax". |
| **TTC (toutes taxes comprises)** | TTC | شامل الضريبة | Post-tax amount. AR شامل الضريبة = "tax-inclusive". |
| **NIF** (Numéro d'Identification Fiscale) | NIF | الرقم الجبائي | Algerian tax ID. DGI mandatory mention on invoices (§9.6.2). AR الرقم الجبائي = "tax number". |
| **NIS** (Numéro d'Identification Statistique) | NIS | الرقم الإحصائي | Algerian statistical ID. DGI mandatory mention. AR الرقم الإحصائي = "statistical number". |
| **RC** (Registre de Commerce) | RC | السجل التجاري | Algerian commercial registry number. DGI mandatory mention. AR السجل التجاري = "commercial register". |
| **TIN** (Taxpayer Identification Number) | TIN | رقم التعريف الضريبي | Generic taxpayer ID; in Algeria the NIF serves as TIN. |
| **NIN** (National Identification Number) | NIN | رقم التعريف الوطني | The 18-digit national ID on the Algerian biometric carte d'identité. Stored on `patient.nin` (encrypted per §12.1 if field-level encryption enabled). AR رقم التعريف الوطني = "national identification number". |
| **DZD** | dinar algérien | دينار جزائري | Algerian dinar. ISO 4217: DZD. Currency column on `invoice` defaults to 'DZD' (never hardcoded). |
| **CNAS** | CNAS | الصندوق الوطني للضمان الاجتماعي | Caisse Nationale des Assurances Sociales — public health insurance for salaried workers (§3.3). |
| **CASNOS** | CASNOS | الصندوق الوطني للضمان الاجتماعي للغير الأجراء | Public health insurance for self-employed/non-salaried (§3.3). |
| **DGI** | DGI | الإدارة العامة للضرائب | Direction Générale des Impôts — Algerian tax authority. |
| **ANPDP** | ANPDP | السلطة الوطنية لحماية المعطيات ذات الطابع الشخصي | Autorité Nationale de Protection des Données à caractère Personnel — Algeria's data protection authority. AR short form: السلطة الوطنية لحماية المعطيات. |

## Auth & RBAC

| Term (EN) | FR | AR | Notes |
|---|---|---|---|
| **tenant / clinic** | clinique | عيادة | The `clinic` table is the tenant in the pool model (ADR-001). AR عيادة = "clinic" (medical or dental). |
| **user** | utilisateur | مستخدم | `app_user` table. AR مستخدم = "user". |
| **role** | rôle | دور | RBAC role per §9.2. AR دور = "role". |
| **permission** | permission | صلاحية | OpenEMR-style `resource:action[:scope]` strings (§9.2). AR صلاحية = "authorization/permission". |
| **super admin** | super administrateur | مدير عام | `super_admin` role (SaaS operator, crosses tenants — the only role with `BYPASSRLS`). |
| **clinic admin** | administrateur de clinique | مدير العيادة | `clinic_admin` role (one tenant's administrator). |
| **session** | session | جلسة | `session` table (Better Auth, RLS-protected per ADR-004). |

## Compliance & audit

| Term (EN) | FR | AR | Notes |
|---|---|---|---|
| **audit log** | journal d'audit | سجل التدقيق | `audit_log` table. Append-only, hash-chained, RLS-enforced, FHIR `AuditEvent`-compatible (§9.7). AR سجل التدقيق = "audit register/log". |
| **consent** | consentement | موافقة | Patient consent for medical-data processing. Logged with timestamp in `audit_log` (§3.1.1, obligation #2). AR موافقة = "consent/agreement". |
| **DPO** (Data Protection Officer) | DPO | مسؤول حماية المعطيات | Mandatory under Law 25-11 (§3.1.5). AR مسؤول حماية المعطيات = "data protection officer". |
| **DPIA** (Data Protection Impact Assessment) | AIPD | تقييم أثر حماية المعطيات | Mandatory for high-risk processing (health data) under Law 25-11. See `docs/dpia.md`. AR تقييم أثر = "impact assessment". |
| **data subject** | personne concernée | صاحب المعطيات | The patient, under Law 18-07. Rights: information, access, rectification, objection, erasure, withdrawal of consent, complaint (§11.4). |
| **retention** | conservation | مدة الاحتفاظ | Clinical records: 20-year default (15-year legal floor + 5-yr buffer). Audit log: 6 years (§9.7). |

---

## Arabic script conventions in this glossary

- Diacritics (harakat) are stripped — Algerian written Arabic does not
  consistently vocalize; Meilisearch's Charabia tokenizer (§8.7) normalizes
  مُحَمَّد / محمد / محمّد to the same form at search time, so we standardize
  on the undiacritized form in message files.
- Where the standard medical Arabic term differs from Algerian spoken usage,
  we use the standard medical term and note the alternative in the Notes
  column. (Example: operatory = غرفة العلاج in standard Arabic; some
  Algerian clinics may colloquially say صالون — we standardize on غرفة العلاج.)
- Numerals are Western Arabic (0123456789) in both locales per
  `docs/conventions/i18n.md` §3 — never Eastern Arabic (٠١٢٣٤٥٦٧٨٩) in
  message files.
