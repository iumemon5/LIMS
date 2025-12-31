1. Executive Summary
What this repo currently is (one paragraph):
This repository is a Vite + React single-page application that simulates a LIMS UI in the browser, storing all data in localStorage and using mock seed data. There is no backend service, no real database or migrations, and no server-side authorization or audit enforcement. AI features use Gemini directly from the client, and Supabase sync scaffolding exists but is not wired into the app. The README positions it as an “AI Studio app” with local dev instructions only. (Evidence: README.md:5-20, package.json, App.tsx:229-276, hooks/useStickyState.ts:3-27, contexts/SyncContext.tsx:1-149, index.tsx:1-16)

Top 5 risks (data corruption / breach / audit failure / operational failure):

P0 – No secure persistence or access control: all records live in localStorage and are client-editable, violating data integrity, access control, and ALCOA+ expectations. (Evidence: hooks/useStickyState.ts:3-27, contexts/LabOpsContext.tsx:58-67, contexts/AuthContext.tsx:28-73)

P0 – Client-side “auth” with default credentials: user accounts and password hashes are in the browser; a default admin hash for “admin123” is seeded, and login is purely client-side. (Evidence: contexts/AuthContext.tsx:28-69, constants.ts:16-68, App.tsx:30-55)

P1 – Audit trail is mutable and incomplete: audit logs are stored in localStorage and not written for critical changes (e.g., results edits, patient edits). (Evidence: contexts/LabOpsContext.tsx:69-118, contexts/PatientContext.tsx:34-39, hooks/useStickyState.ts:3-27)

P1 – Results can be overwritten without amendment: verified results can be modified and status automatically reverted to “Testing” with no reason-for-change or e-signature. (Evidence: contexts/LabOpsContext.tsx:101-115, components/SampleList.tsx:80-92)

P1 – PHI exposure to third-party AI: Gemini API is called from the client with the API key compiled into the bundle; test results are sent directly. (Evidence: services/geminiService.ts:5-85, vite.config.ts:13-16, components/SampleList.tsx:133-158)

2. Architecture Snapshot
Components & responsibilities

Frontend SPA (React + Vite): UI-only LIMS simulation (App.tsx, components/*) with in-browser state persistence. (App.tsx:229-276, package.json)

State management via Context + localStorage: AuthContext, PatientContext, LabOpsContext hold all entities and persist to browser storage. (contexts/AuthContext.tsx:28-73, contexts/PatientContext.tsx:17-47, contexts/LabOpsContext.tsx:55-253, hooks/useStickyState.ts:3-27)

AI services: Gemini client invoked directly in browser for insights and anomaly checks. (services/geminiService.ts:5-85)

Supabase sync scaffolding (unused): SyncContext exists for offline queue and sync, but it is not wired into the app. (contexts/SyncContext.tsx:1-149, index.tsx:11-15)

No backend / no database: no server or migration tooling present.

Primary entrypoints & runtime

index.tsx mounts App (no other providers). (index.tsx:1-16)

App.tsx renders all modules unconditionally after login. (App.tsx:229-266)

Dev runtime: npm run dev (Vite). (package.json, README.md:11-20)

Data flow (current)

User action → Context mutation → localStorage: all CRUD operations update in-memory state and sync to localStorage. (hooks/useStickyState.ts:3-27, contexts/LabOpsContext.tsx:58-253)

AI analysis: client builds prompt and sends analysis data to Gemini → returns text → UI displays. (services/geminiService.ts:32-85, components/SampleList.tsx:133-158)

No server-side validation or persistence.

Trust boundaries

Public boundary: browser UI (any user with access).

External boundary: Gemini API calls over the network using a client-exposed API key. (services/geminiService.ts:5-85, vite.config.ts:13-16)

Potential internal boundary (unused): Supabase client exists but not connected. (lib/supabase.ts:1-14, contexts/SyncContext.tsx:1-149)

Where lab-domain entities live

Entities are defined in types.ts (e.g., Patient, AnalysisRequest, AuditLog). (types.ts:32-125)

Sample statuses: SampleStatus enum. (types.ts:8-16)

In-memory/localStorage records seeded in constants.ts. (constants.ts:38-191)

Diagram (text)

[User Browser]
   | (React UI + Context state)
   v
[LocalStorage]  <-- all patients/requests/results/audit logs persisted here
   |
   v
[No backend]

[Browser] --(Gemini API key, PHI/test data)--> [Google Gemini API]
3. Findings (Prioritized)
1) P0 — Security / Data Integrity
Issue: No secure persistence or access control; all records stored in client localStorage.
Evidence: hooks/useStickyState.ts:3-27; contexts/LabOpsContext.tsx:58-67; contexts/AuthContext.tsx:28-73
Impact: Any user with browser access can tamper with patient data, results, audit logs; data is not enduring, not attributable, and not reliable (ALCOA+ failure).
Recommendation: Move data persistence to a server-side database with authenticated API, enforce server-side authorization, and store audit logs in append-only tables.
Effort: L (multi-PR); not safe for a small PR.

2) P0 — Security / Access Control
Issue: Authentication is purely client-side with default admin credentials and hash; no server-side validation.
Evidence: contexts/AuthContext.tsx:28-69; constants.ts:16-68; App.tsx:30-55
Impact: Any user can bypass authentication by editing localStorage; default credentials invite unauthorized access.
Recommendation: Implement server-side auth (OIDC/SAML or Supabase auth), remove default credentials, enforce password policies and session management.
Effort: L; not safe for small PR.

3) P1 — Auditability / Data Integrity
Issue: Audit logs are mutable and incomplete (no logging for result edits or patient changes).
Evidence: contexts/LabOpsContext.tsx:69-118 (no audit in updateAnalysisResult); contexts/PatientContext.tsx:34-39 (no audit on update/delete); hooks/useStickyState.ts:3-27
Impact: No trustworthy record of who changed what/when/why; fails ALCOA+ audit requirements.
Recommendation: Add server-side append-only audit logging for all critical changes, including reason-for-change and before/after snapshots.
Effort: M–L.

4) P1 — Correctness / Regulated Workflow
Issue: Verified results can be overwritten and status reset implicitly without amendment reason or e-signature.
Evidence: contexts/LabOpsContext.tsx:101-115 (Verified → Testing on edit), components/SampleList.tsx:80-92
Impact: Results can be changed post-verification with no trace, undermining result integrity and regulatory compliance.
Recommendation: Enforce state machine transitions and amendment workflow (new result version + reason + e-signature).
Effort: M.

5) P1 — Security / Privacy (PHI)
Issue: Gemini API is called from the client with the API key embedded; test results/PHI sent to third party without controls.
Evidence: services/geminiService.ts:5-85; vite.config.ts:13-16; components/SampleList.tsx:133-158
Impact: API key exposure, uncontrolled PHI egress, potential HIPAA/GxP non-compliance.
Recommendation: Proxy AI calls through a backend with redaction, consent, and logging; keep keys server-side only.
Effort: M–L.

6) P1 — Reliability / Runtime Error
Issue: Compliance component calls logQC, which is not provided by useLab.
Evidence: components/Compliance.tsx:8-46 (calls logQC); no logQC in contexts/LabOpsContext.tsx:12-253
Impact: Runtime crash when running QC; breaks critical compliance UI.
Recommendation: Implement logQC in context or remove UI action.
Effort: S (safe small PR).

7) P2 — Data Integrity / Backup
Issue: Backup/restore uses key names that don’t match actual localStorage keys used by contexts.
Evidence: components/DataBackup.tsx:10-20 vs actual keys in contexts/LabOpsContext.tsx:58-67 and contexts/PatientContext.tsx:18
Impact: Backups are incomplete or empty; data loss risk.
Recommendation: Align backup keys with actual storage keys and include all required domains.
Effort: S.

8) P2 — Security / Authorization
Issue: No role-based access control; all modules rendered without role checks.
Evidence: App.tsx:229-266 shows unrestricted module rendering after login.
Impact: Any logged-in user can access admin functions (settings, users, billing).
Recommendation: Implement RBAC checks in routes/components and enforce on server-side APIs.
Effort: M.

9) P2 — Architecture / DX
Issue: SyncContext + Supabase scaffolding exists but isn’t used; no backend integration.
Evidence: contexts/SyncContext.tsx:1-149, lib/supabase.ts:1-14, index.tsx:11-15
Impact: Offline/online sync is non-functional; confusion for maintainers; risks false sense of persistence.
Recommendation: Either integrate SyncProvider and real backend tables, or remove dead code.
Effort: S–M.

10) P2 — Security / Data Export
Issue: CSV exports use raw patient/client names; formula injection risk.
Evidence: components/SampleList.tsx:114-129
Impact: Spreadsheet injection when opening exports; can lead to data exfiltration.
Recommendation: Sanitize CSV (prefix dangerous cells with ' or \t).
Effort: S.

4. LIMS / Regulated Readiness Checklist
Control Area	Status	Notes / Evidence
Audit trail completeness (who/what/when/why)	Fail	Partial logs only; no reason-for-change. (contexts/LabOpsContext.tsx:69-118)
Record immutability for critical entities	Fail	Results editable after verification; logs in localStorage. (contexts/LabOpsContext.tsx:101-115)
RBAC/permission coverage	Fail	No role checks; all modules accessible. (App.tsx:229-266)
Electronic signatures	Fail	No e-signature model or flow. (No evidence in types.ts)
Data retention/export	Partial	CSV export exists; but no retention policy. (components/SampleList.tsx:114-129)
Backup/restore documented	Partial	UI backup exists but uses incorrect keys. (components/DataBackup.tsx:10-20)
Change control readiness (migrations/versioning)	Fail	No database/migrations, no backend.
5. Test & CI Evaluation
Tests present: None (no test scripts or files observed).
CI/CD: No CI config found; no lint/test/typecheck pipelines documented.

Runnable commands:

npm run dev, npm run build, npm run preview (no tests). (package.json, README.md:11-20)

Critical path coverage (sample intake → order → results → correction):
Not covered by automated tests (none present).

6. Suggested Refactor Plan (3–6 PRs)
PR: “Introduce backend persistence + auth enforcement”

Scope: Stand up backend (Supabase/Postgres or custom API), move CRUD operations server-side.

Files touched: contexts/*, lib/supabase.ts, new API layer.

Regression risk: High — major data flow shift.

Suggested tests: API integration tests, auth flow tests.

PR: “Immutable audit trail + reason-for-change + e-signature scaffolding”

Scope: Add audit log tables, append-only writes, reason-for-change fields, and initial e-signature model.

Files touched: new backend migrations + API, UI for amendments.

Regression risk: Medium.

Suggested tests: audit log creation on every critical mutation.

PR: “State machine enforcement for sample lifecycle”

Scope: Enforce transitions (Received → Testing → Verified → Published); require amendments for edits.

Files touched: contexts/LabOpsContext.tsx, components/SampleList.tsx, components/Worksheets.tsx.

Regression risk: Medium.

Suggested tests: state transition unit tests.

PR: “Security hardening + RBAC”

Scope: Role checks in UI and API; remove default credentials; enforce least privilege.

Files touched: contexts/AuthContext.tsx, App.tsx, new policy layer.

Regression risk: Medium.

Suggested tests: RBAC permission tests.

PR: “Backup/restore + data export safety”

Scope: Fix backup keys; add CSV injection protections; add data retention docs.

Files touched: components/DataBackup.tsx, components/SampleList.tsx, README.

Regression risk: Low.

Suggested tests: export/import integration tests.

7. Quick Wins (Top 10)
Implement logQC or remove the QC action to prevent runtime crash. (components/Compliance.tsx:8-46)

Fix backup key names to match actual localStorage keys. (components/DataBackup.tsx:10-20, contexts/LabOpsContext.tsx:58-67)

Add audit logging to result edits and patient edits. (contexts/LabOpsContext.tsx:101-118, contexts/PatientContext.tsx:34-39)

Prevent editing of verified results without an amendment flow. (contexts/LabOpsContext.tsx:101-115)

Add role checks around Settings/Billing/Compliance modules. (App.tsx:229-266)

Remove default admin credential and require password reset on first use. (constants.ts:16-68)

Sanitize CSV export to prevent formula injection. (components/SampleList.tsx:114-129)

Add client-side validation for result units/ranges and critical limits. (types.ts:50-98)

Remove or wire in SyncContext to avoid dead code. (contexts/SyncContext.tsx:1-149)

Document explicit data retention/backups and disaster recovery expectations. (README.md:5-20)

8. Questions / Unknowns
Is this intended to be a production LIMS or a UI prototype/demo? The current architecture is not suitable for regulated production without a backend. (README.md:5-20)

What backend is intended (Supabase, custom API, or other)? There is unused Supabase sync code. (contexts/SyncContext.tsx:1-149, lib/supabase.ts:1-14)

What compliance target(s) are required (ISO 15189, 17025, 21 CFR Part 11, HIPAA)? UI claims compliance but no supporting controls are implemented. (App.tsx:83-98, components/Compliance.tsx:50-59)

Is AI usage acceptable for PHI? If yes, what consent and redaction policies are required? (services/geminiService.ts:32-85)

Do you require multi-tenant or multi-lab isolation? No tenant boundaries are modeled. (types.ts:32-98)

