# GhanaBuild 2.0

## Phase 12B: production evidence storage

Field photos use the private `project-evidence` Supabase Storage bucket. The API generates a deterministic server-owned object key (`project_id/inspection_id/evidence_uuid.ext`) and a 10-minute upload URL only after authentication, role, inspection, project, and jurisdiction checks. The client then confirms the object; the server downloads it to validate JPEG/PNG/WebP signatures and its exact size before creating one idempotent `project_evidence` record. Private reads use a newly authorized five-minute signed URL. Images are limited to 8 MB each and eight per inspection. Offline blobs remain in IndexedDB until both binary upload and metadata confirmation succeed.

Apply `20260909000008_phase12b_evidence_storage.sql` after Phase 12 and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. The bucket must remain private; browser clients must never receive the service role key or a permanent object URL.

## Phase 10: Contractor Accountability

GhanaBuild exposes a public contractor directory at `/contractors` and stable public profiles at `/contractors/:slug`. Profiles use verified project records and show a neutral **GhanaBuild Performance Indicator**, not an official government or procurement rating.

### Architecture

Contractors remain related through `projects.contractor_id`. Phase 10 aggregates the existing in-memory project, report, verification, evidence, update, and audit records; it does not create a second contractor registry. The production schema extension is in `supabase/migrations/20260908000005_phase10_contractor_accountability.sql`.

### Metrics

The indicator uses four transparent pillars: delivery (40%), progress (25%), community response (20% when reports exist), and reliability (15%). Delivery combines completion and on-time completion when both dates are available. Delayed means an unfinished, non-cancelled project past its recorded expected completion date. Community reports are observations, not verified findings.

Missing dates, budgets, progress, and reports are excluded from applicable calculations. Profiles display the number of projects evaluated and a confidence label: one project is preliminary, two to three are moderate coverage, and four or more are high coverage. Formal completion extensions are not represented in the current model.

### Authorization and jurisdiction

Public endpoints return only non-archived contractor metadata and verified project portfolios. Contact, tax, and address fields are excluded from public responses. `/api/contractors/analytics` derives scope from the authenticated profile: MMDCE officers receive district scope, regional officers receive regional scope, and national monitors and super administrators receive authorized national scope. Contractor mutations continue to use the existing role and audit-log workflows.

### Validation

Run `npm run lint` for TypeScript validation and `npm run build` for the production build. The focused Phase 10 suite is available to authorized admin users at `GET /api/admin/phase10-tests`.

### Limitations

The current server store is an in-memory development implementation. Supabase RLS remains the database enforcement layer for deployed data, and the migration's public contractor read policy must be applied alongside the existing project visibility policies. No contractor fault is inferred from a community report or an abandoned project status.

## Phase 11: Fiscal Transparency

Phase 11 adds a project-linked fiscal lifecycle without replacing `projects.budget`:

`project_funding` allocation -> `project_commitments` contractual commitment -> `project_tranches` approved tranche -> `project_disbursements` payment -> `project_expenditures` reported or verified expenditure.

The migration is `supabase/migrations/20260909000006_phase11_fiscal_transparency.sql`. It adds positive-amount and ISO-currency checks, foreign keys, unique references, tranche/commitment relationship checks, indexes, a `project_fiscal_summary` view, public visibility policies, jurisdiction-aware officer policies, and deny-delete policies for financial history. Posted corrections use rejection, cancellation, or reversal states and are audit logged.

Public project dossiers expose approved fiscal records at the **Financial Transparency** tab. `/analytics/finance` provides server-side public aggregates and `/finance/methodology` explains allocation, commitment, tranche, disbursement, expenditure, balance, variance, and attention terminology. `/admin` includes a jurisdiction-scoped Fiscal Transparency section. Admin APIs are under `/api/admin/finance-summary`, `/api/admin/funding`, `/api/admin/commitments`, `/api/admin/tranches`, `/api/admin/disbursements`, and `/api/admin/expenditures`.

Financial and physical progress variance is a neutral review indicator, not an accusation. Reported expenditure is never presented as verified expenditure until an authorized reviewer marks it verified. Currency totals are not silently converted. Public responses exclude actor metadata, internal notes, and private document fields.

The focused suite is available at `GET /api/admin/phase11-tests` and covers calculations, verification distinction, tranche ceilings, jurisdiction/IDOR rejection, reversal, and audit logging. The current development runtime remains in-memory when Supabase is not configured; deploy the Phase 11 migration and use database transactions/locking for concurrent production writes.

## Phase 12: Offline Field Inspections and PWA

Phase 12 adds an offline-first field workflow at `/field-inspections` for active `COMMUNITY_OBSERVER`, district, regional, national, and super-admin roles. Authorized project data is cached minimally, inspection drafts and compressed photo blobs are stored in IndexedDB, and a durable queue retries synchronization with exponential backoff. `Sync Now`, connectivity recovery, and Background Sync are supported; Background Sync is an enhancement rather than a requirement.

The PWA manifest is `public/manifest.webmanifest` and the versioned service worker is `public/sw.js`. The browser storage module is `src/lib/offline/inspection_store.ts`. Unsynchronized and failed records are retained locally; do not clear browser storage while work is waiting to sync.

The database migration is `supabase/migrations/20260909000007_phase12_field_inspections.sql`. It adds `field_inspections`, inspection enums, indexes, evidence linkage fields, RLS, immutable inspection history, and future-device-timestamp validation. Offline capture is never verification: synchronized inspections remain `PENDING` until an authorized reviewer verifies them in `/admin/inspections`. Public project pages show verified inspection summaries only.

Server routes include `POST /api/inspections`, `GET /api/inspections/:id`, `POST /api/inspections/:id/review`, `GET /api/projects/:id/inspections`, `GET /api/admin/inspections`, and `POST /api/admin/inspections/:id/review`. Client IDs provide idempotent replay protection. Jurisdiction is derived from the authenticated profile, GPS is validated as WGS-84, project-distance warnings are recorded, and sync/review events are audited.

The focused Phase 12 suite is available at `GET /api/admin/phase12-tests` and covers idempotent sync, GPS metadata/distance, jurisdiction/IDOR rejection, review-controlled public visibility, and audit logging. The existing repository's evidence storage accepts URL metadata rather than a real Supabase Storage upload pipeline; local photo blobs are safely retained and compressed, but production binary upload/signing should be connected before treating offline photo synchronization as fully deployed.
