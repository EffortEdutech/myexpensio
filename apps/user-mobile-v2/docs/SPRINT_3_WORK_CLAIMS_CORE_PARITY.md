# Sprint 3: Work Claims Core Parity

Date: 2026-05-23

Parent roadmap:

```text
docs/USER_MOBILE_V2_FULL_DELIVERY_ROADMAP.md
```

## Sprint Commitment

Deliver a usable Work Claims draft workflow in the new local-first mobile app.
This sprint must move beyond scaffolding and produce a workflow that a real user
can exercise end to end while offline.

## Sprint Outcome

By the end of this sprint, a signed-in user can:

- Open Work Claims.
- See a claim list.
- Create a claim draft.
- Open claim detail.
- Edit claim title and period.
- Add, edit, and soft-delete claim items.
- See claim totals update from local data.
- Attach receipt metadata to an item.
- Submit a draft locally into a locked submitted state.
- See submitted claims protected from local draft edits.
- See pending/failed/synced sync state clearly.
- Reopen the app and still see the same local claim data.

## Business Value

Work Claims is the primary MyExpensio user workflow. Completing this sprint gives
the mobile v2 app its first meaningful user-facing feature parity area and proves
the local-first architecture with real domain behavior, not only technical
plumbing.

## Budget Policy

This sprint remains zero-budget.

- No paid services.
- No paid Expo/EAS requirement.
- No paid maps, OCR, AI, storage, or background job provider.
- No new subscription dependency unless already free and locally usable.
- Backend integration remains API-contract based until the backend sprint.

## Sprint Scope

### Included

- Work Claims list and detail state.
- Draft claim creation and editing.
- Claim item creation, editing, and soft delete.
- Claim totals recalculated from local item data.
- Draft submission state transition.
- Submitted-claim edit lock.
- Receipt metadata attachment placeholder.
- Local-first persistence and sync queue creation for every mutation.
- Clear empty, loading, error, pending, failed, and submitted states.
- Manual QA script.

### Excluded

- Real backend sync implementation.
- Real file upload binary transfer.
- OCR/scan extraction.
- TNG import and linking.
- GPS/mileage capture.
- Export/report generation.
- Admin/CS workflows.
- Any change to `apps/user`.

## Sprint Backlog

| ID | Story | Priority | Estimate | Done When |
| --- | --- | --- | --- | --- |
| WC-01 | User can navigate from claim list to claim detail | P0 | M | Done: selected claim opens a detail view and can return to list |
| WC-02 | User can create a blank claim draft | P0 | S | Draft persists locally and creates sync queue item |
| WC-03 | User can edit draft title and period | P0 | M | Done: changes persist locally, update sync status, and queue mutation |
| WC-04 | User can add claim items by type | P0 | M | Done: item persists locally and total updates |
| WC-05 | User can edit item amount/title/date/type | P0 | M | Done: item changes persist and queue mutation |
| WC-06 | User can soft-delete an item | P0 | S | Done: item disappears from active list, total updates, queue mutation exists |
| WC-07 | User can attach receipt metadata to item | P1 | M | Done: local receipt row links to item without binary upload |
| WC-08 | User can submit draft locally | P0 | M | Done: claim status becomes submitted, submitted_at set, mutation queued |
| WC-09 | Submitted claims are locked from draft edits | P0 | S | Done: edit controls are disabled with clear state |
| WC-10 | User sees sync state per claim and item | P1 | S | Pending/failed/synced/deleted are visible where useful |
| WC-11 | Work Claims data survives reload/restart | P0 | M | Manual QA confirms claim and item data reappear |
| WC-12 | Sprint QA and docs are updated | P0 | S | Checklist, QA script, and commit instructions are current |

## Implementation Progress

Completed in the first Sprint 3 implementation slice:

- Claim list can open a real claim detail view.
- Claim detail can return to the list.
- Draft title and period can be edited locally.
- Claim items can be added by type.
- Claim item title, amount, date, and type can be edited locally.
- Claim items can be soft-deleted from the detail view.
- Receipt metadata can be attached to a claim item without binary upload.
- Draft claims can be submitted locally.
- Submitted claims show a lock banner and disable draft edit controls.
- Claim and item mutations remain local-first and sync-queue backed.

Remaining before Sprint 3 sign-off:

- Manual runtime QA across create/edit/submit/reload.
- More polished empty/loading/error states inside detail if needed after QA.
- Confirm sync queue counts and reload persistence in a running app.

## Technical Tasks

- Add claim detail UI state and component boundary.
- Add repository methods for period edit and local submit.
- Add repository method for receipt metadata attachment to claim item.
- Add hooks for claim detail, period edit, submit, and receipt metadata.
- Replace sample-only claim actions with form-like local controls.
- Keep every write local-first and queue-backed.
- Keep server-owned statuses protected by local merge/edit policy.
- Add manual QA checklist for the Work Claims workflow.

## Data Rules

- Claims remain local-first.
- Draft edits are allowed only when `status = draft`.
- Submit is a local state transition to `submitted` and must queue a sync item.
- Submitted claims cannot be edited locally except future allowed actions.
- Delete is soft delete only.
- Receipt attachment in this sprint means metadata/link only, not upload.

## UX Rules

- The first screen remains the usable app, not a landing page.
- Work Claims must be the default productive space after sign-in.
- Use compact mobile-first controls.
- Avoid decorative cards inside cards.
- Buttons must clearly communicate pending/disabled states.
- Destructive actions require confirmation.
- Text must fit on mobile-width screens.

## QA Plan

Run from repo root:

```text
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
corepack pnpm -C apps/user-mobile-v2 start
```

Manual scenarios:

1. Sign in with development session.
2. Create a Work Claim draft.
3. Open claim detail.
4. Rename claim and set period.
5. Add parking item.
6. Add toll item.
7. Edit one item amount.
8. Delete one item.
9. Attach receipt metadata.
10. Confirm total updates after every mutation.
11. Submit claim.
12. Confirm submitted claim cannot be edited.
13. Restart or reload app.
14. Confirm claim and items still exist.
15. Confirm sync queue count increased.
16. Confirm `apps/user` remains untouched by this sprint.

## Acceptance Criteria

- A non-technical tester can complete the manual QA scenarios above.
- All P0 backlog items are complete.
- Typecheck passes.
- Expo web export passes.
- Local runtime starts.
- No files under `apps/user` are modified by this sprint.
- Commit is scoped to `apps/user-mobile-v2` and related docs only.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Claim detail becomes too large | Medium | Split list/detail/components/hooks early |
| Local submit differs from future backend rules | Medium | Keep submit payload explicit and documented |
| Receipt metadata grows into upload scope | Medium | Enforce metadata-only rule for Sprint 3 |
| Dirty `apps/user` files get accidentally staged | High | Use scoped `git add`, never `git add .` |
| Expo web SQLite differs from native behavior | Medium | Treat web as smoke test, native device test before production |

## Definition Of Done

- Product workflow works locally.
- Data persists locally.
- Mutations create sync queue entries.
- Submitted claim lock exists.
- Verification notes are documented.
- Commit instructions are provided.
- User is told exactly when to commit and push.

## Commit Plan

Commit in meaningful slices:

```text
git add apps/user-mobile-v2
git commit -m "Plan Sprint 3 work claims core parity"
git pull --rebase --autostash
git push
```

Then implementation commits should follow feature slices:

```text
git add apps/user-mobile-v2
git commit -m "Add work claim detail workflow"
git pull --rebase --autostash
git push
```

```text
git add apps/user-mobile-v2
git commit -m "Add local claim submission lock"
git pull --rebase --autostash
git push
```
