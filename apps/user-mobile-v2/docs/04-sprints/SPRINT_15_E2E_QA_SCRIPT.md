# Sprint 15 — End-to-End QA & Feature Parity Sign-Off

**Date:** 2026-06-01
**Status:** 🔄 IN PROGRESS
**Target device:** Android Emulator (Android Studio)

---

## Overview

This sprint has two parts:

1. **Implement** the one remaining deferred item from Sprint 14 — biometric lock prompt on app resume.
2. **Run** the full end-to-end QA pass across every feature on the Android emulator.

Pass = all P0 scenarios green + typecheck clean.

---

## Part 0 — Pre-flight setup

```bash
# From monorepo root
corepack pnpm typecheck --filter user-mobile-v2

# Start the dev server
corepack pnpm dev:user-mobile-v2
```

In the Metro terminal press **`a`** to open on the Android emulator.

Confirm:
- [ ] App boots without crash
- [ ] "Preparing local workspace..." spinner appears then clears
- [ ] Login screen shows (if first run) or session restores silently

---

## Part 1 — Biometric Lock on App Resume (implement first)

**Deferred from Sprint 14.** The `nativeBiometricAuthAdapter` and biometric toggle in settings exist; the lock-on-resume trigger does not.

### What to build

In `App.tsx`, hook into `AppState` (React Native's background/active events). When the app returns from background and the user has biometric lock enabled in settings, show a lock screen and call `nativeBiometricAuthAdapter.authenticate()` before revealing the app content.

**Steps:**

1. Add a `biometricLockEnabled` boolean to `useUserSettingsStore` (default `false`), persisted in AsyncStorage.
2. Add the biometric toggle to the Settings modal in `App.tsx` (toggle exists visually — wire it to the store).
3. In `AuthenticatedHome` (or a wrapper), subscribe to `AppState` change events. On `active` (returning from background), if `biometricLockEnabled` is true, show a full-screen lock overlay and call `authenticate()`. Dismiss overlay on success; keep it up on failure.
4. The lock overlay must **not** show on first boot — only on resume from background.

**QA scenarios for biometric lock:**

| # | Action | Expected |
|---|--------|----------|
| B1 | Enable biometric toggle in Settings | Toggle saves, persists after restart |
| B2 | Background the app (home button), return | Lock overlay appears |
| B3 | Authenticate successfully | Overlay dismisses, app content visible |
| B4 | Disable biometric toggle | Backgrounding the app no longer triggers lock |
| B5 | Emulator has no biometrics enrolled | Toggle greys out or shows "not available on this device" |

> **Note for emulator:** Android emulator supports fingerprint via Extended Controls → Fingerprint → Touch the sensor. Enroll a fingerprint first: Settings → Security → Fingerprint.

---

## Part 2 — Auth

### A1: Sign In (real Supabase)

1. Open the app fresh (no stored session).
2. Enter a valid email + password.
3. Confirm spinner shows "Restoring secure session..." briefly.
4. Confirm authenticated shell appears with correct display name and email in profile menu.
5. Confirm sync badge shows "Synced" or "N pending".

Pass: session established, bootstrap runs, no crash.

### A2: Session Restore

1. Sign in successfully.
2. Close the app fully (swipe away from recents).
3. Re-open the app.

Pass: app skips login screen and goes directly to the authenticated shell (no credentials re-entry).

### A3: Sign Out

1. Tap ⚙️ → Sign Out.
2. Confirm loading state ("Signing Out...").
3. Confirm login screen appears.
4. Confirm local database is wiped (re-sign-in shows clean state from server pull, not old local data).

Pass: session cleared, local DB wiped, login screen shown.

---

## Part 3 — Work Space / Claims

### C1: Create blank claim

1. Go to Work → Claims tab.
2. Tap "Create blank claim".
3. Confirm new claim appears in list with draft status.
4. Confirm sync badge shows "1 pending" (or more).

### C2: Edit claim header

1. Open a draft claim.
2. Change the title.
3. Change period start and end.
4. Tap Save.
5. Return to list and re-open.

Pass: title and period persisted.

### C3: Add and edit claim items

1. Open a draft claim.
2. Add a "Parking" item — set amount 15.00.
3. Add a "Toll" item — set amount 7.50.
4. Edit parking item title to "KLCC Parking".
5. Change toll item type to "Fuel".
6. Delete the fuel item.

Pass: item list updates immediately, claim total reflects adds/deletes, deleted item absent.

### C4: Receipt attachment

1. Open a draft claim with at least one item.
2. Tap "Attach receipt" on an item.
3. Pick a photo from gallery (or use camera).

Pass: item shows receipt indicator, receipt upload summary shows "Local: 1".

### C5: Submit lock

1. Open a draft claim.
2. Tap "Submit claim" → confirm.
3. Confirm status changes to "submitted".
4. Confirm edit controls are disabled.
5. Try to add an item — must be blocked.

Pass: claim is locked, submit queued in sync.

### C6: FlatList scroll (Sprint 14 regression)

1. If fewer than 12 claims exist, create enough to fill the screen.
2. Scroll the claims list rapidly.

Pass: no frame drops, list scrolls smoothly. Pull-to-refresh works.

---

## Part 4 — Trips & Mileage

### T1: Create GPS trip

1. Go to Work → Trips.
2. Tap "New trip".
3. Fill in purpose, start location.
4. Tap "Start GPS tracking".
5. Wait 10 seconds (emulator GPS may be static).
6. Tap "Stop trip".
7. Confirm trip shows distance (may be 0.0 km on emulator — acceptable if trip saves).

Pass: trip record saved locally, appears in list.

### T2: Create manual odometer trip

1. Tap "New trip".
2. Select "Odometer" mode.
3. Enter start and end odometer readings.
4. Save.

Pass: trip created, mileage calculated, mileage rate applied to amount.

### T3: Edit and delete trip

1. Open a saved trip.
2. Edit the purpose.
3. Save.
4. Delete a different trip.

Pass: edited trip reflects change, deleted trip removed from list.

### T4: Trip pull-to-refresh

1. Pull down on trips list.
2. Confirm refresh indicator appears and disappears.

---

## Part 5 — TNG Import

### N1: Import TNG PDF

1. Go to Work → TNG.
2. Tap "Import TNG statement".
3. Select a TNG e-statement PDF.
4. Confirm transactions parsed and listed.
5. Confirm sector/category shown per transaction.

### N2: Link TNG transaction to claim item

1. Open a draft claim with at least one item.
2. Open "Link TNG" on an item.
3. Select a TNG transaction.
4. Confirm item shows TNG linked indicator and transaction no.

### N3: Unlink TNG transaction

1. Open a linked claim item.
2. Tap "Unlink TNG".
3. Confirm item no longer shows TNG link.

### N4: TNG FlatList scroll

1. Import a statement with 10+ transactions.
2. Scroll the TNG list rapidly.

Pass: smooth scroll, pull-to-refresh works.

---

## Part 6 — Receipt Upload

### R1: Upload flow

1. Add a claim item.
2. Attach a receipt photo.
3. Leave the app open for 30 seconds.
4. Check receipt upload summary.

Pass: receipt transitions from "Local" to "Uploaded" if network is available (or stays "Local" if sync not yet run — acceptable, but no error).

### R2: Upload summary accuracy

1. Note current "Local" and "Uploaded" counts.
2. Attach 2 more receipts.
3. Confirm "Local" count increases by 2.

---

## Part 7 — Exports

### X1: CSV export

1. Go to Work → Export.
2. Select date range covering claims with items.
3. Tap "Export CSV".

Pass: on Android, confirm the export action runs without crash. Note that CSV download is web-only (by design — confirm the appropriate message or fallback is shown on native).

### X2: Export screen renders

1. Navigate to Export tab.
2. Confirm claim list preview renders with item rows and totals.
3. Confirm claim selection works (check/uncheck individual claims).

---

## Part 8 — Personal Space

### P1: Personal Home

1. Switch to Personal space via the space switcher.
2. Confirm Home tab shows ledger summary (income vs expenses).

### P2: Personal Expenses

1. Go to Personal → Expenses.
2. Add an expense entry (category, amount, date).
3. Confirm it appears in the list and affects the summary.

### P3: Personal Bills

1. Go to Personal → Bills.
2. Add a bill commitment (name, amount, due date).
3. Confirm it appears in the bills list.

### P4: Personal Tax

1. Go to Personal → Tax.
2. Confirm tax summary screen renders year-to-date figures without crash.

---

## Part 9 — Business Space

### BS1: Business Dashboard

1. Switch to Business space.
2. Confirm dashboard shows income/expense summary.

### BS2: Business Income

1. Go to Business → Income.
2. Add an income entry.
3. Confirm it appears and updates the dashboard total.

### BS3: Business Expenses

1. Go to Business → Expenses.
2. Add a business expense.
3. Confirm it appears.

### BS4: Business Reports

1. Go to Business → Reports.
2. Confirm the reports screen renders without crash.
3. Confirm P&L figures are present (or "no data" if empty).

---

## Part 10 — Settings & Subscription

### S1: Settings — Profile

1. Open ⚙️ → Settings.
2. Fill in display name, company, department.
3. Save.
4. Close and reopen Settings.

Pass: profile fields retained.

### S2: Settings — Claim rates

1. Open Settings → Rates.
2. Change mileage car rate.
3. Save.
4. Create a new odometer trip — confirm new rate is applied.

### S3: Feature gate (subscription)

1. Confirm FREE tier user sees "Trial" badge.
2. Navigate to a Premium-gated feature.
3. Confirm `FeatureGate` component blocks access with upgrade prompt.

---

## Part 11 — Sync

### SY1: Sync badge states

| State | How to trigger | Expected badge |
|-------|---------------|----------------|
| Synced | All items pushed | Green "Synced" |
| Pending | Create a claim (offline) | Amber "N pending" |
| Syncing | Watch during active push | Blue "Syncing…" |
| Offline | Disable emulator network | Grey "Offline" |
| Error | Point to bad API URL in `.env` | Red "Sync error" |

### SY2: Push sync

1. Create a claim and items while online.
2. Watch sync badge cycle from "pending" → "Syncing…" → "Synced".
3. Check Supabase dashboard (or admin panel) to confirm the claim record exists server-side.

### SY3: Offline resilience

1. Disable emulator Wi-Fi (Settings → Wi-Fi off, or use airplane mode).
2. Create a new claim and items.
3. Confirm sync badge shows "Offline".
4. Re-enable Wi-Fi.
5. Confirm badge transitions to "Syncing…" then "Synced" automatically.

---

## Part 12 — UX & Accessibility (Sprint 14 regression check)

- [ ] Keyboard does not cover form inputs on any edit modal (KeyboardSafeScrollView)
- [ ] Loading skeletons appear on first load of Claims and Trips lists
- [ ] Error states show retry button if network fails on initial load
- [ ] All nav tab Pressables have accessibilityLabel (verify in Accessibility Inspector)
- [ ] Claim list items read out title, status, amount when TalkBack is enabled

---

## Part 13 — Boundary check

```bash
git status --short -- apps/user-mobile-v2 apps/user
```

Pass: all Sprint 15 changes are under `apps/user-mobile-v2`. No `apps/user` files modified.

---

## Sign-Off Criteria

Sprint 15 is complete when:

- [ ] **B1–B5** biometric lock scenarios pass on Android emulator
- [ ] **A1–A3** auth scenarios pass
- [ ] **C1–C6** claims scenarios pass
- [ ] **T1–T4** trips scenarios pass
- [ ] **N1–N4** TNG scenarios pass
- [ ] **R1–R2** receipt upload scenarios pass
- [ ] **X1–X2** export scenarios pass (with noted web-only caveat)
- [ ] **P1–P4** personal space scenarios pass
- [ ] **BS1–BS4** business space scenarios pass
- [ ] **S1–S3** settings/subscription scenarios pass
- [ ] **SY1–SY3** sync scenarios pass
- [ ] **Part 12** UX regressions clear
- [ ] **Part 13** boundary check passes
- [ ] `corepack pnpm typecheck --filter user-mobile-v2` exits clean
- [ ] No console errors or red-screen crashes observed during the run

---

## Known limitations going into Sprint 15

| Item | Status |
|------|--------|
| CSV download on native Android | Web-only by design — show appropriate message |
| GPS distance on emulator | May read 0.0 km — acceptable for emulator |
| Dark mode | Not implemented — deferred to Sprint 17 |
| In-app plan comparison page | Deferred to Sprint 17 |
| Pagination cursor on sync pull | Deferred to Sprint 17 |
