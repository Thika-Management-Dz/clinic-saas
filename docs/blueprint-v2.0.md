TECHNICAL DOCUMENTATION — MASTER DOCUMENT

Clinic Management SaaS

Technical Blueprint v2.0

Architecture, Tech Stack & Build Plan for a Multi-Clinic, Bilingual,
Offline-First, Fully Self-Hostable EMR in Algeria

___________________________________________

  -----------------------------------------------------------------------
  Document Type          Technical Documentation (In-Depth Research)
  ---------------------- ------------------------------------------------
  Version                2.0 (Consolidated Master — supersedes v1.0 and
                         v1.1)

  Project                Multi-Clinic Management SaaS — Dental + Medical

  Target Geography       Algeria (Algiers, Oran, Constantine)

  Bilingual UI           Arabic (RTL) + French (LTR)

  Hosting Model          Fully Self-Hosted on Algerian Sovereign
                         Infrastructure

  Date                   2026-07-06

  Status                 Build-Ready

  Prepared for           Founding Clinician-Operator
  -----------------------------------------------------------------------

Table of Contents

1. Executive Summary 1

2. Background & Context 1

2.1 Project Context 1

2.2 Stakeholder Requirements Summary 1

2.3 Scope of This Document 1

3. Regulatory & Legal Framework (Algeria) 1

3.1 Data Protection Law 18-07 (Amended by Law 25-11) 1

3.1.1 Obligations Applicable to a Clinic SaaS 1

3.1.2 Health Data — Sensitive Personal Data Regime 1

3.1.3 Sanctions for Non-Compliance 1

3.1.4 Data Residency — The Cross-Border Transfer Question 1

3.1.5 DPO Registration Procedure 1

3.1.6 Cross-Border Transfer Authorization Procedure 1

3.2 Health Records Regulations (Law 18-11) 1

3.2.1 E-Prescriptions 1

3.3 Public Health Insurance — CNAS & CASNOS 1

3.4 Private Clinic Licensing 1

4. Algerian Technical Ecosystem 1

4.1 Payment Ecosystem 1

4.1.1 SATIM Direct Integration 1

4.1.2 Chargily Pay (Recommended for MVP) 1

4.1.3 Payment Provider Comparison 1

4.2 SMS Gateways for Appointment Reminders 1

4.3 Hosting & Cloud Options 1

4.4 Internet Reliability for Algerian Businesses 1

5. Requirements Analysis 1

5.1 Functional Requirements 1

5.2 Non-Functional Requirements 1

5.3 Constraints & Assumptions 1

6. Self-Hosting Assessment 1

6.1 Component-by-Component Self-Hosting Inventory 1

6.2 External Dependencies (Non-Clinical, No Patient Data) 1

6.3 Fully Self-Hosted Topology 1

6.4 Cost Estimate for Fully Self-Hosted Topology 1

7. System Architecture 1

7.1 Multi-Tenancy Model — Pool Model with PostgreSQL RLS 1

7.1.1 PostgreSQL Row-Level Security Implementation 1

7.2 Modular Monolith (Not Microservices) 1

7.3 High-Level Architecture 1

7.4 Domain Module Boundaries 1

8. Technology Stack 1

8.1 Stack Summary 1

8.2 Frontend — Next.js 16 PWA with RTL 1

8.3 Backend — NestJS Modular Monolith 1

8.4 Database & ORM — PostgreSQL 17 + Drizzle with RLS 1

8.5 Authentication — Better Auth (Self-Hosted) 1

8.6 Real-Time — Socket.IO + Redis Adapter 1

8.7 Search — PostgreSQL FTS (v1) → Meilisearch (v2) 1

8.8 Medical Imaging — Orthanc + Sovereign S3 1

9. Data Model Design 1

9.1 Multi-Tenant Schema Strategy 1

9.1.1 Should We Use FHIR as the Canonical Model? 1

9.2 RBAC Model 1

9.3 Patient & Encounter (OpenMRS Information Model) 1

9.4 Dental Module — Odontogram, FDI, CDT 1

9.4.1 Tooth Numbering — FDI Two-Digit Notation (ISO 3950:2016) 1

9.4.2 Tooth Surfaces — Bitfield Integer 1

9.4.3 Dental Procedures — CDT Codes + Local Escape Hatch 1

9.4.4 Periodontal Charting 1

9.5 Appointment & Scheduling 1

9.6 Billing & Invoicing — Algerian TVA Compliance 1

9.6.1 TVA Treatment of Medical Services 1

9.6.2 E-Invoicing Reform — Future-Proofing 1

9.7 Audit Log — Append-Only, Hash-Chained 1

10. Offline-First Implementation 1

10.1 Strategy — Dexie + Manual Sync (v1) → PowerSync (v2) 1

10.1.1 Why Not Replicache, ElectricSQL, or CRDTs? 1

10.1.2 Conflict Resolution — LWW + Server-Authoritative updated_at 1

10.2 Service Worker Patterns 1

10.2.1 Background Sync API — Progressive Enhancement Only 1

10.2.2 Service Worker Update Flow — No Auto-skipWaiting 1

10.3 Sync Outbox Architecture (Illustrative Pseudocode) 1

10.4 Dexie-to-PowerSync Migration Runbook (v1 → v2) 1

11. Future Integrations (Design Stubs) 1

11.1 Clinical Decision Support (CDS) Stub 1

11.2 Lab Integration Design Note 1

11.3 Breach-Response Runbook 1

11.4 Data-Subject-Rights Workflow 1

11.5 Non-DICOM Device Integration Note 1

11.6 Patient Portal Placeholder (Phase 12+) 1

11.7 Telemedicine Placeholder (Phase 13+) 1

12. Security & Compliance 1

12.1 Encryption 1

12.2 RBAC & Audit (Recap) 1

12.3 ANPDP Compliance Checklist 1

12.4 Anonymization Strategy 1

13. Backup & Disaster Recovery 1

14. Deployment & Observability 1

14.1 Production Topology 1

14.2 CI/CD Pipeline 1

14.3 Performance Testing 1

14.4 Monitoring & Alerting 1

15. Repo Conventions 1

15.1 Recommended Monorepo Layout 1

15.2 AGENTS.md — Content Summary 1

15.3 Architecture Decision Records (ADRs) 1

16. Vendor Lock-In & Exit Strategy 1

17. Phased MVP Roadmap 1

18. Counterarguments & Limitations 1

18.1 "Why Not Just Use OpenMRS / OpenEMR?" 1

18.2 "Why Not FHIR as the Canonical Model?" 1

18.3 "Why Not Microservices from Day One?" 1

18.4 "Why Not Supabase / Firebase for Speed?" 1

18.5 "Why Not Use an Existing Algerian Vertical-Specific SaaS?" 1

18.6 "Why Not .NET or Java?" 1

18.7 "Why Not Managed Postgres on AWS Paris with ANPDP Transfer
Authorization?" 1

18.8 "Why Not a Low-Code Platform?" 1

18.9 Limitations of This Research 1

19. Risks & Mitigations 1

20. Conclusion & Future Outlook 1

21. Appendix A: Phase 0 Task Checklist 1

21.1 Monorepo Scaffold 1

21.2 Database & RLS 1

21.3 Auth & Tenant Interceptor 1

21.4 RTL/i18n Scaffold (Phase 0) 1

21.5 CI/CD & Observability 1

22. Appendix B: Sample AGENTS.md 1

23. References 1

23.1 Algerian Regulatory & Legal (★★★ Official) 1

23.2 Verification Sources (from Meta-Evaluation) 1

23.3 Tech Stack & Architecture (★★★ Official Docs) 1

23.4 Reputable Secondary Sources (★★☆) 1

1. Executive Summary

This document is the single, consolidated technical blueprint for
building a multi-clinic, bilingual (Arabic RTL + French LTR),
offline-first Electronic Medical Record (EMR) and practice-management
SaaS tailored to the Algerian regulatory and technical environment. The
system serves two clinics at launch — one dental-only and one mixed
medical+dental — with architectural headroom to scale to roughly fifty
clinics, dozens of users per clinic, and approximately 120 patient
encounters per clinic per day. There is no fixed delivery deadline,
which favors correctness, auditability, and clean architectural
boundaries over short-term speed.

The recommended stack is a TypeScript end-to-end monorepo: Next.js 16
(App Router) as an installable PWA, NestJS as a modular-monolith
backend, PostgreSQL with Row-Level Security for multi-tenant isolation,
Drizzle ORM for plain-TypeScript schema authorship, Better Auth for
self-hosted multi-tenant authentication, tRPC + Zod for type-safe API
contracts, and shadcn/ui (Base UI + Tailwind CSS v4 logical properties)
for first-class RTL. Offline support is achieved with TanStack Query +
Dexie (IndexedDB) plus a manual sync outbox in v1, with a documented
upgrade path to PowerSync Open Edition (FSL-licensed, self-hostable)
when true multi-device conflict resolution becomes a workflow
requirement.

  Fully Self-Hostable: Yes — 100% of the clinical data stack (frontend,
  backend, database, auth, imaging, search, sync engine, backup) can be
  self-hosted on Algerian sovereign infrastructure (CERIST Cloud or
  Djezzy Cloud). The only external dependencies are non-clinical
  services that do not process patient-identifiable health data: SMS
  gateway (appointment reminders), payment gateway (invoice amounts),
  and code hosting (GitHub). Even observability can be self-hosted
  (Grafana + Loki + Sentry self-hosted) if the operator wants zero
  external dependencies. See §6 for the full assessment.

Algeria-specific constraints materially shaped every layer of the
architecture. Law 18-07 (amended by Law 25-11 of July 2025) classifies
health data as sensitive personal data, mandates a Data Protection
Officer, requires prior ANPDP authorization for processing, restricts
cross-border transfers, and imposes a 5-day breach notification window.
Consequently, all patient-identifiable data resides on Algerian-located,
ARPCE-authorized cloud infrastructure. Payment integration uses Chargily
Pay (v2 three-tier pricing: Startup 0%, Comfort 1.25%, Supreme 2.5%) for
the lowest-friction path. SMS appointment reminders route through
BulkGate, Sobersys, or Africala, accounting for Mobilis's higher
per-message cost and the mandatory alphanumeric Sender ID registration.

  Key Architectural Decisions: Build a modular monolith on PostgreSQL
  RLS with a lean Drizzle schema that maps 1:1 to FHIR resources but
  does not store FHIR JSON internally. Add a future /fhir/export
  endpoint for interoperability with Algeria's national DEM.DZ platform
  when its API becomes available. Resist FHIR-as-canonical-model and
  microservices-from-day-one — both are premature for a two-clinic,
  single-operator startup, even one with no deadline.

2. Background & Context

2.1 Project Context

The operator currently manages two private clinics in Algeria using
pen-and-paper workflows for nearly all clinical, scheduling, and billing
activities. The first clinic is dental-only; the second offers both
medical and dental services. The operator intends to expand the service
catalog (additional specialties) for either clinic and may open
additional clinics over the next five years. There is no fixed delivery
deadline, which permits an architecture-first approach: invest in
correct boundaries and extensible primitives now, even at the cost of a
longer initial build.

2.2 Stakeholder Requirements Summary

  ------------------------------------------------------------------------
  Dimension       Confirmed Value         Architectural Implication
  --------------- ----------------------- --------------------------------
  User count      Dozens across both      RBAC must scale; design role
                  clinics                 hierarchy

  Patient volume  ~120                    Indexed search, audit-log
                  patients/day/clinic     partitioning, archival strategy
                  (~24k/year/clinic)      

  Billing model   Pure out-of-pocket      No CNAS/CASNOS integration in
  (MVP)                                   MVP; schema must allow future
                                          bordereau export

  Payment methods Cash + CIB + Edahabia   Chargily Pay v2 integration;
                                          SATIM direct optional

  UI languages    Arabic (RTL) + French   next-intl + Tailwind v4 logical
                  (LTR)                   properties + shadcn/ui RTL

  Data residency  Cloud-hosted acceptable Algerian-located primary
                                          (CERIST/Djezzy) per Law 18-07

  Form factor     Installable web app     Serwist + manifest +
                  (PWA)                   offline-first IndexedDB

  Connectivity    Reliable but must work  Offline-first PWA with sync
                  offline                 outbox

  Build vs buy    Build from scratch      No OpenMRS/OpenEMR fork;
                                          reference their schemas only

  Self-hosting    Required — host         All clinical data on Algerian
                  everything myself       sovereign infra (see §6)

  AI agent stack  Out of scope — operator Repo conventions only (AGENTS.md
                  handles                 universal standard)

  Timeline        No deadline             Architecture-first; correctness
                                          over speed
  ------------------------------------------------------------------------

2.3 Scope of This Document

This document covers: (a) the Algerian regulatory and technical
environment that constrains the design; (b) a self-hosting assessment
answering whether the operator can host everything himself; (c) the
multi-tenant architecture, technology stack, and data model; (d) the
offline-first PWA implementation strategy; (e) bilingual RTL
internationalization; (f) security, audit, and backup/DR design; (g)
deployment topology on Algerian sovereign infrastructure; (h) repo
conventions for AI-assisted development (tool-agnostic); and (i) a
phased MVP roadmap with explicit risks and counterarguments. It does not
cover: clinical content design (treatment protocols, drug formularies),
business operations (pricing, marketing), or the operator's specific AI
agent orchestration — which is explicitly out of scope per the
operator's instruction.

3. Regulatory & Legal Framework (Algeria)

The legal environment in Algeria imposes hard constraints on data
location, consent, breach response, and audit logging. Every
architectural decision in subsequent sections must be read against this
baseline. Three statutes are load-bearing: Law 18-07 (data protection,
amended by Law 25-11 in July 2025), Law 18-11 (health, including Article
292 on the unique national medical record and Article 316 on
telemedicine), and the Code des Taxes sur le Chiffre d'Affaires (which
exempts medical acts from TVA).

3.1 Data Protection Law 18-07 (Amended by Law 25-11)

Law 18-07 of 10 June 2018 (Journal Officiel N° 34) is Algeria's general
data-protection statute, modeled on the EU GDPR. It entered into force
in August 2023 (LEX Africa cites 11 August 2023) — one year after the
ANPDP (Autorité Nationale de Protection des Données à caractère
Personnel) was installed. Law 25-11 of 24 July 2025 amends and
supplements 18-07 with stricter obligations: mandatory Data Protection
Officer, mandatory processing register with automated operation logs,
mandatory DPIA for high-risk processing, reinforced processor contracts,
and a 5-day breach notification window to ANPDP.

3.1.1 Obligations Applicable to a Clinic SaaS

  ------------------------------------------------------------------------
  #    Obligation             Legal Basis       Operational Implication
  ---- ---------------------- ----------------- --------------------------
  1    Prior declaration to   Law 18-07 Art. 7; File declaration +
       ANPDP before           Law 25-11         authorization BEFORE
       processing; prior                        go-live; multi-month
       authorization for                        process
       sensitive (health)                       
       data                                     

  2    Express, written,      Law 18-07 Art. 7  Build consent-capture UI;
       withdrawable patient                     log every consent event
       consent for all                          with timestamp
       medical-data                             
       processing                               

  3    Mandatory Data         Law 25-11         Operator designates DPO
       Protection Officer                       (internal or external
       (DPO); contact details                   counsel); see §3.1.5
       filed with ANPDP                         

  4    Processing register +  Law 25-11         Append-only audit_log
       automated operation                      table (see §9.7)
       logs (journalisation)                    

  5    DPIA for high-risk     Law 25-11         Conduct DPIA before
       processing (sensitive                    go-live; document in
       data, large scale)                       docs/adr/dpia.md

  6    Written processor      Law 25-11         Reinforce B2B contracts
       contracts with                           with any sub-processors
       reinforced clauses                       

  7    Breach notification to Law 25-11         Breach-response runbook
       ANPDP within 5 days;                     (§11.3); incident registry
       inform affected                          
       individuals                              

  8    Cross-border data      Law 18-07; Gide   Patient data MUST stay in
       transfer requires      legal analysis    Algeria; see §3.1.6
       prior ANPDP                              
       authorization                            

  9    Data subject rights:   Law 18-07         Self-service patient
       access, rectification,                   portal or admin workflow
       objection, erasure,                      (§12.4)
       complaint                                
  ------------------------------------------------------------------------

3.1.2 Health Data — Sensitive Personal Data Regime

Health data (including genetic data) is explicitly classified as
"sensitive personal data" under Law 18-07. Sensitive processing requires
prior authorization from ANPDP — not merely a declaration. ANPDP
Decision 01 of 25 February 2026 confirmed that even negative medical
test results constitute health data and imposed a 3-month retention
limit for drug-test results in recruitment contexts. While no equivalent
retention decree exists yet for clinical records, the precedent signals
ANPDP's willingness to set short, specific retention limits for
health-adjacent data.

The system implements configurable retention with per-data-category
overrides. The legal floor is the 15-year common-law prescription period
under Article 308 of Ordinance 75-58 (Algerian Civil Code, 26 September
1975). The default retention is set to 20 years as a deliberate
conservatism buffer (5 years above the legal floor) pending an ANPDP
sector-specific decree on clinical-record retention. If ANPDP issues a
shorter retention mandate, the configurable retention system can comply
without schema change. This 20-year default is explicitly a conservative
inference, not a settled regulatory requirement.

3.1.3 Sanctions for Non-Compliance

  ------------------------------------------------------------------------
  Provision              Sanction                   Source
  ---------------------- -------------------------- ----------------------
  Art. 65 (controller    Fine 200,000 – 500,000 DZD Ministry of Justice
  violation of Arts.                                official PDF
  38–39)                                            

  Art. 58                6 months – 1 year          ANPDP official PDF
  (sensitive-data        imprisonment + fine        
  violation)                                        

  Maximum criminal       Up to 5 years              Gide law firm analysis
  exposure under 18-07   imprisonment + 500,000 DZD 
  (pre-25-11)                                       

  Obstruction of ANPDP   6 months – 2 years +       GAAN legal review
  action                 60,000 – 200,000 DZD       

  Administrative fines   Up to 6,000,000 DZD (per   Halkorb; AlgeriaTech —
  (Law 25-11)            Halkorb); possibly up to   pending verification
                         10,000,000 DZD (per        
                         AlgeriaTech) — verify      
                         against official JO text   

  Serious criminal       1 – 3 years + 500,000 –    Halkorb / press
  violations             3,000,000 DZD              coverage
  (post-25-11)                                      
  ------------------------------------------------------------------------

  Conservative Posture: For risk-planning purposes, assume the higher
  administrative fine (10,000,000 DZD) until the official Law 25-11 text
  in the Journal Officiel is confirmed. The operator should validate the
  exact fine with Algerian counsel before finalizing the compliance
  budget.

3.1.4 Data Residency — The Cross-Border Transfer Question

The single most consequential regulatory finding is that Law 18-07
effectively mandates local hosting for personal data, with cross-border
transfers permitted only with prior ANPDP authorization (a multi-month
process). The Paris/Algiers law firm Gide states verbatim: "Law 18-07
furthermore strictly regulates the transfer abroad of collected personal
data, by subjecting such transfer, in particular, to the prior
authorization of the ANPDP, save for exceptions expressly set out by the
Law." Algerian SaaS vendors (Almawarid, HALKORB) explicitly market
"hosted in Algeria" as a compliance feature.

  CRITICAL: Patient-identifiable health data MUST be hosted on
  Algerian-located servers (CERIST Cloud, Djezzy Cloud, or Algérie
  Télécom Constantine DC). Non-personal workloads (analytics, CI/CD,
  monitoring) MAY run on AWS Paris at ~56 ms RTT, but only after ANPDP
  cross-border transfer authorization if any personal data is involved.
  This is non-negotiable for legal compliance and shapes every hosting
  decision in §6 and §13.

3.1.5 DPO Registration Procedure

Law 25-11 mandates a Data Protection Officer (DPO) for any organization
processing sensitive personal data at scale. The DPO registration
procedure with ANPDP:

1.  Designate a DPO. The DPO may be internal (a staff member) or
    external (Algerian counsel or a consultancy). The DPO must have
    expert knowledge of data protection law and practice. The DPO cannot
    have a conflict of interest (e.g., the DPO should not also be the
    person who decides how data is processed).

2.  Prepare the DPO filing. The filing to ANPDP must include: the DPO's
    full name, professional contact details (email, phone, postal
    address), qualifications and experience in data protection, the
    scope of the DPO's responsibilities within the organization, and the
    organization's processing register summary.

3.  Submit the filing to ANPDP. File via the ANPDP online platform
    (anpdp.dz) AND physically at the ANPDP headquarters in Algiers (Cité
    Sahli, El Biar, Alger). Retain the filing acknowledgment for the
    compliance audit trail.

4.  Notify ANPDP of any change. Any change in DPO identity, contact
    details, or scope of responsibilities must be communicated to ANPDP
    within 30 days. Maintain a DPO-change log in the audit_log table
    (entity_type = 'dpo_change').

5.  DPO qualifications. While Law 25-11 does not specify a certification
    requirement, ANPDP's practice (per Gide's legal analysis) favors
    DPOs with formal data-protection training. The operator should
    budget for DPO training if designating an internal DPO.

DPO core responsibilities under Law 25-11: (a) monitor processing
compliance; (b) advise the organization on data protection impact
assessments (DPIAs); (c) cooperate with ANPDP and serve as the contact
point for ANPDP inquiries; (d) maintain the processing register and
operation logs (the audit_log table in §9.7 serves as the operation
log); (e) handle data-subject requests (access, rectification, erasure,
objection — see §12.4). The operator must complete DPO registration
before go-live; budget 2-4 weeks for the filing and ANPDP
acknowledgment.

3.1.6 Cross-Border Transfer Authorization Procedure

Law 18-07 (as amended by Law 25-11) strictly regulates cross-border
transfers of personal data. Any transfer of personal data outside
Algeria requires prior authorization from ANPDP, with limited exceptions
expressly set out by the Law. The application procedure:

6.  Prepare the application dossier. The dossier must include: (a) the
    purpose of the transfer; (b) the categories of personal data being
    transferred; (c) the recipient country and recipient
    organization; (d) an adequacy assessment of the recipient country's
    data protection regime (or, if no adequacy, the appropriate
    safeguards — binding corporate rules, standard contractual clauses,
    or other ANPDP-approved mechanisms); (e) the duration of the
    transfer; (f) the data subject's explicit consent (if relying on
    consent as the legal basis).

7.  Submit the application to ANPDP. File via the ANPDP online platform
    and physically at ANPDP headquarters. ANPDP has 3 months to respond
    from the date of receipt of a complete dossier (per Law 18-07
    implementing provisions). In practice, the process may take 3-6
    months.

8.  Await ANPDP authorization. Do not transfer any personal data before
    receiving the authorization. Unauthorized transfers are subject to
    the sanctions in §3.1.3 (Article 58: 6 months to 1 year
    imprisonment + fine for sensitive-data violations).

9.  Renew as required. Authorizations may be time-limited. Maintain an
    authorization register with expiry dates and renewal deadlines in
    the audit_log table.

  Architecture Implication: The architecture uses AWS Paris (eu-west-3)
  for CI/CD, observability, and staging. This is lawful ONLY if no
  personal data egresses to AWS Paris. The egress-prevention controls
  are: (a) network security group rules on the CERIST/Djezzy Cloud VPS
  that restrict outbound traffic to AWS Paris to specific ports and
  block all other egress; (b) a NestJS EgressGuard interceptor that
  asserts no personal-data fields are present in any payload sent to
  AWS-Paris-hosted services; (c) Sentry PII scrubbing rules; (d) Grafana
  metrics that aggregate only (count of patients, not patient names);
  (e) a staging environment that uses pseudonymized data only (§12.5).
  These controls must be in place before go-live and verified by the DPO
  quarterly.

3.2 Health Records Regulations (Law 18-11)

Law 18-11 of 2 July 2018 (Journal Officiel N° 46) is Algeria's binding
health statute. Two articles are load-bearing for the SaaS design.
Article 292 mandates that "every patient must have a unique national
medical record" (dossier médical unique au niveau national) and defers
the modalities — including retention period — to implementing
regulation. Article 316 explicitly authorizes telemedicine, providing
the legal basis for any future remote-consultation feature. The operator
should have Algerian counsel verify both article numbers and content
against the official Journal Officiel text. The Ministry of Health has
begun deploying a national Electronic Medical Record system called
DEM.DZ, currently operational in 16 hospitals and 48 polyclinics in Oran
wilaya. Private clinics are not yet systematically integrated, but the
legal basis (Article 292) applies to both sectors; the SaaS must
therefore be designed to interoperate with DEM.DZ when its API becomes
available (see §8.1.3 on FHIR export).

3.2.1 E-Prescriptions

Algeria has no dedicated e-prescription law comparable to France's 2020
ordonnance. Law 18-11 Article 179 governs the act of prescribing but
does not mandate paper. The practical legal status, per Algerian SaaS
vendor Almawarid, is that "a prescription printed from a software is
perfectly legal in Algeria, provided it is hand-signed before being
given to the patient." Fully dematerialized, signature-less
e-prescriptions are not yet standard because Algeria has not yet
implemented a national PKI / qualified-electronic-signature scheme for
medical prescriptions. The SaaS produces PDF prescriptions with
auto-fill and a clinician wet-signature workflow, not a
digital-signature-only path.

3.3 Public Health Insurance — CNAS & CASNOS

Although the MVP is pure out-of-pocket, the data model accommodates
future CNAS/CASNOS integration. CNAS (Caisse Nationale des Assurances
Sociales des travailleurs salariés) covers salaried workers (~9 million
insured); CASNOS (Caisse Nationale des Assurances Sociales des
travailleurs non salariés) covers self-employed. Both operate under the
Ministry of Labour, Employment and Social Security (MTESS). The Carte
CHIFA — Algeria's equivalent of France's Carte Vitale — enables the
tiers payant (third-party payer) system in pharmacies and conventionné
clinics.

There is NO public, documented electronic billing API for private
clinics to bill CNAS/CASNOS directly — nothing equivalent to France's
SESAM-Vitale. The realistic future integration path is: (a) become a
conventionné clinic by signing a convention with CNAS; (b) install a
CHIFA terminal provided by CNAS; (c) generate bordereaux de factures
électroniques in the CNAS-imposed file format (typically fixed-width or
XML) extracted from the SaaS; (d) submit the bordereaux via the
conventionnement portal. The SaaS data model includes a CHIFA-card
patient identifier field and a tiers-payant invoice bordereau export
format, both dormant until the operator signs a convention.

3.4 Private Clinic Licensing

Per Law 18-11, a licence from the Minister of Health is required for the
establishment, opening, use, expansion, transfer, closing, and total or
partial change of each private health facility. The licence is granted
based on an administrative and technical file deposited with the health
authorities. The General Inspectorate of Health, Population and Hospital
Reform inspects both public and private facilities. Typical
documentation required includes: Registre du Commerce (RC), Ministry of
Health authorization, registration with the Conseil National de l'Ordre
des Médecins, certified contract with a medical director, stamped
technical drawings, equipment statements, fire-safety certificate, and
medical-waste handling license. The SaaS onboarding flow collects and
verifies these KYB (Know Your Business) fields when a clinic registers:
RC number, Ministry of Health authorization number, medical director's
license number, and CNAS convention number (if applicable).

4. Algerian Technical Ecosystem

4.1 Payment Ecosystem

The Algerian payment landscape centers on SATIM (Société
d'Automatisation des Transactions Interbancaires), the national
interbank payment switch. Two card schemes dominate: CIB (Carte
Interbancaire, issued by Algerian banks) and Edahabia (issued by Algérie
Poste on CCP accounts). As of 2026, Algeria has approximately 22 million
total payment cards in circulation, of which approximately 18 million
are Edahabia and the remainder are CIB-issued by commercial banks
(Finance Minister statement, 2026). In early 2025 SATIM was upgraded
with a national instant payments switch (built with ProgressSoft), and
in August 2025 the Bank of Algeria joined PAPSS (Pan-African Payment and
Settlement System). For an Algerian merchant, two integration paths
exist: SATIM direct, or a third-party gateway such as Chargily Pay.

4.1.1 SATIM Direct Integration

SATIM direct requires: (a) opening a merchant account with a
SATIM-supporting Algerian bank (BNA, CPA, BEA, BADR, etc.); (b)
submitting onboarding documents via the SATIM portal at cibweb.dz; (c)
signing the e-payment contract (TPE virtuel); (d) receiving Terminal ID,
username, password, and sandbox credentials at test2.satim.dz. The API
flow is redirect-based (similar to 3DS / Stripe Checkout): the backend
calls register.do with amount, unique orderNumber (max 10 chars),
returnUrl, failUrl, and idempotencyKey; SATIM responds with orderId +
formUrl; the customer is redirected to a SATIM-hosted payment page
(FR/EN/AR) and enters the card with 3DS OTP; SATIM redirects back and
the backend calls acknowledgeTransaction.do for server-side
verification. Currency is DZD; minimum transaction 50 DZD. Critically,
SATIM's native flow is one-shot with NO recurring or card-on-file
tokenization in the public API — plan for SATIM-direct recurring as not
available. SATIM direct integration specifics should be validated with
SATIM and the acquiring bank; the Berkati.xyz community blog provides a
useful overview but should not be relied upon for production integration
details.

4.1.2 Chargily Pay (Recommended for MVP)

Chargily Pay v2 (current as of July 2026) uses a three-tier subscription
model with no per-transaction caps. The operator should start on the
Startup tier (free, 0% commission) for the first month, then evaluate
whether transaction volume justifies upgrading to Comfort (1.25%) based
on actual monthly payment volume. New accounts receive 0% commission for
the first month on any tier. Supports CIB + Edahabia. Onboarding takes
days rather than the months required for SATIM direct. Source:
chargily.com/business/pay/pricing (accessed 2026-07-06).

  -----------------------------------------------------------------------
  Tier       Monthly Fee  Commission   Caps     Use Case
  ---------- ------------ ------------ -------- -------------------------
  Startup    Free         0%           None     First month for any new
                                                account; indefinite for
                                                very low volume

  Comfort    $49/month    1.25%        None     MVP default after first
                                                month if volume >
                                                ~$4,000/month

  Supreme    $99/month    2.5%         None     High-volume clinics with
                                                premium support needs
  -----------------------------------------------------------------------

4.1.3 Payment Provider Comparison

  ----------------------------------------------------------------------------
  Provider        Commission        Onboarding   Recurring   Recommendation
  --------------- ----------------- ------------ ----------- -----------------
  Chargily Pay v2 0% / 1.25% / 2.5% Days         Not native  MVP default
                  (tiered)                                   

  SATIM direct    ~1.5–2% CIB,      Months       Not         Optional, branded
                  ~1–1.5% Edahabia               available   payment page

  SlickPay        Custom            Days         Unknown     Backup option

  Mizaniya Pay    Custom            Days         Unknown     Backup option

  Physical TPE    Per acquiring     Days         N/A         Mandatory at
  (in-clinic)     bank                                       reception
  ----------------------------------------------------------------------------

Build the payment layer as a strategy pattern (PaymentProvider interface
with ChargilyPayAdapter, SlickPayAdapter, MizaniyaPayAdapter,
CashAdapter, TPEAdapter implementations) so switching providers is a
configuration change, not a code change. This also provides resilience:
if Chargily Pay has an outage, the operator can fall back to SlickPay or
Mizaniya Pay, and cash + physical TPE are always available at reception.

4.2 SMS Gateways for Appointment Reminders

Three MNOs operate in Algeria: Mobilis (state, 60301), Djezzy (wholly
Algerian state-owned since August 2022, 60302), and Ooredoo (Ooredoo
Group, 60303). Sender-ID registration is mandatory — generic
alphanumeric Sender IDs (INFO, SMS, NOTICE) are prohibited and
unregistered Sender IDs are rejected outright. Numeric Sender IDs are
not supported on Mobilis and Ooredoo unless using Vonage's 2-way
service. Practical consequence: register a custom Sender ID such as
"CLINICX" with each MNO. Mobilis is consistently the most expensive
route (~$0.32/SMS on Plivo, ~€0.24 on BulkGate); Djezzy is cheapest
(~€0.076 on BulkGate).

  ------------------------------------------------------------------------
  Provider      Type              Pricing                Recommendation
  ------------- ----------------- ---------------------- -----------------
  BulkGate      International     Djezzy €0.076; Mobilis Transparent
                gateway           €0.2412; Ooredoo       per-route
                                  €0.1685 per SMS        pricing; good for
                                                         MVP

  Sobersys      Local             Quote-based; direct    Local support;
                Algeria-based     MNO connections        good for scaling

  Africala      Algiers-based,    DZD pricing;           Direct MNO
                ARPT-compliant    quote-based            connections;
                                                         99.6% delivery
                                                         rate
  ------------------------------------------------------------------------

Plan a blended cost of €0.10–0.20 per SMS. For a clinic with 5,000
patients × 4 reminders/year = 20,000 SMS/year, budget approximately
€3,000/year (~DZD 430,000/year).

4.3 Hosting & Cloud Options

Algerian hosting options are constrained by Law 18-07's effective
data-residency mandate (see §3.1.4). The ARPCE (Autorité de Régulation
de la Poste et des Communications Électroniques) authorizes and
supervises cloud / data-hosting operators. The recommended production
hosting topology is: Algerian-resident primary (CERIST Cloud or Djezzy
Cloud) + secondary Algerian DC for DR (e.g., Algérie Télécom Constantine
DC if primary is in Algiers) + non-personal workloads on AWS Paris
(eu-west-3) at ~56 ms RTT for analytics, CI/CD, and observability —
subject to the egress controls in §3.1.6.

  --------------------------------------------------------------------------
  Provider        Type                  ARPCE Authorized Use Case
  --------------- --------------------- ---------------- -------------------
  CERIST Cloud    State research cloud; Yes              Production primary
                  VPS, S3, Block, NFS,                   (patient data)
                  Backup, VPN, LB                        

  Djezzy Cloud    Private sovereign     Yes              Production primary
                  cloud; Elastic        (authorization   or DR; S3 for
                  Compute, K8s, OSS,    number to be     Orthanc imaging
                  WAF                   verified on      
                                        arpce.dz)        

  Algérie Télécom State telco;          Yes              DR secondary; FTTH
  (Djaweb)        Constantine DC (Feb                    connectivity
                  2023)                                  

  Mobilis hosting State mobile operator Yes              Alternative DR
                  hosting                                

  AWS Paris       Public cloud, ~56 ms  N/A (foreign)    Non-personal
  (eu-west-3)     RTT from Algiers                       workloads ONLY
                                                         (CI/CD,
                                                         observability)
  --------------------------------------------------------------------------

4.4 Internet Reliability for Algerian Businesses

Algérie Télécom offers IDOOM Fibre Pro / Idoom Medium Business plans
from 200 Mbps at DZD 16,000/month up to 1.6 Gbps. 4G has nationwide
coverage from all three MNOs; 5G licenses were awarded and published in
the Official Gazette on 24 November 2025, with commercial launch in
December 2025 in 8 wilayas (Algiers, Oran, Constantine, etc.) and a
6-year nationwide rollout plan. For clinic SaaS connectivity: a typical
private clinic in Algiers/Oran/Constantine subscribes to Idoom Medium
Business 200–500 Mbps FTTH as primary, plus Mobilis or Ooredoo 5G/4G
fixed wireless as backup. Quality is stable in major cities; rural
clinics may have only ADSL or 4G — the SaaS must be resilient to
~100–200 ms RTT and brief outages, which the offline-first design in §10
directly addresses.

5. Requirements Analysis

5.1 Functional Requirements

The functional scope is organized into twelve domain modules. Each
module corresponds to a NestJS module in the backend and a feature
folder in the Next.js app. The boundaries are aligned with OpenMRS's
information model and OpenDental's schema, adapted to the Algerian
out-of-pocket context.

  ------------------------------------------------------------------------
  Module           Core Capabilities                         Priority
  ---------------- ----------------------------------------- -------------
  Auth             Login, MFA, session, password reset, role P0 (MVP)
                   assignment                                

  Clinic (Tenant)  Clinic profile, branches, staff,          P0 (MVP)
                   operatory, schedule templates             

  Patient          Demographics, search, merge, consent log, P0 (MVP)
                   KYB snapshot                              

  Appointment      Calendar, booking, chair assignment,      P0 (MVP)
                   recurring (RRULE), reminders              

  Encounter        Vitals, SOAP notes, problems list,        P0 (MVP)
  (Medical)        allergies, prescriptions                  

  Dental           Odontogram (FDI), treatment plans, perio  P0 (MVP)
                   charting, CDT procedures                  

  Billing          Invoices, payments (cash/CIB/Edahabia),   P0 (MVP)
                   refunds, daily cash report                

  Inventory        Pharmacy stock, dental materials,         P1 (Phase 9)
                   dispense, low-stock alerts                

  Imaging          Orthanc DICOM, intraoral photos, OHIF     P1 (Phase 7)
                   viewer integration                        

  Reports          Daily/monthly stats, cashier report,      P1 (Phase 8)
                   audit log export                          

  FHIR Export      /fhir/export endpoint emitting FHIR       P2 (Phase 10)
                   Bundles for DEM.DZ interop                

  CNAS/CASNOS      CHIFA patient ID, bordereau export        P2 (Phase 11)
                   (dormant until convention)                

  Patient Portal   Self-service appointment booking,         P2 (Phase
                   prescription viewing, invoice payment     12+)

  Telemedicine     WebRTC remote consultations (Law 18-11    P2 (Phase
                   Art. 316 authorized)                      13+)
  ------------------------------------------------------------------------

5.2 Non-Functional Requirements

  ------------------------------------------------------------------------
  Attribute        Target                      Rationale
  ---------------- --------------------------- ---------------------------
  Multi-tenancy    Pool model with RLS;        2 → 50 clinics; AWS SaaS
                   tenant_id on every table    Factory recommendation

  Availability     99.5% during clinic hours   Single-clinic paper
                   (08:00–20:00 Algeria)       fallback within 4h RTO

  Offline          Full create/edit capability Internet reliable but must
  tolerance        for ≥24h offline            keep working if it drops

  RPO / RTO        ≤ 15 min RPO / ≤ 4 h RTO    Continuous WAL archive;
                                               quarterly restore test

  P95 page load    ≤ 2 s on FTTH, ≤ 4 s on 4G  Reception workflow must
                   backup (Lighthouse CI gate) feel instant

  P95 API latency  ≤ 300 ms server-side on     120 patients/day × dozens
                   indexed reads (k6           of users = sustained low
                   regression gate)            load

  Concurrent users 50 concurrent users per     Dozens of users per clinic
                   clinic without degradation  × peak hours; headroom for
                   (k6 load profile)           growth

  Languages        Arabic (ar-DZ, RTL) +       Bilingual UI with locale
                   French (fr-DZ, LTR)         switcher

  Numerals         Western Arabic (0–9) in     Algerian clinical
                   both locales                convention (Maghreb)

  Accessibility    WCAG 2.2 AA conformance for Legal accessibility
                   all UI surfaces, both LTR   expectation; essential for
                   and RTL (axe-core CI gate)  RTL Arabic screen-reader
                                               users

  Data residency   Patient data on Algerian    Law 18-07 / ANPDP
                   soil                        

  Breach           ≤ 5 days to ANPDP           Law 25-11
  notification                                 

  Audit log        6 years minimum,            HIPAA precedent + ANPDP
  retention        partitioned monthly         expectation

  Clinical record  20 years default (15-year   Art. 308 Ord. 75-58 +
  retention        legal floor + 5-year        conservatism buffer
                   buffer), configurable       

  Search           Sub-50 ms typo-tolerant on  Reception workflow;
                   patient name (FR + AR)      Meilisearch upgrade path
  ------------------------------------------------------------------------

5.3 Constraints & Assumptions

-   Patient-identifiable data must reside in Algeria (Law 18-07).
    Non-negotiable.

-   No CNAS/CASNOS electronic billing API exists publicly; future path
    is bordereau file export via CHIFA terminal.

-   Recurring card-on-file payments are not natively supported by SATIM;
    design billing as per-invoice.

-   E-prescriptions require clinician wet-signature; no qualified
    electronic signature scheme for medical prescriptions in Algeria
    yet.

-   Background Sync API is partial in Safari/Firefox; foreground
    IndexedDB outbox is the primary mechanism.

-   Medical acts are TVA-exempt (Code des Taxes sur le Chiffre
    d'Affaires, Art. 91 CGI); non-medical items (cosmetic, retail) at 9%
    or 19%.

-   Algeria's e-invoicing mandate is expected in 2027 (B2B/B2G first);
    no binding legislation published as of July 2026. Invoice schema
    stores all DGI mandatory mentions from day 1 as a future-proofing
    measure.

6. Self-Hosting Assessment

The operator has asked whether the entire solution — frontend, backend,
database, and all supporting infrastructure — can be self-hosted. The
answer is unambiguously yes: 100% of the clinical data stack can be
self-hosted on Algerian sovereign infrastructure, with no proprietary
SaaS dependencies for any component that processes patient-identifiable
health data. This section enumerates every component, its self-hosting
status, and the hosting location.

6.1 Component-by-Component Self-Hosting Inventory

  ------------------------------------------------------------------------------
  Component           Self-Hostable?   License            Hosting Location
  ------------------- ---------------- ------------------ ----------------------
  Next.js 16 frontend Yes              MIT (open-source)  CERIST/Djezzy Cloud
  (PWA)                                                   VPS + Nginx/Caddy

  NestJS backend      Yes              MIT (open-source)  CERIST/Djezzy Cloud
  (modular monolith)                                      VPS

  Worker app          Yes              MIT (open-source)  Same VPS as backend or
  (BullMQ + Redis)                                        separate VPS

  PostgreSQL 17       Yes              PostgreSQL License CERIST/Djezzy Cloud
  database                             (BSD-like,         VPS
                                       open-source)       

  Drizzle ORM         Yes              Apache-2.0         Embedded in backend
                                       (open-source)      

  Better Auth         Yes              MIT (open-source)  Embedded in backend
  (authentication)                                        

  Redis (cache +      Yes              BSD (open-source)  Co-located on backend
  Socket.IO adapter +                                     VPS or dedicated VPS
  BullMQ)                                                 

  Orthanc DICOM       Yes              GPLv3              Docker container on
  server                               (open-source)      CERIST/Djezzy Cloud
                                                          VPS

  S3-compatible       Yes              Provider-managed   Djezzy Cloud OSS /
  object storage                                          CERIST object storage
  (imaging + backups)                                     

  pgBackRest          Yes              MIT (open-source)  On the PostgreSQL VPS;
  (backup + PITR)                                         repositories on Djezzy
                                                          S3 + CERIST S3

  Nginx / Caddy       Yes              BSD / Apache-2.0   On the frontend VPS
  (reverse proxy +                     (open-source)      
  TLS)                                                    

  Serwist service     Yes              MIT (open-source)  Client-side (browser)
  worker (PWA                                             
  offline)                                                

  Dexie (IndexedDB    Yes              Apache-2.0         Client-side (browser)
  offline cache)                       (open-source)      

  PowerSync Open      Yes              FSL-1.1-ALv2       CERIST/Djezzy Cloud
  Edition (v2 sync                     (auto-converts to  VPS + MongoDB metadata
  engine)                              Apache-2.0 in 2    VPS
                                       years)             

  Meilisearch (v2     Yes              Apache-2.0         CERIST/Djezzy Cloud
  search engine)                       (open-source)      VPS

  Socket.IO           Yes              MIT (open-source)  Embedded in backend
  (real-time)                                             

  tRPC + Zod (API     Yes              MIT / MIT          Embedded in frontend +
  contracts)                           (open-source)      backend

  shadcn/ui (Base     Yes              MIT (open-source,  Embedded in frontend
  UI + Tailwind)                       copy-into-repo)    
  components                                              

  Vitest +            Yes              MIT (open-source)  CI/CD runners
  Playwright + MSW                                        (self-hosted or GitHub
  (testing)                                               Actions)

  Grafana +           Yes              AGPLv3 /           CERIST/Djezzy Cloud
  Prometheus + Loki                    Apache-2.0         VPS (or AWS Paris for
  (observability)                      (open-source)      non-personal
                                                          telemetry)

  Sentry (error       Yes              AGPLv3             Self-hosted on
  tracking)           (self-hosted) or (self-hosted) or   CERIST/Djezzy, or SaaS
                      SaaS             SaaS               with PII scrubbing
  ------------------------------------------------------------------------------

6.2 External Dependencies (Non-Clinical, No Patient Data)

The only external dependencies are services that do NOT process
patient-identifiable health data. These are non-negotiable operational
dependencies (you cannot run a clinic without SMS reminders or payment
processing), but they are cleanly separated from the clinical data
stack:

  ---------------------------------------------------------------------------
  External          What It Processes Why It Cannot Be  Mitigation
  Dependency                          Self-Hosted       
  ----------------- ----------------- ----------------- ---------------------
  SMS gateway       Phone numbers +   Requires direct   Minimize data sent:
  (BulkGate /       appointment       MNO connections   phone number +
  Sobersys /        reminder text (no and ARPT          appointment time
  Africala)         clinical content) licensing         only; no diagnosis or
                                                        treatment details

  Payment gateway   Invoice amount +  Requires banking  Payment metadata
  (Chargily Pay /   invoice reference license and SATIM only; invoice line
  SATIM)            (no clinical      integration       items (CDT codes)
                    content)                            stay in the clinic
                                                        SaaS; gateway sees
                                                        only the total amount

  GitHub (code      Source code only  Could self-host   Code only; no patient
  hosting)          (no patient data) Gitea/GitLab, but data ever committed;
                                      GitHub Actions    .env files in OS
                                      CI/CD is a major  keyring
                                      productivity      
                                      lever             

  Domain            Domain name only  Could use         Use an
  registrar + DNS                     Algerian          Algerian-registered
                                      registrar (e.g.,  .dz domain if maximum
                                      nic.dz)           sovereignty is
                                                        desired
  ---------------------------------------------------------------------------

6.3 Fully Self-Hosted Topology

The recommended production topology places 100% of the clinical data
stack on Algerian sovereign infrastructure. The operator can optionally
self-host observability too (Grafana + Loki + Sentry on an Algerian VPS)
for a zero-external-dependency posture, with the trade-off of higher
operational burden. The topology below shows the fully self-hosted
configuration:

  ┌─────────────────────────────────────────────────────────────────────┐
  │ ALGERIAN SOVEREIGN INFRASTRUCTURE (CERIST Cloud / Djezzy Cloud) │
  │ │
  │ VPS-1 (Frontend + Reverse Proxy) │
  │ • Nginx / Caddy (TLS 1.3, HSTS) │
  │ • Next.js 16 PWA (Node.js 22) │
  │ • 2 vCPU, 4 GB RAM, 40 GB SSD │
  │ │
  │ VPS-2 (Backend + Worker) │
  │ • NestJS API (Fastify adapter) │
  │ • Worker app (NestJS + BullMQ) │
  │ • Socket.IO server │
  │ • 4 vCPU, 8 GB RAM, 80 GB SSD │
  │ │
  │ VPS-3 (Database + Redis) │
  │ • PostgreSQL 17 (with RLS, pgBackRest) │
  │ • Redis 7 (cache + Socket.IO adapter + BullMQ) │
  │ • 4 vCPU, 16 GB RAM, 200 GB SSD + WAL volume │
  │ │
  │ VPS-4 (Imaging) │
  │ • Orthanc DICOM server (Docker) │
  │ • 2 vCPU, 4 GB RAM, 20 GB SSD │
  │ • S3 backend: Djezzy Cloud OSS │
  │ │
  │ VPS-5 (Observability — OPTIONAL, for zero external dependencies) │
  │ • Grafana + Prometheus + Loki │
  │ • Sentry self-hosted │
  │ • 2 vCPU, 4 GB RAM, 50 GB SSD │
  │ │
  │ VPS-DR (Disaster Recovery — Algérie Télécom Constantine DC) │
  │ • PostgreSQL streaming replica (read-only, async) │
  │ • 4 vCPU, 16 GB RAM, 200 GB SSD │
  │ • Promoted to primary in ≤ 4h RTO │
  └─────────────────────────────────────────────────────────────────────┘
  EXTERNAL DEPENDENCIES (non-clinical, no patient data):
  • SMS gateway (BulkGate / Sobersys / Africala) — appointment reminders
  • Payment gateway (Chargily Pay) — invoice amounts only
  • GitHub — code hosting + CI/CD runners
  OPTIONAL (if operator accepts external SaaS for non-personal
  workloads):
  • AWS Paris (eu-west-3) — CI/CD runners, Grafana Cloud, Sentry SaaS
  (subject to egress controls in §3.1.6; NO patient data)

6.4 Cost Estimate for Fully Self-Hosted Topology

  -----------------------------------------------------------------------
  Component         Provider          Monthly Cost    Notes
                                      (DZD)           
  ----------------- ----------------- --------------- -------------------
  VPS-1 (Frontend)  CERIST Cloud VPS  ~3,000          2 vCPU, 4 GB RAM,
                    Small                             40 GB SSD

  VPS-2 (Backend +  CERIST Cloud VPS  ~6,000          4 vCPU, 8 GB RAM,
  Worker)           Medium                            80 GB SSD

  VPS-3 (Database + CERIST Cloud VPS  ~12,000         4 vCPU, 16 GB RAM,
  Redis)            Large                             200 GB SSD + WAL

  VPS-4 (Imaging)   Djezzy Cloud      ~4,000          2 vCPU, 4 GB RAM,
                    Elastic Compute                   20 GB SSD + OSS
                                                      usage

  VPS-5             CERIST Cloud VPS  ~3,000          2 vCPU, 4 GB RAM,
  (Observability,   Small                             50 GB SSD
  optional)                                           

  VPS-DR (Disaster  Algérie Télécom   ~10,000         4 vCPU, 16 GB RAM,
  Recovery)         Constantine DC                    200 GB SSD

  S3 storage        Djezzy Cloud OSS  ~2,000          ~500 GB at ~4
  (imaging +                                          DZD/GB/month
  backups)                                            

  FTTH connectivity Algérie Télécom   ~16,000         Primary clinic
  (200 Mbps)        Idoom Pro                         connectivity

  5G/4G backup      Mobilis / Ooredoo ~3,000          Failover
  connectivity                                        connectivity

  SMS gateway (20k  BulkGate /        ~36,000         ~€3,000/year / 12
  SMS/year)         Africala                          

  Payment gateway   Chargily Pay      0 (Startup      Per-transaction
                                      tier) or $49    commission applies
                                      (Comfort)       

  Domain + DNS      nic.dz or         ~1,000          .dz domain
                    international                     preferred for
                                                      sovereignty

  Total (with       —                 ~96,000         ~1,152,000 DZD/year
  observability +                     DZD/month       (~€8,000/year)
  DR)                                                 

  Total (minimal:   —                 ~71,000         ~852,000 DZD/year
  no observability                    DZD/month       (~€6,000/year)
  VPS, no DR)                                         
  -----------------------------------------------------------------------

  Self-Hosting Verdict: YES — the entire clinical data stack is
  self-hostable on Algerian sovereign infrastructure using only
  open-source or source-available licenses. The only external
  dependencies (SMS, payments, code hosting) process no
  patient-identifiable health data. Even observability can be
  self-hosted (Grafana + Loki + Sentry self-hosted) if the operator
  wants a zero-external-dependency posture. Estimated cost: ~96,000
  DZD/month (~€640/month) for the full topology with DR and
  observability; ~71,000 DZD/month (~€475/month) for a minimal topology.
  These costs are trivial relative to the cost of a single clinic's
  operations and the legal risk of non-compliant hosting.

7. System Architecture

7.1 Multi-Tenancy Model — Pool Model with PostgreSQL RLS

AWS SaaS Factory defines three canonical multi-tenancy models: Silo
(DB-per-tenant), Bridge (shared-DB-separate-schema), and Pool
(shared-DB-shared-schema with row-level security). For 2 → 50 clinics
with ~120 patients/day/clinic and dozens of users, the Pool Model is the
explicit AWS recommendation. Crunchy Data's Postgres-specific framing
concurs: "tenant discriminator in shared tables" with a tenant_id on
every table is the right default; DB-per-tenant becomes unwieldy at 10+
tenants due to migration overhead, and schema-per-tenant offers minimal
isolation gain over RLS for substantial operational cost. Citus sharding
is premature at this scale; ADR-001 documents a trigger threshold (>200
tenants or >5 TB or P95 >500 ms) that initiates evaluation of Citus
sharding, preventing premature optimization while ensuring the trigger
is documented.

7.1.1 PostgreSQL Row-Level Security Implementation

PostgreSQL RLS enforces tenant isolation at the database engine level —
a defense-in-depth mechanism that prevents data leaks even if the
application layer forgets a WHERE clause. The pattern uses session
variables set per request: the NestJS request lifecycle issues `SET
LOCAL app.current_tenant = $1` at the start of each transaction, and
every tenant-scoped table has a policy `USING (tenant_id =
current_setting('app.current_tenant')::uuid)`. Critical configuration
points:

-   ALTER TABLE ... ENABLE ROW LEVEL SECURITY on every tenant-scoped
    table.

-   ALTER TABLE ... FORCE ROW LEVEL SECURITY on every tenant-scoped
    table — without FORCE, the table owner bypasses policies, and
    Drizzle migrations run as table owner.

-   CREATE INDEX ... USING btree(tenant_id) on every tenant-scoped table
    — Supabase benchmarks show 171 ms → <0.1 ms with the index (note:
    these are Supabase's own figures measured on Supabase
    infrastructure; the operator should re-benchmark on CERIST Cloud VPS
    to confirm the same gains).

-   Reserve one named ops_superuser role with BYPASSRLS; the application
    DB role MUST NOT have BYPASSRLS.

-   Wrap policy helper functions in (select ...) so Postgres treats them
    as stable scalars — Supabase measured 173,000 ms → 16 ms with this
    refactor.

-   RLS does NOT apply to TRUNCATE or REFERENCES — revoke TRUNCATE from
    the app role.

-   PgBouncer in transaction-pooling mode breaks SET LOCAL session vars
    — use pool_mode=session, or adopt Supavisor/PgCat which support
    session vars in transaction mode.

  -- Schema pattern for every tenant-scoped table
  CREATE TABLE patient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES clinic(id),
  -- ... domain columns ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES app_user(id)
  );
  ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
  ALTER TABLE patient FORCE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation ON patient
  USING (tenant_id = NULLIF(current_setting('app.current_tenant', true),
  '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant',
  true), '')::uuid);
  CREATE INDEX patient_tenant_idx ON patient (tenant_id) WHERE
  deleted_at IS NULL;
  CREATE INDEX patient_tenant_name_idx ON patient (tenant_id,
  family_name, given_name);

7.2 Modular Monolith (Not Microservices)

Martin Fowler's "Monolith First" principle is unambiguous: "Almost all
the successful microservice stories have started with a monolith that
got too big and was broken up. Almost all the cases where I've heard of
a system that was built as a microservice system from scratch, it has
ended up in serious trouble." Shopify — one of the largest Ruby on Rails
codebases in existence — chose to evolve into a "modular monolith"
rather than decompose into microservices. For a clinic SaaS built by a
single operator, the modular-monolith advantages compound: one
deployment, one DB connection pool, one CI pipeline; cross-domain
workflows ("patient checks in → appointment started → encounter created
→ inventory dispensed → invoice generated") span 5 domains and an
in-process EventEmitter is 1000× faster and simpler than a message bus;
easier to discover correct module boundaries inside one codebase before
extracting later; and one VM/container on CERIST/Djezzy Cloud instead of
N microservices × N containers.

7.3 High-Level Architecture

  ┌─────────────────────────────────────────────────────────────────────┐
  │ CLIENTS (installable PWA) │
  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
  │ │ Reception │ │ Doctor tablet│ │ Admin desktop│ │
  │ │ desktop │ │ (chair-side) │ │ │ │
  │ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │
  │ │ Next.js 16 (App Router) + Serwist PWA + shadcn/ui (RTL) │
  │ │ TanStack Query + Dexie (IndexedDB) + sync outbox │
  │ │ next-intl (ar-DZ / fr-DZ) + Tailwind v4 logical props │
  └─────────┼───────────────────────────────────────────────────────────┘
  │ HTTPS + WebSocket (Socket.IO)
  ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ API LAYER (NestJS modular monolith — self-hosted on CERIST/Djezzy) │
  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
  │ │ Auth │ │ Clinic │ │ Patient │ │ Appt │ │Encounter│ │
  │ │ Module │ │ Module │ │ Module │ │ Module │ │ Module │ │
  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
  │ │ Dental │ │ Billing │ │Inventry │ │ Imaging │ │ Audit │ │
  │ │ Module │ │ Module │ │ Module │ │ Module │ │ Module │ │
  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
  │ Better Auth + RBAC guard + RLS tenant interceptor + EgressGuard │
  │ tRPC v11 + Zod (internal); trpc-openapi (external) │
  └─────────┬───────────────────────────────┬───────────────────────────┘
  │ │
  ▼ ▼
  ┌─────────────────────┐ ┌────────────────────────────────────┐
  │ PostgreSQL 17 │ │ Orthanc (DICOM server, Docker) │
  │ + RLS per tenant │ │ + S3-compatible storage │
  │ + pgBackRest PITR │ │ (Djezzy Cloud OSS) │
  │ + pgvector (later) │ └────────────────────────────────────┘
  │ + Meilisearch (P2) │
  └─────────┬───────────┘
  │ WAL archive (continuous)
  ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ BACKUP / DR (3-2-1-1-0) — all on Algerian sovereign infrastructure │
  │ • Repo 1: Djezzy Cloud S3 (encrypted, AES-256-CBC) │
  │ • Repo 2: CERIST S3 (different media, different provider) │
  │ • Repo 3: Weekly encrypted external HDD in clinic safe │
  │ • DR replica: Algérie Télécom Constantine DC (streaming) │
  │ • Quarterly restore test per NIST SP 800-34 │
  └─────────────────────────────────────────────────────────────────────┘
  OPTIONAL EXTERNAL (non-personal workloads only, subject to §3.1.6
  egress controls):
  • AWS Paris eu-west-3: CI/CD runners, Grafana Cloud, Sentry SaaS
  • NO patient data; EgressGuard interceptor enforces

7.4 Domain Module Boundaries

Each NestJS module encapsulates its domain logic, application services,
and infrastructure concerns. A module may import only another module's
public API (exported via index.ts); importing another module's internal
services is a lint error. Cross-module write-side effects go through
EventEmitter2 (in-process), never direct cross-module service calls.
Each domain module owns its Drizzle schema file; the root
schema/index.ts aggregates them for Drizzle-Kit migrations. Event
payloads are designed to be transport-agnostic from day 1
(JSON-serializable, no class instances) so that a future extraction to a
message bus (Redis Streams / NATS) requires no contract changes.

  src/
  main.ts
  app.module.ts
  modules/
  auth/ # login, sessions, JWT, refresh tokens, MFA
  clinic/ # tenant management, branches, staff, operatory
  patient/ # demographics, search, merge, consent
  appointment/ # calendar, booking, RRULE recurrence, reminders
  encounter/ # visits, vitals, SOAP notes, problems, allergies
  dental/ # odontogram, treatment plans, perio, CDT procedures
  billing/ # invoices, payments, refunds, cash drawer
  inventory/ # pharmacy + dental materials, dispense, alerts
  imaging/ # Orthanc integration, intraoral photos
  audit/ # append-only audit_log writer + readers
  shared/ # primitives, types, Result<T>, Pagination, Money
  infrastructure/
  drizzle/ # drizzle.config.ts, schema/, migrations/
  rls/ # SET LOCAL app.current_tenant interceptor
  postgres/ # connection pool config
  auth/ # Better Auth config + Organization plugin
  egress/ # EgressGuard interceptor (AWS Paris PII blocking)

8. Technology Stack

The stack is chosen end-to-end TypeScript for three reasons: (1) the
operator is using AI agents, and TypeScript has the largest AI training
corpus and best tool-time type inference; (2) plain-TypeScript schema
definitions (Drizzle) and function-based API routers (tRPC) maximize
AI-agent productivity; (3) a single language across frontend, backend,
and shared contracts enables a single shared package
(packages/contracts) for Zod schemas, tRPC routers, and MSW mocks — one
source of truth. Every component is self-hostable on Algerian sovereign
infrastructure (see §6).

8.1 Stack Summary

  ------------------------------------------------------------------------------------------
  Layer           Choice                     License          Rationale
  --------------- -------------------------- ---------------- ------------------------------
  Frontend        Next.js 16 (App Router)    MIT              Largest ecosystem, official
  framework                                                   PWA guide, React 19, RSC,
                                                              Turbopack stable

  PWA / Service   @serwist/next              MIT              Maintained successor to
  Worker                                                      next-pwa; wraps Workbox;
                                                              Webpack build for v1

  Offline-first   TanStack Query + Dexie     MIT /            Lowest operational complexity
  data            (v1); PowerSync Open       FSL→Apache-2.0   for solo dev; PowerSync FSL
                  Edition (v2)                                auto-converts to Apache in 2
                                                              years

  RTL styling     Tailwind CSS v4 logical    MIT              Native CSS logical properties;
                  properties (ms-*, me-*,                     no plugin needed
                  ps-*, pe-*, start-*,                        
                  end-*)                                      

  i18n            next-intl with ar-DZ +     MIT              App-Router-native; ICU plurals
                  fr-DZ, ICU MessageFormat,                   (6 forms for Arabic); forces
                  numberingSystem: "latn"                     Western numerals

  UI components   shadcn/ui (Base UI +       MIT              Base UI is the July 2026
                  Tailwind) — first-class                     default; Radix still
                  RTL shipped Jan 2026                        supported; copy-into-repo
                                                              model = AI agents can edit
                                                              source directly

  Backend         NestJS modular monolith on MIT              Module system maps 1:1 to
  framework       @nestjs/platform-fastify                    domain modules; DI; guards;
                                                              interceptors; Fastify = ~2×
                                                              Express throughput

  Worker app      NestJS + @nestjs/bullmq    MIT              SMS reminders, payment
                  with Redis backend                          reconciliation, backup
                                                              verification, audit-log
                                                              integrity check

  ORM             Drizzle ORM with native    Apache-2.0       Plain-TS schema (no DSL
                  RLS support                                 codegen); types inferred;
                                                              native RLS = bulletproof
                                                              multi-tenancy

  Database        PostgreSQL 17 + RLS +      PostgreSQL       Mature; RLS; FTS; JSONB;
                  pgBackRest PITR + (later)  License          Postgres 17 brings incremental
                  pgvector                                    backups, faster vacuuming

  Auth            Better Auth                MIT              Supersedes deprecated Lucia;
                  (Organization + RBAC                        Organization plugin =
                  plugins), self-hosted                       multi-tenant SaaS native;
                                                              avoids Clerk's US-hosted data
                                                              residency issue

  API contracts   tRPC v11 + Zod (internal); MIT / MIT        Zero codegen; end-to-end type
                  trpc-openapi (external)                     inference; single source of
                                                              truth

  Real-time       Socket.IO +                MIT              Rooms (per-clinic channels),
                  @socket.io/redis-adapter                    reconnection, multi-node via
                                                              Redis pub/sub

  Search          PostgreSQL FTS + unaccent  Apache-2.0       No new infra for v1;
                  (v1); Meilisearch (v2)                      Meilisearch Charabia tokenizer
                                                              for Arabic typo-tolerance

  Medical imaging Orthanc (Docker) +         GPLv3            Open-source DICOM server;
                  S3-compatible (Djezzy                       NIH-cited; Postgres/S3
                  Cloud OSS) +                                backends; sovereign storage
                  OHIF/Cornerstone3D                          

  Backup          pgBackRest with            MIT              Full/Diff/Incr + continuous
                  AES-256-CBC client-side                     WAL; PITR ≤5 min; 3-2-1-1-0
                  encryption                                  across sovereign S3 + offline
                                                              HDD

  Monorepo        Turborepo + pnpm           MIT              Lower cognitive load than Nx;
                  workspaces                                  sufficient at solo-operator
                                                              scale

  Testing         Vitest (unit) + Playwright MIT              Industry-standard 2026 stack;
                  (E2E) + MSW (API                            axe-core gates on WCAG 2.2 AA
                  mocking) + Lighthouse CI +                  
                  axe-core                                    

  Observability   Grafana + Prometheus +     AGPLv3 / SaaS    Self-hostable on Algerian VPS;
                  Loki (self-hosted) or                       SaaS option with strict PII
                  Sentry SaaS with PII                        scrubbing if preferred
                  scrubbing                                   
  ------------------------------------------------------------------------------------------

8.2 Frontend — Next.js 16 PWA with RTL

Next.js 16 (released October 2025) ships with Turbopack stable for dev
and prod builds, React 19.2, Cache Components, and a redesigned caching
layer. The official Next.js docs include a "Guides: PWAs" page making
PWA a first-class supported scenario. The Serwist setup is four steps:
wrap next.config with withSerwist, update tsconfig.json, update
.gitignore, create the service worker. Caveat: Serwist + Turbopack
integration is still smoothing out in 2026 — use Webpack for production
builds (turbopack: false in next build) until Serwist's Turbopack story
fully stabilizes; Turbopack dev mode is fine.

8.3 Backend — NestJS Modular Monolith

NestJS modules map 1:1 to domain modules, with dependency injection,
guards for RBAC, interceptors for logging/tenancy, and decorators for
OpenAPI. Use @nestjs/platform-fastify as the underlying HTTP adapter for
~2× Express throughput. Optional @nestjs/cqrs for complex aggregates
(e.g., treatment plan with multi-step procedures); for most modules, a
simple Controller → Service → Repository layering is sufficient. The
request lifecycle includes a tenant interceptor that issues `SET LOCAL
app.current_tenant = $1` at the start of each transaction, an
AuditInterceptor that captures before/after state for all mutating
operations, and an EgressGuard interceptor that asserts no personal-data
fields are present in payloads sent to AWS Paris (if AWS Paris is used
for non-personal workloads).

8.4 Database & ORM — PostgreSQL 17 + Drizzle with RLS

PostgreSQL 17 (released September 2024) is the recommended version — it
brings incremental backups, faster vacuuming, better JSON tables, and
improved MERGE performance over PostgreSQL 16. Drizzle ORM defines
schemas as plain TypeScript — types are inferred, not generated. This is
the single biggest AI-agent productivity win in the data layer: agents
can refactor with standard TS tooling, no codegen step, no DSL to learn.
Drizzle has native Row-Level Security support for Postgres, including
policy creation and role management from the schema. Pair with the
pgvector extension if semantic search is later needed.

8.5 Authentication — Better Auth (Self-Hosted)

Better Auth is the recommended self-hosted authentication library,
superseding the deprecated Lucia (whose maintainer announced deprecation
in October 2024). Better Auth's Organization plugin provides built-in
members, teams, roles, and an organization switcher — explicitly
designed for multi-tenant SaaS. It pairs naturally with Drizzle +
Postgres RLS (the session table can be RLS-protected too). Avoid Clerk
for this project: Clerk is managed and US-hosted, which creates an
awkward legal situation under Algerian Law 18-07's data residency
requirements. Fallback: Auth.js v5 (formerly NextAuth.js) if Better
Auth's smaller ecosystem bites.

8.6 Real-Time — Socket.IO + Redis Adapter

Socket.IO adds rooms (perfect for per-clinic channels:
socket.join(`clinic-42`)), reconnection with backoff, fallback to
long-polling, and a Redis adapter for multi-node horizontal scaling. Use
cases: appointment board updates (reception sees real-time slot
changes), waiting-room display (TV in waiting room shows "now serving
patient X"), and doctor dashboard (current chair status). WebRTC is
reserved for a future doctor-patient telemedicine video feature (which
Law 18-11 Article 316 explicitly authorizes — see §11.6).

8.7 Search — PostgreSQL FTS (v1) → Meilisearch (v2)

PostgreSQL Full-Text Search supports tsvector, tsquery, GIN indexes, the
unaccent extension (removes French diacritics: é→e), and custom Hunspell
dictionaries for Arabic. The unaccent extension works for French but
does NOT normalize Arabic diacritics (harakat are non-spacing marks that
unaccent ignores). For v1, PostgreSQL FTS + unaccent is sufficient for
French patient-name search and basic Arabic substring search — no new
infrastructure to run. For v2, upgrade to Meilisearch when sub-50 ms
typo-tolerant Arabic search across the whole patient base becomes a real
workflow need. Meilisearch's Charabia Rust tokenizer provides Arabic
segmentation and normalization (مُحَمَّد vs محمد vs محمّد — same name,
different diacritization). Skip Elasticsearch (operational overhead not
justified at this scale).

8.8 Medical Imaging — Orthanc + Sovereign S3

Orthanc is the free, open-source, lightweight DICOM server for medical
imaging — maintained by UCLouvain (Belgium), peer-reviewed in NIH PMC.
It has a REST API, official Docker images (orthancteam/orthanc), plugins
for PostgreSQL storage, MySQL storage, DICOMweb, and a built-in Stone
Web Viewer. X-rays, CBCT, intraoral scans, and panoramic imaging are
DICOM natively (DICOM = ISO 12052). Plain JPEG/PNG lose the metadata
(modality, slice thickness, patient orientation) that clinicians need.
For dental intraoral photos that start as JPEG, wrap them in DICOM on
ingest (Orthanc supports this) so the whole imaging pipeline is uniform.

S3-compatible sovereign storage options in Algeria: Djezzy Cloud OSS
(ARPCE authorized), CERIST Cloud object storage, and newer providers
like Deploily and ADEX Technology. Orthanc has a community S3 storage
plugin so DICOM files land directly in sovereign Algerian S3-compatible
storage. Combined with Algerian-resident Postgres, this satisfies Law
18-07's cross-border transfer restrictions for health data. For the
React-integrated web viewer, use OHIF Viewer or Cornerstone3D. For
non-DICOM devices (intraoral scanners producing STL/PLY, vital-signs
monitors), see §11.5 (Future Integrations) — these are deferred to Phase
9+.

9. Data Model Design

9.1 Multi-Tenant Schema Strategy

Every tenant-scoped table follows the same pattern: UUID primary key,
tenant_id (FK to clinic), created_at, updated_at, deleted_at (soft
delete), created_by (FK to app_user). The tenant_id is enforced by RLS
at the database engine level (see §7.1.1). Soft deletes are mandatory
for clinical records — Algerian civil liability statute plus the
patient's right to access historical records under Law 18-07 forbid hard
deletes except via a documented retention-expiry process.

9.1.1 Should We Use FHIR as the Canonical Model?

No — for v1, do NOT use FHIR resources as the internal storage model.
FHIR is verbose (a Patient resource has 50+ top-level fields, most
unused for a dental clinic, adding ~3-5× storage overhead vs a lean
Drizzle schema). FHIR has a 2-year major-release cycle (R3 → R4 → R4B →
R5 → R6 ballot); each release deprecates fields and adds new ones — if
FHIR is your storage model, you must migrate with each release. FHIR has
no multi-tenancy primitive; you must add tenant_id extensions or
partition via FHIR compartments. Creating a single Encounter resource
often requires first creating/finding Practitioner, PractitionerRole,
Organization, Location, Patient, Coverage resources — 7 round-trips for
one appointment. Learning curve is 2-4 weeks for a TypeScript engineer.

Instead: design lean Drizzle tables that map 1:1 to FHIR resources
(patient, encounter, observation, condition, procedure, appointment,
invoice, allergy, medication, immunization) and add a future
national-interop adapter interface with FHIR as the first
implementation. The adapter pattern (NationalInteropAdapter interface
with FhirAdapter, FutureFormatAdapter implementations) hedges against
DEM.DZ shipping a non-FHIR API. This gives interoperability with DEM.DZ
when it ships an API without paying the verbosity tax internally.
Fire.ly's 2025 "State of FHIR" report shows 71% of respondents use FHIR
actively in their country — the trend is clear, but the adoption for a
startup should be at the integration boundary, not the storage layer.

9.2 RBAC Model

The RBAC model follows NIST RBAC (ANSI/INCITS 359-2012) with
OpenMRS-style role inheritance and OpenEMR-style resource:action[:scope]
privilege strings. Roles form a hierarchy: super_admin (SaaS operator,
crosses tenants) → clinic_admin (one tenant's administrator) → physician
/ dentist / dental_assistant / nurse / receptionist / billing /
pharmacist. The "authenticated" base role is built-in (granted to anyone
who logs in); "anonymous" is never used in a clinic SaaS.

  --------------------------------------------------------------------------
  Privilege String          Description
  ------------------------- ------------------------------------------------
  patient:read:any          View any patient demographics in tenant

  patient:read:my           View only patients with an encounter authored by
                            me

  patient:write             Create/edit demographics

  appointment:write         Create/edit appointments

  appointment:write:wsome   Create only within provider template, no
                            double-booking

  encounter:read:any        Read any encounter in tenant

  encounter:read:my         Read only my authored encounters

  encounter:write           Create/edit encounters

  prescription:write        Issue prescriptions

  prescription:verify       Pharmacist verifies

  inventory:dispense        Dispense pharmacy stock

  billing:write             Create invoices

  billing:discount          Apply discounts

  audit:read                Read audit log (clinic_admin only)

  clinic:manage_users       Create/disable user accounts in tenant
  --------------------------------------------------------------------------

9.3 Patient & Encounter (OpenMRS Information Model)

The OpenMRS information model — Patient → Encounter → Observation — is
the spine of the medical EMR. It is simpler than FHIR, battle-tested in
low-resource settings (originally built for HIV clinics in Africa), and
maps cleanly to FHIR when needed. An OpenMRS Encounter represents a
point-in-time clinical transaction; a Visit groups multiple Encounters.
The minimum entity set per ASTM E1384 (Standard Practice for Content and
Structure of the Electronic Health Record) and SOAP note structure:

  --------------------------------------------------------------------------
  Entity         Key Fields                           Notes
  -------------- ------------------------------------ ----------------------
  patient        name, DOB, sex, address, phone, NIN, tenant-scoped;
                 insurance, emergency_contact,        soft-deleted only via
                 language_pref                        retention process

  encounter      patient_id, type                     Maps to FHIR
                 (medical/dental/telemed), status,    Encounter; "telemed"
                 start, end, provider_id,             type for future Phase
                 operatory_id, chief_complaint        13+

  observation    encounter_id, type                   Maps to FHIR
                 (vital/lab/perio/imaging-finding),   Observation; the most
                 code, value, unit, observed_at       versatile FHIR
                                                      resource

  problem_list   patient_id, condition, SNOMED CT     Maps to FHIR Condition
                 code, status                         
                 (active/resolved/chronic),           
                 onset_date, recorded_by              

  allergy        patient_id, allergen, reaction,      Maps to FHIR
                 severity, recorded_at                AllergyIntolerance;
                                                      feeds CDS
                                                      allergy-checking
                                                      (§11.4)

  medication     patient_id, drug_name, RxNorm code,  Maps to FHIR
                 dosage, frequency, start, end,       MedicationRequest;
                 prescribed_by                        feeds CDS
                                                      interaction-checking
                                                      (§11.4)

  immunization   patient_id, vaccine, CVX code, lot,  Maps to FHIR
                 administered_at, administered_by     Immunization

  lab_result     encounter_id, test, LOINC code,      Maps to FHIR
                 value, ref_range, collected_at,      Observation +
                 resulted_at                          DiagnosticReport; lab
                                                      integration deferred
                                                      (§11.5)

  vital_signs    encounter_id, height, weight, BMI,   Or store as
                 BP_sys, BP_dia, pulse, temp,         Observation rows for
                 resp_rate, SpO2                      FHIR compatibility

  soap_note      encounter_id, subjective, objective, 4 text columns OR one
                 assessment, plan                     JSONB
  --------------------------------------------------------------------------

9.4 Dental Module — Odontogram, FDI, CDT

9.4.1 Tooth Numbering — FDI Two-Digit Notation (ISO 3950:2016)

Algeria inherited the French dental education system, which uses FDI
Two-Digit Notation. FDI is the world's most commonly used dental
notation and is ISO 3950:2016 (current edition; the 1984 edition was
withdrawn and replaced by the 2009 and 2016 editions). Permanent
dentition = 32 teeth (8 per quadrant); primary dentition = 20 teeth (5
per quadrant). FDI quadrants: 1 (upper right permanent), 2 (upper left
permanent), 3 (lower left permanent), 4 (lower right permanent); 5–8 for
primary. Tooth numbers 1 (central incisor) through 8 (3rd molar) per
quadrant. So tooth 11 = upper-right central incisor, tooth 48 =
lower-right 3rd molar. The SaaS adopts FDI as the ONLY storage format
(2-digit integer); display-only conversion to Universal (US) notation
for any US-trained dentist. Validate tooth_fdi ∈ {11..18, 21..28,
31..38, 41..48, 51..55, 61..65, 71..75, 81..85} at the schema level.

9.4.2 Tooth Surfaces — Bitfield Integer

Five canonical tooth surfaces for posterior teeth: Mesial (toward
midline), Distal (away from midline), Occlusal (chewing surface), Buccal
(toward cheek), Lingual (toward tongue). For anterior teeth, the chewing
edge is Incisal, not Occlusal. For upper teeth, Lingual is also called
Palatal. The SaaS stores surfaces as a bitfield integer on each
procedure or tooth_finding row — M=1, O=2, D=4, B=8, L=16, I=32, P=64 —
allowing a multi-surface restoration (e.g., MOD amalgam = 1+2+4 = 7) in
a single integer. Alternatively, store as a string array ['M','O','D']
for readability. Both patterns are used in OpenDental.

9.4.3 Dental Procedures — CDT Codes + Local Escape Hatch

CDT (Current Dental Terminology) is the Code on Dental Procedures and
Nomenclature, maintained by the American Dental Association (ADA). CDT
codes are alphanumeric, format D#### (e.g., D0120 = periodic oral
evaluation; D1110 = adult prophylaxis; D0350 = oral/facial photographic
images; D2150 = amalgam filling, 2 surfaces, posterior). Updated
annually — CDT 2025 effective 1 January 2025. Algeria does not have a
national dental procedure code set; store CDT codes as the default
catalog (universally recognized by dental software, useful if the clinic
ever bills a US or European insurer) but also support custom local codes
with code_system = 'local' for procedures that don't map to CDT.

9.4.4 Periodontal Charting

A perio chart measures the depth of the space between a patient's gums
and bones at 6 specific points per tooth, and also records whether gums
bleed when probed. Components: plaque index, gingival index, probing
depth (PD), bleeding on probing (BOP), clinical attachment level (CAL),
gingival recession, furcation involvement, tooth mobility. Clinical
thresholds: probing depths ≥ 5 mm are associated with potential
attachment loss; 4 mm is borderline. CAL = PD + recession. Per-tooth, 6
sites (mesiobuccal, buccal, distobuccal, mesiolingual, lingual,
distolingual). 32 teeth × 6 sites × {PD, BOP, recession, CAL, furcation,
mobility} = ~1,150 numeric measurements per periodontal exam. Store as a
JSONB column on a perio_exam row (one row per exam, JSONB holds the 6×32
matrix) for compactness, or as a normalized perio_site_measurement table
for queryability.

9.5 Appointment & Scheduling

The appointment status state machine follows the FHIR Appointment.status
valueset (stable across R4/R5/R6): proposed | pending | booked | arrived
| fulfilled | cancelled | no-show | entered-in-error | checked-in |
waitlist. For a clinic SaaS, the practical state machine is: proposed →
pending → booked → arrived → in-progress → fulfilled, with cancelled and
no-show as terminal states. booked is the default when reception creates
an appointment; arrived when the patient checks in at reception;
in-progress when the patient is in the chair (optional — can be derived
from Encounter.start); fulfilled when the appointment is completed and
the Encounter closed.

  -- Appointment schema
  appointment(
  id, tenant_id, patient_id, practitioner_id, operatory_id,
  appointment_type_id, -- "Cleaning", "Filling", "Consultation"
  start_ts, end_ts,
  status, --
  proposed|pending|booked|arrived|in-progress|fulfilled|cancelled|no-show
  cancellation_reason,
  recurrence_rule, -- iCal RRULE string, NULL if one-off
  recurrence_parent_id, -- FK to appointment.id for child instances
  notes, created_at, updated_at, deleted_at, created_by
  )
  operatory(id, tenant_id, name, code, operatory_type_id, is_active)
  practitioner_schedule(id, tenant_id, practitioner_id, day_of_week,
  start_time, end_time, effective_from, effective_to)
  appointment_type(id, tenant_id, code, name_ar, name_fr,
  default_duration_minutes, color)

9.6 Billing & Invoicing — Algerian TVA Compliance

9.6.1 TVA Treatment of Medical Services

Algerian TVA rates: standard 19%, reduced 9%. "Les actes médicaux"
(medical acts) are TVA-exempt — listed as item 9 in the exemption
enumeration of the official Code des Taxes sur le Chiffre d'Affaires
published by the Algerian Customs (Direction Générale des Douanes). The
exemption is cross-referenced to Article 91 of the Algerian Code Général
des Impôts (CGI). However, the clinic sells mixed medical + non-medical
services: cosmetic dentistry (veneers, whitening) is arguably
non-medical; retail oral-hygiene products sold at the front desk are
non-medical; parking and cafeteria are non-medical. The data model's
per-line tva_rate field handles this cleanly, but the clinic's
accountant must classify each procedure_code or product correctly.
Recommend a tva_class enum on the procedure_code / product catalog
(medical_exempt | reduced_9 | standard_19) that defaults new invoice
lines to the catalog item's class, with manual override allowed for the
billing clerk.

9.6.2 E-Invoicing Reform — Future-Proofing

Algeria's e-invoicing mandate is expected in 2027, with B2B and B2G
scopes first; no binding legislation had been published as of July 2026
(vatcalc.com, vatupdate.com, January 2026 analyses). The clinic's
invoice layout nonetheless complies with DGI mandatory mentions from day
one — NIF, NIS, RC, TIN, invoice number, issue date, supplier identity,
customer identity, line description, unit price HT, TVA rate, total HT,
total TVA, total TTC — because (a) these mentions are already required
for all TVA-registered entities under existing CGI Article 51, and (b)
the reform trajectory will likely extend to B2C healthcare billing. The
invoice schema below stores all mandatory fields; no schema change will
be needed when the mandate lands.

  -- Billing schema (out-of-pocket clinic, Algerian TVA-compliant)
  invoice(
  id, tenant_id, invoice_number, -- sequential per tenant per year
  patient_id, encounter_id,
  issue_date, payment_due_date,
  status, -- draft|issued|paid|partial|refunded|void
  total_ht, total_tva, total_ttc, paid_amount,
  currency, -- proper column, default 'DZD' (not hardcoded)
  created_at, issued_at, paid_at, voided_at, created_by_user_id,
  -- DGI mandatory mentions (denormalized snapshot at issue time):
  supplier_nif, supplier_nis, supplier_rc,
  patient_nif
  )
  invoice_line(
  id, invoice_id, line_order,
  description_ar, description_fr,
  code, -- CDT code (e.g., 'D1110') or custom
  code_system, -- 'cdt' | 'custom' | 'snomed'
  quantity, unit_price_ht,
  tva_rate, -- 0 | 9 | 19 (percent); 0 default for medical
  tva_amount, line_total_ht, line_total_ttc
  )
  payment(
  id, invoice_id, amount,
  method, -- cash|cib|edahabia|cheque|bank_transfer|other
  reference, -- POS transaction ref for card payments
  paid_at, cashier_user_id, drawer_session_id
  )
  refund(id, invoice_id, original_payment_id, amount, reason,
  refunded_at, authorized_by_user_id)
  cash_drawer_session(
  id, tenant_id, reception_or_operatory_id,
  opened_at, closed_at, opening_balance, expected_closing_balance,
  actual_closing_balance, cashier_user_id, discrepancy_amount,
  discrepancy_note
  )

9.7 Audit Log — Append-Only, Hash-Chained

The audit_log table synthesizes NIST SP 800-92, OWASP Logging Cheat
Sheet, HIPAA 45 CFR §164.312, and IHE ATNA. It is append-only (REVOKE
UPDATE, DELETE; allow INSERT only), hash-chained (each row's hash_curr =
SHA-256 of prev_hash + canonical JSON of this row) to detect tampering,
tenant-scoped via RLS, FHIR AuditEvent-compatible for future export to
an Audit Record Repository over ITI-20.

  CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  tenant_id UUID NOT NULL, -- RLS-enforced
  actor_user_id UUID, -- NULL for system actions
  actor_role TEXT,
  action TEXT NOT NULL, -- e.g. 'patient.update', 'login.success'
  entity_type TEXT NOT NULL, -- 'patient', 'appointment', 'invoice'
  entity_id TEXT, -- supports UUIDs, codes
  before_jsonb JSONB, -- prior state, NULL on INSERT
  after_jsonb JSONB, -- new state, NULL on DELETE
  ip_address INET,
  user_agent TEXT,
  request_id UUID, -- correlates to HTTP request
  outcome TEXT NOT NULL DEFAULT 'success', -- success|failure|denied
  hash_prev BYTEA, -- SHA-256 of previous row's hash_curr
  hash_curr BYTEA NOT NULL -- SHA-256(prev_hash ||
  canonical_json(this_row))
  );
  ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
  REVOKE UPDATE, DELETE ON audit_log FROM app_role;
  CREATE INDEX audit_log_tenant_time_idx ON audit_log (tenant_id,
  timestamp DESC);
  CREATE INDEX audit_log_entity_idx ON audit_log (tenant_id,
  entity_type, entity_id, timestamp DESC);
  CREATE INDEX audit_log_actor_idx ON audit_log (tenant_id,
  actor_user_id, timestamp DESC);

Retention distinction: audit-log retention is 6 years minimum (HIPAA
§164.530(j) precedent, aligned with ANPDP's expectation that operation
logs be available for inspection), partitioned monthly via pg_partman
with drop_after_72_months plus a 12-month cold archive on encrypted
S3-compatible storage. Clinical-record retention is 20 years default
(15-year legal floor + 5-year conservatism buffer), configurable per
data category. These are two independent retention policies: the
audit_log table retains access/mutation events for 6 years; the patient,
encounter, observation, and clinical tables retain clinical content for
20 years. An audit_log entry pointing to a deleted clinical record is
itself retained for 6 years, but the clinical record it references is
retained for 20 years.

10. Offline-First Implementation

10.1 Strategy — Dexie + Manual Sync (v1) → PowerSync (v2)

The offline-first architecture has two phases. v1 uses TanStack Query +
Dexie (IndexedDB) with a custom push/pull outbox queue — lowest
operational complexity for a solo developer, sufficient for 2 clinics ×
~120 patients/day. v2 upgrades to PowerSync Open Edition when true
multi-device conflict resolution becomes a real workflow (e.g.,
receptionist and doctor editing the same patient concurrently from two
tablets). PowerSync is Postgres-native, FSL-licensed (auto-converts to
Apache-2.0 after 2 years), and self-hostable on Algerian sovereign
infrastructure. The schema is designed to be PowerSync-compatible from
day 1: every table has id UUID PK, tenant_id, updated_at, deleted_at.

10.1.1 Why Not Replicache, ElectricSQL, or CRDTs?

-   Replicache is client-only — you must build the push/pull backend
    yourself. Highest operational complexity for a solo dev.

-   ElectricSQL pivoted in July 2024 — it is now read-only sync (writes
    go through your API). Insufficient for offline clinic workflows
    where the doctor must write to the database while offline.

-   WatermelonDB is mobile-first (React Native), uses LokiJS (in-memory)
    on web — poor fit for a Next.js PWA where IndexedDB is the right
    persistence layer.

-   Yjs / Automerge CRDTs are overkill for structured clinic data
    (appointments, invoices, odontogram, vitals) where each record
    typically has a single author. Use CRDTs only for collaborative
    free-text fields (e.g., two doctors co-writing a SOAP note in real
    time).

10.1.2 Conflict Resolution — LWW + Server-Authoritative updated_at

For ~95% of records, use Last-Write-Wins (LWW) with server-authoritative
updated_at and tenant-scoped client_id. LWW is simple, used by Dynamo
and Cassandra. The risk is silent discard of concurrent writes and
clock-skew issues — acceptable at clinic scale where each record
typically has a single author. For the handful of multi-author records
(SOAP notes, shared treatment plans), wrap the text field in a Yjs
document. Avoid vector clocks (too much complexity for the benefit at
this scale).

10.2 Service Worker Patterns

  -------------------------------------------------------------------------------
  Resource Type          Strategy                 Rationale
  ---------------------- ------------------------ -------------------------------
  Versioned static       Cache-first              URL changes when content
  assets (hashed JS/CSS                           changes; safe to cache
  bundles, fonts, icons)                          indefinitely

  HTML shell (App Router Network-first falling    Always serve latest; fall back
  pages)                 back to cache            to cached version when offline

  Images, fonts          Stale-while-revalidate   Returns cached immediately,
  (non-versioned)                                 async refreshes for next
                                                  request

  Critical API (auth,    Network-first falling    Always prefer fresh; cache for
  tenant config)         back to cache            offline fallback

  Clinical API (patient, Custom: read from        Offline-first; IndexedDB is the
  encounter)             IndexedDB (Dexie), sync  source of truth on client
                         in background            
  -------------------------------------------------------------------------------

10.2.1 Background Sync API — Progressive Enhancement Only

The Background Sync API enables the service worker to replay queued
requests when connectivity returns — even after the tab is closed.
However, Background Sync is well-supported in Chromium browsers but
partial/missing in Safari and Firefox. For a clinical PWA in Algeria
(where Safari iOS share is non-trivial), the SW Background Sync must be
a progressive enhancement over a foreground IndexedDB outbox queue that
drains on the `online` event. Never rely on Background Sync alone.

10.2.2 Service Worker Update Flow — No Auto-skipWaiting

  SAFETY: For a clinical app, do NOT call self.skipWaiting()
  automatically. Show an "Update available" toast and let the user
  reload explicitly. Auto-updating a service worker mid-consultation can
  break in-flight data flows. The 30-second cost of a manual reload is
  trivial; the cost of a corrupted clinical encounter is not.

10.3 Sync Outbox Architecture (Illustrative Pseudocode)

  // Client-side sync outbox (Dexie table) — ILLUSTRATIVE PSEUDOCODE
  // Production version uses a transactional Dexie update and a more
  robust
  // retry/backoff strategy with exponential backoff and a dead-letter
  table
  // for permanently-failed operations.
  db.outbox.add({
  id: uuid(),
  entity_type: 'appointment',
  entity_id: 'apt-123',
  operation: 'update',
  payload: { ...changes },
  client_id: getClientId(), // stable per device
  created_at: Date.now(),
  attempts: 0,
  last_error: null,
  status: 'pending' // pending|syncing|conflict|failed
  });
  // Drain on `online` event AND via Background Sync (Chromium)
  async function drainOutbox() {
  const pending = await
  db.outbox.where('status').equals('pending').toArray();
  for (const op of pending) {
  try {
  await op.attempts++;
  await db.outbox.put(op);
  const result = await
  trpc.api[op.entity_type][op.operation].mutate(op.payload);
  await db.outbox.delete(op.id);
  // Reconcile server response into Dexie
  await db[op.entity_type].put(result);
  } catch (err) {
  op.last_error = err.message;
  op.status = err.code === 'CONFLICT' ? 'conflict' : 'failed';
  await db.outbox.put(op);
  // LWW resolution: server wins, re-pull latest
  if (err.code === 'CONFLICT') {
  const fresh = await trpc.api[op.entity_type].get.query(op.entity_id);
  await db[op.entity_type].put(fresh);
  }
  }
  }
  }
  window.addEventListener('online', drainOutbox);

10.4 Dexie-to-PowerSync Migration Runbook (v1 → v2)

The migration from Dexie + manual sync (v1) to PowerSync Open Edition
(v2) is triggered when any of the following conditions are met: (a) more
than 5 concurrent users per clinic need to edit the same patient record;
(b) conflict-resolution manual effort exceeds 1 hour/week; (c) the
operator observes data-divergence incidents (two devices showing
different patient states after sync). The migration is non-trivial and
should be planned as a dedicated 2-3 week project.

  # Dexie-to-PowerSync Migration Runbook
  ## Pre-Migration (Week 0)
  1. Deploy PowerSync Open Edition on a CERIST Cloud VPS Small alongside
  a MongoDB metadata VPS.
  2. Configure PowerSync Service to read from the production Postgres
  (read replica, not primary).
  3. Define PowerSync sync rules: which tables sync to which client
  device, filtered by tenant_id
  and user role (e.g., receptionist sees appointments + patients;
  dentist adds encounters + dental).
  4. Test sync in staging with pseudonymized data.
  ## Outbox Draining (Week 1)
  1. Before switching clients to PowerSync, drain ALL pending outbox
  entries from Dexie.
  2. Run the drainOutbox() function on every client device until the
  outbox table is empty.
  3. Verify zero pending entries via the admin dashboard (add a "Sync
  Status" widget showing
  outbox depth per device).
  ## Client ID Namespacing (Week 1)
  1. PowerSync requires a stable client_id per device. Reuse the
  existing Dexie client_id
  (already namespaced per device) to avoid creating duplicate client
  states.
  2. Map each Dexie client_id to a PowerSync client_id during the first
  PowerSync sync.
  ## Schema Reconciliation (Week 1-2)
  1. PowerSync expects every synced table to have: id (UUID PK),
  tenant_id, updated_at, deleted_at.
  The v1 schema already has these (designed for PowerSync compatibility
  from day 1).
  2. Verify that every Drizzle schema file includes updated_at and
  deleted_at with defaults.
  3. Add a Drizzle migration to backfill updated_at on any rows that
  have NULL (should be none
  if the schema was followed, but verify).
  ## Client Cutover (Week 2)
  1. Ship a new PWA build that uses PowerSync instead of Dexie for the
  sync layer.
  2. On first launch after the update, the PWA: (a) drains any remaining
  Dexie outbox entries;
  (b) initializes the PowerSync client; (c) performs an initial full
  sync; (d) switches the
  UI's data source from Dexie to PowerSync's local SQLite (via OPFS or
  WASM SQLite).
  3. Keep Dexie as a read-only fallback for 30 days (if PowerSync fails,
  the app can still
  read from Dexie while the operator investigates).
  ## PowerSync Sync-Rules Language Pitfalls (Week 2)
  1. PowerSync sync rules use a YAML-like syntax to define what data
  each client sees.
  2. Common pitfall: forgetting to filter by tenant_id in every sync
  rule -> cross-tenant data leak.
  Mitigation: a CI test that asserts every sync rule includes a
  tenant_id filter.
  3. Common pitfall: syncing too much data to low-powered tablets ->
  performance degradation.
  Mitigation: sync only the current day's appointments + the patient's
  last 90 days of encounters;
  lazy-load older data on demand.
  ## Rollback Plan
  1. If PowerSync fails catastrophically within the first 30 days, roll
  back to the last Dexie-based
  PWA build.
  2. PowerSync's local SQLite database can be discarded; the next Dexie
  sync repopulates from Postgres.
  3. Investigate the failure; do not re-attempt PowerSync migration
  until root cause is fixed.
  ## Post-Migration
  1. After 30 days of stable PowerSync operation, remove the Dexie
  dependency from the codebase.
  2. Remove the foreground outbox drain logic (PowerSync handles this
  natively).
  3. Update the architecture diagram in §7.3 to reflect PowerSync as the
  sync layer.

11. Future Integrations (Design Stubs)

These design notes address completeness gaps identified during the
review. They are design stubs, not implementations — each notes the
scope, the interface boundary, and the deferral rationale. They are
placed here so the architecture accommodates them without rework when
the time comes.

11.1 Clinical Decision Support (CDS) Stub

Scope: drug-allergy checking, drug-drug interaction checking,
dosage-range checking. The data model has allergy and medication tables
but no CDS layer. Design stub:

-   Interface: a CdsService with three methods: checkAllergy(patientId,
    medicationCode) → AllergyAlert[]; checkInteractions(patientId,
    newMedicationCode) → InteractionAlert[]; checkDosage(medicationCode,
    dosage, patientAge, patientWeight) → DosageAlert[].

-   Data sources: (a) allergy data from the allergy table; (b)
    drug-interaction data from a drug database (RxNorm for
    international, or a local Algerian formulary if available —
    deferred); (c) dosage-range data from a drug database (deferred).

-   Deferral rationale: no open-source Algerian drug-interaction
    database exists; commercial options (First Databank, Medispan) are
    expensive and not Algeria-specific. Build the CdsService interface
    in Phase 2 (Clinical Encounter) but leave the implementation as a
    no-op stub that returns empty arrays. Implement the actual checking
    when a reliable data source is identified.

-   CDS Hooks: the emerging standard is CDS Hooks (cds-hooks.org) for
    integrating CDS into EHRs. Design the CdsService to be
    CDS-Hooks-compatible so future external CDS services can be plugged
    in.

11.2 Lab Integration Design Note

Scope: receiving lab results from external laboratories (blood tests,
microbiology, pathology) and sending lab orders. The data model has a
lab_result table but no integration story. Design note:

-   Inbound: HL7 v2 ORU^R01 (Observation Result Unsolicited) is the
    legacy standard used by most Algerian labs. Build an HL7 v2 ORU
    parser (use the hl7v2 npm package or node-hl7) that maps ORU
    segments to the lab_result table (MSH → message metadata; PID →
    patient; OBR → order; OBX → result). Fallback: the lab emails a PDF;
    the receptionist uploads it manually and the system OCRs it
    (deferred).

-   Outbound: FHIR DiagnosticReport for future lab ordering. Build a
    /fhir/DiagnosticReport endpoint that emits lab orders in FHIR R4
    format when the lab supports it (most Algerian labs do not yet;
    deferred).

-   Deferred to Phase 9+ (post-MVP). The MVP lab_result table stores
    manually-entered results; integration is a Phase 9+ enhancement.

11.3 Breach-Response Runbook

Given the 5-day ANPDP breach notification SLA under Law 25-11, the
breach-response runbook is the most critical operational document.
Create the file docs/runbooks/breach-response.md in the repository with
the following content (summary; the full runbook lives in the repo):

  # Breach-Response Runbook (summary — full version in docs/runbooks/)
  ## Activation Criteria
  - Unauthorized access to patient-identifiable data (confirmed or
  suspected)
  - Loss or theft of a device with access to the clinic SaaS
  - Exfiltration of patient data to an unauthorized destination
  - Ransomware encryption of any clinic SaaS component
  - Compromise of any credential (DB password, JWT signing key, API key)
  ## Response Timeline (ANPDP 5-day SLA)
  - Hour 0: Detection & Triage — notify DPO + clinic_admin; log incident
  in audit_log
  - Hours 0-4: Containment — revoke compromised credentials; remotely
  wipe devices;
  block source IPs; preserve evidence
  - Hours 4-24: Assessment — DPO assesses scope, affected patients, risk
  level;
  drafts ANPDP notification
  - Hours 24-72: Notification — file ANPDP notification via online
  platform AND
  physically at ANPDP HQ; if high-risk, notify affected patients
  (bilingual AR/FR)
  - Hours 72-336: Remediation & Post-Mortem — implement permanent fix;
  document
  in incident registry; blameless post-mortem within 1 week
  ## ANPDP Contact
  - Website: https://anpdp.dz
  - HQ: Cité Sahli, El Biar, Alger
  - File notifications via the ANPDP online platform AND physically
  ## Legal Basis
  - Law 25-11 of 24 July 2025: breach notification within 5 days to
  ANPDP
  - Law 18-07 Article 34: data controllers must implement appropriate
  technical
  and organizational measures

11.4 Data-Subject-Rights Workflow

Law 18-07 grants data subjects (patients) the rights of information,
access, rectification, objection, erasure (in certain cases), withdrawal
of consent, and complaint to ANPDP. The workflow:

  -----------------------------------------------------------------------
  Right             Response      Implementation
                    Deadline      
  ----------------- ------------- ---------------------------------------
  Information       At data       Patient consent form (bilingual AR/FR)
  (right to be      collection    at first encounter; privacy policy
  informed)                       accessible in patient portal

  Access (right to  1-2 months    Patient portal self-service: view
  access)           per Law 18-07 demographics, encounters, observations,
                                  invoices, audit log entries where they
                                  are the subject

  Rectification     1 month       Patient portal self-service for
                                  demographics; clinician-mediated for
                                  clinical data (with audit_log entry
                                  recording the change and reason)

  Objection         1 month       Patient portal "object to processing"
                                  form; clinic_admin reviews and either
                                  complies or documents the compelling
                                  legitimate ground to continue

  Erasure (right to 1 month; may  Reconcile with soft-delete + retention:
  be forgotten)     be refused    mark record as erasure-requested;
                                  physical deletion deferred until
                                  retention period expires (15-20 years).
                                  Document the refusal basis if erasure
                                  is declined.

  Withdrawal of     Immediate     Patient portal toggle; withdrawal stops
  consent                         future processing but does not affect
                                  lawfully-processed past data; audit_log
                                  entry

  Complaint to      N/A           Provide ANPDP contact details in the
  ANPDP             (external)    privacy policy; do not obstruct the
                                  patient's right to complain
  -----------------------------------------------------------------------

Erasure-vs-soft-delete reconciliation: the clinic SaaS cannot physically
delete clinical records on patient request because (a) Law 18-11 Article
292 implies a clinical-record retention obligation, and (b) the 15-year
civil prescription period means records may be needed for legal defense.
The workflow: mark the record as erasure-requested (a flag on the
patient row), restrict all further processing, and defer physical
deletion until the retention period expires. Document this in the
privacy policy so patients understand that "erasure" in the clinical
context means "processing restriction + deferred deletion," not
immediate deletion. The DPO reviews every erasure request within 7 days
and either complies, partially complies, or refuses with documented
grounds.

11.5 Non-DICOM Device Integration Note

Scope: intraoral scanners (STL/PLY files), vital-signs monitors
(serial/Bluetooth), and other non-DICOM medical devices. DICOM is
covered via Orthanc (§8.8) but these devices are not. Design note:

-   Intraoral scanners (e.g., 3Shape TRIOS, Medit i700): produce STL or
    PLY files, not DICOM. Store as S3-compatible objects on Djezzy Cloud
    OSS with metadata (patient_id, scan_type, captured_at,
    scanner_model) in a device_scan table. Build a viewer using three.js
    or model-viewer (Google) for web display. CDT code D0472 (diagnostic
    casts) may apply for billing.

-   Vital-signs monitors: some modern monitors support HL7 v2 or FHIR;
    older ones use serial/Bluetooth. For the MVP, manually enter vitals.
    Phase 9+ enhancement: integrate via FHIR Observation resources if
    the monitor supports it, or via a Bluetooth bridge app on a tablet.

-   Deferred to Phase 9+ (post-MVP).

11.6 Patient Portal Placeholder (Phase 12+)

Scope: a self-service patient portal for appointment booking,
prescription viewing, lab result viewing, invoice payment, and
data-subject-rights requests (see §11.4). Design stub:

-   Architecture: a separate Next.js app (apps/patient-portal) sharing
    the same NestJS API but with a separate Better Auth instance
    (patient authentication via phone number + OTP, not
    username/password).

-   Features (Phase 12+): book appointment (limited to available slots),
    view upcoming appointments, view past encounter summaries (SOAP note
    redacted to patient-friendly language), view prescriptions (PDF
    download), view lab results (with reference ranges), pay outstanding
    invoices (Chargily Pay), submit data-subject-rights requests.

-   Deferral rationale: the MVP serves clinic staff; the patient portal
    is a Phase 12+ enhancement once the core EMR is stable. Design the
    API to be patient-portal-ready from day 1 (separate patient auth
    scope; patient-facing endpoints return redacted data).

11.7 Telemedicine Placeholder (Phase 13+)

Scope: remote consultations via WebRTC. Law 18-11 Article 316 explicitly
authorizes telemedicine in Algeria. The encounter.type enum includes
'telemed' from day 1. Design stub:

-   Architecture: WebRTC peer-to-peer video between doctor and patient.
    Use the mediasoup or LiveKit open-source SFU for multi-party
    (doctor + patient + interpreter). Signaling via Socket.IO (already
    in the stack).

-   Encounter type: 'telemed' in the encounter.type enum. A telemed
    encounter has: scheduled start, WebRTC session ID, recording
    (optional, with patient consent), chat log, and a SOAP note (same as
    in-person).

-   Deferral rationale: telemedicine requires the patient portal (Phase
    12+) for patient-side access. Phase 13+ after the patient portal is
    stable. Regulatory: while Article 316 authorizes telemedicine, the
    implementing decree may impose specific requirements (consent,
    recording, prescribing limitations) — the operator must verify with
    Algerian counsel before launching.

12. Security & Compliance

12.1 Encryption

-   At rest: PostgreSQL TDE or LUKS-encrypted volumes on the VM;
    AES-256-CBC client-side encryption for pgBackRest backup
    repositories (passphrase stored in OS keyring or KMS, NOT in repo
    config).

-   In transit: TLS 1.3 everywhere (Nginx/Caddy in front of NestJS; HSTS
    preload).

-   Application secrets: environment variables injected at deploy time;
    never committed.

-   Patient file encryption: optional field-level encryption for the
    most sensitive columns (NIN, phone) using pgcrypto with a
    tenant-specific key — overkill for MVP but designed for.

-   Backup encryption: AES-256-CBC client-side via pgBackRest — even if
    the backup repository is compromised, the data is unintelligible
    without the passphrase.

12.2 RBAC & Audit (Recap)

RBAC is implemented per §9.2 (NIST RBAC + OpenMRS inheritance + OpenEMR
resource:action strings). Audit logging is implemented per §9.7
(append-only, hash-chained, RLS-enforced, FHIR AuditEvent-compatible).
Both are wired into every NestJS module via a @RequirePermissions guard
and an AuditInterceptor that automatically captures before/after state
for all mutating operations.

12.3 ANPDP Compliance Checklist

  ------------------------------------------------------------------------
  Compliance Item        Status            Implementation Reference
  ---------------------- ----------------- -------------------------------
  Prior declaration to   Required BEFORE   Operator files declaration;
  ANPDP                  go-live           multi-month process

  Prior authorization    Required BEFORE   Operator files authorization;
  for health data        go-live           ANPDP Decision 01 of 25 Feb
  (sensitive)                              2026 precedent

  DPO designation +      Mandatory (Law    Operator designates internal or
  registration           25-11)            external DPO; files with ANPDP
                                           (§3.1.5)

  Written patient        Mandatory; logged Consent-capture UI in patient
  consent                with timestamp    module; audit_log entry on
                                           consent event

  Processing register +  Mandatory (Law    audit_log table (§9.7) serves
  operation logs         25-11)            as operation log

  DPIA for high-risk     Mandatory         Conduct DPIA before go-live;
  processing                               document in docs/adr/dpia.md

  Processor contracts    Mandatory         Reinforce B2B contracts with
  with reinforced                          sub-processors (hosting, SMS,
  clauses                                  payment)

  Breach notification ≤  Mandatory (Law    Breach-response runbook
  5 days                 25-11)            (§11.3); incident registry;
                                           on-call alerting

  Data residency in      Mandatory         CERIST Cloud or Djezzy Cloud
  Algeria                                  primary; Constantine DC DR (§6)

  Cross-border transfer  Required for      AWS Paris only for CI/CD +
  authorization          non-personal      observability (no personal
                         workloads abroad  data); egress controls (§3.1.6)

  Data subject rights    Mandatory         Self-service patient portal or
  (access,                                 admin workflow (§11.4)
  rectification,                           
  erasure, objection)                      

  Soft delete +          Mandatory         deleted_at on every table;
  configurable retention                   20-year default for clinical
                                           records; 6-year for audit_log
  ------------------------------------------------------------------------

12.4 Anonymization Strategy

Distinguish pseudonymization (still personal data — RLS + access
controls apply) from anonymization (no longer personal data — outside
data-protection law). Pseudonymization is used for staging/dev
environments (faker-seeded replacement of patient name, phone, NIN,
address; DOB as year-only; re-identification key kept in a separate
KMS-encrypted table accessible only to clinic_admin) and for the
analytics warehouse (nightly pseudonymized extract). Anonymization
(k-anonymity with k≥5 on quasi-identifier set: 5-digit geographic code,
year of birth, gender, ICD-10 chapter; suppress small cells <5) is used
for external research / published statistics — requires ANPDP sign-off
because health data is sensitive under Law 18-07.

13. Backup & Disaster Recovery

The backup strategy follows the 3-2-1-1-0 rule (3 copies, 2 media types,
1 offsite, 1 immutable, 0 errors verified by restore test) on top of
PostgreSQL continuous WAL archiving with pgBackRest. RPO ≤ 15 minutes
(continuous WAL archive); RTO ≤ 4 hours (single clinic can revert to
paper that long). Full backup nightly at 02:00 Algeria time;
differential every 6 hours; incremental hourly (optional); WAL archive
continuous. PITR granularity ≤ 5 minutes via `pgbackrest restore
--type=time --target='2026-07-06 14:23:00+01'`. Quarterly restore test
per NIST SP 800-34 7-step ISCP: restore to staging VM, run smoke tests,
document results.

  ---------------------------------------------------------------------------
  Component       Target                     Tooling
  --------------- -------------------------- --------------------------------
  RPO             ≤ 15 min (continuous WAL   pgBackRest archive-push
                  archive)                   

  RTO             ≤ 4 h                      pgBackRest restore + Drizzle
                                             migrations

  Full backup     Nightly 02:00 Algeria time pgbackrest backup --type=full

  Differential    Every 6 hours              pgbackrest backup --type=diff

  Incremental     Every hour (optional)      pgbackrest backup --type=incr

  WAL archive     Continuous (per segment)   archive_command='pgbackrest
                                             archive-push %p'

  PITR            ≤ 5 min                    pgbackrest restore --type=time
  granularity                                --target=...

  Encryption      AES-256-CBC client-side    repo1-cipher-type=aes-256-cbc;
                                             passphrase in OS keyring

  Repo 1          Djezzy Cloud S3            repo1-type=s3
  (primary)                                  

  Repo 2          CERIST object storage      repo2-type=s3
  (secondary)     (different provider)       

  Repo 3          Weekly encrypted external  SFTP push
  (offline)       HDD in clinic safe         

  DR replica      Algérie Télécom            PostgreSQL streaming replication
                  Constantine DC (streaming) (async)

  Restore test    Quarterly per NIST SP      Restore to staging VM; smoke
                  800-34                     tests; document

  Retention       Full 4wk; Diff 2wk; Incr   repo1-retention-full=4, etc.
                  7d; WAL 30d; Monthly 12mo; 
                  Yearly 7yr                 
  ---------------------------------------------------------------------------

  WARNING: The pgBackRest AES passphrase MUST be stored separately from
  the backup repository. If both live on the same host, ransomware
  compromises both. Use OS keyring or a KMS (HashiCorp Vault, or a
  self-hosted KMS on a separate Algerian VPS). Document the
  passphrase-recovery procedure in docs/runbooks/backup-recovery.md.

14. Deployment & Observability

14.1 Production Topology

The production topology is documented in §6.3 (Self-Hosting Assessment).
All clinical-data components run on Algerian sovereign infrastructure.
The operator can optionally self-host observability (Grafana + Loki +
Sentry self-hosted on an Algerian VPS) for a zero-external-dependency
posture, or use AWS Paris for non-personal observability telemetry
(subject to the egress controls in §3.1.6).

14.2 CI/CD Pipeline

-   GitHub Actions on every push: lint (ESLint), typecheck (tsc
    --noEmit), unit tests (Vitest), build (Next.js + NestJS).

-   On merge to main: full E2E suite (Playwright) against staging, then
    deploy to staging environment.

-   On tag (release): deploy to production with blue-green or rolling
    strategy; run smoke tests post-deploy.

-   Drizzle migrations: apply via `drizzle-kit migrate` in a pre-deploy
    job; never auto-apply on app boot.

-   RLS policies: verified by a test suite that asserts cross-tenant
    queries return zero rows.

-   Backup verification: nightly job restores the latest backup to an
    ephemeral DB and runs schema-integrity checks.

14.3 Performance Testing

Performance testing uses k6 (open-source, Grafana-Labs-maintained) as
the primary load-testing tool, with Lighthouse CI for frontend
performance budgets. The testing strategy:

-   k6 load profiles: (a) smoke test on every PR (1 virtual user, 1
    minute, all critical paths); (b) load test on every release (50
    virtual users per clinic, 10 minutes, all critical paths); (c)
    stress test quarterly (200 virtual users, 30 minutes, identify
    breaking point); (d) spike test quarterly (instant ramp to 100
    virtual users, measure recovery).

-   Lighthouse CI: runs on every PR against the built Next.js app; gates
    on Performance score ≥ 90, Accessibility score ≥ 95, Best Practices
    score ≥ 90, SEO score ≥ 90. Fails the CI if any score drops below
    threshold.

-   axe-core accessibility scan: runs on every PR; gates on zero
    critical violations for both LTR (fr-DZ) and RTL (ar-DZ) layouts.
    Covers WCAG 2.2 AA success criteria.

-   SLO monitoring in production: Prometheus + Grafana track p50/p95/p99
    API latency, error rate, and uptime per clinic. Alert if p95 > 500
    ms for 5 consecutive minutes, or error rate > 1% for 5 consecutive
    minutes, or uptime < 99.5% during clinic hours (08:00-20:00
    Algeria).

-   Regression cadence: full load test before every release; quarterly
    stress test; annual capacity-planning review (extrapolate from
    current load + growth rate to predict when to add the second
    Postgres replica or migrate to Citus).

14.4 Monitoring & Alerting

-   Application metrics: Prometheus + Grafana (self-hosted on Algerian
    VPS, or AWS Paris for non-personal telemetry; only aggregated
    metrics, no patient data).

-   Error tracking: Sentry (self-hosted or SaaS) with PII scrubbing
    rules — never log patient names, NINs, or phone numbers in error
    context.

-   Uptime monitoring: external probe from AWS Paris + a secondary probe
    from a different Algerian DC.

-   Audit-log integrity: daily cron job that recomputes the hash_curr
    chain and alerts on any mismatch.

-   Backup job monitoring: alert if no successful backup in the last 24
    hours.

-   On-call alerting: PagerDuty or Grafana OnCall for breach-response
    SLA (5-day ANPDP notification).

15. Repo Conventions

The repo conventions support AI-assisted development. The 2025-2026
emerging standard is a layered approach: AGENTS.md (universal, read by
all AI coding tools) is the single source of truth for build commands,
architecture rules, testing conventions, code style, i18n rules, and RTL
rules. Tool-specific instruction files (for whatever AI tools the
operator chooses to use) can be added as needed, but they should @import
or reference AGENTS.md rather than duplicate content. The operator's
specific AI agent stack is out of scope for this document; the
conventions below are tool-agnostic.

15.1 Recommended Monorepo Layout

  clinic-saas/
  ├── apps/
  │ ├── web/ # Next.js 16 (clinic dashboard, PWA)
  │ ├── api/ # NestJS modular monolith
  │ ├── worker/ # NestJS + BullMQ (cron + queue consumer)
  │ └── patient-portal/ # (Phase 12+) separate Next.js app for patients
  ├── packages/
  │ ├── db/ # Drizzle schema + migrations (shared)
  │ ├── auth/ # Better Auth config (shared)
  │ ├── ui/ # shadcn/ui components (shared, copy-into-repo)
  │ ├── i18n/ # next-intl messages + config
  │ ├── contracts/ # tRPC routers + Zod schemas + MSW mocks (shared)
  │ └── tsconfig/ # shared tsconfig presets
  ├── docs/
  │ ├── adr/ # Architecture Decision Records (one file per decision)
  │ ├── conventions/ # naming, file layout, testing, i18n, RTL rules
  │ ├── domain/ # trilingual glossary (FR + AR + EN)
  │ ├── runbooks/ # backup-recovery, breach-response,
  dexie-to-powersync-migration
  │ ├── templates/ # ANPDP breach notification, patient notification
  (AR/FR)
  │ └── dpia.md # Data Protection Impact Assessment
  ├── AGENTS.md # universal agent instructions (root) — single source of
  truth
  ├── turbo.json # Turborepo pipeline config
  ├── pnpm-workspace.yaml
  └── package.json

15.2 AGENTS.md — Content Summary

AGENTS.md contains: build commands (`pnpm install`, `pnpm dev`, `pnpm
build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm db:migrate`);
architecture rules (modular monolith; modules in apps/api/src/modules/;
cross-module imports only via index.ts public API; EventEmitter2 for
cross-module writes; RLS via SET LOCAL app.current_tenant per request;
EgressGuard for AWS Paris); testing conventions (Vitest for unit,
co-located with source as *.test.ts; Playwright for E2E in tests/e2e/;
MSW handlers in packages/contracts/mocks/); code style (TypeScript
strict mode, no any, prefer Drizzle query builder over raw SQL, never
use DELETE on tenant-scoped tables — use soft delete via deleted_at);
i18n rules (all UI strings via next-intl; never hardcode user-visible
text; ICU MessageFormat for plurals); RTL rules (use Tailwind logical
properties ms-*/me-*/ps-*/pe-*; mirror direction-aware icons via rtl:
variant); domain glossary reference (docs/domain/glossary.md is the
source of truth for terminology); and a "Do NOT" list of common
pitfalls. A complete sample AGENTS.md is in Appendix B.

15.3 Architecture Decision Records (ADRs)

Maintain one ADR per significant decision in docs/adr/. Template: Title,
Status (Proposed / Accepted / Deprecated / Superseded), Context,
Decision, Consequences, Alternatives Considered. Initial ADRs: ADR-001
Pool-model multi-tenancy with RLS (with Citus trigger threshold: >200
tenants or >5 TB or P95 >500 ms initiates Citus evaluation); ADR-002
Modular monolith over microservices; ADR-003 Drizzle over Prisma;
ADR-004 Better Auth over Clerk; ADR-005 Dexie+manual-sync for v1,
PowerSync for v2; ADR-006 Lean schema + future national-interop adapter
(FHIR as first implementation) over FHIR-as-canonical-model; ADR-007 FDI
tooth notation only (ISO 3950:2016); ADR-008 Chargily Pay for MVP
payments. ADRs are referenced from AGENTS.md so AI agents understand the
rationale, not just the rules.

16. Vendor Lock-In & Exit Strategy

Every dependency carries some lock-in risk. The matrix below states, for
each dependency, the lock-in type, the exit trigger, and the migration
path. The operator should review this matrix annually and update exit
triggers as the ecosystem evolves.

  ----------------------------------------------------------------------------
  Dependency      Lock-In Type      Exit Trigger    Migration Path
  --------------- ----------------- --------------- --------------------------
  PostgreSQL      Data (schema, RLS If Postgres     Dump schema + data;
                  policies)         becomes         restore on another RDBMS
                                    unsuitable      (CockroachDB for
                                    (e.g., need for distributed; MySQL for
                                    multi-region    simpler). RLS policies are
                                    writes)         Postgres-specific —
                                                    rewrite as app-layer
                                                    filters.

  Drizzle ORM     Code (schema      If Drizzle      Drizzle schemas are plain
                  definitions,      becomes         TS; rewrite as Prisma
                  queries)          unmaintained or schema or raw SQL. Effort:
                                    a better ORM    2-4 weeks for a 30-table
                                    emerges         schema.

  NestJS          Code (module      If NestJS       Migrate to Fastify +
                  structure, DI,    becomes         manual DI, or to a
                  decorators)       unmaintained    different framework.
                                                    Effort: 4-8 weeks.
                                                    Mitigation: keep modules
                                                    framework-agnostic where
                                                    possible (business logic
                                                    in plain TS classes).

  Better Auth     Code (auth        If Better Auth  Migrate to Auth.js v5 or
                  schema, session   becomes         custom JWT. Effort: 1-2
                  management)       unmaintained    weeks (session table is
                                                    standard). Mitigation: the
                                                    Organization plugin is the
                                                    main lock-in — design the
                                                    org/role schema to be
                                                    portable.

  shadcn/ui (Base Low               If Base UI      Replace Base UI primitives
  UI)             (copy-into-repo   becomes         with Radix or Headless UI.
                  model)            unmaintained    Effort: 1-2 weeks
                                                    (component API is
                                                    similar). The
                                                    copy-into-repo model means
                                                    the components are already
                                                    in your codebase.

  Next.js         Code (App Router, If Next.js      Self-host on CERIST Cloud
                  RSC, deploy       becomes         (already the plan).
                  config)           unsuitable      Next.js is open-source;
                                                    self-hosting loses some
                                                    Vercel-specific features
                                                    but the core App Router
                                                    works anywhere. Effort: 1
                                                    week.

  PowerSync (v2)  Data (sync state  If PowerSync    PowerSync Open Edition is
                  in MongoDB), Code becomes         FSL-1.1-ALv2,
                  (sync rules)      unmaintained or auto-converts to
                                    changes license Apache-2.0 after 2 years.
                                                    If PowerSync the company
                                                    disappears, the code
                                                    becomes fully Apache-2.0
                                                    and the community can
                                                    maintain it. Exit: revert
                                                    to Dexie + manual sync
                                                    (the v1 path). Effort: 2-3
                                                    weeks.

  CERIST Cloud /  Infrastructure    If the provider DR replica on the other
  Djezzy Cloud    (VM, storage)     becomes         provider (already
                                    unreliable or   planned). Migrate primary
                                    shuts down      to the DR provider.
                                                    Effort: 4-8 hours (restore
                                                    from backup + DNS
                                                    cutover).

  Chargily Pay    Code (payment     If Chargily     Switch to SlickPay or
                  adapter)          becomes         Mizaniya Pay via the
                                    unreliable or   PaymentProvider strategy
                                    changes pricing pattern. Effort: 2-3 days
                                                    per adapter.

  Orthanc         Data (DICOM       If Orthanc      Migrate to dcm4chee or a
                  storage), Code    becomes         commercial DICOM server.
                  (REST API         unsuitable      DICOM is a standard — the
                  integration)                      data is portable. Effort:
                                                    1-2 weeks.

  GitHub          Code hosting,     If GitHub       Migrate to GitLab or
                  CI/CD             becomes         self-hosted Gitea. Effort:
                                    unsuitable      2-3 days (git history is
                                                    portable; CI/CD configs
                                                    need rewriting).
  ----------------------------------------------------------------------------

  Key Lock-In Risks: The two highest lock-in risks are (1) PowerSync's
  MongoDB metadata store (sync state is non-portable; reverting to Dexie
  requires draining and re-syncing all clients) and (2) Better Auth's
  Organization plugin (org/role schema is plugin-specific). Mitigation
  for both: design the schema to be portable (standard UUID PKs,
  standard role/privilege tables) so the migration path is documented
  and tested. The FSL-1.1-ALv2 license on PowerSync is a strong
  safeguard: even in the worst case, the code auto-converts to
  Apache-2.0 after 2 years.

17. Phased MVP Roadmap

The operator has no fixed deadline, which permits a phased approach:
ship a usable MVP for one clinic first, then extend. Each phase is
independently deployable and usable. Phases are ordered by dependency:
auth and tenant infrastructure must come first; clinical modules build
on patient+encounter; billing builds on encounter; imaging and reports
build on the rest. The CNAS/CASNOS and FHIR-export phases are
deliberately last — they depend on external factors (operator signing a
CNAS convention; DEM.DZ shipping an API) that may not materialize for
years. The RTL/i18n scaffold is in Phase 0 (not Phase 6) so bilingual
conventions are enforced from day one, consistent with the AGENTS.md
mandate.

  ------------------------------------------------------------------------
  Phase           Scope                              Exit Criteria
  --------------- ---------------------------------- ---------------------
  Phase 0 —       Monorepo scaffold (Turborepo +     A user can log in,
  Foundation +    pnpm); Drizzle schema + RLS;       switch tenants, every
  RTL Scaffold    Better Auth with Organization      API call is
                  plugin; tenant interceptor;        RLS-isolated, AND the
                  audit_log; CI/CD; **RTL/i18n       login screen renders
                  scaffold (next-intl config with    correctly in both
                  ar-DZ + fr-DZ, Tailwind v4 logical Arabic (RTL) and
                  properties, shadcn/ui rtl:true,    French (LTR) with
                  trilingual glossary stub,          Western numerals
                  numberingSystem: "latn")**         

  Phase 1 —       Patient CRUD + search; appointment Reception can book
  Patient &       calendar with FDI-aware chair      and manage a full day
  Appointment     assignment; RRULE recurrence; SMS  of appointments
                  reminders via BulkGate/Africala    

  Phase 2 —       Encounter, vitals, SOAP notes,     Doctor can complete a
  Clinical        problems list, allergies,          full encounter
  Encounter       prescriptions (PDF + wet-signature chair-side on a
                  workflow); CDS interface stub      tablet
                  (no-op)                            

  Phase 3 —       Odontogram (FDI ISO 3950:2016),    Dentist can chart and
  Dental Module   tooth surfaces (bitfield),         bill a full treatment
                  treatment plans, perio charting    plan
                  (JSONB), CDT procedure catalog     

  Phase 4 —       Invoices with per-line TVA;        Reception can close
  Billing & Cash  Chargily Pay v2 integration; cash  the day with a
                  drawer session; daily cash report; balanced cash drawer
                  DGI mandatory mentions             

  Phase 5 —       Serwist service worker; Dexie +    App works for 24h
  Offline-First   sync outbox; Background Sync       offline and syncs
  PWA             progressive enhancement;           cleanly on reconnect
                  installable on                     
                  desktop/tablet/mobile              

  Phase 6 — RTL + Comprehensive translation of all   Zero axe-core
  Bilingual       UI strings; RTL icon mirroring     critical violations
  Polish          audit; RTL chart axis audit; RTL   in both LTR and RTL;
                  animation direction audit; WCAG    Lighthouse
                  2.2 AA accessibility audit; Arabic Accessibility ≥ 95 in
                  medical-terminology review with a  both locales
                  clinician                          

  Phase 7 —       Orthanc Docker deploy; S3 storage  Dentist can view
  Imaging         on Djezzy Cloud;                   X-rays and intraoral
                  OHIF/Cornerstone3D viewer; DICOM   photos in the patient
                  ingest for CBCT/panoramic;         record
                  intraoral JPEG wrapping            

  Phase 8 —       Daily/monthly stats; cashier       Clinic admin can
  Reports & Audit report; audit log export (FHIR     generate all reports
                  AuditEvent); ANPDP compliance      required for ANPDP
                  reports                            inspection

  Phase 9 —       Pharmacy stock; dental materials;  Pharmacist can
  Inventory +     dispense; low-stock alerts;        dispense and reorder
  Lab + Device    supplier POs; lab integration (HL7 without spreadsheet;
                  v2 ORU); non-DICOM device stubs    lab results arrive
                                                     electronically

  Phase 10 — FHIR /fhir/export endpoint emitting     Can export a patient
  Export          FHIR Bundles via national-interop  record as a FHIR
                  adapter; DEM.DZ interop when API   Bundle
                  available                          

  Phase 11 —      CHIFA patient ID; bordereau        Can bill CNAS for
  CNAS/CASNOS     export; tiers payant workflow      conventionné patients
                                                     (requires signed
                                                     convention)

  Phase 12+ —     Self-service appointment booking,  Patient can book an
  Patient Portal  prescription viewing, lab result   appointment and pay
                  viewing, invoice payment, DSR      an invoice from their
                  requests                           phone

  Phase 13+ —     WebRTC remote consultations;       Doctor can conduct a
  Telemedicine    encounter.type="telemed";          remote consultation
                  recording (with consent); chat log (requires Algerian
                                                     counsel sign-off on
                                                     implementing decree)
  ------------------------------------------------------------------------

18. Counterarguments & Limitations

18.1 "Why Not Just Use OpenMRS / OpenEMR?"

OpenMRS and OpenEMR are mature, free, open-source EMRs with global
adoption. The operator has explicitly chosen to build from scratch. The
counterargument for build-vs-buy is threefold: (1) both projects have
UI/UX patterns from the 2000s that do not match the PWA +
offline-first + RTL expectations of a 2026 Algerian clinic; retrofitting
would consume as much effort as a clean build; (2) both have data models
optimized for their original contexts (OpenMRS for HIV clinics in
sub-Saharan Africa; OpenEMR for US insurance billing) — the SaaS needs a
model optimized for Algerian out-of-pocket + future CNAS bordereau
workflow; (3) the operator wants AI-agent authorship, which is
materially easier on a clean, well-documented codebase than on a
20-year-old Java/PHP codebase with undocumented conventions. The
decision is defensible but comes with the cost of re-implementing
everything that OpenMRS/OpenEMR already do — which is why this document
draws heavily on their schemas as reference.

18.2 "Why Not FHIR as the Canonical Model?"

The case for FHIR-as-canonical-model is strong on paper:
interoperability, future-proofing, standardized code systems, ecosystem
tooling. The case against (which this document adopts) is operational:
FHIR's verbose JSON (50+ fields on Patient, most unused for a dental
clinic) adds 3-5× storage overhead and slows development by 30-50% vs a
lean Drizzle schema; the 2-year major-release cycle forces constant
migration; no native multi-tenancy primitive; and creating a single
Encounter requires 7 round-trips to first resolve Practitioner,
PractitionerRole, Organization, Location, Patient, Coverage. The
pragmatic middle path adopted here — lean Drizzle schema with 1:1 FHIR
mapping + future national-interop adapter (FHIR as first implementation)
— captures 90% of FHIR's interop benefit at 10% of the operational cost.
The limitation is that the export endpoint must be built and tested, and
any FHIR consumer (e.g., DEM.DZ) must be able to accept a Bundle that
may not implement every FHIR constraint perfectly.

18.3 "Why Not Microservices from Day One?"

The microservices-first argument is that if you will eventually need
them, why not start with them? Martin Fowler's answer is decisive:
"Almost all the cases where I've heard of a system that was built as a
microservice system from scratch, it has ended up in serious trouble."
The "Microservice Premium" — the cost of managing a suite of services —
slows down a small team and favors a monolith for simpler applications.
For a single-operator build with AI agents, microservices multiply the
number of moving parts (deployments, CI pipelines, DB connection pools,
network failure modes) that an AI agent can misconfigure. The
modular-monolith approach (Shopify, DHH) preserves the option to extract
services later once correct boundaries are discovered — and the repo
conventions in §15 explicitly design EventEmitter2 payloads to be
transport-agnostic for that future extraction.

18.4 "Why Not Supabase / Firebase for Speed?"

Supabase (Postgres + Auth + Storage + Realtime) and Firebase would
dramatically accelerate the MVP. The blocker is Algerian data residency:
Supabase's managed offering is hosted in AWS regions outside Algeria,
and self-hosting Supabase is operationally heavy (12+ containers:
Postgres, GoTrue, PostgREST, Realtime, Storage, Meta, Kong, etc.).
Firebase is US-hosted with no self-host option. Both create an awkward
legal situation under Law 18-07's data residency requirements. The
architectural choice is therefore: self-host Postgres on CERIST/Djezzy
Cloud + Better Auth (self-hosted) + S3-compatible sovereign storage.
This is more work than Supabase but is the legally safe path. The
trade-off is documented in ADR-004 (Better Auth over Clerk/Supabase
Auth).

18.5 "Why Not Use an Existing Algerian Vertical-Specific SaaS?"

Algerian vendors like Almawarid, HALKORB, and EDSM offer
clinic-management software tailored to the Algerian market — Law 18-07
compliance, CNAS integration, Arabic/French bilingual UI, and local
support. The case for using one of these is strong: faster
time-to-value, proven regulatory compliance, and local maintenance. The
case against (which this document adopts) is threefold: (1) the operator
wants full control over the data model and feature roadmap for future
service expansion; (2) the operator wants to build with AI agents on a
modern TypeScript stack, which is easier on a clean codebase than on an
existing vendor's proprietary or legacy codebase; (3) the operator wants
the SaaS to be a product (multi-tenant, potentially sellable to other
clinics), not just an internal tool — existing vendors are single-tenant
installations. The decision is defensible but the operator should
periodically reassess: if an Algerian vendor ships a modern API-first
multi-tenant SaaS that meets the operator's needs, the build-vs-buy
calculus may shift.

18.6 "Why Not .NET or Java?"

The document chooses TypeScript end-to-end for AI-agent tooling support.
The case for .NET (C# + ASP.NET Core) or Java (Spring Boot) is strong:
both are mature enterprise ecosystems with excellent EMR-library
availability (e.g., HAPI FHIR is Java; Firely is .NET). The case against
is twofold: (1) the operator is using AI agents, and TypeScript has the
largest AI training corpus and best tool-time type inference of the
three; (2) a single language across frontend, backend, and shared
contracts enables a single shared package for Zod schemas, tRPC routers,
and MSW mocks — one source of truth — which is harder in .NET (no
equivalent to tRPC) or Java (frontend would still be TypeScript). The
decision is defensible for the operator's workflow but should be
revisited if the operator hires a team with .NET or Java expertise.

18.7 "Why Not Managed Postgres on AWS Paris with ANPDP Transfer Authorization?"

The document chooses self-hosted Postgres on CERIST/Djezzy Cloud for
data residency. The case for managed Postgres on AWS Paris (RDS or
Aurora) with ANPDP cross-border transfer authorization is: (a)
dramatically lower operational burden (no patching, no backup
configuration, no replication setup); (b) better performance and
reliability than self-hosted on Algerian VPS; (c) AWS Paris is only
~56ms from Algiers. The case against is twofold: (1) the ANPDP transfer
authorization process takes 3-6 months and there is no guarantee of
approval — the operator cannot risk a 3-6 month delay to go-live; (2)
even with authorization, the legal risk is higher (if ANPDP revokes the
authorization, the operator must migrate all patient data back to
Algeria within a deadline — a multi-week disruptive migration). The
self-hosted-on-Algerian-sovereign-infra choice is the conservative,
legally-safe path. The operator could file for ANPDP transfer
authorization in parallel and, if approved, migrate non-personal
workloads (already on AWS Paris) and potentially pseudonymized analytics
data to AWS Paris managed services for lower operational burden.

18.8 "Why Not a Low-Code Platform?"

Low-code platforms (Appsmith, Budibase, Retool, NocoDB) could
dramatically accelerate the MVP for CRUD-heavy clinic workflows (patient
demographics, appointments, invoices). The case for low-code is: (a)
faster time-to-value for standard CRUD; (b) visual UI builder handles
RTL and bilingual concerns declaratively; (c) built-in auth and role
management. The case against is threefold: (1) low-code platforms are
poor at complex domain logic (odontogram charting, periodontal charting,
treatment plans, DICOM viewer integration) — these would require custom
widgets or external apps anyway, defeating the purpose; (2) low-code
platforms have vendor lock-in concerns (the app logic lives in the
platform's proprietary format); (3) AI agents are less effective on
low-code platforms (the visual-builder paradigm doesn't map well to
text-based AI code generation). The decision to build from scratch with
TypeScript is defensible, but the operator could use a low-code platform
for internal admin tools (e.g., a clinic-admin dashboard for user
management, audit-log viewing, report generation) while building the
clinical workflow (odontogram, encounters, billing) in Next.js. This
hybrid approach reduces build effort without compromising the clinical
UX.

18.9 Limitations of This Research

-   Algerian Health Ministry implementing decrees for Article 292
    (retention period for medical records) were not located in public
    sources — the 20-year default is a conservative inference (15-year
    legal floor + 5-year buffer), not a regulatory mandate.

-   The ANPDP authorization process timeline is described as
    "multi-month" based on law-firm secondary sources; the operator
    should validate with ANPDP directly before committing to a go-live
    date.

-   CNAS/CASNOS electronic billing integration is documented as "no
    public API exists" — this is accurate as of July 2026 but the
    operator should monitor CNAS direction of IT modernization for any
    future API announcement.

-   SATIM direct integration specifics (exact register.do payload
    schema, sandbox behavior) are based on the Berkati.xyz community
    blog (reclassified to ★☆☆); the operator must validate with SATIM
    and the acquiring bank before implementation.

-   PowerSync Open Edition is source-available (FSL-1.1-ALv2), not
    OSI-approved open source — the operator should review the FSL terms
    (auto-conversion to Apache-2.0 after 2 years) before committing.

-   Algerian SMS pricing is volatile and route-dependent (Mobilis is 3×
    more expensive than Djezzy on some gateways); the operator should
    negotiate volume discounts with Sobersys or Africala before scaling
    reminders.

-   The exact maximum criminal fine under Law 25-11 (6M DZD per Halkorb
    vs 10M DZD per AlgeriaTech) could not be definitively resolved; the
    conservative posture assumes the higher figure.

-   Law 18-11 Articles 292 and 316 should be verified by Algerian
    counsel against the official Journal Officiel text before go-live.

19. Risks & Mitigations

  -----------------------------------------------------------------------------------
  Risk                  Likelihood   Impact          Mitigation
  --------------------- ------------ --------------- --------------------------------
  ANPDP authorization   Medium       High (legal)    File declaration + authorization
  delayed past go-live                               at Phase 0; budget 6 months;
                                                     plan paper fallback

  CERIST/Djezzy Cloud   Low          High (clinical) DR replica in Constantine DC; 4h
  outage                                             RTO; offline-first PWA keeps
                                                     clinic operational

  RLS + PgBouncer       Medium       High (data leak Use pool_mode=session OR adopt
  incompatibility                    or empty        Supavisor/PgCat; bake FORCE RLS
  breaks session vars                results)        into migration template

  Drizzle migration     High (if not Critical (data  FORCE ROW LEVEL SECURITY on
  bypasses RLS (table   mitigated)   leak)           every tenant-scoped table; CI
  owner)                                             test asserts cross-tenant
                                                     queries return zero rows

  PowerSync             Medium       Medium (delays  Ship v1 on Dexie+manual-sync;
  self-hosting                       v2)             only upgrade when multi-device
  operational burden                                 conflict is a real workflow

  Background Sync       High (in     Medium (sync    Foreground IndexedDB outbox is
  unsupported in Safari Algeria)     delay)          primary; Background Sync is
                                                     progressive enhancement only

  SATIM onboarding      High         Medium (payment Use Chargily Pay v2 for MVP
  takes months                       friction)       (days to onboard); SATIM direct
                                                     is optional; backup providers
                                                     via PaymentProvider strategy
                                                     pattern

  Algerian SMS route    High         Low (cost)      Negotiate volume discounts;
  pricing volatility                                 budget €3,000/year/clinic;
  (Mobilis 3× Djezzy)                                consider email/WhatsApp as
                                                     secondary channel

  E-invoicing reform    Medium       Medium          Invoice schema already stores
  extends to B2C                     (compliance)    DGI mandatory mentions from day
  healthcare                                         1 (§9.6.2)

  Next.js 16 +          Medium       Medium (PWA     Use Webpack for production
  Turbopack + Serwist                breakage)       builds (turbopack: false);
  integration unstable                               Turbopack dev mode is fine

  AI agent writes code  Medium       High            Lint rules + CI tests assert RLS
  that bypasses RLS or               (compliance)    on every tenant-scoped table;
  audit                                              AuditInterceptor auto-captures
                                                     mutations; security review
                                                     before merge

  Breach response SLA   Low          Critical        Breach-response runbook (§11.3);
  (5 days) missed                    (legal +        on-call alerting; incident
                                     reputation)     registry; quarterly
                                                     breach-response drill

  Patient data          Low          Critical        Network egress rules (security
  accidentally sent to               (legal)         group + Nginx/Caddy whitelist);
  AWS Paris                                          NestJS EgressGuard interceptor
                                                     asserts no personal-data fields;
                                                     Sentry PII scrubbing; Grafana
                                                     metrics aggregate only; staging
                                                     uses pseudonymized data; DPO
                                                     verifies quarterly

  Orthanc DICOM ingest  Medium       Medium (imaging Validate DICOM on upload;
  fails on malformed                 workflow)       fallback to JPEG wrap; Orthanc
  files                                              logs monitored

  Operator burnout /    High (solo   Critical        Document everything in ADRs +
  key-person dependency operator)    (project        runbooks; pair-program with AI
                                     stalls)         agents on critical paths; budget
                                                     rest periods; identify a backup
                                                     developer who can take over

  ANPDP interpretation  Medium       High            Monitor anpdp.dz monthly; DPO
  shifts (new decrees)               (compliance     responsible for regulatory
                                     rework)         watch; configurable retention
                                                     and consent flows to absorb new
                                                     requirements

  AI-agent security     Medium       High (data leak AI agents run with
  holes (prompt                      or corruption)  least-privilege DB role (no
  injection, excessive                               BYPASSRLS); CI asserts RLS on
  permissions)                                       every tenant-scoped table;
                                                     security review of AI-generated
                                                     code before merge; no AI agent
                                                     has production deploy access

  Sovereign-hosting     Low          Critical        DR replica on a different
  vendor failure                     (clinic         sovereign provider (CERIST
  (CERIST or Djezzy                  downtime)       primary → Djezzy Cloud DR, or
  Cloud                                              vice versa); 4h RTO;
  outage/bankruptcy)                                 offline-first PWA keeps clinic
                                                     operational during outage;
                                                     quarterly DR drill

  Algerian dinar /      Medium       Medium (billing Cash fallback at reception;
  payment network       (SATIM       disruption)     invoice payment deferral; daily
  outage                switch                       cash drawer reconciliation
                        incidents)                   absorbs short outages

  Regulatory            Low          Critical        ANPDP declaration filed before
  retroactive penalties              (fines +        go-live; DPO designated;
                                     criminal        audit_log immutable; quarterly
                                     liability)      compliance self-audit; legal
                                                     counsel on retainer

  Patient data breach   Medium       Critical (5-day PWA data is in IndexedDB
  via lost/stolen                    ANPDP           (encrypted at rest on modern
  clinic device                      notification)   OS); device-level full-disk
                                                     encryption; remote-wipe policy
                                                     for clinic devices; session
                                                     timeout (15 min inactive);
                                                     breach-response runbook (§11.3)

  Power outage at       Medium       Low (PWA works  PWA continues on device battery;
  clinic (no UPS)                    offline)        sync resumes when power +
                                                     network return; recommend UPS
                                                     for reception desktops
  -----------------------------------------------------------------------------------

20. Conclusion & Future Outlook

This document has defined a complete technical blueprint for an
Algerian, bilingual, offline-first, multi-clinic EMR and
practice-management SaaS, built from scratch by a single operator using
AI coding agents, and — critically — fully self-hostable on Algerian
sovereign infrastructure. The architecture is a TypeScript monorepo
(Turborepo + pnpm) with Next.js 16 PWA + shadcn/ui RTL on the frontend,
a NestJS modular monolith on the backend, PostgreSQL 17 with Row-Level
Security for multi-tenant isolation, Drizzle ORM for plain-TypeScript
schema authorship, Better Auth for self-hosted multi-tenant
authentication, tRPC + Zod for type-safe API contracts, and a Dexie +
manual sync offline layer with a documented upgrade path to PowerSync
Open Edition. Hosting is on Algerian sovereign infrastructure (CERIST
Cloud or Djezzy Cloud primary, Algérie Télécom Constantine DC for DR),
with non-personal workloads (CI/CD, observability) optionally on AWS
Paris at ~56 ms RTT subject to ANPDP cross-border transfer rules.

The Algerian regulatory environment — Law 18-07 (amended by Law 25-11),
Law 18-11, the Code des Taxes sur le Chiffre d'Affaires — shapes every
architectural decision: data must stay in Algeria; health data requires
prior ANPDP authorization; a DPO is mandatory; breach notification is 5
days; medical acts are TVA-exempt but invoices must still carry all DGI
mandatory mentions; e-prescriptions require wet-signature. The data
model is a lean Drizzle schema that maps 1:1 to FHIR resources but does
not store FHIR JSON internally — a future national-interop adapter (with
FHIR as the first implementation) provides interoperability with
Algeria's national DEM.DZ platform when its API becomes available.

The phased roadmap ships a usable MVP (Phases 0-6) for one clinic first,
then extends to imaging, reports, inventory, FHIR export, CNAS
integration, patient portal, and telemedicine. The counterarguments
against build-vs-buy, FHIR-as-canonical-model,
microservices-from-day-one, Supabase/Firebase, Algerian
vertical-specific vendors, .NET/Java, managed Postgres on AWS Paris, and
low-code platforms have been addressed: the operator's choices are
defensible given the Algerian context, the AI-agent workflow, the
self-hosting requirement, and the no-deadline timeline. The risks are
catalogued with mitigations; the highest-priority risks (RLS bypass via
Drizzle migrations, ANPDP authorization delay, Safari Background Sync
gap, operator burnout, AI-agent security holes) have concrete technical
and operational mitigations already built into the architecture.

Future outlook: the Algerian digital-health ecosystem is rapidly
maturing — 5G launched commercially in December 2025 in 8 wilayas, SATIM
instant payments went live in early 2025, PAPSS connection landed in
August 2025, and the DEM.DZ national EHR is being deployed
wilaya-by-wilaya. A clinic SaaS built today on the architecture defined
here is well-positioned to integrate with these national infrastructure
pieces as their APIs become available, without re-architecture. The
single biggest strategic bet is the
lean-schema-plus-national-interop-adapter pattern: if DEM.DZ or another
national system ships a FHIR R4 API in the next 2-3 years, the SaaS can
interop from day one of that API's availability. If they ship a non-FHIR
API or no API at all, the SaaS has lost nothing — the adapter facade is
a thin layer that can accommodate any future format.

21. Appendix A: Phase 0 Task Checklist

A granular task checklist for Phase 0 (Foundation + RTL Scaffold). Each
task is small enough for an AI agent to complete in one session. Check
off each item as it lands.

21.1 Monorepo Scaffold

10. Initialize git repo; create .gitignore (node_modules, .next, dist,
    .env, *.pem).

11. Initialize pnpm workspace: pnpm-workspace.yaml with packages:
    ['apps/*', 'packages/*'].

12. Initialize Turborepo: turbo.json with build, dev, lint, test,
    typecheck pipelines.

13. Create apps/web (Next.js 16): pnpm create next-app with App Router,
    TypeScript, Tailwind CSS v4, no src dir.

14. Create apps/api (NestJS): nest new with Fastify adapter
    (@nestjs/platform-fastify).

15. Create apps/worker (NestJS + BullMQ): same as api, with
    @nestjs/bullmq and Redis backend.

16. Create packages/db: Drizzle ORM config + schema/ directory (empty
    index.ts for now).

17. Create packages/auth: Better Auth config (empty stub).

18. Create packages/ui: shadcn/ui init (Base UI default, Tailwind v4,
    rtl:true).

19. Create packages/i18n: next-intl config with ar-DZ + fr-DZ,
    numberingSystem: "latn".

20. Create packages/contracts: empty index.ts (will hold tRPC routers +
    Zod schemas).

21. Create packages/tsconfig: shared tsconfig presets (base, nextjs,
    nestjs).

22. Create docs/ directory structure: adr/, conventions/, domain/,
    runbooks/, templates/.

23. Write AGENTS.md (root) with build commands, architecture rules,
    testing conventions (see Appendix B).

24. Write docs/adr/ADR-001 through ADR-008 (one ADR per architectural
    decision).

25. Write docs/domain/glossary.md (trilingual FR + AR + EN stub).

26. Write docs/conventions/testing.md, docs/conventions/i18n.md,
    docs/conventions/rtl.md.

27. Write docs/runbooks/breach-response.md (full runbook per §11.3).

28. Write docs/runbooks/backup-recovery.md.

29. Write docs/runbooks/dexie-to-powersync-migration.md (per §10.4).

30. Write docs/dpia.md (Data Protection Impact Assessment stub — to be
    completed with DPO).

21.2 Database & RLS

31. Set up PostgreSQL 17 on CERIST Cloud VPS Large (4 vCPU, 16 GB RAM,
    200 GB SSD + WAL volume).

32. Create app_role (no BYPASSRLS) and ops_superuser (BYPASSRLS)
    Postgres roles.

33. Configure pgBackRest with AES-256-CBC encryption; passphrase in OS
    keyring.

34. Configure WAL archiving to Djezzy Cloud S3 (repo1) and CERIST S3
    (repo2).

35. In packages/db/schema/: create clinic.ts (tenant table),
    app_user.ts, role.ts, privilege.ts, role_privilege.ts,
    role_inheritance.ts, user_role.ts.

36. In packages/db/schema/: create audit_log.ts (append-only,
    hash-chained, per §9.7).

37. Write Drizzle migration: 001_initial_schema.ts.

38. For every tenant-scoped table: ENABLE ROW LEVEL SECURITY + FORCE ROW
    LEVEL SECURITY.

39. For every tenant-scoped table: CREATE POLICY tenant_isolation USING
    (tenant_id = NULLIF(current_setting('app.current_tenant', true),
    '')::uuid) WITH CHECK (same).

40. For every tenant-scoped table: CREATE INDEX ... USING
    btree(tenant_id) WHERE deleted_at IS NULL.

41. Write a CI test (Vitest) that: creates two tenants, creates a
    patient in tenant A, queries patient as tenant B, asserts zero rows
    returned. Run on every PR.

42. Write a CI test that: attempts to UPDATE the audit_log table as
    app_role, asserts permission denied. Run on every PR.

43. Write a CI test that: recomputes the audit_log hash_curr chain and
    asserts no mismatch. Run nightly.

21.3 Auth & Tenant Interceptor

44. Configure Better Auth with Organization + RBAC plugins in
    packages/auth.

45. Create the auth schema (user, organization, session,
    organization_member, role, privilege tables) — all tenant-scoped
    where applicable.

46. In apps/api: create a TenantInterceptor that reads tenant_id from
    the JWT, issues SET LOCAL app.current_tenant = $1 at the start of
    every transaction.

47. In apps/api: create a PermissionsGuard
    (@RequirePermissions('encounter:write')) that walks the role
    inheritance graph and caches per request.

48. In apps/api: create an AuditInterceptor that captures before_jsonb /
    after_jsonb for all mutating operations and writes to audit_log.

49. In apps/api: create an EgressGuard interceptor that asserts no
    personal-data fields are present in payloads sent to AWS Paris (per
    §3.1.6).

50. Write a login endpoint (POST /auth/login) that returns a JWT with
    tenant_id, user_id, role.

51. Write a tenant-switch endpoint (POST /auth/switch-tenant) that
    returns a new JWT with the new tenant_id.

52. Write E2E tests (Playwright) for login + tenant switch + RLS
    isolation.

21.4 RTL/i18n Scaffold (Phase 0)

53. Configure next-intl in apps/web: [locale] dynamic segment,
    middleware (createMiddleware), ar-DZ + fr-DZ locales.

54. Set numberingSystem: "latn" for both locales in the next-intl
    config.

55. Configure Tailwind CSS v4 logical properties (ms-*, me-*, ps-*,
    pe-*, start-*, end-*).

56. Configure shadcn/ui with rtl:true (Base UI default, January 2026 RTL
    support).

57. Create the locale switcher component (toggles between ar-DZ and
    fr-DZ; persists in cookie).

58. Create the login page in both locales; verify RTL layout for ar-DZ.

59. Verify Western numerals (0-9) render in both locales (not Eastern
    Arabic-Indic ٠١٢٣).

60. Write the trilingual glossary stub in docs/domain/glossary.md (FR +
    AR + EN for: patient, appointment, encounter, prescription,
    odontogram, invoice, etc.).

61. Write an axe-core CI test that scans the login page in both LTR and
    RTL for WCAG 2.2 AA violations; gate on zero critical violations.

21.5 CI/CD & Observability

62. Create .github/workflows/ci.yml: lint (ESLint), typecheck (tsc
    --noEmit), unit tests (Vitest), build (Next.js + NestJS).

63. Create .github/workflows/e2e.yml: Playwright E2E on merge to main.

64. Create .github/workflows/deploy.yml: deploy to staging on tag;
    deploy to production on manual approval.

65. Configure Sentry (self-hosted or SaaS) with PII scrubbing rules.

66. Configure Grafana + Prometheus + Loki (self-hosted on Algerian VPS,
    or AWS Paris for non-personal telemetry only).

67. Configure Lighthouse CI with Performance ≥ 90, Accessibility ≥ 95
    gates.

68. Configure axe-core CI gate (zero critical WCAG 2.2 AA violations in
    both LTR and RTL).

69. Write the k6 smoke test (1 virtual user, 1 minute, login + tenant
    switch + patient list).

70. Configure backup verification: nightly job restores latest backup to
    an ephemeral DB and runs schema-integrity checks.

71. Configure uptime monitoring: external probe from AWS Paris +
    secondary probe from a different Algerian DC.

22. Appendix B: Sample AGENTS.md

A starter AGENTS.md for the root of the repository. This file is the
universal standard read by all AI coding tools. It is tool-agnostic —
the operator can add tool-specific instruction files as needed for
whatever AI tools they choose to use, but those files should reference
AGENTS.md rather than duplicate content. Customize the build commands
and architecture rules as the project evolves.

  # AGENTS.md — Clinic Management SaaS
  ## Project Overview
  A multi-tenant, bilingual (Arabic RTL + French LTR), offline-first
  clinic management SaaS for
  Algeria. Two clinics at launch (one dental, one mixed medical+dental),
  scaling to ~50 clinics.
  Built with TypeScript end-to-end. Fully self-hosted on Algerian
  sovereign infrastructure
  (CERIST Cloud / Djezzy Cloud) per Law 18-07 data residency
  requirements.
  ## Build Commands
  - `pnpm install` — install dependencies
  - `pnpm dev` — start all apps in dev mode (Turborepo)
  - `pnpm build` — build all apps for production
  - `pnpm test` — run all unit tests (Vitest)
  - `pnpm test:e2e` — run all E2E tests (Playwright)
  - `pnpm lint` — run ESLint across all packages
  - `pnpm typecheck` — run tsc --noEmit across all packages
  - `pnpm db:migrate` — apply Drizzle migrations (NEVER auto-apply on
  app boot)
  - `pnpm db:generate` — generate Drizzle migration from schema changes
  - `pnpm db:studio` — open Drizzle Studio (DB GUI)
  ## Architecture Rules
  ### Multi-Tenancy
  - Pool model: every tenant-scoped table has `tenant_id UUID NOT NULL
  REFERENCES clinic(id)`.
  - PostgreSQL Row-Level Security (RLS) enforces isolation at the DB
  engine level.
  - Every tenant-scoped table: `ENABLE ROW LEVEL SECURITY` + `FORCE ROW
  LEVEL SECURITY`.
  - Every tenant-scoped table: `CREATE INDEX ... USING btree(tenant_id)
  WHERE deleted_at IS NULL`.
  - The app_role MUST NOT have BYPASSRLS. Only ops_superuser has
  BYPASSRLS (for migrations).
  - TenantInterceptor issues `SET LOCAL app.current_tenant = $1` at the
  start of every transaction.
  - NEVER write a query on a tenant-scoped table without the
  TenantInterceptor active.
  ### Modular Monolith
  - NestJS modules in apps/api/src/modules/: auth, clinic, patient,
  appointment, encounter, dental,
  billing, inventory, imaging, audit, shared.
  - A module may import only another module's `index.ts` (public API).
  Importing another module's
  internal services is a lint error.
  - Cross-module write-side effects go through EventEmitter2
  (in-process). Event payloads must be
  JSON-serializable (no class instances) for future message-bus
  extraction.
  - Each domain module owns its Drizzle schema file (e.g.,
  modules/patient/schema/patient.ts).
  The root packages/db/schema/index.ts aggregates them for Drizzle-Kit
  migrations.
  ### Soft Deletes
  - NEVER use DELETE on tenant-scoped tables. Use `deleted_at
  TIMESTAMPTZ` (soft delete).
  - Queries on tenant-scoped tables should filter `WHERE deleted_at IS
  NULL` (the RLS index
  already partial-indexes this).
  ### Audit Logging
  - AuditInterceptor automatically captures before_jsonb / after_jsonb
  for all mutating operations.
  - The audit_log table is append-only (REVOKE UPDATE, DELETE from
  app_role).
  - The audit_log hash_curr chain is verified nightly; alert on any
  mismatch.
  ### Data Residency
  - Patient-identifiable data MUST stay in Algeria (CERIST Cloud /
  Djezzy Cloud).
  - AWS Paris (eu-west-3) is for NON-PERSONAL workloads ONLY (CI/CD,
  observability, staging with
  pseudonymized data).
  - EgressGuard interceptor asserts no personal-data fields in payloads
  sent to AWS Paris.
  - NEVER log patient names, NINs, phone numbers, or addresses in Sentry
  error context.
  ## Testing Conventions
  ### Unit Tests (Vitest)
  - Co-located with source: `component.tsx` → `component.test.tsx`.
  - One test file per module; describe blocks per function/method.
  - Use MSW (Mock Service Worker) for API mocking; handlers in
  packages/contracts/mocks/.
  ### E2E Tests (Playwright)
  - In apps/web/tests/e2e/.
  - One test per user journey: login, switch tenant, create patient,
  book appointment, etc.
  - Use seeded DB fixtures (tests/e2e/fixtures/).
  ### CI Gates
  - ESLint: zero errors.
  - tsc --noEmit: zero errors.
  - Vitest: all tests pass.
  - Lighthouse CI: Performance ≥ 90, Accessibility ≥ 95.
  - axe-core: zero critical WCAG 2.2 AA violations in both LTR and RTL.
  - RLS test: cross-tenant queries return zero rows.
  - Audit-log test: UPDATE/DELETE on audit_log denied.
  ## i18n Rules
  - ALL user-visible strings via next-intl. NEVER hardcode user-visible
  text.
  - Locales: ar-DZ (RTL), fr-DZ (LTR). Default: fr-DZ.
  - ICU MessageFormat for plurals (Arabic has 6 plural forms: zero, one,
  two, few, many, other).
  - numberingSystem: "latn" (Western numerals 0-9) for BOTH locales.
  NEVER use Eastern Arabic-Indic
  numerals (٠١٢٣) — the Maghreb convention is Western numerals.
  - Translation keys in packages/i18n/messages/{locale}/{module}.json.
  ## RTL Rules
  - Use Tailwind CSS v4 logical properties: ms-*, me-*, ps-*, pe-*,
  start-*, end-*.
  - NEVER use physical-left/right properties (ml-*, mr-*, pl-*, pr-*,
  left-*, right-*) for layout.
  - Use rtl: and ltr: variants for direction-specific overrides (icons,
  animations).
  - Mirror direction-aware icons (back/forward, reply, share, undo,
  chevrons) via rtl:rotate-180.
  - Do NOT mirror media controls, clocks, or universal icons (search,
  settings).
  - Charts: time always flows left-to-right even in RTL.
  ## Code Style
  - TypeScript strict mode. No `any`. Use `unknown` + type narrowing if
  the type is truly unknown.
  - Prefer Drizzle query builder over raw SQL. If raw SQL is needed, use
  sql.template`` tagged template.
  - Functions: prefer arrow functions for React components; named
  functions for NestJS services.
  - Naming: camelCase for variables/functions; PascalCase for
  types/classes/interfaces; SCREAMING_SNAKE_CASE for constants.
  - File naming: kebab-case for files (patient-schema.ts); PascalCase
  for component files (PatientForm.tsx).
  ## Domain Glossary
  See docs/domain/glossary.md for the trilingual (FR + AR + EN)
  glossary. Use these terms
  consistently in code, UI, and documentation. Examples:
  - patient (EN) = patient (FR) = مريض (AR)
  - appointment (EN) = rendez-vous (FR) = موعد (AR)
  - prescription (EN) = ordonnance (FR) = وصفة طبية (AR)
  - odontogram (EN) = odontogramme (FR) = مخطط الأسنان (AR)
  - invoice (EN) = facture (FR) = فاتورة (AR)
  ## ADRs
  Architecture Decision Records live in docs/adr/. Read them before
  making architectural decisions.
  Each ADR: Title, Status, Context, Decision, Consequences, Alternatives
  Considered.
  ## Runbooks
  Operational runbooks live in docs/runbooks/:
  - breach-response.md — 5-day ANPDP breach notification SLA
  - backup-recovery.md — pgBackRest restore procedure
  - dexie-to-powersync-migration.md — v1-to-v2 offline-upgrade path
  ## Worker App
  apps/worker is a NestJS app using @nestjs/bullmq with Redis backend.
  Handles: SMS reminder cron
  jobs (BullMQ repeatable), payment reconciliation, backup verification,
  audit-log integrity check.
  Deployed as a separate process on the same VPS as the API (or a
  separate VPS if load demands).
  ## Do NOT
  - Do NOT use DELETE on tenant-scoped tables. Use soft delete
  (deleted_at).
  - Do NOT auto-apply Drizzle migrations on app boot. Apply via `pnpm
  db:migrate` in a pre-deploy job.
  - Do NOT log patient PII in Sentry or console.
  - Do NOT hardcode user-visible text. Use next-intl.
  - Do NOT use physical-left/right CSS properties for layout. Use
  logical properties.
  - Do NOT call self.skipWaiting() in the service worker. Show an
  "Update available" toast.
  - Do NOT store FHIR JSON internally. Use the lean Drizzle schema; emit
  FHIR via /fhir/export.
  - Do NOT use Universal tooth numbering. Use FDI Two-Digit Notation
  (ISO 3950:2016) only.
  - Do NOT assume Background Sync API works in Safari. Foreground
  IndexedDB outbox is primary.

23. References

Sources are organized by credibility tier: ★★★ official/primary
(government, peer-reviewed, official docs), ★★☆ reputable secondary (law
firms, vendor blogs with technical depth, reputable media), ★☆☆ general
web (community blogs, forums, used for corroboration only). All URLs
accessed on 2026-07-06.

23.1 Algerian Regulatory & Legal (★★★ Official)

-   Law 18-07 of 10 June 2018 on data protection — Journal Officiel
    N° 34. PDF: https://www.joradp.dz/FTP/jo-francais/2018/F2018034.pdf

-   Law 18-07 official PDF via ANPDP:
    https://anpdp.dz/wp-content/uploads/2023/01/2.1-Loi-N°18-07-2.pdf

-   Law 18-07 official PDF via Ministry of Justice:
    https://droit.mjustice.gov.dz/sites/default/files/loi_18-07_fr.pdf

-   Law 18-11 of 2 July 2018 on health — Journal Officiel N° 46. PDF:
    https://www.joradp.dz/FTP/jo-francais/2018/F2018046.pdf

-   Algerian Civil Code, Ordinance 75-58 of 26 September 1975 (WIPO
    WIPOlex record).
    https://www.wipo.int/wipolex/en/legislation/details/14774

-   Algerian Code des Taxes sur le Chiffre d'Affaires (Direction
    Générale des Douanes):
    https://www.douane.gov.dz/IMG/pdf/code_des_taxes_sur_le_chiffre_d_affaire.pdf

-   ANPDP (Autorité Nationale de Protection des Données à caractère
    Personnel): https://anpdp.dz

-   Ministry of Health (Ministère de la Santé): https://sante.gov.dz

-   MTESS (Ministry of Labour, Employment and Social Security):
    https://www.mtess.gov.dz

-   CNAS portal: https://cnas.dz — Carte CHIFA:
    https://cnas.dz/fr/carte-chifa-et-le-system-du-tiers-payant

-   CASNOS portal: https://www.casnos.dz — Damancom:
    https://www.damancom.casnos.dz

-   ARPCE (Autorité de Régulation de la Poste et des Communications
    Électroniques): https://www.arpce.dz

-   MFDGI (Ministère des Finances — Direction Générale des Impôts) TVA
    page:
    https://www.mfdgi.gov.dz/fr/professionnels/services-pro/regime-reel/la-taxe-sur-la-valeur-ajoutee

-   Algérie Télécom (Djaweb): https://www.algerietelecom.dz

-   CERIST Cloud: https://cloud.cerist.dz/Cloud-CERIST-En.html

-   Djezzy Cloud: https://djezzycloud.dz

23.2 Verification Sources (from Meta-Evaluation)

-   ISO 3950:1984 — Dentistry: Designation system for teeth (status:
    Withdrawn, stage 95.99). https://www.iso.org/standard/9600.html [★★★
    official]

-   ISO 3950:2009 — Dentistry: Designation system for teeth.
    https://www.iso.org/standard/41835.html [★★★ official]

-   ISO 3950:2016 — confirmed current edition (Standards Council of
    Canada; ANSI Webstore preview "© ISO 2016").
    https://scc-ccn.ca/standardsdb/standards/8161556 [★★★ official]

-   VEON — "VEON completes the sale of Djezzy, receiving USD 682
    million" (5 Aug 2022; FNI acquires stake).
    https://www.veon.com/newsroom/press-releases/veon-completes-the-sale-of-djezzy-receiving-usd-682
    [★★★ official]

-   VEON SEC Form (Note 11) — confirms transaction completed 5 Aug 2022,
    US$682M, FNI acquisition.
    https://www.sec.gov/Archives/edgar/data/1468091/000146809125000058/R18.htm
    [★★★ official]

-   RCR Wireless — "Veon completes sale of Djezzy Algeria stake for $682
    million" (Aug 2022).
    https://www.rcrwireless.com/20220808/featured/veon-completes-sale-of-djezzy-al
    [★★☆ reputable secondary]

-   WeAreTech Africa — "Algeria Launches 5G Services, Begins Six-Year
    Nationwide Rollout" (licenses confirmed in Official Gazette 24 Nov
    2025). https://www.wearetech.africa/en/fils-uk/news/telecom/algeria
    [★★☆ reputable secondary]

-   ecofinagency — "Algeria Awards 5G Licenses…" (Official Gazette 24
    Nov 2025).
    https://www.ecofinagency.com/news-digital/2711-50886-algeria-awards-5g-licenses-to-three-operato
    [★★☆ reputable secondary]

-   shadcn/ui Changelog — "July 2026 — Base UI as the Default" (Base UI
    default; Radix still supported).
    https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default [★★★
    official]

-   vatcalc.com — Algeria e-invoicing mandate analysis (January 2026).
    https://vatcalc.com/algeria/e-invoicing-algeria/ [★★☆ reputable
    secondary]

-   vatupdate.com — Algeria e-invoicing timeline (January 2026).
    https://vatupdate.com/algeria-e-invoicing/ [★★☆ reputable secondary]

-   Chargily Pay v2 pricing (current as of July 2026).
    https://chargily.com/business/pay/pricing [★★★ official]

23.3 Tech Stack & Architecture (★★★ Official Docs)

-   Next.js 16 release blog: https://nextjs.org/blog/next-16

-   Next.js PWA guide:
    https://nextjs.org/docs/app/guides/progressive-web-apps

-   Serwist docs: https://serwist.pages.dev/docs/next/getting-started

-   Tailwind CSS v4 release: https://tailwindcss.com/blog/tailwindcss-v4

-   shadcn/ui RTL changelog (Jan 2026):
    https://ui.shadcn.com/docs/changelog/2026-01-rtl

-   shadcn/ui Base UI default (Jul 2026):
    https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default

-   next-intl docs: https://next-intl.dev/docs/usage/translations

-   Drizzle ORM RLS docs: https://orm.drizzle.team/docs/rls

-   PostgreSQL 17 docs: https://www.postgresql.org/docs/17/

-   PostgreSQL Row-Level Security docs:
    https://www.postgresql.org/docs/current/ddl-rowsecurity.html

-   PostgreSQL continuous archiving (PITR):
    https://www.postgresql.org/docs/current/continuous-archiving.html

-   pgBackRest User Guide: https://pgbackrest.org/user-guide.html

-   Supabase RLS guide (with performance benchmarks):
    https://supabase.com/docs/guides/database/postgres/row-level-security

-   NestJS docs: https://docs.nestjs.com/

-   Better Auth Organization plugin:
    https://better-auth.com/docs/plugins/organization

-   PowerSync pricing & Open Edition: https://powersync.com/pricing

-   PowerSync Open Edition announcement:
    https://powersync.com/blog/new-open-era-for-powersync

-   Functional Source License (FSL) spec: https://fsl.software

-   Dexie.js docs: https://dexie.org

-   Workbox caching strategies overview:
    https://developer.chrome.com/docs/workbox/caching-strategies-overview

-   HL7 FHIR R5: https://hl7.org/fhir/

-   HL7 Dental Data Exchange IG:
    https://build.fhir.org/ig/HL7/dental-data-exchange

-   OpenDental database schema:
    https://www.opendental.com/site/databaseschema.html

-   OpenEMR Access Controls Listing:
    https://www.open-emr.org/wiki/index.php/Access_Controls_Listing

-   OpenMRS information model:
    https://guide.openmrs.org/getting-started/openmrs-information-model

-   Orthanc official site: https://www.orthanc-server.com

-   Orthanc Docker images: https://hub.docker.com/r/orthancteam/orthanc

-   Meilisearch language support:
    https://meilisearch.com/docs/resources/help/language

-   tRPC docs: https://trpc.io/docs

-   Socket.IO Redis adapter: https://socket.io/docs/v4/redis-adapter

-   AWS SaaS Factory multi-tenant architectures:
    https://docs.aws.amazon.com/solutions/multi-tenant-architectures-on-aws

-   Martin Fowler — Monolith First:
    https://martinfowler.com/bliki/MonolithFirst.html

-   Shopify Engineering — Deconstructing the Monolith:
    https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity

-   NIST RBAC: https://csrc.nist.gov/projects/role-based-access-control

-   NIST SP 800-92 (Log Management):
    https://csrc.nist.gov/pubs/sp/800/92/final

-   NIST SP 800-34 Rev 1 (Contingency Planning):
    https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final

-   OWASP Logging Cheat Sheet:
    https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

-   HIPAA 45 CFR §164.312 (Technical Safeguards):
    https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312

-   IHE ATNA profile: https://profiles.ihe.net/ITI/TF/Volume1/ch-9.html

-   Material Design 3 bidirectionality:
    https://m3.material.io/foundations/layout/bidirectionality-rtl

23.4 Reputable Secondary Sources (★★☆)

-   DLA Piper Data Protection Laws of the World — Algeria:
    https://www.dlapiperdataprotection.com/?c=DZ

-   CMS Expert Guide — Algeria data protection:
    https://cms.law/en/int/expert-guides/cms-expert-guide-to-data-protection-and-cyber-security-laws/algeria2

-   Gide (Paris/Algiers) — Protection of personal data focus on Algerian
    regulations:
    https://www.gide.com/en/news-insights/protection-of-personal-data-focus-on-algerian-regulations

-   LEX Africa — Algerian data protection law becomes effective:
    https://lexafrica.com/2023/08/the-algerian-data-protection-law-becomes-effective

-   Crunchy Data — Designing your Postgres database for multi-tenancy:
    https://www.crunchydata.com/blog/designing-your-postgres-database-for-multi-tenancy

-   Crunchy Data — Row-level security for tenants in Postgres:
    https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres

-   Ink & Switch — Local-first software:
    https://www.inkandswitch.com/essay/local-first

-   MakerKit — Better Auth vs Clerk:
    https://makerkit.dev/blog/tutorials/better-auth-vs-clerk

-   MakerKit — Drizzle vs Prisma:
    https://makerkit.dev/blog/tutorials/drizzle-vs-prisma

-   Fire.ly — State of FHIR in 2025:
    https://fire.ly/blog/the-state-of-fhir-in-2025

-   ADA — CDT Code: https://www.ada.org/publications/cdt

-   Wikipedia — FDI World Dental Federation notation:
    https://en.wikipedia.org/wiki/FDI_World_Dental_Federation_notation

-   WonderNetwork — Algiers↔Paris latency:
    https://wondernetwork.com/pings/Paris

-   Berkati.xyz — SATIM CIB/Edahabia payment integration guide
    (reclassified ★☆☆):
    https://berkati.xyz/en/guides/satim-cib-edahabia-payment-integration

-   Twilio SMS guidelines — Algeria:
    https://www.twilio.com/en-us/guidelines/dz/sms

-   BulkGate SMS pricing Algeria:
    https://www.bulkgate.com/en/pricing/sms/dz/algeria

-   ICO UK — Anonymisation guidance:
    https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation

-   Article 29 Working Party — WP216 Opinion on anonymisation:
    https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2014/wp216_en.pdf

End of Document — Clinic Management SaaS Technical Blueprint v2.0
