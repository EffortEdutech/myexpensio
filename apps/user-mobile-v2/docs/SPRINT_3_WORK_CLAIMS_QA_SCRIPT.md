# Sprint 3 Work Claims QA Script

Date: 2026-05-23

Use this script to verify Sprint 3 manually from the new mobile v2 app.

## Scope

Test only:

```text
apps/user-mobile-v2
```

Do not modify or stage:

```text
apps/user
```

## Setup

Run from repo root:

```text
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
corepack pnpm -C apps/user-mobile-v2 start
```

Open the local app and sign in with the development email.

## Scenario A: Blank Draft Claim

Expected outcome: a user can create a blank claim and edit it into useful data.

1. Press `Create blank claim`.
2. Confirm local claim count increases.
3. Open the new claim.
4. Change title.
5. Change period start.
6. Change period end.
7. Press `Save claim`.
8. Return to list.
9. Reopen the claim.
10. Confirm title and period remain changed.

Pass criteria:

- Claim remains visible.
- Sync queue count increases.
- Claim status is still `draft`.

## Scenario B: Claim Items

Expected outcome: a user can add and edit claim items while offline.

1. Open a draft claim.
2. Add a parking item.
3. Add a toll item.
4. Edit one item title.
5. Edit one item amount.
6. Change one item type.
7. Save the item.
8. Delete one item.

Pass criteria:

- Item list updates immediately.
- Claim total changes after add/edit/delete.
- Deleted item is not shown in active list.
- Sync queue count increases.

## Scenario C: Receipt Metadata

Expected outcome: a user can attach receipt metadata without real upload.

1. Open a draft claim with at least one item.
2. Press `Attach receipt`.
3. Confirm item shows `metadata attached`.
4. Confirm receipt upload summary `Local` count increases.

Pass criteria:

- Receipt metadata attaches to the item.
- No binary upload is attempted.
- Claim remains editable because it is still draft.

## Scenario D: Submit Lock

Expected outcome: submitted claims cannot be edited locally.

1. Open a draft claim.
2. Press `Submit claim`.
3. Confirm submit action.
4. Confirm lock banner appears.
5. Try to edit claim fields.
6. Try to add/edit/delete item.

Pass criteria:

- Claim status is `submitted`.
- Draft edit controls are disabled.
- Submit mutation is queued.
- Existing data remains visible.

## Scenario E: Reload Persistence

Expected outcome: local data survives app reload or restart.

1. Create a blank claim.
2. Add one item.
3. Attach receipt metadata.
4. Reload/restart the app runtime.
5. Sign in again if needed.
6. Open Work Claims.
7. Reopen the claim.

Pass criteria:

- Claim remains visible.
- Item remains visible.
- Receipt metadata remains visible.
- Submitted claim remains locked if previously submitted.

## Scenario F: Boundary Check

Expected outcome: the sprint does not touch the existing app.

Run:

```text
git status --short -- apps/user-mobile-v2 apps/user
```

Pass criteria:

- Sprint changes are under `apps/user-mobile-v2`.
- Any `apps/user` changes are pre-existing or unrelated and are not staged.

## Sign-Off

Sprint 3 can be called complete only when:

- All P0 scenarios pass.
- Typecheck passes.
- Expo export passes.
- Commit is scoped.
- Push uses `git pull --rebase --autostash` first.
