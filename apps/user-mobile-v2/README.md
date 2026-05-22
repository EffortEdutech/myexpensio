# MyExpensio User Mobile v2

This folder is reserved for the clean local-first rewrite of the MyExpensio user mobile app.

## Important Boundary

Do not modify the existing user app as part of this rewrite:

```text
apps/user
```

The existing app is the behavior reference. This folder is the new implementation.

## Target Direction

The new mobile app should be built as a local-first React Native / Expo app:

- SQLite for persistent runtime data.
- Zustand for UI, session, and temporary state.
- TanStack Query for API orchestration and background refresh.
- A sync engine for push, pull, retry, and conflict handling.
- NestJS APIs between the app and Supabase.
- Supabase for PostgreSQL, Auth, Storage, and limited Realtime use.

See the full decision record:

```text
docs/USER_MOBILE_V2_LOCAL_FIRST_DECISION.md
```

See the comprehensive sprint plan:

```text
docs/USER_MOBILE_V2_COMPREHENSIVE_SPRINT_PLAN.md
apps/user-mobile-v2/docs/SPRINT_1_COMPREHENSIVE_CHECKLIST.md
```

## Development Notes

This scaffold targets Expo SDK 56, which is the current Expo SDK as of May 2026. SDK 56 uses React Native 0.85 and React 19.2.

During early testing, prefer a development build when Expo Go support is inconvenient or unavailable for a target device.

## First Local-First Slice

The first implemented slice is intentionally small:

- Initialize SQLite.
- Create the `expenses` table.
- Create the `sync_queue` table.
- Create sample local draft expenses.
- Queue each local draft for future sync.

Run from this folder after dependencies are installed:

```text
pnpm start
```

Or from the monorepo root:

```text
pnpm dev:user-mobile-v2
```
