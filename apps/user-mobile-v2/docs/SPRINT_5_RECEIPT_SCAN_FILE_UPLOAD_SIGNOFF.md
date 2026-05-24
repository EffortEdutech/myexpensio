# Sprint 5 - Receipt, Scan, and File Upload Hardening Sign-off

Date: 2026-05-24

## Scope

Sprint 5 hardens receipt and evidence capture for the local-first user mobile v2 app while preserving the v1 user flow:

- Add claim item with receipt optional.
- Scan Document entry point.
- Attach from Gallery entry point.
- JPEG, PNG, and WebP file selection.
- 5 MB file size guard.
- Local receipt metadata stored offline first.
- Receipt upload/sync status remains queued for later backend sync hardening.
- Receipt attach, replace, view, and remove actions for claim items.
- Odometer start/end evidence picker and pending-sync preview.
- Submitted claim read-only behavior.

## Implemented

- Claim item add modal now includes receipt capture directly inside the form.
- Claim item rows show `No receipt`, `Receipt attached`, or uploaded status.
- Existing claim items can attach, replace, view, or remove receipt metadata while the claim is draft.
- Submitted claims hide mutating item controls and keep receipt viewing available.
- Receipt metadata is linked through the local receipts table and sync queue.
- Odometer evidence uses camera/gallery file picker behavior instead of placeholder text.
- Receipt selector UI was corrected so icons do not wrap vertically.

## Runtime QA Evidence

Passed:

- Create claim.
- Add toll item with attached gallery receipt.
- Confirm item row displays `Receipt attached`.
- Open receipt viewer.
- Remove receipt and confirm row returns to `No receipt`.
- Reattach receipt and confirm `Replace` action appears.
- Submit claim and confirm submitted read-only lock message.
- Confirm mutating controls are hidden on submitted claim rows.
- Confirm odometer evidence attach preview appears for start/end photos.

Validation commands:

```powershell
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
```

## Known Follow-up

- Actual cloud upload execution, signed upload URLs, retry policy, and backend storage confirmation remain for Sprint 11 and Sprint 12.
- Native camera edge detection quality should be verified on physical Android/iOS builds during Sprint 15 QA.
- Receipt image rendering currently confirms local attachment state; production-grade full image preview depends on final native/cloud storage implementation.

## Sign-off

Sprint 5 is acceptable to close for local-first v2 parity foundation. The receipt UX is now present in the same claim and trip workflows where users expect it, and the remaining work belongs to sync/backend production hardening rather than the Sprint 5 UI foundation.
