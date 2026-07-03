# Recovery A Pass 4 - Work Claims Runtime QA and Visual Polish

Date: 2026-05-25

## Goal

QA the Work Claims calculation engines added in pass 3 and polish obvious flow issues before calling the recovery work stable enough for hands-on user testing.

## Verification Performed

- TypeScript verification passed.
- Expo web export passed.
- Static local web build was generated successfully.
- Browser runtime QA was attempted against the static local build.

## Browser Runtime Limitation

The Codex in-app browser blocked both local URLs:

- `http://127.0.0.1:8084`
- `http://localhost:8084`

Result: `ERR_BLOCKED_BY_CLIENT`.

Because of this, pass 4 could not complete visual browser screenshot QA inside Codex. Manual browser QA on the user's machine is still required.

## Issues Found and Fixed

- Fixed the add button label for calculated claim items.
  - Fixed-rate meal, fixed-rate lodging, mileage, and per diem now show the calculated amount in the footer button instead of staying as a plain `Add ...` action.
- Improved lodging default dates.
  - Check-in defaults to today.
  - Check-out now defaults to tomorrow.
  - This avoids a confusing same-day lodging state.
- Added lodging date guardrail.
  - Check-out must be after check-in.
- Improved modal row layout resilience.
  - Two-column modal rows can wrap.
  - Generic fields now flex correctly inside rows.

## Claim Engine QA Checklist for Manual Browser Testing

- Create or open a draft Work Claim.
- Add Mileage:
  - Modal lists final trips only.
  - Amount equals distance x vehicle rate.
  - Added trip disappears from the same claim's mileage picker.
  - Mileage item cannot be edited directly.
- Add Meal:
  - Fixed Rate mode calculates Morning, Noon, Evening, and Full Day correctly.
  - Receipt mode accepts manual amount.
  - Footer button shows the amount being added.
- Add Lodging:
  - Check-in/check-out defaults are sensible.
  - Night count calculates correctly.
  - Fixed Rate mode calculates nights x lodging rate.
  - Receipt mode accepts manual amount.
- Add Per Diem:
  - Days x rate calculates correctly.
  - Footer button shows the calculated amount.
- Add TNG item:
  - TNG mode hides manual amount.
  - Claim submit is blocked until linked.
- Submit Claim:
  - Claim with valid items can submit.
  - Submitted item detail is read-only.

## Status

Current status: `READY FOR MANUAL RUNTIME QA`.

Work Claims recovery should not be signed off until the manual browser/device checklist above is completed.

## Commands

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
```
