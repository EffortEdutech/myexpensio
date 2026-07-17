# myexpensio — AI-Assisted Capture (Receipts, Odometer, Voice): Research & Spec

**Version:** 1.0
**Date:** 2026-07-17
**Status:** Draft for review — research/proposal, no code written yet

---

## 1. Overview

Today, capturing a claim in myexpensio still requires the user to do all the thinking: photograph a receipt, wait for `scan_service` to sharpen the image, then manually type the amount, date, merchant, and category. Odometer readings work the same way — a ~600-line OpenCV heuristic pipeline (`scan_service/main.py`) tries to locate and enhance the digit display, but a human still reads the number and types it in.

This doc proposes replacing that manual-entry step with AI: point the camera or speak, and the claim form fills itself in, with the user only confirming or correcting. It also answers the three specific questions raised — using the phone's on-device Gemini, using free cloud AI, and whether voice input is realistic on a zero-budget stack.

**Design principle:** AI drafts, the human confirms. Nothing gets written to a claim or submitted without the user seeing and approving the extracted fields first — this preserves the audit-friendly, dispute-resistant intent behind the existing evidence-capture design, and keeps the `SUBMITTED` lock model untouched.

---

## 2. What exists today (confirmed by reading the code)

- `scan_service/main.py` (FastAPI + OpenCV, hosted on Render.com) only does image **enhancement** — perspective warp, CLAHE contrast, sharpening, and a scene-classifying odometer-ROI detector. It does **not** read any text or digits. No OCR, no AI, anywhere in the stack today.
- `apps/user-mobile-v2` has zero AI/OCR/speech dependencies (checked `package.json` — only `expo-image-picker`, `expo-file-system`, etc.).
- Sprint 3 planning docs explicitly scoped OCR/AI **out** of the mobile rewrite ("No paid maps, OCR, AI, storage, or background job provider" — zero-budget discipline, confirmed).
- `ReceiptPickerField.tsx` just opens the camera/gallery and stores a URI — no processing at all on mobile today (the OpenCV enhance call only exists in the web app, `apps/user/app/api/scan/process/route.ts`).
- `receipt_scan` is already gated `PRO`-only in `apps/user-mobile-v2/src/features/subscription/featureGates.ts`. This existing gate is the natural attachment point for AI features too.

So this isn't a retrofit — it's genuinely greenfield. That also means there's no legacy OCR pipeline to migrate off of; the question is purely "what's the best free/cheap path in mid-2026."

---

## 3. Answering the specific questions

### "Can we use the phone's Gemini that's already installed?"

Worth being precise here, because there are two different things people mean by this, and only one is real:

- **The Gemini *app*** pre-installed on Android phones is a consumer chat app. It has no public API a third-party app like myexpensio can call programmatically. There's no way to silently hand it a receipt photo and get JSON back — a user could manually share a photo *to* the Gemini app themselves, but that's a manual detour outside myexpensio, not an integration.
- **Gemini Nano on-device via ML Kit GenAI APIs** is the real, callable thing. Since mid-2025, Google ships ML Kit GenAI APIs (Summarization, Proofreading, Rewriting, Image Description, and a general-purpose Prompt API) that run Gemini Nano locally through Android's AICore, at zero API cost, fully offline, data never leaving the device. As of the Pixel 10 generation this runs the newer "nano-v3" model. This *is* usable from a native Android app.

**The catch:** AICore/Gemini Nano is only available on a subset of devices (Pixel 8 and up, recent Samsung Galaxy S24/S25-class phones, best on Pixel 10). It is Android-only — no iOS, no web/PWA. Given myexpensio's actual platform strategy right now (per `SHIP_READINESS_ACTION_PLAN.md`: PWA is the path that gets iOS users a real experience, Android native is gated on a Play Console signup that's deferred), an Android-only, newer-device-only capability can't be the primary engine — device coverage would be too patchy for a v1. It's a legitimate **phase 2 fast-path** (see §6), not the foundation.

### "Free cloud AI, if possible?"

Yes — this is the more practical foundation, and it fits zero-budget discipline better than it sounds:

- The **Gemini API free tier** (via Google AI Studio, no credit card) is, per current docs, the only major LLM provider with an indefinite free tier — no expiry. As of mid-2026 the recommended free-tier model is Gemini Flash/Flash-Lite family (Pro was pulled from the free tier in April 2026). Typical free-tier shape: ~10 requests/minute, ~250–1,500 requests/day, 250K tokens/minute, shared across the whole Google Cloud project.
- Free tier is **fully multimodal** — image, audio, video, and text all count as normal input, no extra cost tier for vision like some competitors. This means one API call can take a receipt photo and return structured JSON (amount, date, merchant, category) directly, using Gemini's `responseSchema` structured-output feature — this is now a well-established pattern (multiple 2026 write-ups treat "Gemini for OCR + structured JSON" as the default approach, cheaper and more accurate than classic OCR+regex for messy real-world receipts).
- The same free tier accepts **audio input directly** — a voice note can be sent straight to Gemini and transcribed *and* interpreted in one call (no separate speech-to-text step needed for the "smart" path — see §5).

**The real constraint isn't "is it free," it's "is it free at your scale."** The free-tier quota (10 RPM / ~250–1,500 RPD) is per Google Cloud *project*, not per user. If every myexpensio user's AI scan hits the same server-side API key, a handful of active users could exhaust the daily quota. This is why §6 recommends gating AI capture behind PRO/PREMIUM initially (mirrors the existing `receipt_scan: "PRO"` gate) — it keeps usage within a predictable, small user base while the feature proves itself, with a clear "start paying Google a few dollars once volume justifies it" escalation path later (consistent with the project's "present paid options only as a future enhancement" rule).

### "Voice instruction?"

Two viable tiers, worth building in this order:

1. **Cloud-first (v1, ships fastest):** record a short voice note, send the raw audio straight to Gemini free tier with a JSON-schema prompt ("extract amount, category, merchant/location, note from this claim description"). One network call does transcription + understanding + structuring together — no separate STT library needed, works identically on web, iOS PWA, and Android.
2. **On-device STT (phase 2, optional, offline-friendly):** `expo-speech-recognition` (actively maintained, wraps Android's native `SpeechRecognizer` and iOS's `SFSpeechRecognizer`) gives free, on-device transcription without a network call. Useful because myexpensio's mobile app is explicitly local-first/offline-capable — this lets a user dictate a claim note while offline, with the "structuring into fields" step deferred until the sync engine has connectivity (same pattern already used for the offline claims/receipt queue).

Not recommended: `react-native-voice` — it's effectively unmaintained relative to `expo-speech-recognition`, and requires the Google Speech Recognition Engine package which not all Android builds have.

---

## 4. Proposed features

### A. AI Receipt Capture & Auto-fill

**What it does (user-facing):** user photographs a receipt → within a couple seconds the claim form pre-fills amount, date, merchant/vendor, and a best-guess category → user reviews and taps save. Zero manual typing in the common case.

**Why it matters:** this is the actual "minimum effort" ask — today the photo capture step doesn't save the user any typing at all. It also reduces disputes: capturing merchant/date/amount consistently as structured data (rather than "whatever the user remembered to type") makes exports more audit-friendly, which is a stated project goal.

### B. AI Odometer Reading

**What it does:** photograph the odometer → the numeric reading is extracted directly, no manual digit entry, and — because a vision model reads the actual digits rather than trying to guess a display region — this can **replace** the ~600 lines of scene-classification/ROI-detection heuristics in `scan_service` (mechanical vs. LCD vs. backlit branches, warm-pixel detection, etc.). That code exists because classic OpenCV has no idea what a "7" looks like; it can only guess where digits probably are. A vision-language model doesn't need the guessing step at all — it reads the number. This is a genuine simplification, not just a bolt-on, and removes a meaningful maintenance burden (and possibly the Render.com hosting cost for `scan_service` entirely, once receipts don't need the enhance step either — see open question in §7).

**Auditability:** `final_distance_m` remains the single source of truth per the locked baseline — AI only proposes the reading; the user still confirms it before it's stored, same as today's manual entry. No change to the distance-calculation contract.

### C. Voice Claim Entry

**What it does:** tap a mic button, say something like "forty-five ringgit parking at KLCC today" → a draft claim appears with amount, category, location, and date pre-filled → user reviews and saves. Useful for claims with no receipt (parking, tolls without TNG evidence, tips) where photographing a receipt was never possible anyway — the alternative today is fully manual typing, so this is a clean effort reduction with no regression risk.

---

## 5. Implementation sketch

### Provider & data flow
- New server-side endpoints in `apps/user` (Next.js), following the exact pattern already used for `scan_service`: `GEMINI_API_KEY` stays server-only (env var, never shipped to client), proxied through routes like `/api/ai/extract-receipt`, `/api/ai/extract-odometer`, `/api/ai/parse-voice-claim`.
- Each call sends the image (or audio) plus a strict `responseSchema` (JSON Schema) so Gemini returns typed fields, not free text — this avoids brittle regex-parsing of a text response.
- Client receives the structured draft, pre-fills the existing claim form components, and stops there — no auto-submit, no auto-lock. The user's existing edit/save flow is unchanged; AI just pre-populates it.

### Tier gating
- Extend the existing `FeatureKey` gate list (`featureGates.ts`) with `ai_receipt_scan`, `ai_odometer_scan`, `ai_voice_claim`, gated `PRO`/`PREMIUM` initially — mirrors the current `receipt_scan: "PRO"` pattern and keeps Gemini free-tier usage within a bounded, predictable user count while the feature is new.
- Server-side: rate-limit/queue AI calls per org (not just per client) so one workspace can't exhaust the shared free-tier quota; on quota exhaustion, degrade gracefully to "AI unavailable right now — enter manually," never a hard failure.

### Offline behavior
- If offline: photo/audio still attaches locally via the existing sync queue (`receiptUploadEngine.ts`, local-first SQLite) exactly as today. The AI "auto-fill" pass is deferred until connectivity returns, surfaced as a soft prompt ("Auto-fill available — tap to apply") rather than blocking claim creation. This matches the existing dead-letter/retry pattern already built for sync.

### Data/audit trail (optional, phase 2)
- Consider an `ai_extracted: boolean` + `ai_confidence: numeric` pair of columns on claim items, so exports can show which fields were AI-suggested vs. hand-typed — supports the "audit-friendly" goal without changing the locked `final_distance_m` / claim-lock rules.

### Privacy / PDPA note
- Cloud path sends receipt/odometer images and voice notes to Google's Gemini API. Flag this for a line in the privacy policy (`docs/06-legal-compliance/`) and confirm data-processing terms under Google AI Studio's free tier are acceptable for Malaysia PDPA — this needs a compliance check before shipping, not a code change.

---

## 6. Recommended path (zero-budget, minimum effort to ship)

1. **v1 — Cloud Gemini free tier, all three features (A/B/C), gated PRO/PREMIUM.** One provider, works identically across web, iOS PWA, and Android, no native-device fragmentation to test against. This is the fastest path to the actual user-facing goal ("minimum effort for user").
2. **v2 — On-device fallback for Android (ML Kit GenAI / Gemini Nano).** Once the feature is proven and Android native ships, add on-device Image Description / Prompt API as a fast, offline, zero-quota path *on supported devices only* (Pixel 8+/Galaxy S24+), falling back to the cloud path everywhere else. This is additive, not a rewrite.
3. **Retire or shrink `scan_service`.** Once AI extraction is live, re-evaluate whether the OpenCV enhance step is still needed at all — vision models tolerate noisy/uneven images far better than classic OCR did. If receipts also stop needing the enhance pass, `scan_service` could be retired, saving the Render.com hosting cost — worth a follow-up pass once v1 is validated, not before.

---

## 7. Open questions for Eff

- Which tier(s) should AI capture launch at — PRO only, or PRO+PREMIUM? (Affects how tight the free-tier quota math needs to be.)
- OK to send receipt/odometer photos and voice notes to Google's Gemini API (cloud), given PDPA notes already in `docs/06-legal-compliance/`? Needs a compliance sanity check, not just an engineering decision.
- Should `scan_service` be kept running in parallel during v1 (as a fallback if Gemini quota is hit), or retired immediately once AI extraction ships?

---

## Addendum (2026-07-17) — Bring-Your-Own-Key & Chrome On-Device AI

Two follow-up questions came up after v1.0: can users supply their own Gemini API key, and can we use the free Gemini Nano built into Chrome? Both are worth building in, but they solve different problems and land at different points in the roadmap.

### A. Bring-your-own-key (BYOK)

**What it solves:** §6 of this spec already flagged the real constraint on the cloud path — the free-tier quota (~10 RPM / ~250–1,500 RPD) is shared across *all* myexpensio users on one Google Cloud project. BYOK removes that ceiling entirely for any user who opts in, because the call runs against their own free Google account, not myexpensio's.

**How it works:**
- Settings gets an optional field: "Use your own free Google Gemini key for unlimited AI scanning," with a link to Google AI Studio (free, no card, ~2 minutes) and a **Test key** button that fires one cheap validation call before saving.
- The key is stored **client-side only** — `expo-secure-store` on mobile (already a dependency), secure browser storage on web — and is never sent to or stored by myexpensio's servers. When a user's key is present, the client calls Gemini **directly**, b