# PWA vs Mobile V2 — Feature Parity Tracker

Last updated: 2026-06-09 (Sprints 0–18 complete)

This table tracks feature parity between the production PWA (`apps/user`) and the new
local-first mobile app (`apps/user-mobile-v2`). Update the Mobile V2 column as sprints
are signed off.

Legend: ✅ Done · ⚠️ Partial / stub · ❌ Not yet built · 🚫 Deferred to Sprint 19+

---

## Auth

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Login | ✅ | ✅ | |
| Session restore | ✅ | ✅ | |
| Biometric lock on resume | ✅ | ✅ | Sprint 15 ✅ — AppState-triggered lock overlay |
| Forgot password | ✅ | 🚫 | Deferred — deep-link handling not implemented |
| Accept invite | ✅ | 🚫 | Deferred — requires deep-link + org onboarding flow |
| Change password | ✅ | 🚫 | Deferred |
| First-time setup page | ✅ | 🚫 | Deferred |

---

## Home

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Dashboard (stats, recent trips/claims) | ✅ | 🚫 | Placeholder only — deferred to Sprint 19 |

---

## Work Space — Claims

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Claims list | ✅ | ✅ | FlatList virtualised — Sprint 14 ✅ |
| New claim | ✅ | ✅ | |
| Claim detail | ✅ | ✅ | |
| Mileage item | ✅ | ✅ | |
| Toll item | ✅ | ✅ | |
| Parking item | ✅ | ✅ | |
| Transport item (Grab/Taxi/Train/Bus/Flight) | ✅ | ✅ | |
| Meal item + meal_session field | ✅ | ✅ | Sprint 15 ✅ — rich metadata |
| Lodging item + check-in/out dates | ✅ | ✅ | Sprint 15 ✅ — rich metadata |
| Per Diem item + days/rate/destination | ✅ | ✅ | Sprint 15 ✅ — rich metadata |
| Misc item | ✅ | ✅ | V2 uses type "other" |
| Receipt attach / view / remove per item | ✅ | ✅ | |
| TNG link from claim item | ✅ | ✅ | |
| TNG unlink | ✅ | ✅ | |
| Draft / Submit lock | ✅ | ✅ | |
| Claim awaiting approval badge (EMPLOYEE) | ✅ | 🚫 | Deferred to Sprint 19 |

---

## Work Space — Trips

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Trips list | ✅ | ✅ | FlatList virtualised — Sprint 14 ✅ |
| Odometer trip | ✅ | ✅ | |
| Route / planned trip (map) | ✅ | ✅ | V2 web only via Leaflet |
| GPS trip (real tracking) | ✅ | ⚠️ | Draft mode only — no real GPS point tracking yet |
| Trip detail | ✅ | ✅ | |
| Add mileage item to claim from trip | ✅ | ✅ | |
| GPS simulator (dev tool) | ✅ | 🚫 | Deferred |

---

## Work Space — TNG

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Statement import | ✅ | ✅ | FlatList virtualised — Sprint 14 ✅ |
| Transaction library + filters | ✅ | ✅ | |
| Statement delete | ✅ | ✅ | |
| Backend PDF parsing | ✅ | 🚫 | Deferred — V2 uses CSV import only |

---

## Work Space — Transactions

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Unified transactions tab (TNG + claim items) | ✅ | 🚫 | Deferred to Sprint 19 |

---

## Work Space — Exports

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Export screen | ✅ | ✅ | |
| CSV export | ✅ | ✅ | |
| XLSX export | ✅ | ✅ | Sprint 12 ✅ — on-device via SheetJS |
| PDF export | ✅ | ✅ | Sprint 7 ✅ — on-device via expo-print |
| PDF with signature | ✅ | ✅ | Sprint 10 ✅ — draw + upload tabs |
| PDF grouping (by date / by category) | ✅ | ✅ | Sprint 9 ✅ |
| Export history | ✅ | ✅ | |
| Usage limits enforcement | ✅ | ✅ | |

---

## Personal Space

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Personal home (yearly stats) | ✅ | ✅ | Sprint 8 ✅ |
| Add personal expense | ✅ | ✅ | Sprint 8 ✅ |
| Personal expenses list | ✅ | ✅ | Sprint 8 ✅ |
| Attach receipt to personal expense | ✅ | ✅ | Sprint 17 ✅ — camera + gallery |
| Bills & commitments list | ✅ | ✅ | Sprint 8 ✅ |
| Add / manage bill | ✅ | ✅ | Sprint 8 ✅ |
| Tax deduction summary (LHDN) | ✅ | ✅ | Sprint 8 ✅ |

---

## Business Space

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Business dashboard (P&L) | ✅ | ✅ | Sprint 9 ✅ |
| Income list + add income | ✅ | ✅ | Sprint 9 ✅ |
| Expense list + add expense | ✅ | ✅ | Sprint 9 ✅ |
| Attach receipt to business expense | ✅ | ✅ | Sprint 17 ✅ — camera + gallery |
| Business reports | ✅ | ✅ | Sprint 9 ✅ |

---

## Settings & Org

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Profile (display name, dept, location) | ✅ | ⚠️ | Form exists, no backend save yet |
| Mileage rates | ✅ | ✅ | Local + role-gated Sprint 16 ✅ |
| Meal rates (per session) | ✅ | ⚠️ | Partial — session breakdown not fully exposed |
| Lodging rates | ✅ | ⚠️ | Partial |
| Per Diem rates | ✅ | ✅ | Local only |
| Billing settings | ✅ | ✅ | Sprint 10 ✅ |
| Org role awareness (OWNER/ADMIN/EMPLOYEE) | ✅ | ✅ | Sprint 16 ✅ — useOrgContext hook |
| Rates gate (OWNER/ADMIN only) | ✅ | ✅ | Sprint 16 ✅ |
| ORG subscription tier resolution | ✅ | ✅ | Sprint 16 ✅ |

---

## Upgrade / Billing

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Plan comparison page | ✅ | ⚠️ | Opens Stripe checkout (no in-app comparison UI) |
| Upgrade flow + success | ✅ | ✅ | Sprint 10 ✅ — Stripe checkout via browser |

---

## Backend & Infrastructure

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Supabase auth (real) | ✅ | ✅ | Sprint 10 ✅ |
| All data synced to server | ✅ | ✅ | Sprint 11/12 ✅ |
| Org context in bootstrap payload | ✅ | ✅ | Sprint 16 ✅ |
| Performance indexes (SQLite) | N/A | ✅ | Sprint 14 ✅ — 8 partial indexes |
| FlatList virtualisation | N/A | ✅ | Sprint 14 ✅ — claims, trips, TNG |
| Keyboard-safe forms | N/A | ✅ | Sprint 14 ✅ — KeyboardSafeScrollView |
| Loading skeletons + error states | N/A | ✅ | Sprint 14 ✅ |
| Offline banner / recovery page | ✅ | 🚫 | Native handles offline differently — deferred |

---

## Summary (as of Sprint 18)

| Status | Count |
|---|---|
| ✅ Full parity | ~45 |
| ⚠️ Partial / stub | ~5 |
| 🚫 Deferred to Sprint 19+ | ~12 |

### Deferred gaps (documented, not blockers for launch)

| Gap | Reason deferred |
|---|---|
| Forgot password / change password | Requires deep-link setup — Sprint 19 |
| Accept invite flow | Requires deep-link + org onboarding — Sprint 19 |
| Dashboard home stats | Low-priority UX — Sprint 19 |
| Unified transactions tab | Non-critical for launch — Sprint 19 |
| GPS real point tracking | Works in draft mode; edge case for most users |
| TNG backend PDF parsing | CSV import covers majority of users |
| Claim awaiting approval badge | EMPLOYEE workflow UX polish — Sprint 19 |
| Profile backend save | Form works locally; sync deferred — Sprint 19 |
| Offline banner | Native OS handles offline indication adequately |
