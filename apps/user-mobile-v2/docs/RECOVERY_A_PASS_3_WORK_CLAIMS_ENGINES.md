# Recovery A Pass 3 - Work Claims v1 Claim Engines

Date: 2026-05-25

## Goal

Move Work Claims beyond surface UI by adding the real v1-style calculation engines for the major claim types.

This pass connects Work Claims to existing local-first v2 trip data and saved claim rates.

## Completed

- Mileage now uses saved final trips instead of manual amount entry.
- Mileage excludes trips that are already attached to a mileage claim item in the same claim.
- Mileage amount is calculated from:
  - Final trip distance.
  - Vehicle type.
  - Saved car or motorcycle mileage rate.
- Mileage item notes now preserve trip id, distance, and rate.
- Mileage item editing is blocked from the item detail action area because the amount is calculated from the saved trip.
- Meal now supports:
  - Fixed Rate mode.
  - Receipt mode.
  - Morning, Noon, Evening, and Full Day sessions.
  - Saved meal rates from Settings.
- Lodging now supports:
  - Fixed Rate mode.
  - Receipt mode.
  - Check-in date.
  - Check-out date.
  - Night calculation.
  - Saved lodging rate from Settings.
- Per Diem now supports:
  - Date.
  - Days.
  - Rate.
  - Auto total calculation.
  - Saved per diem rate from Settings as the default.

## Important Notes

- This is still local-first and zero-budget friendly.
- The pass uses the v2 local settings store for rates.
- Backend rate snapshots and server-side validation still belong to the later backend/sync sprints.
- Receipt upload and TNG linking remain in their existing local-first flows.

## Remaining Before Work Claims Recovery Sign-Off

- Runtime QA on a real browser/device:
  - Create final trip.
  - Add that trip as mileage to a claim.
  - Confirm duplicate mileage trip is not offered again in the same claim.
  - Add fixed-rate meal for each session.
  - Add receipt-mode meal.
  - Add fixed-rate lodging across multiple nights.
  - Add receipt-mode lodging.
  - Add per diem with days and rate.
  - Confirm submit works after all TNG-pending items are linked.
- Compare the modal layout visually against v1 after runtime QA.
- Decide whether calculated meal/lodging/per diem items should use structured local DB columns later, or continue storing calculation detail in notes until backend sync schema is finalized.

## Verification

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
```
