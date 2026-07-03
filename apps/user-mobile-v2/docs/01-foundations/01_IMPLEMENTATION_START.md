# Implementation Start

Date: 2026-05-22

This folder starts the clean MyExpensio user mobile v2 implementation.

## Current Rule

Do not change:

```text
apps/user
```

That app remains the feature and behavior reference.

## First Build Target

The first useful milestone is not the full app. It is a narrow local-first vertical slice:

```text
Login/session shell
-> local SQLite schema
-> expense list from local DB
-> create draft expense locally
-> sync queue entry
-> push pending expense to API
-> mark synced after confirmation
```

## Intended Source Layout

```text
src/
  screens/
  components/
  features/
    auth/
    expenses/
    claims/
    receipts/
    dashboard/
  local-db/
    migrations/
    repositories/
  sync/
  api/
  state/
  theme/
  utils/
```

## App Layer Rules

- Screens use feature hooks.
- Feature hooks use repositories and API clients.
- Repositories own SQLite reads and writes.
- Sync owns background push, pull, retry, and reconciliation.
- Supabase is not called directly from screens.
- Business rules should be enforced by NestJS APIs and mirrored locally only where needed for offline UX.

## Next Actions

1. Create the React Native / Expo scaffold in this folder.
2. Add the local database layer.
3. Define the first SQLite tables.
4. Build the first expense draft flow.
5. Add sync queue processing.

## Expo SDK Note

This scaffold targets Expo SDK 56. SDK 56 is current as of May 2026 and uses React Native 0.85 with React 19.2.

Use Expo Go where available. Use an Expo development build if Expo Go support becomes a blocker for device testing.
