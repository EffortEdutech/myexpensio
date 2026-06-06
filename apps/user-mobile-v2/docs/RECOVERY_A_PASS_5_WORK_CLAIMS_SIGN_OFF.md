# Recovery A Pass 5 - Work Claims Sign-Off Cleanup

Date: 2026-05-25

## Decision

Recovery A is signed off for the **local-first Work Claims recovery scope**.

This does not mean the whole MyExpensio user app has complete v1 parity. It means the Work Claims recovery detour has achieved its purpose: the claim flow is now usable, calculation-backed, mobile-friendlier, and no longer just a placeholder UI.

## What Is Now Recovered

- Draft claim list and claim detail flow.
- Claim item list with item detail modal.
- Add item modals for:
  - Mileage.
  - Toll.
  - Parking.
  - Transport.
  - Meal.
  - Lodging.
  - Per Diem.
  - Misc.
- Mileage claim calculation from saved final trips.
- Duplicate trip prevention inside the same claim.
- Meal fixed-rate and receipt modes.
- Meal session rates for Morning, Noon, Evening, and Full Day.
- Lodging fixed-rate and receipt modes.
- Lodging check-in, check-out, night count, and date guardrail.
- Per Diem days x rate calculation.
- TNG pending item creation and submit blocking until linked.
- TNG link/unlink/delete consistency cleanup.
- Receipt attach, replace, remove, and view metadata flow.
- Submitted claim/item read-only behavior.
- Compact mobile-friendly filter/sort controls:
  - Claims list sort sheet.
  - Claim item filter/sort sheets.
  - Trips filter/sort sheets.
- Web console cleanup for nested button structure in claim item rows.
- Removed the dynamic `shadowColor` usage that triggered React Native Web warning noise.

## Current Status

Status: `RECOVERY A COMPLETE`.

Scope: Work Claims local-first recovery and mobile UI cleanup.

## Not Claimed As Complete

The following are intentionally not signed off here:

- Backend/NestJS sync API parity.
- Supabase server-side rate snapshots and validation.
- Production export service for PDF/XLSX.
- Full app v1 parity for Personal Expense and Business/My Income spaces.
- Store release readiness.
- End-to-end production QA across real mobile devices.

These remain in the main sprint roadmap.

## Remaining Watch Items

- Continue comparing modal spacing and density against v1 during normal use.
- Confirm the compact filter/sort sheets feel right on actual phone viewport.
- Confirm no new browser console warnings after refresh.
- Keep claim item structured calculation metadata in mind for backend sync. For now, calculation details are preserved in notes where local schema does not yet have dedicated columns.

## Verification

Run before committing:

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
```

## Recommended Next Move

Return to the delivery roadmap.

Recommended sequence:

1. Finish/clean up Sprint 7 export/report/usage work honestly.
2. Then proceed to Sprint 8 Personal Expense space parity.

Reason: Work Claims is recovered enough to stop blocking the roadmap, but export/report behavior was previously found incomplete and should not be left ambiguous.
