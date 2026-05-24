# Recovery A - Work Claims Parity Cleanup

Date: 2026-05-24

## Goal

Recover the Work Claims flow after the parity lock by improving real claim usability instead of advancing to the next sprint prematurely.

This pass is not a full Work Claims sign-off. It is a recovery cleanup pass focused on the claim detail page, item viewing, edit/delete rules, and TNG-linked item behavior.

## What Changed

- Added a readable claim item detail modal.
- Claim items can now be opened to review date, type, amount, receipt status, TNG status, and notes.
- Item detail modal exposes the main draft actions in one place:
  - Edit item.
  - View receipt.
  - Attach/replace receipt.
  - Remove receipt.
  - Link/change TNG.
  - Unlink TNG.
  - Delete item.
- Submitted claim items remain read-only in the detail modal.
- Add-item modal now blocks invalid zero-amount manual entries.
- Add-item modal still allows zero amount only for TNG-pending items, because the amount is resolved when a real TNG transaction is linked.
- Fixed a functional TNG bug: deleting a TNG-linked claim item now releases the TNG transaction back to unclaimed and queues a `tng_transaction` sync update.
- Replaced state-setting `useMemo` in the edit modal with `useEffect`.

## Honest Status

Current status: `PARTIAL`.

This pass improves Work Claims usability and fixes one real data consistency bug, but it does not yet complete full v1 parity.

## Still Required Before Work Claims Parity Sign-Off

- Compare every v1 add-item modal field against v2:
  - Mileage.
  - Toll.
  - Parking.
  - Transport.
  - Meal.
  - Lodging.
  - Per Diem.
  - Misc.
- Confirm item row design against v1 visual style.
- Confirm edit/delete behavior for all item types.
- Confirm submitted claim lock behavior after runtime QA.
- Confirm receipt capture/upload with real files.
- Confirm TNG picker only uses real imported TNG rows.
- Confirm claim submit flow cannot proceed with unresolved TNG-pending items unless that is intentionally allowed.

## Verification

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
```

Result: passed.
