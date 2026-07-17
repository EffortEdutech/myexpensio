# myexpensio AI-Assisted Capture — Sprint Plan

**Feature:** AI receipt/odometer/voice capture with minimum user effort (BYOK + shared-key fallback)
**Reference spec:** `docs/02-product-specs/02_AI_ASSISTANT_AUTOMATION_SPEC.md` (read this first — this plan implements it)
**Tracking starts:** 2026-07-17
**Baseline versions:** user `4.18.0` · user-mobile-v2 `0.1.0` · admin `0.1.0` · root `1.0.0`

---

## Zero-Budget Confirmation

- Gemini API free tier (Google AI Studio): no card required, no expiry, as of this writing.
- No paid AI provider, no paid OCR service, no new paid infra.
- BYOK (Sprint 5) shifts even the free-tier quota risk onto users who opt in — myexpensio's own key only ever needs to cover PRO/PREMIUM users without one.
- `scan_service` (Render.com) keeps running unchanged through Sprint 6 — nothing is removed until Sprint 7 makes that call deliberately, not as a side effect.

## Backend Home — Investigated 2026-07-17

Eff raised whether `apps/user` (which hosts all shared `/api/*` routes, including the ones this plan builds) should be retired, and whether the API should live in `user-mobile-v2` instead. Full investigation and decision: `docs/01-architecture/03_BACKEND_API_HOME_DECISION.md`.

**Short version: unblocked, no change to this plan.** `user-mobile-v2` cannot host a server itself (native builds and the PWA are both clients). `apps/user`'s own Sprint 18 launch signoff already set a 2026-08-08 checkpoint for evaluating its retirement, based on v2 adoption metrics — not yet reached. Feature parity is ~50/60 items complete per the parity tracker, with only GPS live-tracking and profile-edit-save as named remaining gaps. `/api/ai/*` routes in S1 onward continue to live in `apps/user` as planned; revisit only after 2026-08-08.

## Source Boundary

- Do not change claim-lock rules (`SUBMITTED` immutability), `final_distance_m` semantics, or export determinism at any point in this plan. AI only **pre-fills a draft** — the human always confirms before anything is written to a real claim/trip record.
- Do not modify `scan_service/main.py` before Sprint 7. It stays as the fallback path while the AI path is being proven out.
- Do not touch unrelated in-flight work (PWA Track B device QA, Stripe env var finalization) — this plan is additive and should not block or be blocked by either.

---

## Sprint Overview

| Sprint | Focus | User App (web) | Mobile v2 | Commit Tag |
|--------|-------|-----------------|-----------|------------|
| S0 | Compliance & Provider Prep | — | — | `chore(ai): gemini key + compliance prep [S0]` |
| S1 | Receipt Auto-fill — Web, shared key | `4.19.0` ✅ (TransportModal only — see notes) | — | `feat(ai): receipt auto-fill via gemini v4.19.0` |
| S2 | Receipt Auto-fill — Mobile + tier gate | — | `0.2.0` | `feat(ai): mobile receipt auto-fill v0.2.0` |
| S3 | Odometer AI Reading | `4.20.0` | `0.3.0` | `feat(ai): odometer reading via gemini` |
| S4 | Voice Claim Entry (cloud) | `4.21.0` | `0.4.0` | `feat(ai): voice claim capture` |
| S5 | Bring-Your-Own-Key | `4.22.0` | `0.5.0` | `feat(ai): byok settings + client-direct calls` |
| S6 | On-device Fast Path (Android) | — | `0.6.0` | `feat(ai): on-device fallback (android)` |
| S7 | Audit Trail, Compliance Polish, scan_service Decision | `4.23.0` | `0.7.0` | `release: ai capture stable` |

---

## Sprint 0 — Compliance & Provider Prep

**Goal:** Everything that has to happen before Eff before any code lands.
**Deliverable:** Gemini API key live in env vars; PDPA line drafted; tier decision made.

### Tasks
- [x] Eff creates a Google AI Studio project + free Gemini API key (no card) — done
- [x] Add `GEMINI_API_KEY` to Vercel env vars on the `myexpensio` project — done, redeploy green (confirmed 2026-07-17)
- [x] Add `GEMINI_API_KEY` to local `apps/user/.env.local` — done (confirmed 2026-07-17)
- [x] Decide launch gate — **confirmed 2026-07-17: keep the recommended order.** S1–S4 ship PRO/PREMIUM-gated via the shared key; BYOK (S5) is what opens AI capture to FREE tier, not day one.
- [x] Privacy-policy wording drafted, approved, and live in `docs/06-legal-compliance/03_PRIVACY_POLICY.html` §5/§9 (2026-07-17)
- [x] Confirm with Eff: sending receipt images to a third-party AI provider under the PDPA notes — **approved 2026-07-17**

- [x] Fixed local dev misconfiguration found along the way: `apps/user-mobile-v2/.env.local`'s `EXPO_PUBLIC_API_BASE_URL` was pointing at `myexpensio-apps.vercel.app` (the static PWA shell, no API capability — confirmed by fetching `/api/scan/process` there and getting the same static HTML back) instead of the real backend. Corrected to `https://myexpensio-jade.vercel.app` (2026-07-17).

**S0 complete.** Ready to start S1.

**No app version bump.**

---

## Sprint 1 — Receipt Auto-fill (Web, shared key)

**Goal:** `/api/ai/extract-receipt` live and callable; claim form pre-fills from a receipt photo in `apps/user`. Feature flag off by default in production.
**Version bump:** user app `4.18.0` → `4.19.0`

### Tasks — done 2026-07-17
- [x] `POST /api/ai/extract-receipt` (`apps/user/app/api/ai/extract-receipt/route.ts`) — accepts base64 image, calls Gemini (`gemini-2.5-flash`, overridable via `GEMINI_MODEL`) with a `responseSchema` for `{ amount, currency, date, merchant, category_guess, confidence }`. No new npm dependency — raw `fetch` to the Gemini REST endpoint.
- [x] Auth via `createClientForRequest()` (the mobile-Bearer + web-cookie pattern already used by `/api/exports`) rather than the plain `/api/scan/process` pattern — means this route is already S2-ready, no rework needed when mobile wires it up.
- [x] Tier gate — **server-side only**, matching this codebase's actual convention (there is no client-side feature-gate hook in `apps/user`, unlike mobile's `featureGates.ts` — checked, doesn't exist, didn't invent one for a single button). Uses the same `loadTierAndEntitlements()` used by `/api/exports`; FREE tier gets `403 UPGRADE_REQUIRED` with a clear message, `SUPER_ADMIN`/`SUPPORT` bypass for testing.
- [x] `ScanPreviewModal.tsx` calls the endpoint on confirm (RECEIPT purpose only, not ODOMETER — that's S3), shows "🤖 Reading receipt…" on the confirm button while it runs, passes results up via `onConfirm(blob, aiFields)`. `AiExtractedFields` type exported for the rest of the chain.
- [x] `ReceiptUploader.tsx` threads results up via a new optional `onExtracted` prop.
- [x] Graceful degrade — any Gemini error, timeout, or non-OK response resolves to `undefined` fields client-side; the confirm flow always completes, never blocks or throws on AI failure.
- [~] Server-side quota protection — **implemented as reactive 429-handling, not proactive per-org counting.** Sprint plan originally called for a call counter; built instead: catch Gemini's own `429` and return a clean `UPSTREAM_RATE_LIMITED` (503) rather than pre-emptively tracking usage per org. Simpler, avoids a new migration + RPC extension for a first pass, and Gemini's real-time limit is more accurate than a self-maintained counter would be. Revisit with real per-org counting if usage data shows it's actually needed.

### CORRECTION — 2026-07-17: original "Transport wired" claim was wrong
The first pass wired `apps/user/components/TransportModal.tsx` — which turned out to be **dead code**. `app/(app)/claims/[id]/page.tsx` defines and renders its own **local** `TollParkingModal`, `TransportModal`, `ExpenseModal`, and `MiscModal` functions; nothing in the app imports the standalone file (confirmed via a full-repo grep). Since those live modals already called `<ReceiptUploader enableScan={true} .../>` (defaulting to `purpose='RECEIPT'`), **every scan since S1 shipped was already calling the Gemini API and throwing the result away** — no `onExtracted`/`onAiError` was wired to catch it. Real cost, zero benefit, for every user who scanned a receipt in this window.

Fixed 2026-07-17 — wired `onExtracted`/`onAiError` into all four **actually-live** modals in `page.tsx`:
- `ExpenseModal` (MEAL + LODGING) — pre-fills amount/merchant always; date only for MEAL (LODGING's date is check-in, which a receipt's printed date doesn't reliably represent, so left alone)
- `TollParkingModal` (TOLL + PARKING) — pre-fills amount/date; merchant maps to entry location (TOLL) or location (PARKING)
- `TransportModal` (local — TAXI/GRAB/TRAIN/FLIGHT/BUS) — pre-fills amount/date/merchant
- `MiscModal` — pre-fills amount/date; merchant maps to the description field

`PER_DIEM` confirmed to have no receipt field at all (fixed daily rate) — correctly nothing to wire there.

Also fixed a latent bug in the pre-fill guard while doing this: the original `!claimDate` check never fires because these forms default `claimDate` to today's date (always truthy). Changed to `claimDate === today` so AI can actually pre-fill the date when the field is still at its untouched default.

**Disposition of `components/TransportModal.tsx`:** still exists, still AI-wired from the first pass, still unused by anything. Left in place pending Eff's call — delete as dead code, or keep as the target for a future refactor that moves `page.tsx`'s inline modals into `components/`.

### SECOND CORRECTION — 2026-07-17: `apps/user`'s pages aren't the product at all
Eff clarified directly: `apps/user-mobile-v2` (Expo — native app on Expo Go, and its own PWA export at `myexpensio-apps.vercel.app`) is the actual shipped product, with a local-first SQLite database. `apps/user` (`myexpensio-jade.vercel.app`) stays alive only as the `/api/*` backend that `user-mobile-v2` calls — its own website *pages* (everything under `apps/user/app/(app)/...`, including the whole page.tsx wiring described above) are not what users touch. This matches `docs/01-architecture/03_BACKEND_API_HOME_DECISION.md`'s framing but is a firmer, current statement of intent than that doc's "wait for the 2026-08-08 checkpoint" framing suggested.

**Net effect:** the `page.tsx` UI wiring above is harmless (still technically live at that URL) but not the real deliverable. The actual S1 UI was built fresh, same day, directly in `apps/user-mobile-v2`:

- `apps/user-mobile-v2/src/features/claims/components/ClaimDetail.tsx` — added `extractReceiptFields()` (mirrors web's version: reads the local file as base64 via `expo-file-system`, POSTs to `/api/ai/extract-receipt` with `Authorization: Bearer <session.accessToken>`, 25s abort timeout) and wired it into the existing `ReceiptCaptureField` component (which already had camera/gallery capture AND client-side tier gating via `canUseFeature(tier, "receipt_scan")` — that infrastructure pre-dated this work).
- Unlike the web version, the AI call is skipped client-side entirely when the account can't use the feature (`!canScan`) — web always called the endpoint and let the server 403; mobile already knows the tier, so it doesn't bother.
- Wired into both `AddClaimItemModal` (pre-fills amount/date/description, date only if still at today's default) and `EditClaimItemModal` (pre-fills amount/description only — deliberately never touches date on an existing item).
- Same conservative pattern throughout: never overwrites a field the user already typed into; shows a blue "✨ AI-suggested" hint on success, an amber hint with the reason on failure/low-confidence.

**Base URL note:** on native (Expo Go, real device), `getSyncBaseUrl()` resolves to the deployed `apps/user` API (`EXPO_PUBLIC_API_BASE_URL`, falling back to `myexpensio-jade.vercel.app`) — **not localhost**. This means testing on a phone requires `apps/user`'s `/api/ai/extract-receipt` route to actually be pushed and deployed, with `GEMINI_API_KEY` set in that Vercel project's dashboard env vars (not just local `.env.local`, which the deployed instance never reads). `apps/user-mobile-v2` itself needs no push to test locally via Expo Go — it runs straight from local files through the Metro bundler.

**Verification:** not run through `tsc`/Expo's type checker in this environment (mobile-v2's bash mount in this sandbox is stale for Edit-tool-modified files, same root cause as the earlier apps/user false-positive — confirmed via mtime/truncation check). All edited regions were re-read in full after editing and are structurally sound (balanced braces, complete JSX). **Run `pnpm --filter user-mobile-v2 tsc --noEmit` (or Expo's own type-check) locally to confirm before relying on this.**

### Verification note — updated 2026-07-17
Two separate verification passes now done:

1. **Mobile crash fix (this update).** The Expo Go crash Eff hit (`TypeError: Cannot read property 'length' of undefined`) was in the mobile app's own local photo pickers — **not related to S1's AI wiring** (S2 hasn't started; mobile isn't calling `/api/ai/extract-receipt` yet). Root cause: `result.canceled || result.assets.length === 0` in two places, which throws if `result.assets` itself is `undefined` (can happen when a picker is dismissed a specific way). Fixed to `result.canceled || !result.assets?.[0]` in both spots, matching the safe pattern already used elsewhere in this codebase (`SignatureModal.tsx`, `SignatureModal.web.tsx`, `TngScreen.tsx`). Confirmed via `grep` across the full `apps/user-mobile-v2/src` tree: zero remaining occurrences of the unsafe `result.assets.length` pattern anywhere.
   - `apps/user-mobile-v2/src/features/claims/components/ClaimDetail.tsx:2376` (receipt picker)
   - `apps/user-mobile-v2/src/features/trips/components/TripsScreen.tsx:2839` (odometer picker)

2. **S1 web files — full `tsc` syntax verification (this update).** An earlier verification attempt in this environment reported three syntax errors (`ScanPreviewModal.tsx`, `ReceiptUploader.tsx`, `TransportModal.tsx`). Root-caused today: the sandbox's file mount was serving a **stale, truncated snapshot from March 2026** for those three files — confirmed by mtime and by finding the mount's copy of `TransportModal.tsx` literally cut off mid-string. The actual files were never broken. Re-verified against the real, current files (read fresh, then syntax-checked in isolation with the TypeScript compiler): **zero syntax errors** in `ScanPreviewModal.tsx`, `ReceiptUploader.tsx`, `TransportModal.tsx`, or `app/api/ai/extract-receipt/route.ts`. This environment still can't run a full project-mode `tsc --noEmit` (monorepo path aliases + `node_modules` aren't reliably reachable here), so **please still run `pnpm --filter user tsc --noEmit` once locally** before deploying — that remains the authoritative check — but the syntax-level risk that was blocking this update is resolved.

### Testing checklist (manual, once deployed/running locally)
- [ ] Happy path: clear photo → correct amount/date/merchant pre-filled in a Parking/Taxi/Grab/Train/Flight item
- [ ] Messy photo (crumpled, low light) → degrades cleanly (low confidence / nulls), doesn't crash, doesn't overwrite anything
- [ ] FREE-tier user → `403 UPGRADE_REQUIRED`, confirm form still works via manual entry (AI call just silently skips pre-fill)
- [ ] Type in amount/merchant *before* scanning → confirm AI results do NOT overwrite what was already typed
- [ ] `GEMINI_API_KEY` temporarily unset → confirm clean `SERVER_ERROR` degrade, not a crash
- [ ] TOLL item (no receipt field) → confirm nothing AI-related appears, unaffected

---

## Sprint 2 — Receipt Auto-fill (Mobile + tier gate)

**Goal:** Same capability inside `apps/user-mobile-v2`, respecting local-first/offline rules.
**Version bump:** user-mobile-v2 `0.1.0` → `0.2.0`

### Tasks
- [ ] Extend `ReceiptPickerField.tsx`: after a photo is picked (and device is online), offer "Auto-fill from photo"
- [ ] If offline: photo still attaches via the existing sync queue (`receiptUploadEngine.ts`) exactly as today; auto-fill is deferred and surfaced as "Auto-fill available" once connectivity returns — do not block claim creation on AI availability
- [ ] `canUseFeature(tier, "ai_receipt_scan")` gate, same PRO/PREMIUM pattern as `receipt_scan`
- [ ] Parallel QA against the web app's S1 behavior (same prompt/schema, same review-before-save UX)

### Testing checklist
- [ ] Offline capture → photo saved, auto-fill prompt appears only after sync
- [ ] Online capture → same behavior as web (S1)
- [ ] Dead-letter/retry queue unaffected by AI calls (AI is a separate, non-blocking pass)

---

## Sprint 3 — Odometer AI Reading

**Goal:** Photograph the odometer → numeric reading proposed directly, replacing the *manual read* step (not yet replacing `scan_service` itself — see S7).
**Version bump:** user `4.19.0` → `4.20.0`, mobile `0.2.0` → `0.3.0`

### Tasks
- [ ] `POST /api/ai/extract-odometer` — same pattern as S1, schema `{ reading_km, confidence }`
- [ ] Wire into the existing odometer trip-entry flow (web + mobile) as a proposed value the user confirms — `final_distance_m` is only written after confirmation, unchanged single-source-of-truth rule
- [ ] Keep `scan_service`'s `/process` ODOMETER mode running in parallel as the fallback if Gemini is unavailable/unset
- [ ] Add `ai_odometer_scan` feature gate (PRO/PREMIUM)

### Testing checklist
- [ ] Mechanical, LCD-light, and backlit-LCD odometer photos (the three scenes `scan_service` already handles) all produce a sane reading or a clear "couldn't read this, enter manually" — no silent wrong numbers
- [ ] Confirmed reading matches what gets written to `final_distance_m`
- [ ] Claim/trip distance audit trail unaffected

---

## Sprint 4 — Voice Claim Entry (cloud)

**Goal:** Record a short voice note → structured claim draft (amount, category, location, date, note).
**Version bump:** user `4.20.0` → `4.21.0`, mobile `0.3.0` → `0.4.0`

### Tasks
- [ ] `POST /api/ai/parse-voice-claim` — accepts base64 audio, Gemini audio-understanding call with `responseSchema`
- [ ] Mic button on the claim-creation screen (web + mobile); record → upload → show draft → user reviews/edits → save
- [ ] `ai_voice_claim` feature gate (PRO/PREMIUM)
- [ ] Offline: allow recording and local storage of the raw audio note even without connectivity; parsing deferred until online (same deferred-pass pattern as S2)

### Testing checklist
- [ ] Clear speech in a quiet room → correct fields
- [ ] Background noise / accented English or Malay → degrades to "couldn't parse — here's the raw note, fill in manually" rather than wrong data
- [ ] Offline recording → queued correctly, parsed on reconnect

---

## Sprint 5 — Bring-Your-Own-Key (BYOK)

**Goal:** Settings lets a user paste their own free Gemini key; client calls Gemini directly with it, bypassing `/api/ai/*` and myexpensio's quota entirely. Opens AI capture to FREE tier when a key is set.
**Version bump:** user `4.21.0` → `4.22.0`, mobile `0.4.0` → `0.5.0`
**Built 2026-07-18** — receipt scanning only (S1 is the only shipped AI feature so far; odometer/voice BYOK wiring is deferred to when S3/S4 are actually built, per the note below).

### Tasks
- [x] Settings field: "Use your own free Google Gemini key," link to Google AI Studio signup, help text explaining it's optional and stored only on-device — `App.tsx`'s `AiByokCard` in the new "AI Receipt Scanning" accordion
- [x] **Test key** button — one lightweight validation call before saving — `testGeminiKey()` in `geminiDirectClient.ts` hits Gemini's `models` list endpoint (cheap, no image tokens spent) before the key is stored
- [x] Storage: `expo-secure-store` on mobile, `localStorage` on web — key never transmitted to or stored by myexpensio's servers — `byokKeyStore.ts`
- [x] Client-side Gemini call path (same `responseSchema`/prompt/model as S1) used whenever a user key is present; falls back to the existing `/api/ai/*` shared-key path otherwise — `extractReceiptFieldsDirect()` in `geminiDirectClient.ts`, branched in `ReceiptCaptureField.handlePicked()` (`ClaimDetail.tsx`)
- [x] Update feature gate: `receipt_scan` becomes available on FREE tier when a user key is set (`canScan = canUseFeature(tier, "receipt_scan") || !!byokKey`); otherwise still PRO/PREMIUM-gated via the shared key. `ai_odometer_scan`/`ai_voice_claim` don't exist yet (S3/S4 not built) — apply the same `|| !!byokKey` pattern to their gates when those sprints land.
- [x] No new DB table needed for the key itself (by design — it never leaves the device) — confirmed, no migration added

### Testing checklist
- [ ] Valid key saves and passes Test-key check
- [ ] Invalid/expired key fails Test-key check with a clear message, doesn't silently break capture
- [ ] FREE-tier user with a valid key can scan receipts (odometer/voice N/A — not built yet)
- [ ] FREE-tier user without a key still sees the normal upgrade prompt
- [ ] Removing a saved key reverts cleanly to the shared-key/manual fallback chain
- [ ] `pnpm --filter user-mobile-v2 tsc --noEmit` clean (not yet run — sandbox can't verify, needs Eff to confirm)

---

## Sprint 6 — On-device Fast Path (Android)

**Goal:** On supported Android devices (Pixel 8+/Galaxy S24+ class), use ML Kit GenAI (Gemini Nano via AICore) for image description as a free, offline, zero-quota-impact path; fall back to cloud everywhere else.
**Version bump:** mobile `0.5.0` → `0.6.0`

### Tasks
- [ ] Device-capability check (AICore availability) — feature-detect, don't assume
- [ ] Route receipt/odometer capture through ML Kit GenAI Image Description when available, cloud path (S1/S3, BYOK-aware) otherwise
- [ ] No UI difference to the user beyond "works offline on supported devices" — same review-before-save flow throughout

### Testing checklist
- [ ] Supported device, offline → AI capture still works
- [ ] Unsupported device → falls back to cloud path without user-visible error
- [ ] No regression to iOS/PWA users (this sprint is additive, Android-only)

---

## Sprint 7 — Audit Trail, Compliance Polish & `scan_service` Decision

**Goal:** Close the loop — decide `scan_service`'s fate, finish the audit trail, ship a stable release.
**Version bump:** user `4.22.0` → `4.23.0`, mobile `0.6.0` → `0.7.0`

### Tasks
- [ ] Add `ai_extracted BOOLEAN` + `ai_confidence NUMERIC` to relevant claim-item/trip columns (migration, RLS unaffected — additive columns only)
- [ ] Exports show which fields were AI-suggested vs. hand-entered (supports the audit-friendly goal from the top-level project brief)
- [ ] Decision with Eff: keep `scan_service` running as the odometer/receipt fallback indefinitely, or retire it now that AI extraction has proven reliable across S1–S6 (Render.com hosting cost consideration)
- [ ] Finalize the privacy-policy paragraph drafted in S0 into the live `docs/06-legal-compliance/03_PRIVACY_POLICY.html`
- [ ] Update `docs/00_INDEX.md` and this repo's `progress_checklist.md` to mark AI Capture Upgrade complete

### Testing checklist
- [ ] Full regression pass: claim lock, export correctness (CSV/XLSX/PDF), offline sync, all three AI features, BYOK, on-device fallback
- [ ] Confirm no change to `final_distance_m` semantics or `SUBMITTED` immutability anywhere in the new code paths

---

## Open Items Carried From the Spec (still need Eff's call)

- Launch gate: PRO/PREMIUM only vs. PRO/PREMIUM+FREE-via-BYOK from day one (S0)
- PDPA/compliance sign-off on sending images/audio to Google's Gemini API (S0 — blocking)
- `scan_service` retire-or-keep decision (S7 — not blocking, revisit once AI path is proven)
