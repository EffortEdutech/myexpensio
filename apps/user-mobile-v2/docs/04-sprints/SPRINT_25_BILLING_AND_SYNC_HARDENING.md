# Sprint 25 — Billing Cleanup & Sync Hardening (Code-Only Slice of Ship Readiness)

**Created:** 2026-07-02
**Status:** ✅ Code items done — Stripe Dashboard steps remain with Eff. Play Console/Apple Developer signup **deferred to a later stage** (paid, Eff's call, confirmed 2026-07-02).
**Source:** `docs/SHIP_READINESS_ACTION_PLAN.md` — this sprint executes every item from that plan that doesn't require an external dashboard/account action.

---

## Addendum (same day, 2026-07-02)

After the initial sprint, two more code-only plan items were finished:
- **§1.1.4** — `docs/04-billing-payments/01_STRIPE_SETUP_GUIDE.md` rewritten to match the actual code (`STRIPE_PRICE_PRO`/`STRIPE_PRICE_PREMIUM`, Premium price step added, unused yearly-billing steps dropped).
- **§1.2.3** — Removed the dead `/api/billing/catalog` test block from `scripts/uat-api-tests.js` (no `premium/checkout` test existed).

Also: Eff confirmed Play Store/App Store account signups are paid and deferred to a later stage — §4 Track A/C in the ship-readiness plan is now marked ⏸ deferred rather than open. Track B (PWA) has no paid-account dependency and is the recommended next real progress.

---

## Correction Made Mid-Sprint

The ship-readiness plan's §2 assumed **no native purchase flow existed anywhere** and planned to build a new `BillingScreen.tsx` from scratch for Android. That assumption was wrong. Re-checking `App.tsx` directly (not just `src/features/*`) found a working `SettingsPanel` → "Plan & Billing" accordion (~line 1072) with `handleBillingPress()` already calling `/api/billing/checkout` and `/api/billing/portal` via `Linking.openURL` — running on **all platforms, including iOS**, since `App.tsx` has no per-platform split.

So the real fix was much smaller than planned: gate the existing button off on iOS, not build a new screen. Done — see below. (The earlier "no purchase flow on native" finding came from a search that covered `src/features/*` but missed the 2,926-line `App.tsx` monolith where this screen actually lives.)

---

## Deliverables

### 1. iOS purchase-flow compliance (corrected §2) ✅
| File | Change |
|---|---|
| `App.tsx` (~line 1083-1108, `SettingsPanel`) | Wrapped the "See pricing" / "Manage billing" button in `Platform.OS === "ios"` — iOS now shows read-only text ("Manage your subscription at myexpensio.com/settings/billing") instead of the button. Android and web unchanged, still open Stripe checkout/portal via `Linking.openURL`. |

### 2. Dead billing routes marked unused (§1.2 — adjusted from delete) ✅
Eff declined file-deletion permission for both routes, so they're marked instead of removed:
| File | Change |
|---|---|
| `apps/user/app/api/billing/catalog/route.ts` | Added a banner explaining it's unused (billing page hardcodes plans and calls `/api/billing/checkout` directly), has no PREMIUM entry, and reads different env var names than the live checkout route. |
| `apps/user/app/api/billing/premium/checkout/route.ts` | Strengthened its existing DEPRECATED note with confirmation that zero callers exist repo-wide. |

**Follow-up for Eff:** delete both files/directories whenever convenient — confirmed safe, just needs your go-ahead in this environment.

### 3. Subscription source-of-truth documented (§1.4.3) ✅
| File | Change |
|---|---|
| `apps/user/lib/entitlements.ts` | Added a "SOURCE OF TRUTH" header: FREE = unlimited routes/trips, 0 exports/month; PRO/PREMIUM = unlimited everything; no per-month route cap. Any doc that disagrees is stale. |
| `apps/user/lib/subscription.ts` | Added a pointer to `entitlements.ts` for usage-limit questions (this file only handles tier/status, not the numeric limits). |

### 4. Sync queue dead-letter / retry cap (§3.1) ✅
Previously `SYNC_MAX_RETRIES` (from `syncConfig.ts`) was defined but never read anywhere — failed sync items could be retried forever with no cutoff.
| File | Change |
|---|---|
| `src/local-db/repositories/syncQueueRepository.ts` | `retryFailedSyncItems()` now skips items where `retryCount >= SYNC_MAX_RETRIES` — they stay `failed` instead of resurrecting. `getSyncQueueSummary()` now returns a `deadLetter` count (failed items that have exhausted retries). |
| `src/local-db/repositories/syncQueueRepository.web.ts` | Same behavior, but `deadLetter` is computed by fetching failed rows and filtering in JS rather than `WHERE retry_count >= ?` — the web mock SQL engine (`database.web.ts`) only supports `=`, `IS [NOT] NULL`, `IN`, and `LIKE` in WHERE clauses, not `>=`. |
| `App.tsx` (`WorkClaimsSliceProps`, `WorkClaimsSlice` toolbar) | Surfaced `syncQueueSummary.deadLetter` as "· N need attention" next to the existing pending-sync count, styled with the existing `errorText` color. |

### 5. Orphaned web queue persistence marked unused (§3.2 — adjusted from delete) ✅
| File | Change |
|---|---|
| `src/sync/webQueuePersistence.ts` | Confirmed zero imports anywhere (the same localStorage mirror is independently reimplemented inside `syncQueueRepository.web.ts`, which is the version actually wired into `useSyncEngine.ts`). Added an unused-file banner instead of deleting. |

**Follow-up for Eff:** delete this file whenever convenient — confirmed safe.

---

## Explicitly Out of Scope for This Sprint (needs Eff, not code)

From `SHIP_READINESS_ACTION_PLAN.md`:
- §1.1 — creating the actual `STRIPE_PRICE_PRO` / `STRIPE_PRICE_PREMIUM` prices in the Stripe Dashboard and setting them in Vercel
- §1.4.1 — already done during the docs reorg (`subscription_matrix.html` archived)
- §1.5 — Stripe live-mode account activation
- §4 — Google Play Console signup, Apple Developer account, EAS builds, store listing submission

---

## Testing Checklist

- [ ] Confirm `App.tsx` still compiles/type-checks after the `Platform.OS === "ios"` billing-button change and the `syncQueueSummary.deadLetter` addition
- [ ] On Android/web build: tap "See pricing"/"Manage billing" in Settings → confirm still opens Stripe as before
- [ ] On iOS build (simulator is enough): confirm Settings → Plan & Billing shows the read-only text, no button, nothing crashes
- [ ] Force a bad payload into `sync_queue` locally, fail it `SYNC_MAX_RETRIES` times, confirm it stops auto-retrying and shows up in the toolbar "need attention" count
- [ ] Confirm normal offline→online sync still works end-to-end (create claim offline → reconnect → item leaves the queue)

## Files Changed

- `apps/user-mobile-v2/App.tsx`
- `apps/user-mobile-v2/src/local-db/repositories/syncQueueRepository.ts`
- `apps/user-mobile-v2/src/local-db/repositories/syncQueueRepository.web.ts`
- `apps/user-mobile-v2/src/sync/webQueuePersistence.ts` (comment only)
- `apps/user/app/api/billing/catalog/route.ts` (comment only)
- `apps/user/app/api/billing/premium/checkout/route.ts` (comment only)
- `apps/user/lib/entitlements.ts` (comment only)
- `apps/user/lib/subscription.ts` (comment only)
