# Sprint 6 - TNG Import, Transactions, Linking, and Appendix Support Plan

Date: 2026-05-24

## Goal

Build the local-first TNG foundation for the new user mobile v2 app:

- Import TNG statement rows into a reusable local transaction library.
- Let users review TNG transactions by statement, status, sector, and date.
- Link TNG transactions to claim items.
- Support TNG-pending claim items where the amount is filled after linking.
- Preserve enough statement metadata for future PDF export Appendix B.

This sprint should not pretend that backend PDF parsing and final PDF appendix generation are fully solved in mobile. Those belong to Sprint 11 and Sprint 12, but Sprint 6 must shape the local data, UX, and matching logic correctly now.

## Foundation Pass Status

Implemented on 2026-05-24:

- Added local TNG statement batch storage and transaction metadata needed for import, dedupe, future sync, and appendix grouping.
- Added TNG sync entity types so statement batches and transactions enter the existing local sync queue.
- Added a TNG transaction repository with list, summary, save-preview, and safe statement delete operations.
- Added local matcher groundwork for toll, parking, and retail transport rows.
- Added the Work > TNG screen with statement summary, filters, transaction library, PDF/sample preview modal, row selection, local save, and statement delete.
- Wired the existing TNG footer tab to the real screen instead of the deferred placeholder.

Verified:

- `corepack pnpm -C apps/user-mobile-v2 typecheck`
- `corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear`

Runtime browser click-through was attempted but blocked in this environment: the static server failed with Windows socket provider error `WinError 10106`, and the Node QA path did not have Playwright installed. Manual browser QA should be done from the local Expo app after commit.

## V1 Reference Studied

- `apps/user/app/(app)/tng/page.tsx`
- `apps/user/app/(app)/tng/transactions/page.tsx`
- `apps/user/app/(app)/claims/[id]/tng-link/page.tsx`
- `apps/user/app/api/tng/parse/route.ts`
- `apps/user/app/api/tng/transactions/route.ts`
- `apps/user/app/api/claims/[id]/tng-suggestions/route.ts`
- `apps/user/app/api/claims/[id]/tng-link/route.ts`
- `apps/user/app/api/export/tng-preview/route.ts`
- `apps/user/lib/tng-matcher.ts`
- `apps/user/lib/__tests__/tng-matcher.test.ts`
- `packages/types/src/transport-claims.ts`
- `packages/shared/export-columns.ts`

## V1 Gaps / Risks Found

1. Parser dependency is server-side.
   - V1 sends PDFs to `SCAN_API_URL /parse-tng`.
   - Mobile v2 cannot realistically parse statement PDFs locally in this sprint without a large native/parser dependency.
   - Sprint 6 should support local preview/manual/sample import and preserve the backend parser integration contract for Sprint 12.

2. RETAIL behavior is inconsistent.
   - The v1 matcher code includes `RETAIL` in eligible TNG rows, but the old matcher test says RETAIL should be excluded.
   - The v1 link page later uses unmatched RETAIL rows to add transport items.
   - Decision: v2 should support RETAIL as unmatched/imported rows, but only auto-match RETAIL to TNG-paid transport items when the transport type is clear.

3. TNG toggle in v2 is currently incomplete.
   - V2 claim item modal shows `Paid via TNG`, but the saved item does not yet become `mode: TNG`, amount pending, or linkable.
   - Sprint 6 must fix this before linking screens are useful.

4. V1 has multiple linking directions.
   - Direction A: transaction library row -> choose claim item.
   - Direction B: claim -> suggested TNG matches.
   - Sprint 6 should build both flows at local-first level, but start with Direction B because it matches the user claim workflow.

5. Appendix support needs metadata now.
   - V1 export groups by `source_file_url`, `upload_batch_id`, and `statement_label`.
   - V2 current `tng_transactions` table is too thin.
   - Sprint 6 must add local statement batch metadata so Sprint 7 export and Sprint 12 backend sync do not need a painful schema rewrite.

## Data Model Plan

Add/extend local-first tables:

### `tng_statement_batches`

- `id`
- `statement_label`
- `source_file_uri`
- `source_file_name`
- `source_file_size`
- `source_file_mime_type`
- `source_file_path`
- `import_status`
- `parsed_total`
- `saved_total`
- `skipped_duplicate_total`
- `imported_at`
- `sync_status`
- `created_at`
- `updated_at`
- `deleted_at`
- `device_id`

### Extend `tng_transactions`

Current v2 has basic fields. Add:

- `upload_batch_id`
- `source_file_uri`
- `source_file_path`
- `statement_label`
- `entry_datetime`
- `exit_datetime`
- `location`
- `raw_payload`
- `dedupe_key`
- `linked_claim_id`

Keep:

- `trans_no`
- `sector`
- `amount_cents`
- `currency`
- `transaction_date`
- `entry_location`
- `exit_location`
- `claimed`
- `claim_item_id`
- `link_status`
- `sync_status`

## Feature Slices

### Slice 6.1 - TNG claim item mode

- Make `Paid via TNG` toggle functional in claim item modal.
- For TNG-paid toll/parking/transport:
  - `mode = "TNG"`
  - amount may be `0` until linked.
  - receipt field should be hidden or optional because TNG statement is evidence.
  - row should show `TNG - Link pending`.
- For manual payment:
  - amount required.
  - receipt remains optional.

Acceptance:

- Create toll item with TNG ON.
- Claim row shows pending state.
- Total excludes zero pending amount but shows pending warning.

### Slice 6.2 - Local TNG transaction library

- Add Work footer `TNG` screen instead of placeholder.
- Show statement cards and transaction list.
- Filters:
  - All / Toll / Parking / Retail
  - All / Claimed / Unclaimed
  - Date range
- Empty state should guide import.

Acceptance:

- Seed/import sample rows locally.
- View rows grouped by statement.
- Claimed/unclaimed state visible.

### Slice 6.3 - Import preview foundation

Because backend PDF parsing belongs to Sprint 12, Sprint 6 should support:

- Select PDF file locally and store metadata.
- Show parser-not-connected state clearly.
- Add development/manual preview rows for runtime QA.
- Save selected preview rows into local `tng_transactions`.
- Deduplicate by `trans_no` where present, else by date + amount + sector + location.

Acceptance:

- Import a mock statement batch.
- Preview rows.
- Select/deselect rows.
- Save rows.
- Duplicate import reports skipped duplicates.

### Slice 6.4 - Local matcher port

- Port matcher to `apps/user-mobile-v2/src/features/tng/matcher.ts`.
- Normalize item types between v1 uppercase and v2 lowercase.
- Preserve transparent score breakdown.
- Fix RETAIL policy:
  - TOLL item matches only TOLL.
  - PARKING item matches only PARKING.
  - GRAB/TAXI/TRAIN/BUS TNG-paid items can match RETAIL.
  - RETAIL unmatched rows can be added to claim with type confirmation.

Acceptance:

- Unit-style local checks for:
  - date match
  - amount match
  - TNG-pending amount
  - one-to-one assignment
  - retail transport policy

### Slice 6.5 - Claim-to-TNG linking

- Add `Link TNG` action in claim detail when draft has TNG-linkable items.
- Suggested matches screen/modal:
  - suggested matches
  - already linked
  - unmatched claim items
  - unmatched TNG rows
- Confirm links:
  - update `claim_items.tng_transaction_id`
  - update `tng_transactions.claimed = 1`
  - update `tng_transactions.claim_item_id`
  - if claim item amount was 0 and mode is TNG, fill amount from transaction
  - recalculate claim total locally
  - enqueue sync items

Acceptance:

- TNG-pending toll item gets linked.
- Amount fills from TNG row.
- Claim total updates.
- Same transaction cannot link to two items.
- Submitted claim cannot link/unlink.

### Slice 6.6 - Transaction-to-claim linking

- From TNG library row, let user choose a draft claim item.
- Only compatible item types appear.
- Link using same local repository logic as Slice 6.5.

Acceptance:

- Unclaimed TNG row can link to existing item.
- Incompatible items are not offered.
- Already claimed row is locked.

### Slice 6.7 - Appendix metadata preview

- Add local preview summary:
  - statement label
  - linked transaction count
  - linked amount
  - source PDF available/missing
- This is not final PDF export yet.
- Sprint 7/Sprint 12 will use the metadata for actual export/backend storage.

Acceptance:

- Linked TNG items produce appendix preview groups by statement.
- Rows without source PDF are clearly marked.

## UX Principles

- TNG must feel like a library, not a one-time upload.
- Users should not have to understand matching algorithms.
- Suggested matches should explain why they were suggested.
- TNG-paid claim items with pending amount must be obvious.
- Submitted claims are locked.
- Importing a statement should not automatically claim anything; linking is deliberate.

## Runtime QA Plan

1. Create draft claim.
2. Add toll item with `Paid via TNG` ON.
3. Open TNG tab.
4. Import mock statement rows.
5. Return to claim.
6. Open Link TNG.
7. Confirm suggested match.
8. Verify claim item amount fills.
9. Verify TNG row becomes claimed.
10. Submit claim.
11. Verify link/unlink controls are locked.
12. Verify appendix preview lists statement and transaction.

## Sprint 6 Deliverable Boundary

In scope:

- Local-first TNG data model.
- TNG tab UI.
- Import preview using local/mock parser path.
- Transaction library.
- Matcher.
- Claim linking.
- Appendix metadata preview.
- Runtime QA and sign-off.

Out of scope:

- Production PDF parsing service.
- Supabase storage upload of TNG PDFs.
- Backend NestJS sync API.
- Final PDF export with highlighted statement appendix.
- Admin review of TNG appendix.

These out-of-scope items are intentionally deferred to Sprint 7, Sprint 11, and Sprint 12.

## Recommendation

Do Sprint 6 in two implementation passes:

1. Foundation pass:
   - Schema, repositories, types, matcher, TNG tab, sample/import preview.

2. Workflow pass:
   - Claim TNG pending mode, linking UI, transaction linking, appendix preview, runtime QA.

This keeps the difficult parts testable and avoids mixing parser/backend uncertainty with the core user workflow.
