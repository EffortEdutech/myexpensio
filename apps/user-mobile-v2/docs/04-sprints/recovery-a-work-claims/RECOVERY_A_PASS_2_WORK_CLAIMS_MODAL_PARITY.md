# Recovery A Pass 2 - Work Claims v1 Modal Parity

Date: 2026-05-25

## Goal

Improve the Work Claims add-item flow so it behaves closer to the v1 claim modal pattern, while keeping the status honest about deeper parity work that is not complete yet.

This pass focuses on claim item entry, TNG pending behavior, and submit guardrails. It does not close Work Claims parity by itself.

## Completed

- Added type-specific modal headings and helper text for:
  - Mileage.
  - Toll.
  - Parking.
  - Transport.
  - Meal.
  - Lodging.
  - Per Diem.
  - Misc.
- Kept the v1-style transport picker inside the add transport modal.
- Changed TNG-enabled toll, parking, and transport entry so the amount field is hidden when `Paid via TNG` is enabled.
- Added a clear TNG pending notice explaining that the amount will come from the imported TNG transaction.
- Kept zero-amount creation allowed only for TNG-pending items.
- Added required description validation for Misc claims.
- Updated the add button label to show the selected amount for manual entries and `TNG` for pending TNG entries.
- Added submit blocking when a draft claim contains unresolved TNG-pending items.
- Added a visible TNG submit warning on the claim detail page.

## Still Not Full v1 Parity

These items are still required before Work Claims can be signed off:

- Mileage modal must select from saved trips and pull actual route distance/rate from the Trips module.
- Meal modal must support fixed rate vs receipt mode, sessions, and configured rates.
- Lodging modal must support check-in, check-out, nights, and configured rates.
- Per Diem modal must support days, rate, destination, and configured rates.
- TNG picker must be runtime-tested with real imported transactions.
- Claim item row visual density still needs to be compared against v1 after modal behavior is stable.

## Status

Current status: `PARTIAL`.

Recovery A should continue until the Work Claims flow is genuinely easy to use and matches the v1 mental model.

## Verification

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
```
