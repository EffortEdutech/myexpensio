# Sprint 7 - Exports, Reports, and Usage Limits

Date: 2026-05-24

## Goal

Build the local-first export foundation for user mobile v2 and make sure supported export actions create real files, not only preview rows.

## Implemented

- Added local `export_jobs` storage for generated preview history.
- Added Work > Export screen instead of the deferred placeholder.
- Added claim selection, format selection, export summary, row preview, export history, and usage preview.
- Added local usage counter support through existing `usage_counters_cache`.
- Added local export preview builder that reads claims, claim items, receipts, and linked TNG transaction metadata.
- Added Appendix B preview grouping for linked TNG rows by statement batch/label.
- Added sync queue entries for local export jobs.
- Added real local CSV generation for the web build using the same browser Blob/download pattern used by v1.
- Added CSV download from export history when a saved job has a preview payload.
- Renamed the primary CSV action to `Download CSV` so users are not misled by preview-only wording.
- Locked PDF/XLSX actions behind explicit backend-generation messaging until their real generators are wired.

## Current Boundary

In scope for this pass:

- Local preview and history for export records.
- Real CSV file generation and download in the web build.
- Usage counter enforcement for local CSV export creation.
- TNG appendix metadata readiness.
- Clear PDF/XLSX backend-required messaging.

Out of scope for this pass:

- Real PDF rendering.
- Real XLSX generation.
- Supabase storage.
- Backend export API.
- Admin review/export template management.

## Verification

Run:

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
```

Runtime smoke completed on 2026-05-24:

- Opened Work > Export from footer.
- Confirmed export tab rendered without console errors.
- Selected a submitted claim.
- Confirmed preview row count and total matched the selected claim.
- Saved a local CSV preview.
- Confirmed usage counter incremented and export history showed the new preview.

Runtime QA and polish pass completed on 2026-05-24:

- Confirmed empty export state in a fresh local session.
- Created a draft QA claim and claim item through the app UI.
- Selected and deselected claim rows through the Export screen.
- Saved CSV, PDF, and XLSX preview records.
- Confirmed usage counter reached `3/3`.
- Confirmed the fourth preview action is blocked when the limit is reached.
- Confirmed export history displays all three preview formats.
- Confirmed browser console had no errors.
- Added a visible limit-reached notice so users understand why preview generation is disabled.

File generation correction completed on 2026-05-24:

- Added CSV file builder with v1-style browser download behavior.
- `corepack pnpm -C apps/user-mobile-v2 typecheck` passed.
- `corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear` passed.
- Runtime verified Export screen loads after the patch.
- Runtime verified CSV history rows show a `Download` action.
- Runtime verified PDF selection shows backend-required messaging instead of pretending a file can be generated.
- Note: the Codex in-app browser cannot capture file downloads, so final CSV file-save confirmation must be done in Chrome/Edge.

## Remaining Sprint 7 Work

- Wire PDF generation to the backend export service or add an approved PDF generator.
- Wire XLSX generation to the backend export service or add an approved XLSX generator.
- Confirm CSV file creation manually in Chrome/Edge with a clean usage counter or an existing CSV history row.
