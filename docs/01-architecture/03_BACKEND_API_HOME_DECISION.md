# Backend/API Home & `apps/user` Retirement — Decision Record

Date: 2026-07-17
Status: Investigated and decided — no code changed by this doc

---

## The Question

`apps/user-mobile-v2` calls `apps/user`'s Next.js API routes as its backend (there is no separate NestJS/dedicated API layer, despite that being the original target architecture in `02_MOBILE_V2_LOCAL_FIRST_DECISION.md`). Eff's stated intent is to eventually delete `apps/user` from Vercel and stop running it — which raises the real question: once that happens, what answers `user-mobile-v2`'s API calls?

## What Was Checked Before Deciding

**Mobile apps cannot host a server.** Neither a compiled native build nor the web-exported PWA can accept incoming requests — this rules out "just put the API in `user-mobile-v2`" as a literal option, not as a matter of preference.

**Expo Router API routes were checked as the closest real alternative.** `user-mobile-v2` doesn't use Expo Router at all (no `expo-router` dependency, `"main": "expo/AppEntry"`, everything runs through the single `App.tsx`). Adopting it would mean migrating the app's routing foundation first, and would require `web.output: "server"` — which conflicts with the `"single"` output setting that was deliberately restored on 2026-07-04 to fix the PWA build. Not a quick option today.

**`apps/admin` already proves each app can have its own backend** — it has its own `/api/*` routes and doesn't depend on `apps/user`. So retiring `apps/user` doesn't risk breaking the admin app.

**Feature parity between `apps/user` (the "V1 PWA") and `apps/user-mobile-v2` was checked directly** against `apps/user-mobile-v2/docs/02-architecture-decisions/04_PWA_VS_MOBILEV2_PARITY_TRACKER.md` (last updated 2026-06-10, Sprints 0–22 complete):

- **~50 features at full parity**, including all the core business functions: claims, all 8 claim item types, trips, odometer, TNG import + linking + backend PDF parsing (Sprint 22), CSV/XLSX/PDF exports with signature and grouping, Personal Space, Business Space, billing/Stripe checkout, org roles.
- **~5 partial/stub:** GPS *real-time point* tracking (draft mode works, live tracking doesn't), profile edits (form exists, no backend save yet), meal/lodging rate sub-fields (partial), in-app plan-comparison UI (checkout itself works, just opens Stripe directly rather than showing a comparison screen first).
- Nearly everything originally deferred at launch (forgot/change password, accept invite, dashboard stats, unified transactions, TNG PDF parsing) has since been closed in Sprints 19–22.

**Sprint 18's own launch signoff (2026-06-09) already answered "when do we retire `apps/user`."** It explicitly chose "V1 PWA remains available — parallel run," with two named checkpoints: a 30-day gap-closure review (Sprint 19, done) and a **60-day retirement evaluation based on v2 adoption metrics** — dated **2026-08-08**. That checkpoint has not been reached yet (today is 2026-07-17, ~3 weeks out), and it was explicitly meant to be based on real usage data, not just feature-parity completeness.

**The new PWA (Track B, per `SHIP_READINESS_ACTION_PLAN.md`) is a web export of `user-mobile-v2` itself, not `apps/user`.** This is the thing that actually makes `apps/user`'s website redundant once it's done — and per project memory, Track B's device QA is still pending.

## Decision

**No big-bang backend migration right now — it isn't justified by what's actually true today, and would violate "don't rebuild working foundations unnecessarily."** Concretely:

1. **`apps/user`'s `/api/*` routes stay the shared backend for now.** This does not block or change the AI capture sprint plan — S1 still builds `/api/ai/extract-receipt` there, exactly as planned.
2. **Retiring `apps/user`'s website *pages* (not the API) becomes safe to act on once three things are true**, none of which have happened yet:
   - PWA Track B (the `user-mobile-v2` web export) is fully deployed and device-QA'd as the real web/iOS replacement.
   - The Sprint 18-documented 60-day adoption-metrics checkpoint (2026-08-08) is reached and reviewed.
   - The two remaining named parity gaps (GPS live tracking, profile backend save) are either closed or explicitly accepted as permanently deferred.
3. **When that point is reached, the low-cost move is to strip `apps/user` to API-routes-only** — delete the website pages, keep `/api/*` (billing, scan proxy, TNG parsing, AI routes). Same Vercel project, same URL, zero code migration, nothing currently working breaks.
4. **Moving the backend out of `apps/user` entirely** (a dedicated NestJS service, or Supabase Edge Functions — both real, both free-tier-friendly, both discussed as options) **is a separate, non-urgent decision.** Revisit it only if keeping `apps/user` alive as an API-only project becomes an actual problem — cost, deploy friction, or a genuine desire to decouple. Nothing found in this investigation makes that urgent today.

## What This Means for the AI Capture Plan

Unblocked. Sprint 1 proceeds as written in `03-sprint-plans/ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md` — `/api/ai/extract-receipt` is built in `apps/user`, which is not going anywhere before 2026-08-08 at the earliest, and even after that checkpoint, the API layer specifically survives regardless of what happens to the website pages.

## Addendum (2026-07-17) — Why not `apps/cs`?

Eff proposed hosting the shared API in `apps/cs` (the "console" app, deployed at `myexpensio-cs.vercel.app`) instead of `apps/user`. Checked the actual code: every route in `apps/cs` — `/api/console/users`, `/workspaces`, `/subscriptions`, `/system`, password resets, etc. — is gated by `requireConsoleAuth()`, hard-restricted to `CONSOLE_ROLES = ['SUPER_ADMIN', 'SUPPORT']` (`apps/cs/lib/auth.ts`). Regular customers hold `profiles.role = 'USER'` and would be rejected outright. There's no blanket `middleware.ts` — each route checks auth individually — so a bypass route is technically possible, but not advisable: it would mix a project that can reset any user's password and touch every workspace with public, customer-facing AI traffic, widening the blast radius of the most sensitive project in the system for no real benefit. `apps/cs` is not a candidate backend home. The two live options remain unchanged: `apps/user`'s `/api/*` for now, or a genuinely new dedicated backend (own project, or Supabase Edge Functions) later if getting off `apps/user` specifically becomes the goal.

## Final Decision (confirmed 2026-07-17)

`apps/user` stays as the backend, both now and past the 2026-08-08 checkpoint — even once its website pages are retired, the project itself continues on as the API layer (per the "strip to API-only" option above). **Future cosmetic step, not urgent:** rename the project/folder from `apps/user` to something like `apps/api` once it's actually API-only, so the name reflects what it does and stops causing the "which app are we working on" confusion this decision record exists because of. This is a rename to schedule deliberately when the time comes (Vercel project settings, folder path, every doc/script referencing `apps/user`, CI workflows) — not something to do today alongside a name that's still accurate (it's still a website too, right now).

## Open Item for Eff

Nothing blocking. Worth a calendar note: **2026-08-08** is the date Sprint 18 itself set for reviewing `apps/user` retirement — that's the natural point to revisit this doc, strip the project to API-only, and schedule the `apps/api` rename.
