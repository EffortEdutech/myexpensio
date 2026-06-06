# PWA vs Mobile V2 — Feature Parity Tracker

Last updated: 2026-05-30 (Sprints 8, 9, 10, 11, 12 & 13 complete)

This table tracks feature parity between the production PWA (`apps/user`) and the new
local-first mobile app (`apps/user-mobile-v2`). Update the Mobile V2 column as sprints
are signed off.

Legend: ✅ Done · ⚠️ Partial / stub · ❌ Not yet built

---

## Auth

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Login | ✅ | ✅ | |
| Session restore | ✅ | ✅ | |
| Forgot password | ✅ | ❌ | |
| Accept invite | ✅ | ❌ | |
| Change password | ✅ | ❌ | |
| First-time setup page | ✅ | ❌ | |
| Biometric login | ✅ | ⚠️ | UI toggle exists, not wired to backend |

---

## Home

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Dashboard (stats, recent trips/claims) | ✅ | ❌ | Placeholder only |

---

## Work Space — Claims

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Claims list | ✅ | ✅ | |
| New claim | ✅ | ✅ | |
| Claim detail | ✅ | ✅ | |
| Mileage item | ✅ | ✅ | |
| Toll item | ✅ | ✅ | |
| Parking item | ✅ | ✅ | |
| Transport item (Grab/Taxi/Train/Bus/Flight) | ✅ | ✅ | |
| Meal item (per session rates) | ✅ | ✅ | |
| Lodging item | ✅ | ✅ | |
| Per Diem item | ✅ | ✅ | |
| Misc item | ✅ | ✅ | V2 uses type "other" |
| Receipt attach / view / remove per item | ✅ | ✅ | |
| TNG link from claim item | ✅ | ✅ | |
| TNG unlink | ✅ | ✅ | |
| Draft / Submit lock | ✅ | ✅ | |

---

## Work Space — Trips

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Trips list | ✅ | ✅ | |
| Odometer trip | ✅ | ✅ | |
| Route / planned trip (map) | ✅ | ✅ | V2 web only via Leaflet |
| GPS trip (real tracking) | ✅ | ⚠️ | Draft mode only — no real GPS point tracking yet |
| Trip detail | ✅ | ✅ | |
| Add mileage item to claim from trip | ✅ | ✅ | |
| GPS simulator (dev tool) | ✅ | ❌ | |

---

## Work Space — TNG

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Statement import | ✅ | ✅ | |
| Transaction library + filters | ✅ | ✅ | |
| Statement delete | ✅ | ✅ | |
| Backend PDF parsing | ✅ | ❌ | Deferred to Sprint 12 |

---

## Work Space — Transactions

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Unified transactions tab (TNG + claim items) | ✅ | ❌ | Not yet started |

---

## Work Space — Exports

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Export screen | ✅ | ✅ | |
| CSV export (real file download) | ✅ | ✅ | |
| XLSX export | ✅ | ❌ | Backend-required, locked with message |
| PDF export | ✅ | ❌ | Backend-required, locked with message |
| Export history | ✅ | ✅ | |
| Usage limits enforcement | ✅ | ✅ | |

---

## Personal Space

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Personal home (yearly stats) | ✅ | ✅ | Sprint 8 ✅ |
| Add personal expense | ✅ | ✅ | Sprint 8 ✅ |
| Personal expenses list | ✅ | ✅ | Sprint 8 ✅ |
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
| Business reports | ✅ | ✅ | Sprint 9 ✅ (PDF deferred Sprint 12) |

---

## Settings

| Feature | PWA | Mobile V2 | Notes |
|---|---|---|---|
| Profile (display name, dept, location) | ✅ | ⚠️ | Form exists, no backend save |
| Mileage rates | ✅ | ✅ | Local only |
| Meal rates (per session) | ✅ | ⚠️ | Partial — session breakdown not fully exposed |
| Lodging rates | ✅ | ⚠️ | Partial |
| Per Diem rates | ✅ | ✅ | Local only |
| Billing settings | ✅ | ✅ | Sprint 10 ✅ — checkout + portal handoff live |

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
| Supabase auth (real) | ✅ | ✅ | Sprint 10 ✅ — signInWithPassword + token refresh |
| All data synced to server | ✅ | ✅ | Sprint 11/12 ✅ — push/pull/bootstrap wired |
| Offline banner / recovery page | ✅ | ❌ | Native handles offline differently |

---

## Summary

| Status | Count |
|---|---|
| ✅ Full parity | ~32 |
| ⚠️ Partial / stub | ~10 |
| ❌ Not yet in V2 | ~18 |

### Key gaps before V2 can replace the PWA

1. ~~**Personal Space** (Sprint 8)~~ ✅ Done
2. ~~**Business Space** (Sprint 9)~~ ✅ Done
3. ~~**Settings & Billing** (Sprint 10)~~ ✅ Done — real auth, profile save, billing handoff
4. ~~**Backend sync** (Sprint 11–12)~~ ✅ Done — push/pull/bootstrap live
5. ~~**Security & compliance** (Sprint 13)~~ ✅ Done — data wipe, RLS, receipt upload, session expiry
6. **Transactions tab** — unified TNG + claim items ledger
7. **XLSX / PDF exports** — requires backend generation (Sprint 14)
8. **Auth flows** — forgot password, invite acceptance, change password (Sprint 10)
