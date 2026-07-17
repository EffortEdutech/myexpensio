# S1 — AI Receipt Pre-fill: Manual Test Checklist (mobile-v2)

**Rewritten:** 2026-07-17. Tests the real product — `apps/user-mobile-v2` (Expo, run via Expo Go on your phone, or the web export at myexpensio-apps). The previous version of this doc tested `apps/user`'s website pages, which are not shipped; replaced.

**Backend it calls:** `myexpensio` project → `myexpensio-jade.vercel.app` (`/api/ai/extract-receipt`). Vercel build is green as of today, so this should hit live code.

**Scope:** every claim item type wired for AI pre-fill: Toll, Parking, Transport (Grab/Taxi/Train/Bus/Flight), Meal, Lodging, Per Diem, Misc. Mileage has no receipt field — not applicable, skip it.

---

## 0. Setup (once)

- [ ] Open the app on your phone via Expo Go (or `pnpm --filter user-mobile-v2 web` if testing in browser)
- [ ] Sign in with a **PRO/PREMIUM** account (or `SUPER_ADMIN`/`SUPPORT`) for the main pass — FREE tier is tested separately in section 7
- [ ] Open a **DRAFT** claim (submitted/locked claims won't show the add-item grid)
- [ ] Have 1–2 real receipt photos ready — printed amount + date + merchant makes accuracy easiest to check

---

## 1. Add flow — general pattern (test once on Misc, then spot-check others)

1. [ ] Tap **+ Add Item** (or however the item grid opens), pick **📦 Misc**
2. [ ] Under "Receipt (optional)", tap **📷 Scan Document**
3. [ ] While processing: row shows a spinner + **"🤖 Reading receipt…"**
4. [ ] **Expect:** a highlighted bar appears — **"✨ AI-suggested from your receipt — review before saving"**
5. [ ] **Expect:** Amount pre-fills if it was blank; Description pre-fills from the receipt's merchant if it was blank
6. [ ] Pre-filled fields stay editable — change one, confirm your edit sticks (not overwritten again)
7. [ ] Save the item — saves normally

## 2. Toll / Parking

1. [ ] Tap **🛣️ Toll** (repeat later for **🅿️ Parking**)
2. [ ] Confirm the **TNG toggle is OFF** — when it's ON, the Amount field is replaced entirely (TNG import provides the amount), so AI amount-fill has nothing to fill into. Test with it OFF.
3. [ ] Scan a receipt → same AI-suggested bar, Amount + Description pre-fill

## 3. Transport (Grab / Taxi / Train / Bus / Flight)

1. [ ] Tap **🚕 Transport**, pick a type (e.g. Grab)
2. [ ] If a "Paid via TNG" toggle is visible, leave it OFF for this test
3. [ ] Scan a receipt → Amount + Description pre-fill

## 4. Meal

1. [ ] Tap **🍽 Meal**, switch to **Receipt** mode (not Fixed Rate — fixed-rate meals have no amount field to fill)
2. [ ] Scan a receipt → Amount, Description, **and Date** pre-fill
3. [ ] Date only pre-fills if you hadn't already changed it from today's default — change the date first, rescan, confirm it's left alone

## 5. Lodging

1. [ ] Tap **🏨 Lodging**, switch to **Receipt** mode
2. [ ] Scan a receipt → Amount + Description pre-fill

## 6. Per Diem

1. [ ] Tap **🧾 Per Diem**
2. [ ] Scan a receipt → Description pre-fills if blank (Per Diem has no free-entry Amount field, so only Description/Date behavior applies — confirm nothing breaks)

## 7. FREE tier / negative cases

- [ ] **FREE tier account, tap Scan Document:** a native popup appears — **"PRO Feature — Camera scanning requires a PRO subscription. Upgrade in Settings → Billing to unlock."** No camera opens.
- [ ] **FREE tier account, tap Attach from Gallery:** photo attaches normally (gallery is not blocked) but **no AI runs** — no spinner, no hint bar, no error. This is correct: silent skip, not a failure.
- [ ] **Type a value first:** enter an amount manually, then scan a receipt with a different amount → your typed value must NOT be overwritten
- [ ] **Blurry/unreadable photo:** scan a bad photo → hint bar reads **"🤖 AI couldn't read this receipt clearly — please enter the details manually."** (or, if it read but had nothing new to add, **"🤖 AI read the receipt but had nothing new to fill in."**) — never a crash, never a blocked save

## 8. Edit an existing item

1. [ ] Open an existing claim item, tap **Edit**
2. [ ] Scan/replace the receipt → same AI-suggested bar
3. [ ] **Expect:** Amount and Description/Title pre-fill if blank
4. [ ] **Expect:** Date is NEVER touched here (editing an item with a real existing date — only the Add flow touches date)

---

## Pass criteria

All item types except Mileage show the AI-suggested bar and correct pre-fill on scan; Per Diem and Meal/Lodging fixed-rate modes behave as noted above; FREE tier blocks camera with a popup but still allows manual gallery attach; typed-first values are never overwritten; bad photos degrade to a clear error, never a crash; Edit never touches date.
