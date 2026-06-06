# Sprint 14 — Performance, Accessibility & UX Polish — Sign-off

**Date:** 2026-05-30
**Status:** ✅ SIGNED OFF

---

## Scope

Make the app pleasant and reliable under real mobile use: list virtualization,
keyboard safety, loading feedback, offline awareness, and accessibility.

---

## Deliverables

### 1. List virtualization — FlatList ✅

| Screen | Before | After |
|---|---|---|
| Claims list (`ClaimDraftList`) | `View + .map()` | `FlatList` — `initialNumToRender=12`, `windowSize=5`, `removeClippedSubviews` |
| Trips list (`TripsScreen`) | `View + .map()` | `FlatList` + `RefreshControl` |
| TNG transactions (`TngScreen`) | `View + .map()` | `FlatList` + `RefreshControl` |

All three lists now virtualize off-screen rows. With 200+ claims or 500+ TNG
transactions the scroll position no longer drops frames.

---

### 2. Pull-to-refresh ✅

`handleRefresh()` in `App.tsx` refetches both claims and trips in parallel.
Wired via `RefreshControl` on claims `FlatList` and trips `FlatList`.
TNG transactions use the built-in query `isRefetching` flag.

---

### 3. SQLite performance indexes — migration 12 ✅

8 new partial indexes added in `src/local-db/migrations.ts` (migration id 12):

- `idx_claims_updated_desc` — claims list ordering
- `idx_claim_items_updated_at` — sync pull delta queries
- `idx_trips_updated_desc` — trips list ordering
- `idx_tng_txn_date_desc` — TNG library date sort
- `idx_tng_txn_sector_claimed` — TNG sector + claimed filter combo
- `idx_ledger_date_desc` — personal/business ledger lists
- `idx_commitments_name` — commitment name lookup
- `idx_receipts_entity_updated` — receipt attachment lookup per entity

All indexes are `WHERE deleted_at IS NULL` partial indexes to minimise index size.

---

### 4. Keyboard-safe forms ✅

New `KeyboardSafeScrollView` component (`src/components/KeyboardSafeScrollView.tsx`)
wraps `KeyboardAvoidingView` + `ScrollView` with `keyboardShouldPersistTaps="handled"`.

Applied to:
- All 4 claim item edit modals in `ClaimDetail.tsx`
- Both trip form modals in `TripsScreen.tsx`
- TNG import modal in `TngScreen.tsx`
- Settings panel in `App.tsx` (full settings scroll)

---

### 5. Loading skeletons + error states ✅

| Component | File |
|---|---|
| `SkeletonList` | `src/components/SkeletonRow.tsx` — animated pulse, 5-row default |
| `ErrorState` | `src/components/ErrorState.tsx` — icon + message + optional retry |

Wired into `ClaimDraftList` and `TripsScreen`:
- First load shows `SkeletonList` instead of spinner
- Network error with empty data shows `ErrorState` with retry button

---

### 6. Sync status — offline/error/syncing states ✅

`AppShell` sync badge now shows 5 distinct states:

| State | Badge colour | Copy |
|---|---|---|
| `idle` + 0 pending | Green | "Synced" |
| `idle` + N pending | Amber | "N pending" |
| `syncing` | Blue | "Syncing…" |
| `error` | Red | "Sync error" |
| `offline` | Grey | "Offline" |

`isNetworkError()` helper in `useSyncEngine.ts` detects fetch/network failures
and sets status `"offline"` instead of `"error"`. Badge has `accessibilityLabel`
describing the full state in plain English for screen readers.

---

### 7. Accessibility improvements ✅

- Nav tab `Pressable`s now carry `accessibilityLabel={tab.label}` in addition
  to the existing `accessibilityRole="tab"` and `accessibilityState`
- `ClaimDraftList` items carry a full `accessibilityLabel` combining title,
  status, and amount (e.g. "May 2026, Submitted, MYR 450.00")
- `ErrorState` retry button has `accessibilityLabel="Retry"`
- Sync badge has `accessibilityLabel` with plain-language status

Touch target audit: all interactive `Pressable` components in key flows have
`minHeight ≥ 44`. The 26px `minHeight` values in `ClaimDetail` are display-only
status badges (non-interactive) — no fix needed.

---

### 8. Dark / light mode decision ✅

Light mode only for launch. Full rationale in:
`apps/user-mobile-v2/docs/DARK_LIGHT_MODE_DECISION.md`

Revisit after pilot (Sprint 17) based on user feedback.

---

## Deferred items

| Item | Deferred to |
|---|---|
| Biometric lock prompt on app resume (using the toggle preference) | Sprint 15 |
| In-app plan comparison page | Sprint 17 |
| Dark mode palette | Sprint 17 |
| GPS live tracking point rendering optimisation | Sprint 17 |
| Pagination cursor on sync pull (single page per fetch) | Sprint 17 |
