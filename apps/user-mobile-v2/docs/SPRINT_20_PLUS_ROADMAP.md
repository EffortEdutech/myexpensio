# Sprint 20+ Roadmap & Checklist

**Created:** 2026-06-09
**Updated:** 2026-06-10
**Status:** In Progress

## Execution order (locked 2026-06-10)
21 → 22 → 20-B
Rationale: clear all code/feature work before EAS build so the store submission
reflects the complete app. 20-B is last because it requires human DevOps steps.

---

## Pre-sprint audit findings

Before planning, a code audit corrected several items previously marked
as "deferred" in the parity tracker:

| Item | Tracker said | Actual state |
|---|---|---|
| Dashboard stats (Personal) | 🚫 Placeholder | ✅ Done — `PersonalHomeScreen` queries `useLedgerEntriesForYear`, computes totals |
| Dashboard stats (Business) | 🚫 Placeholder | ✅ Done — `BusinessDashboard` has monthly + yearly bar chart with real data |
| Profile backend save | 🚫 Local-only | ✅ Done — `useProfileSave` calls `/api/profile` POST; backend endpoint exists |
| GPS real-point tracking | 🚫 Deferred | ✅ Done — `Location.watchPositionAsync` running in `TripsScreen` with glitch filter |

**Remaining real work: 3 items.**

---

## Sprint 20 — Org Invite Deep-Link + EAS Production Build

**Theme:** Complete the last HIGH-priority gap and ship to the Play Store.

### 20-A — Accept Org Invite (code) ✅ COMPLETE (2026-06-10)

- [x] **20-A-1** Extend `parseDeepLinkUrl` — handles `myexpensio://invite?invite_id=`
- [x] **20-A-2** `DeepLinkInvite` type + state in `MobileV2Home`
- [x] **20-A-3** `AcceptInviteScreen.tsx` — full native UI, all error states
- [x] **20-A-4** Wired into `MobileV2Home`
- [x] **20-A-5** Pushed to main (commit `1c7bd49`)

Also done (ad-hoc, 2026-06-10):
- [x] Subscription gating bugs fixed: `business_space` → PREMIUM, `receipt_scan` enforced in ClaimDetail / ReceiptPickerField / TripsScreen, FeatureGate user-facing copy
- [x] Agent 1 org subscription row inserted in Supabase (was missing — `tier=FREE, status=TRIALING`)

### 20-B — EAS Production Build & Play Store Submission (DevOps)

All config is in place (`eas.json`, `app.json` v1.0.0, icon/splash assets).
These steps are **human actions** — cannot be automated.

**One-time setup (do once):**
- [ ] **20-B-1** Create a Google Play Console account at
  [play.google.com/console](https://play.google.com/console)
  (requires a one-time USD 25 developer registration fee)
- [ ] **20-B-2** Create a new app: package `com.effortedutech.myexpensio`,
  default language, app name "MyExpensio"
- [ ] **20-B-3** Create a Google Play service account with
  "Release Manager" permissions → download `google-service-account.json` →
  place at `apps/user-mobile-v2/google-service-account.json`
  (add to `.gitignore` — never commit this file)
- [ ] **20-B-4** Log in to EAS: `npx eas-cli login` with your Expo account

**Build:**
- [ ] **20-B-5** From `apps/user-mobile-v2/`:
  ```
  npx eas build --profile production --platform android
  ```
  Monitor build at [expo.dev](https://expo.dev) → EAS Build dashboard
- [ ] **20-B-6** Download the `.aab` from EAS dashboard and verify it opens
  in Android Studio or Google Play internal testing

**Submit:**
- [ ] **20-B-7** From `apps/user-mobile-v2/`:
  ```
  npx eas submit --profile production --platform android
  ```
  This uploads the AAB to the Play Store internal track automatically

**Play Store listing (required before any public release):**
- [ ] **20-B-8** Add at least 2 screenshots (phone), 1 feature graphic (1024×500)
- [ ] **20-B-9** Write short description (80 chars) + full description
- [ ] **20-B-10** Complete content rating questionnaire
- [ ] **20-B-11** Fill privacy policy URL (use `https://myexpensio.com/privacy`)
- [ ] **20-B-12** Set up internal test track → invite testers via email
- [ ] **20-B-13** Promote from internal → closed testing → open testing → production

---

## Sprint 21 — Unified Transactions Tab

**Theme:** Merge TNG transactions and claim items into one searchable view.

**Why:** Power users track both card swipes (TNG) and manual claims —
a unified view saves them switching tabs to reconcile.

### Checklist

- [ ] **21-1** Add `"transactions"` to `WorkTab` union type in `AppShell.tsx`
- [ ] **21-2** Add "Transactions" footer tab to Work space tab bar
- [ ] **21-3** Create `UnifiedTransactionsScreen.tsx`
  (`src/features/transactions/components/UnifiedTransactionsScreen.tsx`):
  - Merges `useTngTransactions()` + `useClaimItems()` into a single sorted list
  - Each row: date, description, amount, source badge (TNG / Claim)
  - Search bar (filter by description)
  - Date range filter (this month / last 3 months / all)
  - Group by date (sectioned list)
- [ ] **21-4** Wire into `App.tsx` work tab render switch
- [ ] **21-5** Update parity tracker
- [ ] **21-6** Git push

---

## Sprint 22 — TNG Backend PDF Parsing

**Theme:** Allow users to upload TNG e-statement PDFs (not just CSV).

**Why:** TNG's primary export format is PDF; CSV requires extra steps in the TNG app.

**Complexity:** BACKEND heavy — the PDF → transaction parser lives in the
scan service (`scan_service/`), not in the mobile app.

### Checklist

- [ ] **22-1** Audit `scan_service/` — check if a TNG PDF parser already exists or
  if only image/receipt scanning is implemented
- [ ] **22-2** Research TNG e-statement PDF structure (column layout, date formats)
- [ ] **22-3** Build `parseTngPdf(pdfBuffer)` in scan service using `pdf-parse` or
  `pdfjs-dist` — extract: date, description, debit/credit, balance columns
- [ ] **22-4** Add `POST /api/tng/parse-pdf` endpoint to `apps/user/app/api/tng/`
  that accepts a PDF file upload and returns parsed transactions JSON
- [ ] **22-5** In mobile `TngScreen.tsx` — add "Import PDF" button alongside
  existing "Import CSV"; calls the new endpoint
- [ ] **22-6** Map parsed transactions to `TngTransaction` type and upsert into
  local SQLite via `tngRepository`
- [ ] **22-7** QA: test with real TNG e-statements (multiple months)
- [ ] **22-8** Git push

---

## Summary

| Sprint | Theme | Effort | Blocker |
|---|---|---|---|
| **20-A** | Org invite deep-link | ~2h code | None — backend done |
| **20-B** | EAS + Play Store | ~3h DevOps | Google Play Console account + service account JSON |
| **21** | Unified transactions tab | ~4h code | None |
| **22** | TNG PDF parsing | ~6h backend + mobile | Scan service audit first |

**Total estimated to full parity: ~15 hours of focused work.**

---

## Items confirmed DONE (no sprint needed)

| Item | Evidence |
|---|---|
| Dashboard stats — Work space | `WorkHomeScreen` has trip/claim stats ✅ |
| Dashboard stats — Personal space | `PersonalHomeScreen` queries `useLedgerEntriesForYear` ✅ |
| Dashboard stats — Business space | `BusinessDashboard` has monthly/yearly bar chart ✅ |
| Profile backend save | `useProfileSave` → `POST /api/profile` → Supabase profiles table ✅ |
| GPS real-point tracking | `Location.watchPositionAsync` + 300m glitch filter in `TripsScreen` ✅ |
