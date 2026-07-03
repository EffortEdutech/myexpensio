# Sprint 24 — Cross-Device Sync Hardening (Native ↔ PWA)

**Created:** 2026-06-20
**Status:** ⬜ NOT STARTED
**Depends on:** Sprint 23 Track B (PWA web build) running without crashes

---

## The Core Problem

The native Android app is **local-first** — SQLite persists on-device and sync
is a cloud backup for PRO users.

The PWA (`database.web.ts`) is **cloud-first by necessity** — it uses a
session-scoped in-memory store that clears on every page refresh. The comment in
`database.web.ts` says this explicitly:

> "Data is session-scoped — clears on page refresh, which is correct because
> all real data arrives from Supabase sync after login."

This means: **if sync doesn't run and succeed before the user sees the app, all
lists are blank.** The goal of this sprint is to make that sync fast, reliable,
and correctly handled in every condition.

---

## Sync Architecture Difference: Native vs PWA

| Aspect | Native (Android) | PWA (Web) |
|---|---|---|
| Local DB | SQLite — persists between launches | In-memory — wiped on every page refresh |
| Data on launch | Instantly available from SQLite | Empty until sync completes |
| Sync model | Local-first, cloud backup | Cloud-first, sync is required |
| Offline support | Full — works without network | None — blank data offline |
| AppState events | `AppState.addEventListener` | Must use `document.visibilitychange` |
| Sync cursor storage | SQLite `sync_state` table | Must use `localStorage` (DB is wiped) |
| Pending push queue | SQLite `sync_queue` table | Must push immediately or persist to `localStorage` |
| Device ID | SecureStore / AsyncStorage | Must use `localStorage` |
| FREE tier | Shows local data, sync disabled | Shows nothing — sync is required |

---

## All Conditions That Must Be Handled

### Condition 1 — First-ever PWA open (no cursor, no data)

**What happens today:**
- In-memory DB initialises empty
- `useSyncEngine` detects no cursor → runs bootstrap
- Bootstrap fetches full profile, spaces, subscription from Supabase
- Data populates → UI renders
- BUT: bootstrap does NOT pull claims/trips/TNG data — that comes from `pull`
- Pull must run after bootstrap to get all entity data

**Gap:** Bootstrap only hydrates profile/subscription/spaces. Claims, trips, TNG
transactions, personal expenses, business entries — all come from `pull`. If `pull`
doesn't run after bootstrap, lists remain empty even after bootstrap succeeds.

**Fix (C1-1):** After bootstrap completes, immediately trigger `pull` to fetch all
entity data. This is already partially done in `useSyncEngine` but needs to be
confirmed as a hard chain: `bootstrap → pull → show data`.

**Fix (C1-2):** Show a blocking "Loading your data…" screen while bootstrap + pull
are in progress. Do not render content lists until the first sync cycle finishes.

---

### Condition 2 — PWA page refresh (cursor lost, session preserved)

**What happens today:**
- User had data, refreshes the page
- `localStorage` holds the Supabase session → auth restores correctly
- In-memory DB is wiped → cursor is gone (stored in `sync_state` table in-memory)
- `useSyncEngine` sees no cursor → runs full bootstrap again
- Then pull again → data repopulates, but it's slow (full bootstrap on every reload)

**Gap:** Every page refresh triggers a full bootstrap instead of a fast delta pull.

**Fix (C2-1):** Persist the sync cursor to `localStorage` on web so it survives
page refreshes:

```ts
// src/local-db/repositories/syncStateRepository.web.ts
const CURSOR_KEY = 'myexpensio:sync_cursor';

export async function getSyncState(_scope: string) {
  const cursor = localStorage.getItem(CURSOR_KEY);
  return cursor ? { cursor, lastSyncedAt: null } : null;
}

export async function upsertSyncState(_scope: string, cursor: string, syncedAt: string) {
  localStorage.setItem(CURSOR_KEY, cursor);
  localStorage.setItem('myexpensio:sync_last_at', syncedAt);
}
```

With this fix:
- Page load 1: No cursor → bootstrap + pull → save cursor to localStorage
- Page load 2+: Cursor found → delta pull only (fast, ~200ms vs 2-5s)

---

### Condition 3 — Native app pushed data, user opens PWA

**What happens:**
- User added a claim on Android → sync pushed to Supabase
- User opens PWA → in-memory DB empty
- With Condition 2 fix: delta pull runs → picks up claim from Supabase → shows correctly

**This condition is handled by C2-1 + the pull chain.**

**Additional risk:** Pull only fetches changes AFTER the stored cursor. If cursor is
stale (e.g., user hasn't opened PWA in weeks), the delta may be very large. Bootstrap
should re-run if the cursor is older than 30 days.

**Fix (C3-1):** Check cursor age on startup. If `lastSyncedAt` is more than 30 days
ago, wipe cursor and re-bootstrap:

```ts
const lastAt = localStorage.getItem('myexpensio:sync_last_at');
if (lastAt) {
  const ageMs = Date.now() - new Date(lastAt).getTime();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  if (ageMs > THIRTY_DAYS_MS) {
    localStorage.removeItem('myexpensio:sync_cursor');
  }
}
```

---

### Condition 4 — User edits on PWA, closes tab before push

**What happens today:**
- User creates a claim on the PWA
- Claim is written to in-memory DB + added to `sync_queue` table (in-memory)
- User closes the tab before the push cycle runs
- In-memory queue is lost → mutation never reaches Supabase
- Native app never sees the claim

**This is data loss.**

**Fix (C4-1):** On web, push immediately after every mutation rather than queuing.
Add a `flushOnMutation` flag to `useSyncEngine` that triggers `triggerPush()`
after each local write on `Platform.OS === 'web'`.

**Fix (C4-2):** Mirror the push queue to `localStorage` on web so it survives a
page close. On next page load, drain the localStorage queue before any pull:

```ts
// src/sync/webQueuePersistence.ts
const QUEUE_KEY = 'myexpensio:pending_queue';

export function saveQueueToStorage(items: PushSyncItem[]) {
  if (Platform.OS !== 'web') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function loadQueueFromStorage(): PushSyncItem[] {
  if (Platform.OS !== 'web') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch { return []; }
}

export function clearQueueStorage() {
  if (Platform.OS !== 'web') return;
  localStorage.removeItem(QUEUE_KEY);
}
```

**Recommended:** C4-1 (immediate push on mutation) is simpler and covers 99% of cases.
C4-2 is belt-and-suspenders for offline scenarios.

---

### Condition 5 — Same entity edited on both native AND PWA concurrently

**What happens:**
- Native app edits claim A (offline) → pushes when online → `server_updated_at = T1`
- PWA edits claim A (concurrent) → pushes → `server_updated_at = T2`
- If T2 > T1: PWA version wins (last-write-wins) — native edit silently overwritten
- If T1 > T2: Native version wins — PWA edit silently overwritten

**Current policy:** Last-write-wins by server timestamp. Already documented in
`STORAGE_AND_SYNC_ARCHITECTURE.md` as "low priority — full conflict UI deferred."

**Fix (C5-1):** No code change required, but the policy must be communicated to the
user. Add a visible sync status in the PWA that shows when a pull has overwritten
local changes:

- Rejected push items: already returned as `rejected[]` in push response
- Show a non-blocking toast: "1 item was not saved — a newer version exists"

**Fix (C5-2):** On the PWA, disable editing submitted claims (status `submitted`,
`approved`, `paid`) — these are already locked server-side but the UI should make
this clear.

---

### Condition 6 — FREE tier user opens PWA

**What happens today:**
- User logs in → `useSubscription` reads from in-memory DB (empty) → falls back to `FREE`
- `useSyncEngine` sees `tier === 'FREE'` → sync disabled → `status = 'free_tier'`
- No bootstrap, no pull → all lists are blank forever
- User is confused — data exists on their Android app but PWA shows nothing

**Note:** This is by design — FREE tier is local-only. But on web, local-only means
blank, which is a terrible experience.

**Fix (C6-1):** When `tier === 'FREE'` AND `Platform.OS === 'web'`, show a dedicated
empty state instead of blank lists:

```
┌─────────────────────────────────┐
│  📱 Your data lives on your     │
│     Android device              │
│                                 │
│  Cloud sync is a PRO feature.   │
│  Upgrade to PRO to see your     │
│  data across all your devices.  │
│                                 │
│  [ Upgrade to PRO ]             │
└─────────────────────────────────┘
```

**Fix (C6-2):** Still run a one-time bootstrap on FREE tier for the PWA — but only
to hydrate the subscription/profile cache (so the correct tier is known and the
upgrade button works). Do NOT run push/pull for entity data on FREE.

---

### Condition 7 — Network offline when PWA opens

**What happens:**
- In-memory DB empty + network unavailable → bootstrap/pull fails
- User sees blank data with sync error badge

**Native behaviour:** Fully offline — SQLite has all data, user can work normally.

**PWA behaviour:** Blank until network returns. This is a fundamental limitation of
the cloud-first web model. The service worker (Sprint 23 B-5) can cache the JS
bundle so the app shell loads, but NOT the data.

**Fix (C7-1):** Show a clear "No connection — data unavailable offline" message
instead of blank lists. Include a "Retry" button.

**Fix (C7-2):** When network returns (listen to `window.addEventListener('online')`),
automatically retry bootstrap/pull.

```ts
// In useSyncEngine on web:
useEffect(() => {
  if (Platform.OS !== 'web') return;
  const handler = () => { triggerPull(); };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}, [triggerPull]);
```

---

### Condition 8 — Foreground detection on web (AppState replacement)

**What happens today:**
- `useSyncEngine` uses `AppState.addEventListener('change', ...)` for foreground sync
- On web, `AppState` from `react-native` is a no-op or doesn't fire
- Sync on tab-focus is never triggered

**Fix (C8-1):** Add a platform-split in `useSyncEngine` for visibility events:

```ts
useEffect(() => {
  if (Platform.OS === 'web') {
    // Web: use Page Visibility API
    const handler = () => {
      if (document.visibilityState === 'visible' && session?.accessToken) {
        void triggerPull();
        void triggerPush();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }

  // Native: use AppState
  const sub = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active' && session?.accessToken) {
      void triggerPush();
      void triggerPull();
    }
  });
  return () => sub.remove();
}, [session?.accessToken, syncEnabled]);
```

---

### Condition 9 — Receipt images on PWA

**What happens:**
- Native app stores receipts at local file URIs (`file:///...` or `documentDirectory/...`)
- PWA cannot access these file URIs
- PRO users: receipts uploaded to Supabase Storage → have a `storage_path`
- PWA should download receipt via Supabase Storage signed URL when displaying

**Fix (C9-1):** In receipt display components, when `Platform.OS === 'web'`,
use `supabase.storage.from('receipts').createSignedUrl(storagePath, 3600)` instead
of the local URI.

**Fix (C9-2):** FREE users' receipts are device-local only — show a placeholder
"Receipt on device only" instead of a broken image.

---

### Condition 10 — Pull does NOT hydrate claims/trips/TNG (bootstrap gap)

**What happens today:**
- `bootstrapEngine.ts` applies: profile, subscription, spaces, org_context
- It does NOT apply: claims, claim_items, trips, tng_transactions, personal expenses,
  business entries
- These come via `pull` which fetches delta changes since cursor

**Gap:** If `pull` doesn't fetch these entities correctly, the PWA shows blank lists
even after bootstrap succeeds.

**Fix (C10-1):** Verify `pullEngine.ts` correctly applies all entity types to the
in-memory DB on web. Check that `upsert` operations for each entity write to the
correct in-memory table.

**Fix (C10-2):** Add a "sync complete" event or state that is only set TRUE after
both bootstrap AND the first pull have completed successfully. Lists should not
render until this state is true.

---

## Implementation Plan

### Priority 1 — Blockers (app is unusable without these)

| ID | Fix | File | Effort |
|---|---|---|---|
| C1-2 | Loading screen until first sync complete | `App.tsx` / `useSyncEngine` | 1h |
| C2-1 | Persist cursor to localStorage on web | `src/local-db/repositories/syncStateRepository.web.ts` | 2h |
| C4-1 | Immediate push on mutation on web | `useSyncEngine` + mutation hooks | 2h |
| C6-1 | FREE tier empty state on web | New `WebSyncEmptyState` component | 1h |
| C7-1 | Offline empty state + retry | `useSyncEngine` + list screens | 1h |
| C8-1 | Replace AppState with visibilitychange on web | `useSyncEngine.ts` | 1h |
| C10-2 | "Sync complete" gate before rendering lists | `useSyncEngine` | 1h |

### Priority 2 — Data integrity

| ID | Fix | File | Effort |
|---|---|---|---|
| C3-1 | Re-bootstrap if cursor older than 30 days | `syncStateRepository.web.ts` | 30m |
| C4-2 | Mirror push queue to localStorage | `src/sync/webQueuePersistence.ts` | 2h |
| C5-1 | Show toast when push item rejected | `useSyncEngine` | 1h |
| C7-2 | Auto-retry on network restore | `useSyncEngine` | 30m |

### Priority 3 — Polish

| ID | Fix | File | Effort |
|---|---|---|---|
| C9-1 | Receipt display via Supabase signed URL | Receipt display components | 2h |
| C9-2 | "Receipt on device only" placeholder | Receipt display components | 30m |
| C10-1 | Verify pullEngine applies all entity types | `src/sync/pullEngine.ts` | 1h |

---

## Sync Flow: What the PWA Should Do on Every Load

```
Page loads
    │
    ▼
initializeLocalDatabase() → in-memory DB ready (empty)
    │
    ▼
Supabase session restored from localStorage
    │
    ├─ No session → show LoginScreen
    │
    └─ Session valid
           │
           ▼
       Show "Loading your data…" screen (do not render lists yet)
           │
           ▼
       Read cursor from localStorage
           │
           ├─ No cursor (first load or cursor wiped)
           │       │
           │       ▼
           │   bootstrap() → hydrates profile/sub/spaces
           │       │
           │       ▼
           │   pull(null) → fetches ALL entities (claims, trips, etc.)
           │       │
           │       ▼
           │   Save cursor to localStorage
           │
           └─ Cursor exists (returning user)
                   │
                   ▼
               pull(cursor) → delta only (fast ~200ms)
                   │
                   ▼
               Update cursor in localStorage
           │
           ▼
       Sync complete → hide loading screen → render lists
           │
           ▼
       Periodic pull every SYNC_PERIODIC_INTERVAL_MS (setInterval — works on web)
       Page visibility change → pull + push on tab focus
       Network restore → retry pull + push
```

---

## FREE Tier Sync Policy (Web)

| Tier | Bootstrap | Push | Pull | Data visible on PWA |
|---|---|---|---|---|
| FREE | ❌ Disabled | ❌ Disabled | ❌ Disabled | ❌ Never — show upgrade CTA |
| PRO | ✅ On first load | ✅ Immediate on mutation | ✅ On load + periodic | ✅ After first sync |
| PREMIUM | ✅ On first load | ✅ Immediate on mutation | ✅ On load + periodic | ✅ After first sync |

**Exception:** Even FREE tier users run a one-time mini-bootstrap to hydrate
subscription/tier so the upgrade prompt knows which plan to offer.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src/local-db/repositories/syncStateRepository.web.ts` | New — localStorage-backed cursor persistence |
| `src/sync/hooks/useSyncEngine.ts` | visibilitychange on web, online retry, sync-complete gate |
| `src/sync/webQueuePersistence.ts` | New — localStorage queue mirror for web |
| `src/features/shell/components/SyncLoadingGate.tsx` | New — blocks content until first sync done |
| `src/features/shell/components/WebSyncEmptyState.tsx` | New — FREE tier empty state on web |
| `src/features/receipts/components/ReceiptThumbnail.tsx` | Signed URL on web, placeholder for local-only |
| `App.tsx` | Wire `SyncLoadingGate`, `WebSyncEmptyState`, online handler |

---

## Success Criteria

| Scenario | Expected Result |
|---|---|
| First PWA open (PRO user) | "Loading…" → bootstrap + pull → all claims visible within 5s |
| PWA page refresh (PRO user) | Delta pull only → data appears within 1s |
| Native pushed new claim → user opens PWA | Claim visible after pull on load |
| User creates claim on PWA → closes tab | Claim visible on native (pushed before close) |
| PWA tab refocused | Pull triggered → latest data appears |
| Offline when PWA opens | "No connection" message + Retry button |
| Network restores while PWA open | Auto-retry pull → data appears |
| FREE tier user opens PWA | Upgrade CTA — no blank lists |
| Conflict: native + PWA edit same claim | Last-write-wins, toast notification if rejected |
