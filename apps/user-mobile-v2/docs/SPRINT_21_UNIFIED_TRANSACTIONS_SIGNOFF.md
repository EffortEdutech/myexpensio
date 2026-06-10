# Sprint 21 — Unified Transactions Tab — Sign-Off

**Date:** 2026-06-10
**Status:** ✅ COMPLETE

---

## What Was Built

Merged TNG transactions and all claim items into a single chronological "Txns" tab in the Work space.

### New screen: `UnifiedTransactionsScreen`
- Path: `src/features/transactions/components/UnifiedTransactionsScreen.tsx`
- Pulls from two sources: `useTngTransactions({ claimed: "all", sector: "ALL" })` + `useAllClaimItems()`
- Merges into a `UnifiedEntry[]` array (`kind: "tng" | "claim"`)
- Groups by month into `SectionList` sections, sorted newest-first
- **Search**: full-text filter on description
- **Date range pills**: This Month / 3 Months / All Time
- **Import TNG button**: calls `onOpenTngImport()` → switches `activeWorkTab` to `"tng"`
- TNG amounts in red `#dc2626`; claim amounts in blue `#0369a1`
- TNG badge: yellow `#fef3c7`; Claim badge: blue `#dbeafe`
- "✓ linked" label: green, for TNG when `claimed=true`, for claim when `tngTransactionId` exists
- Empty state shows Import TNG button when no search query active

### New repository function: `listAllClaimItems()`
- Path: `src/local-db/repositories/claimRepository.ts`
- Queries all `claim_items` across all claims (`deleted_at IS NULL`, ordered by `item_date DESC, created_at DESC`)

### New query hook: `useAllClaimItems()`
- Path: `src/features/claims/hooks/useClaimDrafts.ts`
- Query key: `["claims", "all-items"]`

### Footer tab: TNG → Txns
- Path: `src/features/shell/components/AppShell.tsx`
- `WorkTab` type updated to include `"transactions"`
- Footer tab key `"tng"` replaced with `"transactions"` (label "Txns")
- Footer tab highlights for both `"transactions"` and `"tng"` states (active check: `activeWorkTab === "transactions" || activeWorkTab === "tng"`)

### App.tsx wiring
- Render case for `activeWorkTab === "transactions"` → `<UnifiedTransactionsScreen onOpenTngImport={() => onWorkTabChange("tng")} />`
- TNG render case now passes `onBack={() => onWorkTabChange("transactions")}` to `<TngScreen>`

### TngScreen back button
- Path: `src/features/tng/components/TngScreen.tsx`
- Added `onBack?: () => void` prop
- Header renders `← Txns` back button when `onBack` is provided
- Styles: `backBtn`, `backBtnText` added

---

## Files Changed

| File | Change |
|---|---|
| `src/local-db/repositories/claimRepository.ts` | Add `listAllClaimItems()` |
| `src/features/claims/hooks/useClaimDrafts.ts` | Add `claimQueryKeys.allItems` + `useAllClaimItems()` |
| `src/features/transactions/components/UnifiedTransactionsScreen.tsx` | **NEW** |
| `src/features/shell/components/AppShell.tsx` | `WorkTab` type + footer tab update |
| `App.tsx` | Add `UnifiedTransactionsScreen` render case + `onBack` to TngScreen |
| `src/features/tng/components/TngScreen.tsx` | `onBack` prop + back button UI + styles |
| `docs/PWA_VS_MOBILEV2_PARITY_TRACKER.md` | Mark Unified Transactions tab ✅ |

---

## Parity Status

Unified transactions tab: **PWA ✅ → Mobile V2 ✅**

---

## Next: Sprint 22 — TNG PDF Parsing

- Audit `scan_service` for existing PDF parsing capability
- Build `parseTngPdf()` parser
- Add `POST /api/tng/parse-pdf` backend route
- Add "Import PDF" button to TngScreen alongside CSV import
- Map parsed output to `TngTransaction` type
