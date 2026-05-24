# Sprint 7 - Exports, Reports, and Usage Limits Foundation

Date: 2026-05-24

## Goal

Build the local-first export foundation for user mobile v2 without pretending the final backend PDF/XLSX export service is complete.

## Implemented Foundation

- Added local `export_jobs` storage for generated preview history.
- Added Work > Export screen instead of the deferred placeholder.
- Added claim selection, format selection, export summary, row preview, export history, and usage preview.
- Added local usage counter support through existing `usage_counters_cache`.
- Added local export preview builder that reads claims, claim items, receipts, and linked TNG transaction metadata.
- Added Appendix B preview grouping for linked TNG rows by statement batch/label.
- Added sync queue entries for local export jobs.

## Current Boundary

In scope for this pass:

- Local preview and history.
- CSV/PDF/XLSX format intent.
- Usage counter enforcement for local previews.
- TNG appendix metadata readiness.

Out of scope for this pass:

- Real PDF rendering.
- Real XLSX generation.
- File downloads.
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

## Next Sprint 7 Pass

- Runtime QA Work > Export.
- Save preview for selected claims.
- Confirm history and usage counter increments.
- Add download/share placeholder behavior if needed.
- Polish any UI issues found in runtime.
