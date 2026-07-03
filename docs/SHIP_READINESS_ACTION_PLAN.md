# myexpensio — Ship Readiness Action Plan

**Date:** 2026-07-02
**Owner:** Eff (myeffort.studio@gmail.com)
**Status:** 🟡 All code-only items done (Sprint 25 + follow-up). Remaining items need Eff: Stripe Dashboard setup (§1.1.1-1.1.3, §1.5). Play Console/Apple Developer signup and store submissions (§4) are **deferred to a later stage** — both require payment and Eff isn't doing that yet.

Bismillah. This plan expedites everything currently blocking shipping: subscription/payment finalization, the mobile sync issues found in the code review, and native purchase-flow compliance for the app stores. Decisions below were confirmed with Eff on 2026-07-02 and are now locked — do not re-litigate them without a version bump.

**Execution log:** `apps/user-mobile-v2/docs/04-sprints/SPRINT_25_BILLING_AND_SYNC_HARDENING.md` covers everything below marked ✅. It also corrects §2 — the "build a new billing screen" premise was wrong; a working one already existed in `App.tsx`, it just needed the iOS purchase button gated off. Read that sprint doc for what actually changed, file-by-file.

---

## 0. Decisions Locked This Session

| Question | Decision |
|---|---|
| FREE tier model | **No routes/month cap.** The "2 route-calcs/month" line in the old locked-baseline note is stale and superseded by `apps/user/lib/entitlements.ts` (updated 2026-04-21): FREE gets **unlimited routes and trips**, **0 exports/month** (paid gate is exports only, not usage). PRO and PREMIUM are unlimited on everything. This is the only model going forward — see §1.4 for doc cleanup. |
| iOS purchase flow | **Hide it.** No purchase button ships inside the iOS build. iOS users manage subscriptions via the PWA/website. |
| Android purchase flow | **Keep Stripe checkout**, same as web — but see §2, because it doesn't actually exist as a screen yet (see below). |
| PREMIUM at launch | **Finish PREMIUM Stripe setup now** — ship PRO + PREMIUM together, not PRO-only. |

**One correction to the original ask:** the review said "hide purchase flow on iOS only, keep native as-is." Turns out there **is no working purchase flow on native at all today** — Android has the same gap as iOS. `WebSyncEmptyState.tsx` (the only working checkout button in the whole mobile codebase) is hard-gated to `Platform.OS === 'web'` only. Every native paywall (`FeatureGate.tsx`, the "Camera scanning requires PRO" alerts in `ClaimDetail.tsx` / `TripsScreen.tsx` / `ReceiptPickerField.tsx`, the disabled "PRO Required — Upgrade to Export PDF" button in `ExportScreen.tsx`) just tells the user to go to "Settings → Billing" — **a screen that does not exist in the app.** So this plan includes building that screen for Android (§2), not just gating something that already worked.

---

## 1. Subscription & Payment — Finalize (Priority 0, blocks revenue)

### 1.1 Fix the env var mismatch that breaks checkout today

`apps/user/app/api/billing/checkout/route.ts` reads `STRIPE_PRICE_PRO` and `STRIPE_PRICE_PREMIUM`. But `docs/STRIPE_SETUP_GUIDE.md` — the guide meant to walk Eff through setup — only ever tells you to create `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID`. Follow the guide exactly today and checkout returns `CONFIG_ERROR: STRIPE_PRICE_PRO env var not set` — a 500 on the "Continue to payment" button.

- [ ] **1.1.1** In Stripe Dashboard (test mode first), create **one recurring monthly price per tier** — not monthly+yearly, since `checkout.ts` doesn't accept an interval parameter today, only `tier`:
  - "myexpensio Pro" — RM18/month → copy `price_...` id
  - "myexpensio Premium" — RM29/month → copy `price_...` id
- [ ] **1.1.2** Set in Vercel (User App project → Settings → Environment Variables):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PRO` ← the actual variable the code reads
  - `STRIPE_PRICE_PREMIUM` ← ditto
- [ ] **1.1.3** Redeploy, then run the Step 12 test checkout from `STRIPE_SETUP_GUIDE.md` for **both** tiers (test card `4242 4242 4242 4242`).
- [x] **1.1.4** Rewrote `docs/04-billing-payments/01_STRIPE_SETUP_GUIDE.md` — now references `STRIPE_PRICE_PRO` / `STRIPE_PRICE_PREMIUM`, includes the Premium price creation step, drops the unused yearly-billing instructions.

### 1.2 Remove dead billing code causing the "confusion"

Two routes exist but nothing calls them — they're a leftover from an earlier design and are exactly the kind of thing that causes "which plan is real" confusion:

- [x] **1.2.1** ~~Delete~~ `apps/user/app/api/billing/catalog/route.ts` — you declined delete permission, so it's marked with an "unused/orphaned" banner explaining why instead. Delete whenever convenient.
- [x] **1.2.2** ~~Delete~~ `apps/user/app/api/billing/premium/checkout/route.ts` — same treatment, DEPRECATED note strengthened with confirmation of zero callers.
- [x] **1.2.3** Removed the `/api/billing/catalog` test block from `scripts/uat-api-tests.js` (no `premium/checkout` test existed to clean up).

### 1.3 Webhook — confirm PREMIUM path is production-ready

The unified webhook (`apps/user/app/api/billing/webhook/route.ts`) already handles PREMIUM correctly (auto-creates a BUSINESS space on PREMIUM activation, tier resolution via `tierFromPriceId`). Once 1.1 is done:

- [ ] **1.3.1** Confirm the Stripe Dashboard webhook endpoint has all 5 events ticked: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- [ ] **1.3.2** Test-mode smoke test: subscribe test user to PREMIUM → confirm `subscriptions` row shows `tier=PREMIUM, status=ACTIVE` and a `BUSINESS` space was created.
- [ ] **1.3.3** Test cancel-at-period-end via the Stripe portal (`/api/billing/portal`) → confirm billing page reflects `cancel_at_period_end` correctly.

### 1.4 Fix the stale documentation causing the confusion

- [x] **1.4.1** Archived `docs/subscription_matrix.html` → `docs/archive/subscription_matrix_SUPERSEDED.html` during the docs reorg, with a README note explaining why.
- [x] **1.4.2** Locked-baseline understanding corrected in Claude's project memory (FREE = unlimited routes/trips, 0 exports/month, no per-month cap). No source file to edit for this one — it lived only in prior conversation context.
- [x] **1.4.3** Added a "SOURCE OF TRUTH" header to `apps/user/lib/entitlements.ts`, plus a pointer from `apps/user/lib/subscription.ts` to it.

### 1.5 Go-live checklist (once 1.1–1.4 are done)

- [ ] Stripe account fully activated (business verification, bank account) — Stripe approval can take up to 2 days, start this early since it's the longest lead time item in this whole plan
- [ ] Switch `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / both price IDs to live values in Vercel
- [ ] One real low-value test transaction in live mode, then refund it

---

## 2. Native Billing Screen — CORRECTED (Priority 0, blocks Android monetization)

**Correction (Sprint 25):** this section originally assumed no native purchase flow existed anywhere and planned to build a new `BillingScreen.tsx`. That was wrong — a working "Plan & Billing" section already existed inline in `App.tsx`'s `SettingsPanel` (~line 1072), with `handleBillingPress()` already calling `/api/billing/checkout` / `/api/billing/portal` via `Linking.openURL`, running on **all platforms including iOS**. The earlier research missed it because it searched `src/features/*` component files, not the 2,926-line `App.tsx` monolith where this screen actually lives.

- [x] **2.1 (redone)** Gated the existing "See pricing"/"Manage billing" button in `App.tsx` behind `Platform.OS === "ios"` — iOS now shows read-only status text instead of the button. Android and web unchanged.
- [x] **2.2** No new nav entry needed — the screen already existed and was already wired in.
- [ ] **2.3** The dead-end alerts (`ClaimDetail.tsx`, `TripsScreen.tsx`, `ReceiptPickerField.tsx`, `FeatureGate.tsx`) that say "Upgrade in Settings → Billing" are technically correct now (that screen exists) but still worth a pass to confirm the copy matches — low priority.
- [ ] **2.4** QA: on an Android build, tap every paywall trigger → confirm it reaches the Settings → Plan & Billing section → confirm checkout completes → confirm tier updates in-app after returning from Stripe.
- [ ] **2.5** On an iOS build, confirm Settings → Plan & Billing shows read-only status text only, no purchase button, nothing crashes.

---

## 3. Mobile Sync Engine Fixes (Priority 1, data-integrity risk)

From the earlier code review — two concrete fixes, both small:

- [x] **3.1** Added the retry cap in `syncQueueRepository.ts` and `.web.ts`: `retryFailedSyncItems()` now skips items where `retryCount >= SYNC_MAX_RETRIES`, and `getSyncQueueSummary()` returns a new `deadLetter` count. Surfaced in `App.tsx`'s claims toolbar as "· N need attention".
- [x] **3.2** ~~Delete~~ `apps/user-mobile-v2/src/sync/webQueuePersistence.ts` — you declined delete permission, so it's marked with an "unused/orphaned" banner instead. Delete whenever convenient.
- [ ] **3.3** Regression pass still needed (requires a running build, not just code review): create a claim offline → go online → confirm push/pull completes. Then force a bad payload into the queue and confirm it now stops retrying and shows up as "needs attention" instead of retrying forever.

---

## 4. App Store / Play Store Submission — Remaining Steps

This condenses the open items from `apps/user-mobile-v2/docs/SPRINT_23_IOS_PWA_ANDROID_BUILD_PLAN.md` — full detail lives there, this is the punch list in shipping order.

**⏸ DEFERRED (2026-07-02):** Eff confirmed Google Play Console (USD 25) and Apple Developer (USD 99/yr) signups are paid and happening at a later stage — not now. Everything below that depends on those accounts is on hold. Code-only prep (build config, listing copy drafts, PWA track) can still move forward.

### Track A — Android (native) — ⏸ paused at account signup
- [ ] ⏸ Google Play Console account (USD 25 one-time) — **deferred, later stage**
- [ ] New app entry: package `com.effortedutech.myexpensio` — blocked on above
- [ ] Play service account JSON for EAS submit (never commit — already `.gitignore`'d) — blocked on above
- [ ] Production AAB build (`eas build --profile production --platform android`) — can be done without a Play Console account, just can't submit yet
- [ ] Smoke test on a physical Android device: login → claim → Settings → Plan & Billing → sync → export PDF
- [ ] Submit (`eas submit`), listing copy, screenshots, feature graphic, content rating, Data Safety form, privacy policy live — blocked on Play Console account
- [ ] Promote internal → closed testing → production — blocked on Play Console account

### Track B — PWA (Android + iPhone via browser, no store review, no account needed) — ✅ not blocked, can proceed
- [ ] Finish B-1 through B-8 in SPRINT_23 (web build audit, native-module web stubs, PWA manifest/icons, service worker, Vercel deploy, QA on both Chrome and Safari)
- [ ] This is the track where iOS users actually get PRO/PREMIUM checkout (via `WebSyncEmptyState.tsx`, already working) and needs no paid account — good candidate for next real progress while store accounts wait

### Track C — iOS native — ⏸ paused at account signup
- [ ] ⏸ Apple Developer account (USD 99/year) — **deferred, later stage**
- [x] Build with no purchase buttons — done in Sprint 25 (`Platform.OS === "ios"` guard in `App.tsx`)
- [ ] App Review notes: proactively state the app does not sell anything in-app on iOS — draft this whenever, submit only once the Developer account exists
- [ ] If Apple rejects anyway on subscription-adjacent grounds, the fallback is RevenueCat + native IAP — treat as a fast-follow, not a launch blocker

---

## 5. Suggested Execution Order (updated 2026-07-02)

1. ✅ ~~§1.2, 1.4~~ Dead billing routes marked + stale docs archived — done
2. ✅ ~~§3.1–3.2~~ Sync engine fixes — done
3. ✅ ~~§2~~ iOS purchase-flow gating (corrected — no new screen needed, existing one gated) — done
4. ✅ ~~§1.1.4~~ Stripe setup guide rewrite — done
5. **§1.1.1–1.1.3, §1.5 — up to Eff:** create the Stripe prices, set the 4 Vercel env vars, activate live Stripe (longest lead time in this whole plan — worth starting whenever ready, independent of everything else)
6. **§4 Track B (PWA)** — next best code-only progress available: no paid account needed, and it's the only path that gives iOS users a real checkout today. Good candidate for the next sprint.
7. **§4 Track A/C (Android + iOS store submission)** — ⏸ **deferred**, paid signups happen at a later stage per Eff (2026-07-02). Revisit when ready.

---

## Files Touched (summary)

| File | Change |
|---|---|
| Vercel env vars | **Still needed from Eff:** add `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PREMIUM` (+ existing secret/webhook) — needs live Stripe Dashboard access, can't be done from here |
| `docs/04-billing-payments/01_STRIPE_SETUP_GUIDE.md` | ✅ Rewritten — correct env var names, added PREMIUM, dropped unused yearly steps |
| `scripts/uat-api-tests.js` | ✅ Removed the dead `/api/billing/catalog` test block |
| `apps/user/app/api/billing/catalog/route.ts` | ✅ Marked unused (delete pending your go-ahead) |
| `apps/user/app/api/billing/premium/checkout/route.ts` | ✅ Marked unused (delete pending your go-ahead) |
| `docs/subscription_matrix.html` | ✅ Archived |
| `apps/user/lib/entitlements.ts` | ✅ Added "source of truth" comment |
| `apps/user/lib/subscription.ts` | ✅ Added pointer to entitlements.ts |
| `apps/user-mobile-v2/App.tsx` | ✅ Gated existing billing button off on iOS; surfaced dead-letter count in claims toolbar |
| `apps/user-mobile-v2/src/local-db/repositories/syncQueueRepository.ts` + `.web.ts` | ✅ Added retry-cap / dead-letter handling |
| `apps/user-mobile-v2/src/sync/webQueuePersistence.ts` | ✅ Marked unused (delete pending your go-ahead) |

---

*In shaa Allah, this is the last full-scope plan before Android ships. Alhamdulillah for the clarity on the FREE-tier model — one source of truth from here: `apps/user/lib/entitlements.ts`.*
