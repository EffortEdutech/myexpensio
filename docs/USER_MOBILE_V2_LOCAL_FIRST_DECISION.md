# MyExpensio User Mobile v2 Local-First Decision

Date: 2026-05-22

## Decision

Build a new clean MyExpensio user mobile app in:

```text
apps/user-mobile-v2
```

Do not modify the existing user app during this rewrite:

```text
apps/user
```

The existing app remains the behavior reference. The new app is the architecture reset.

## Product Scope

The v2 user mobile app must keep the same user-facing features, flows, permissions, and business rules as the current MyExpensio user app.

The goal is not to redesign the product behavior. The goal is to replace the runtime architecture so the mobile app becomes faster, more resilient, and capable of offline-first expense work.

## Architecture Direction

The target architecture is local-first:

```text
React Native / Expo mobile app
  - UI and feature screens
  - Zustand for session, UI, and temporary state
  - TanStack Query for API orchestration and background refresh
  - SQLite as the primary runtime database
  - Sync engine for push, pull, retry, and reconciliation

NestJS API layer
  - validation
  - business logic
  - permissions
  - aggregation APIs
  - sync APIs

Supabase
  - PostgreSQL source of truth
  - Auth
  - Storage for receipts/files
  - Realtime only where appropriate
```

Core rule:

```text
Screens should not know whether data came from SQLite, the API, or Supabase.
```

Screens should use feature-level hooks and repositories, for example:

```text
useExpenses()
useCreateExpense()
useClaims()
useDashboardSummary()
```

## Local-First Runtime Policy

The mobile app should treat local SQLite as the primary runtime layer.

Expected flow:

```text
User opens app
-> render local SQLite data immediately
-> sync in background
-> update local data silently when server changes arrive
```

Expense creation flow:

```text
User creates expense
-> save to SQLite immediately
-> update UI immediately
-> add sync queue item
-> upload in background when possible
-> mark local record synced after server confirmation
```

## Sync Principles

The sync engine must be designed explicitly. SQLite alone is not the architecture.

Required concepts:

- Local mutation queue.
- Push queued local changes to NestJS sync APIs.
- Pull server changes by cursor or timestamp.
- Retry failed sync items.
- Track sync status per entity.
- Use soft deletes with `deleted_at`.
- Keep conflict rules explicit per entity.
- Treat receipt upload as a first-class sync workflow.

Suggested local sync status values:

```text
pending
syncing
synced
failed
deleted
```

Suggested shared columns:

```text
id
created_at
updated_at
deleted_at
sync_status
device_id
```

## Conflict Policy Starting Point

Recommended initial policy:

- Draft expense owned by the user: local changes can win until submission.
- Submitted claim: server wins for approval, rejection, payment, and locked financial status.
- Policy, category, company, and permission data: server wins.
- Receipt attachments: merge by attachment ID.
- Deletes: use `deleted_at`; do not hard-delete during normal sync.

These rules must be revisited during feature mapping.

## PWA Consideration

PWA can be offline-capable, but it should not be treated as equivalent to the native mobile local-first implementation.

For PWA/web, use:

```text
IndexedDB / Dexie / RxDB
Service Worker
foreground sync
opportunistic background sync
NestJS sync APIs
Supabase
```

Do not rely only on background sync in PWA. Browser storage and background execution are less reliable than React Native with SQLite, especially for long offline periods and receipt uploads.

Recommended split:

- Native mobile app: full offline-first.
- PWA/web user app: offline-capable with clear limitations.
- Admin/manager web app: mostly online-first with caching.

## Budget Position

Development can remain near-zero budget by using open-source and existing infrastructure:

- React Native / Expo
- SQLite
- Zustand
- TanStack Query
- Existing Supabase project
- NestJS
- GitHub
- Local development and Expo Go testing

As of May 2026, the new scaffold targets Expo SDK 56 with React Native 0.85 and React 19.2.

Likely future costs:

- Reliable backend hosting.
- Growing Supabase usage.
- Receipt/file storage growth.
- Apple Developer Program for public iOS distribution.
- Google Play Console registration.

Position:

```text
Architecture and development can stay near-zero budget now.
Production launch cannot be guaranteed to stay fully zero-budget forever.
```

## Migration Strategy

Use the current app as the product contract.

Suggested phases:

1. Feature inventory from the existing `apps/user` app.
2. Data model and Supabase behavior mapping.
3. New app shell: auth, navigation, theme, environment config.
4. Local-first expense core: expenses, receipts, claims, sync queue.
5. Push/pull sync APIs through NestJS.
6. Port features one by one until parity.
7. Parallel QA against the current app.

## Guardrails

- Do not change `apps/user` as part of the v2 clean rewrite.
- Do not let screens call Supabase directly.
- Do not make TanStack Query the primary persistent database.
- Do not rely on PWA background sync for guaranteed mobile sync.
- Do not hard-delete synced business records by default.
- Do not defer conflict policy until after implementation.
