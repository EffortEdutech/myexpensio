# myexpensio — Gap Closure Master Plan

**Date:** 2026-07-03
**Owner:** Eff (myeffort.studio@gmail.com)
**Status:** 🟡 Awaiting Eff's review — no code changed yet
**Supersedes:** `myexpensio-production-gap-and-sprint-plan.md` (2026-05-09) for gap inventory; complements `docs/SHIP_READINESS_ACTION_PLAN.md` (2026-07-02), which remains authoritative for Stripe/store-submission items.

Bismillah. Every claim below was verified against the actual code on 2026-07-03 — not carried over from older docs.

---

## 0. Verified State Snapshot (2026-07-03)

**Resolved since the May gap plan** — confirmed in code:
- Stripe checkout/webhook/portal routes fully built, PRO + PREMIUM (`apps/user/app/api/billing/*`)
- `/privacy` and `/terms` pages exist in the user app
- Dev routes gated: `auth-test` redirects unless `NODE_ENV === 'development'`; `/dev/gps-sim` removed
- Mobile sync retry-cap / dead-letter handling done (Sprint 25)
- PWA Track B started: manifest, native-module web stubs, in-memory SQL engine for web (`database.web.ts`), vercel config — committed at v4.15.0 (2026-06-16)
- CS Console functionally complete (13 pages incl. workspaces, invitation queue, subscriptions)

**Still open** — confirmed in code:

| # | Area | Gap |
|---|------|-----|
| G1 | Repo | **361 uncommitted files, no commit since 2026-06-16.** Mix: real work (mobile features, sync, user/admin/cs API changes, 2 migrations) + docs reorg (92 deletions = moves into `docs/` structure) + **large CRLF line-ending churn** (many "modified" files are full-file rewrites with no content change). |
| G2 | Admin | `/orgs` still hardcodes the beta org; `/orgs/new` is a 7-line placeholder; `/orgs/[id]/invites` exists (283 lines) but all three sit **outside `(protected)`** — auth-gating unverified. |
| G3 | Mobile/PWA | Sprint 23 Track B checkboxes (B-1…B-8) unticked; code shows partial completion. QA on Chrome + iPhone Safari and Vercel deploy not confirmed. This is the only checkout path for iOS users. |
| G4 | CI | `validate.yml` matrix builds only `user` and `admin` — CS app can break silently. |
| G5 | Ops | No error monitoring (Sentry) in any app. |
| G6 | Ops | No rate limiting on any API route (auth, exports, route-calc, scan all unprotected). |
| G7 | Billing | Stripe Dashboard prices + 4 Vercel env vars still pending (**Eff's action** — §1.1/§1.5 of Ship Readiness Plan). Blocks all revenue. |
| G8 | QA | Pending passes: Android paywall→checkout (§2.4), iOS read-only billing (§2.5), offline-sync regression (§3.3). |
| G9 | Ops | Unverified: custom domains, Vercel prod env-var audit, production email E2E (H3/H4/H5 from May plan). |

---

## Workstream 1 — Commit Safety (do first, ~half a day)

**Goal:** Zero work at risk; clean history; line-ending problem fixed permanently.

**Why first:** ~3 weeks of work across 4 apps exists only in the working tree. Everything else in this plan creates more diffs on top of it.

### Steps

1. **Backup before touching anything:** `git stash list` check, then a plain folder copy or `git bundle create backup-20260703.bundle HEAD` — cheap insurance.
2. **Fix line endings permanently.** Add `.gitattributes`:
   ```
   * text=auto
   *.ts text eol=lf
   *.tsx text eol=lf
   *.sql text eol=lf
   *.md text eol=lf
   *.json text eol=lf
   *.png binary
   *.jpg binary
   ```
   Then `git add --renormalize .` — this collapses the CRLF-only churn so real diffs become visible.
3. **Commit in logical chunks** (after renormalize, review each with `git diff --stat`):
   - `chore: normalize line endings + add .gitattributes`
   - `docs: reorganize into docs/ numbered structure` (the 92 deletions + new `docs/0*` folders + `SHIP_READINESS_ACTION_PLAN.md`)
   - `feat(mobile): Sprint 24/25 sync hardening + billing gating` (`apps/user-mobile-v2/src/**`, new `.web.ts` repos, `WebSyncEmptyState`, `SyncLoadingGate`, `ActiveSessionModal`, deviceSessionApi)
   - `feat(user): API + app updates` (`apps/user/app/**`, migrations)
   - `feat(admin,cs): API updates` (`apps/admin/**`, `apps/cs/**`)
   - `docs(mobile): sprint docs + store listing drafts` (`apps/user-mobile-v2/docs/**`)
4. **Push** and confirm CI green.

**Exit criteria:** `git status` clean; CI passing; `.gitattributes` in place.

**Note:** a `.git/index.lock` permission warning appeared during read-only inspection — if git commands fail, remove the stale lock file first.

---

## Workstream 2 — Admin `/orgs` Completion (clears C2/C3/C4/H7)

**Goal:** Real org management in the Admin app, correctly auth-gated.

### Decision needed from Eff first
The CS Console already has `workspaces/`, `workspaces/new/`, and `invitation-queue/` pages that do org-level management. Two options:

- **Option A (recommended):** Admin `/orgs` becomes a thin real list + detail that links into existing flows; org *creation* stays in CS Console (avoid duplicating `POST /api/console/workspaces` logic in two apps).
- **Option B:** Full parity build in Admin app (list, create, invites) with its own admin-scoped API routes.

### Steps (Option A shape; adjust if B chosen)

1. **Move pages under `(protected)`** — relocate `apps/admin/app/orgs/*` → `apps/admin/app/(protected)/orgs/*`; verify middleware fires (unauthed request → login redirect).
2. **`/orgs` list page:** real data via existing `apps/admin/app/api/admin/orgs/route.ts` (already exists, currently modified/uncommitted — review first). Paginated table, search, status badge, link to detail.
3. **`/orgs/new`:** replace placeholder — form (org name, workspace type TEAM/AGENT, contact email, initial owner email) → admin-scoped API route with server-side `role = ADMIN` check + service-role client (server only).
4. **`/orgs/[id]/invites`:** page already has 283 lines — audit it against the `(protected)/invitations` pattern, wire to real data, scope by `org_id`.
5. **RLS/permissions:** all new routes server-check ADMIN role; no service keys in browser; every query scoped/filterable by `org_id`.

### Testing checklist
- [ ] Unauthed → redirected to login on all three routes
- [ ] Non-ADMIN authenticated user → rejected
- [ ] Org list paginates + searches against real data
- [ ] Create org → org + owner invite provisioned → visible in list
- [ ] Per-org invites: create, resend, revoke
- [ ] Claim-lock and existing flows regression-free

---

## Workstream 3 — PWA Track B Finish (iOS checkout path)

**Goal:** Deployed, QA-passed PWA at a production URL — the only path where iOS users can buy PRO/PREMIUM.

### Steps (from SPRINT_23 B-1…B-8, reconciled against what's already committed)

1. **Reconcile the sprint doc** — stubs/manifest/vercel config are committed but B-boxes are unticked. Audit which of B-1…B-8 are actually done; tick them.
2. **B-1 web build audit:** `npx expo export --platform web` → walk every major screen in Chrome; document crashes.
3. **Remaining B-2 stubs** — verify `expo-print`, `expo-sharing`, `expo-file-system`, signature canvas on web.
4. **B-3 session persistence:** localStorage adapter; session survives reload in Safari.
5. **B-4/B-5:** icons, iOS splash, Add-to-Home-Screen full-screen check on iPhone Safari; service worker.
6. **Deploy to Vercel** (free tier) → QA on Chrome (Android/desktop) + Safari (iPhone).
7. **End-to-end money test (once G7/Stripe env vars set):** PWA on iPhone → `WebSyncEmptyState` checkout → Stripe test card → tier updates in app.

### Testing checklist
- [ ] All major screens load on Chrome + iPhone Safari
- [ ] Login persists across reload
- [ ] Offline: claims list readable, edits queue, sync on reconnect
- [ ] Add to Home Screen: full-screen, icon + splash correct
- [ ] Checkout completes on iPhone Safari (test mode)
- [ ] Export blocked on FREE (0 exports/month), allowed on PRO

### 3.B Cross-device data consistency (added 2026-07-03 — Eff's concern, verified valid)

**Architecture fact:** Supabase is the hub; the PWA rebuilds its in-memory DB from Supabase on every load. The PWA is therefore always as fresh as Supabase — but never fresher than the phone's last successful push. If the phone holds unpushed or dead-lettered items, the PWA works on stale data, and simultaneous edits create merge conflicts on push.

**Already in place (verified in code):**
- Phone pushes on foreground (`AppState`); web pushes on `visibilitychange`
- Web pending queue mirrored to localStorage + rehydrated on load (`syncQueueRepository.web.ts`) — tab close doesn't lose edits
- Retry cap + dead-letter count surfaced as "N need attention" (Sprint 25)

**Gaps to close:**
- [ ] **Dead-letter recovery UI** — user can view stuck items, retry, or discard. Today the "N need attention" badge is informational only; stuck items silently never reach Supabase (biggest stale-data risk).
- [ ] **§3.3 regression pass** — offline edit on phone → online → push completes; forced-bad payload stops retrying and surfaces.
- [ ] **Conflict test** — edit the same claim item on phone (offline) and PWA, bring phone online, verify `mergePolicy.ts` outcome is deterministic and no data is silently lost.
- [ ] **Staleness indicator on PWA** — show "last synced" time from `sync_state` cursor so a PRO/PREMIUM user knows whether phone data has arrived.
- [ ] **Claim-lock regression** — SUBMITTED claim edited offline on phone before submission from web: server must reject the late push with CONFLICT, phone must surface it (not dead-letter it invisibly).

---

## Workstream 4 — Hardening Batch (CI, Sentry, rate limiting)

### 4.1 CS app into CI (15 min)
Add `cs` to the matrix in `.github/workflows/validate.yml` + any CS-specific dummy env vars. Exit: CI builds all three apps.

### 4.2 Error monitoring — Sentry free tier (fits zero-budget: 5k errors/month)
- `@sentry/nextjs` in user, admin, cs; wizard-generated config files
- DSN via Vercel env vars per project; separate environments (`production`/`preview`)
- Scrub PII in `beforeSend` (emails, org names) — this is a financial-data product
- Optional follow-up: `@sentry/react-native` in user-mobile-v2

### 4.3 Rate limiting — free path
Priority routes: `/api/auth/*` (login/reset abuse), `/api/exports*`, route-calculation, `/api/scan/*`, `/api/billing/checkout`.
- **Free option 1 (recommended):** Upstash Redis free tier (10k commands/day) + `@upstash/ratelimit` in middleware
- **Free option 2 (no new service):** simple per-IP token bucket in a Supabase table — coarser, but zero dependencies
Return `429` with `RATE_LIMITED` error code; UI shows a calm retry message.

### Testing checklist
- [ ] CI green on all 3 apps
- [ ] Thrown test error appears in Sentry for each app, with PII scrubbed
- [ ] Hammering login endpoint → 429 after threshold; normal use unaffected

---

## 5. Items that remain YOURS (no code work possible from my side)

| Item | Ref | Lead time |
|---|---|---|
| Stripe Dashboard: create PRO (RM18/mo) + PREMIUM (RM29/mo) prices, set 4 Vercel env vars, run test checkouts | Ship Plan §1.1 | ~1 hour |
| Stripe live activation (business verification + bank) | Ship Plan §1.5 | **up to 2 days — start earliest** |
| Custom domains in Vercel + update cross-app URL env vars | May plan H3 | ~1 hour |
| Play Console / Apple Developer signups | Ship Plan §4 | Deferred per your 2026-07-02 decision |

---

## 6. Proposed Execution Order

1. **WS1 Commit Safety** — prerequisite for everything
2. **WS4.1 CS in CI** — trivial, do immediately after WS1 push
3. **WS2 Admin /orgs** — after your Option A/B decision
4. **WS3 PWA Track B** — parallel-friendly with WS2; becomes revenue-relevant the moment you finish Stripe env vars (G7)
5. **WS4.2/4.3 Sentry + rate limiting** — before public launch, after the above
6. **G8 QA passes + G9 ops verification** — final pre-launch sweep

---

*In shaa Allah — once you approve this plan (and pick Option A or B for Workstream 2), execution starts with Workstream 1.*
