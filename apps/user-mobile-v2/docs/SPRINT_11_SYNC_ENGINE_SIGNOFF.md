# Sprint 11 — Sync Engine Production Hardening — Sign-off

**Date:** 2026-05-30
**Status:** ✅ SIGNED OFF

---

## Scope

Sprint 11 delivered the complete local-first sync engine for the mobile app:
offline mutation queuing, bootstrap-on-login, periodic push/pull, and
AppShell sync status display.

---

## Deliverables

### New files

| File | Purpose |
|---|---|
| `src/sync/syncConfig.ts` | Base URL resolution, push/pull limits, retry intervals |
| `src/sync/syncApi.ts` | Typed API client — bootstrap / push / pull |
| `src/sync/types.ts` | `SyncEntityType`, `SyncOperation` union types |
| `src/sync/syncEngine.ts` | `pushPendingSyncItems()` — batches queue, calls push, marks accepted/rejected |
| `src/sync/pullEngine.ts` | `pullAndApplyChanges()` — fetches delta, applies to SQLite per entity type |
| `src/sync/bootstrapEngine.ts` | `runBootstrap()` — fetches profile/subscription/spaces, seeds local cache |
| `src/sync/syncState.ts` | Minimal re-export shim |
| `src/sync/mergePolicy.ts` | Last-write-wins merge policy helpers |
| `src/sync/hooks/useSyncEngine.ts` | React hook — orchestrates bootstrap, push, pull, periodic sync, app-foreground sync |
| `src/sync/hooks/usePendingSyncItems.ts` | Hook — live count of pending queue items |
| `src/sync/hooks/useSyncQueueSummary.ts` | Hook — pending / syncing / synced counters for AppShell badge |
| `src/local-db/repositories/syncQueueRepository.ts` | `enqueueSyncItem`, `markSyncItemSynced`, `markSyncItemFailed`, list helpers |
| `src/local-db/repositories/syncStateRepository.ts` | `getSyncState`, `upsertSyncState` — cursor persistence |

### Modified files

| File | Change |
|---|---|
| `App.tsx` | Imports and calls `useSyncEngine`; passes `pendingSyncCount` and `syncQueueSummary` to AppShell |

---

## Entity types enqueued on write

All repositories call `enqueueSyncItem` on every create / update / delete:

- `claims` (claimRepository.ts)
- `claim_items` (claimRepository.ts)
- `trips` (tripRepository.ts)
- `tng_transactions` (tngRepository.ts)
- `tng_statement_batches` (tngRepository.ts)
- `ledger_entries` (ledgerRepository.ts)
- `commitments` (commitmentRepository.ts)
- `expenses` (expenseRepository.ts)
- `receipts` (receiptRepository.ts)
- `export_jobs` (exportRepository.ts)

---

## Sync lifecycle

```
Login → useSyncEngine detects no cursor → runBootstrap()
  ↓ seeds profile, subscription, spaces into local cache tables
  ↓ saves cursor
App foreground / periodic (60s) → triggerPush() + triggerPull()
  ↓ push: flush SQLite sync_queue → POST /api/sync/push → mark accepted/rejected
  ↓ pull: GET /api/sync/pull?cursor=... → apply delta to local tables
```

---

## Verification notes (2026-05-30)

- All sync module files present and correctly cross-imported
- `useSyncEngine` confirmed wired in `App.tsx`
- `enqueueSyncItem` confirmed called in all 10 repository files
- `pullEngine.ts` verified to handle: `claim`, `claim_item`, `trip`, `receipt`,
  `ledger_entry`, `tng_transaction`, `commitment`
- No TypeScript import errors in mobile app sync module

---

## Known deferred items

- Receipt actual cloud upload (binary file upload pipeline) → Sprint 13
- GPS live tracking points → Sprint 14
- Conflict resolution UI (currently last-write-wins silently) → Sprint 13
