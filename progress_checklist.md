# MyExpensio — Progress Checklist

**Status:** Updated to reflect current repo build state  
**Milestone:** User App **UAT-ready**

---

## A. User App

### Core access and structure
- [x] User app scaffold exists
- [x] User auth flow available
- [x] Main user navigation in place
- [x] Home dashboard implemented
- [x] Settings page implemented

### Trips
- [x] Trips list implemented
- [x] GPS trip entry flow implemented
- [x] GPS active-trip / resume flow implemented
- [x] Odometer trip entry implemented
- [x] Mileage calculator / planned trip flow implemented
- [x] Trip detail access implemented

### Claims
- [x] Claims list implemented
- [x] Claim detail implemented
- [x] Draft vs Submitted state implemented
- [x] Submitted claim locking enforced
- [x] Claim deletion flow for draft claims implemented

### Claim item types
- [x] Mileage items implemented
- [x] Meal items implemented
- [x] Lodging items implemented
- [x] Toll items implemented
- [x] Parking items implemented
- [x] Transport items implemented
- [x] Per Diem items implemented
- [x] Misc items implemented

### Rates and policies
- [x] Mileage rate settings implemented
- [x] Meal rate settings implemented
- [x] Lodging rate settings implemented
- [x] Per Diem default rate implemented
- [x] Rate persistence via settings API implemented

### TNG integration
- [x] TNG-linked claim item support implemented
- [x] TNG pending / verified states shown in claim UI
- [x] TNG unlink flow implemented

### Export
- [x] CSV export implemented
- [x] XLSX export implemented
- [x] PDF export implemented
- [x] Export job logging implemented

### Readiness
- [x] User App ready for UAT

---

## B. Admin App

### Access and protection
- [x] Separate admin app scaffold exists
- [x] Admin login page implemented
- [x] Supabase session refresh middleware implemented
- [x] Admin-only role gating implemented
- [x] Unauthorized loop protection handled

### Admin pages
- [ ] Dashboard completed
- [ ] Organizations list completed
- [ ] Create organization workflow completed
- [ ] Organization detail workflow completed
- [ ] Invite list / invite create workflow completed

### Readiness
- [ ] Admin App ready for UAT

---

## C. Enhancements

### Tracking and docs
- [x] `progress.md` updated to reflect actual build state
- [x] Progress checklist split into User App / Admin App / Enhancements
- [ ] Keep status files in sync with repo as development continues
- [x] Jest test runner installed in `apps/user` (2026-07-17) — `lib/__tests__/tng-matcher.test.ts` existed since before this session but no test runner was ever installed for it, so `pnpm tsc --noEmit` failed with 63 pre-existing `TS2582`/`TS2304` errors (`describe`/`it`/`expect` unrecognized) unrelated to any current feature work. Added `jest.config.js` (via Next.js's `next/jest` preset) + `jest`/`@types/jest`/`jest-environment-node` devDependencies + `pnpm test` script.
- [x] **Real bug found + fixed by running tests for the first time (2026-07-17):** `lib/tng-matcher.ts`'s sector-compatibility gate only recognised TOLL↔TOLL and PARKING↔PARKING, so TAXI/GRAB/TRAIN/BUS claim items paid via TNG (which `/api/claims/[id]/tng-suggestions/route.ts` explicitly fetches for this purpose) could never auto-match their RETAIL-sector TNG transaction — a silently broken code path since it was written, invisible because the tests that would have caught it never ran. Fixed by wiring in the already-written-but-unused `isCompatiblePair()` helper. Added a regression test proving TAXI↔RETAIL matching now works, and corrected the one pre-existing test whose assertion depended on the bug. See `lib/tng-matcher.ts` inline comment for detail.

### Product / platform next steps
- [ ] Complete admin operational workflows
- [ ] Review dependency alignment between user app and admin app
- [ ] Improve export template / format management
- [ ] Implement original statement attachment + claim highlighting workflow
- [ ] Polish export history / retry / download UX

---

## D. AI Capture Upgrade (planning stage — 2026-07-17)

Full detail: `docs/02-product-specs/02_AI_ASSISTANT_AUTOMATION_SPEC.md` (spec) and `docs/03-sprint-plans/ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md` (sprint-by-sprint plan). Nothing below is built yet — additive upgrade, does not modify existing claim/export/lock behavior.

- [x] S0 — Compliance & provider prep (Gemini key, PDPA sign-off) — done 2026-07-17
- [x] S1 — Receipt auto-fill (web, shared key) — done 2026-07-17. Corrected same day: first pass wired the wrong (unused) TransportModal file; re-wired into the actual live modals in claims/[id]/page.tsx (Meal, Lodging, Toll, Parking, Transport, Misc). Per Diem has no receipt field, N/A.
- [~] S2 — Receipt auto-fill (mobile + tier gate) — auto-fill wiring + tier gate shipped early as part of S1 (built directly in mobile-v2, the real product). Remaining gap: offline-deferred retry prompt not built; QA not run. See sprint plan S2 for detail.
- [x] S3 — Odometer AI reading — built 2026-07-18, mobile-v2 only (`/api/ai/extract-odometer` route + BYOK direct path + `TripsScreen.tsx` origin/destination wiring, `ai_odometer_scan` gate). Web page wiring deliberately skipped — `apps/user` pages aren't the real product, same call as S1. Not yet manually tested by Eff — see S3 testing checklist in the sprint plan.
- [ ] S4 — Voice claim entry (cloud)
- [x] S5 — Bring-your-own-key (BYOK) — built 2026-07-18 for receipt scanning (mobile-v2 only; odometer/voice BYOK deferred until S3/S4 exist). Client-side only — key stored via expo-secure-store/localStorage, calls Gemini directly from device, never touches myexpensio's servers. Settings → AI Receipt Scanning. Not yet manually tested by Eff — see S5 testing checklist in the sprint plan.
- [ ] S6 — On-device fast path (Android)
- [ ] S7 — Audit trail, compliance polish, `scan_service` decision

---

## Current Development Position
- **User App:** stable enough for structured user testing
- **Admin App:** protected and scaffolded, but still partially placeholder
- **Next recommended build target:** Admin App completion or export enhancement batch

