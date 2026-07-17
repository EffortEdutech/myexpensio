# S1 — AI Receipt Pre-fill: Manual Test Checklist

**⚠️ SUPERSEDED 2026-07-17 — DO NOT USE.** This checklist tests `apps/user`'s website pages, which are NOT the real product — Eff ships `apps/user-mobile-v2` (Expo, native + its own PWA at `myexpensio-apps.vercel.app`). `apps/user` stays alive only as the `/api/*` backend. The work below was built in the wrong app. See `docs/03-sprint-plans/ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md` for the corrected plan — AI pre-fill is being rebuilt directly in `apps/user-mobile-v2`. Left in place only as a record of what was (mis-)tested; not a valid test plan going forward.

**Date:** 2026-07-17
**Scope:** Verifies the 2026-07-17 fix — AI pre-fill wired into the actual live modals in `app/(app)/claims/[id]/page.tsx` (Meal, Lodging, Toll, Parking, Transport, Misc). Per Diem has no receipt field, not tested.

---

## 0. Setup (once)

- [ ] `cd apps/user && pnpm dev:user` (or `pnpm dev` from `apps/user/`)
- [ ] Open the app, sign in
- [ ] Confirm your test account is **PRO/PREMIUM**, or a `SUPER_ADMIN`/`SUPPORT` role — FREE tier will show the upgrade message instead of AI results (that's correct behavior, not a bug — see step 6)
- [ ] Open (or create) a **DRAFT** claim — locked/submitted claims won't show the "Add" buttons at all
- [ ] Have 1–2 real receipt photos ready (phone gallery or camera) — a printed amount + date + merchant makes it easiest to check accuracy
- [ ] Open the browser console (F12 → Console) and leave it open the whole time — every AI attempt logs there regardless of outcome

---

## 1. Meal (Receipt mode)

1. [ ] Tap **🍽 Meal**
2. [ ] Tap the **🧾 Receipt** toggle (not "⚡ Fixed Rate")
3. [ ] Under "Receipt Photo," tap **📷 Scan Document**
4. [ ] Capture/select a receipt photo → tap **⚡ Enhance** (optional) → tap **✓ Use Photo**
5. [ ] Button briefly reads **🤖 Reading receipt…**
6. [ ] **Expect:** blue bar "✨ AI-suggested from your receipt — review before saving" appears above the Amount field
7. [ ] **Expect:** Amount is pre-filled (if it was blank), Merchant is pre-filled (if blank)
8. [ ] **Expect:** Date pre-fills *only if you hadn't already changed it* from today's default
9. [ ] All pre-filled fields are still editable — change one, confirm it's not overwritten again
10. [ ] Tap **Add Meal** — item saves normally

## 2. Toll

1. [ ] Tap **🛣️ Toll**
2. [ ] Confirm **"Paid by TNG"** toggle is **OFF** (AI/receipt only apply when paying manually, not via TNG)
3. [ ] Under Receipt, tap **📷 Scan Document** → capture/select → **✓ Use Photo**
4. [ ] **Expect:** blue AI-suggested bar appears
5. [ ] **Expect:** Amount and Date pre-fill if blank/untouched
6. [ ] **Expect:** Entry Plaza pre-fills from the receipt's merchant field if it was blank (best-effort — check it makes sense, edit if not)
7. [ ] Tap **Add Toll** — item saves normally

## 3. Parking

Same as Toll (step 2), but:
- [ ] Tap **🅿️ Parking** instead
- [ ] **Expect:** "Location" field pre-fills instead of Entry Plaza

## 4. Transport (Grab / Taxi / Train / Bus / Flight)

1. [ ] Tap **🚕 Transport**
2. [ ] Pick a type, e.g. **Grab**
3. [ ] If "Paid via TNG" toggle is visible, leave it **OFF**
4. [ ] Under Receipt, scan/select a photo → **✓ Use Photo**
5. [ ] **Expect:** blue AI-suggested bar; Amount, Date, and Merchant/Route pre-fill if blank/untouched
6. [ ] Tap **Add Grab** — item saves normally
7. [ ] *(Optional)* repeat once for **Flight** to confirm the pattern holds for a different type

## 5. Lodging

1. [ ] Tap **🏨 Lodging**
2. [ ] Tap the **🧾 Receipt** toggle
3. [ ] Scan/select a photo → **✓ Use Photo**
4. [ ] **Expect:** blue AI-suggested bar; Amount and Merchant pre-fill if blank
5. [ ] **Expect:** Check-in/Check-out dates are **NOT** touched by AI (intentional — see sprint doc, receipt date ≠ check-in date)
6. [ ] Tap **Add Lodging** — item saves normally

## 6. Misc

1. [ ] Tap **📦 Misc**
2. [ ] Scan/select a receipt → **✓ Use Photo**
3. [ ] **Expect:** blue AI-suggested bar; Amount pre-fills if blank; Description pre-fills from the receipt's merchant *only if Description was empty*
4. [ ] Tap **Add Misc** — item saves normally

---

## 7. Negative / edge cases (quick pass)

- [ ] **FREE tier account** (if you have one to test with): scan any receipt → amber bar "🤖 AI receipt scanning is a PRO/PREMIUM feature…" instead of the blue bar. Manual entry still works.
- [ ] **Type a value before scanning:** e.g. type an amount into Misc, then scan a receipt with a different amount → your typed value must NOT be overwritten
- [ ] **Blurry/dark photo:** scan a bad photo → either low-confidence partial fill, or amber "AI couldn't read this receipt clearly" bar — never a crash, never a blocked form
- [ ] **Console check:** for every scan above, confirm a `[ScanPreviewModal] AI extraction...` log line appears (success shows nothing extra; failure logs `declined:` or `error:` with the reason)

---

## Pass criteria

All six item types (Meal, Toll, Parking, Transport, Lodging, Misc) show the blue AI-suggested bar and correct pre-fill behavior; PER_DIEM is untouched (no receipt field); no crashes; typed-first values are never overwritten; FREE tier degrades to manual entry cleanly.
