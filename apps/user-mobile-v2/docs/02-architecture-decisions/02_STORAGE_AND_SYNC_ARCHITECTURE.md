# MyExpensio Mobile v2 — Storage & Sync Architecture

**Decision locked:** 2026-06-02  
**Model:** Option B — Local-first, cloud as backup (PRO tier)  
**Reference this document at the start of every conversation touching data, sync, receipts, or subscription.**

---

## Core Principle

> The app works fully offline. Cloud backup is a PRO value proposition, not a baseline requirement.

This is the standard architecture for modern fintech mobile apps (Notion, Bear Notes, 1Password, MoneyMoney). Users expect offline-first behaviour. Cloud sync is opt-in via subscription.

---

## Tier Definitions

### FREE Tier

| Aspect | Behaviour |
|--------|-----------|
| Data storage | SQLite on device only |
| Receipts | JPEG files in `expo-file-system` `documentDirectory/receipts/` |
| Sync engine | **Disabled** — no push, pull, bootstrap, or receipt upload |
| Login purpose | Subscription gate + feature gates only |
| Exports | PDF / Excel work locally (no cloud needed) |
| Data on uninstall | **Lost** — this is acceptable and communicated to users |
| Sync badge | Shows **"Local only"** (grey) |

### PRO Tier

| Aspect | Behaviour |
|--------|-----------|
| Data storage | SQLite on device + synced to Supabase (PostgreSQL) |
| Receipts | Local JPEG **+** uploaded to Supabase Storage |
| Sync engine | **Active** — push, pull, bootstrap, periodic sync, foreground sync |
| Receipt upload | Runs after each push cycle via `receiptUploadEngine` |
| Data on uninstall | Survives — restore from Supabase on next login |
| Cross-device | Yes — PRO value proposition |
| Sync badge | Shows **"Synced"** / **"N pending"** / **"Syncing…"** / **"Offline"** / **"Sync error"** |

### PREMIUM Tier

Same as PRO plus workspace/team features (invite members, shared claims, admin panel).

---

## Implementation Map

### Sync engine gating
File: `src/sync/hooks/useSyncEngine.ts`
- Reads `tier` from `useSubscription()` (which queries `subscriptions_cache` in local SQLite)
- If `tier === "FREE"` → all sync functions are no-ops, status returns `"free_tier"`
- If `tier === "PRO"` or `"PREMIUM"` → full sync runs

### Receipt capture & storage
File: `src/features/claims/components/ClaimDetail.tsx` → `openLocalReceiptPicker()`
- Native: `expo-image-picker` → copies file to `documentDirectory/receipts/<timestamp>.jpg`
- `localUri` is always the permanent path (survives app restart)
- FREE: stays local forever
- PRO: `receiptUploadEngine` picks up `upload_status = 'local'` records and pushes to Supabase Storage

### Receipt upload engine
File: `src/sync/receiptUploadEngine.ts`
- Only called inside `triggerPush()` which is already gated behind `syncEnabled`
- Requests signed upload URL from `/api/sync/upload-url`
- PUTs file binary to Supabase Storage via signed URL
- Marks receipt as `upload_status = 'uploaded'` with `storage_path`

### Subscription cache
Table: `subscriptions_cache` in SQLite
- Populated by bootstrap engine on first PRO login
- Updated by pull engine on each sync
- Hook: `src/features/subscription/hooks/useSubscription.ts`
- Falls back to `FREE` if no cached record exists

### Sync API routes (on `apps/user` Next.js backend)
| Route | Purpose |
|-------|---------|
| `POST /api/sync/bootstrap` | First-login full data pull |
| `POST /api/sync/push` | Client → Supabase mutations |
| `POST /api/sync/pull` | Supabase → client delta |
| `POST /api/sync/upload-url` | Get signed URL for receipt upload |

---

## Sync Badge States

| Status | Label | Colour | Meaning |
|--------|-------|--------|---------|
| `free_tier` | Local only | Grey | FREE user — no sync |
| `idle` (synced) | Synced | Green | PRO, all pushed |
| `pending` | N pending | Amber | Items queued |
| `syncing` | Syncing… | Blue | Active sync cycle |
| `offline` | Offline | Grey | Network unavailable |
| `error` | Sync error | Red | Push/pull failed |

---

## Data Loss Policy

- **FREE tier:** Data is device-bound. Uninstalling = data lost. This must be communicated clearly on the upgrade screen and in onboarding.
- **PRO tier:** Data is backed up to Supabase. Uninstalling and reinstalling restores all data on next login (bootstrap pull).
- **Receipts (FREE):** Stored in `documentDirectory` — survives app updates but not reinstall.
- **Receipts (PRO):** Stored in `documentDirectory` + Supabase Storage. Restored via pull + re-download (download on demand, not yet implemented — files are re-uploaded on next device if needed).

---

## What Is NOT Implemented Yet (as of 2026-06-02)

| Item | Priority | Notes |
|------|----------|-------|
| Receipt re-download on PRO restore | Medium | After reinstall, localUri is lost; need to download from Supabase Storage on demand |
| Upgrade screen with data-loss warning | High | Must warn FREE users before they uninstall / before upgrade prompt |
| Storage quota enforcement (PRO) | Medium | Supabase Storage bucket should have per-user quota |
| Conflict resolution on pull | Low | Currently last-write-wins; full conflict UI deferred |

---

## Sprint Context

This architecture was implemented in **Sprint 15** (E2E QA). Prior sprints (11 & 12) built the sync engine without the tier gate. The tier gate was added in Sprint 15 as part of the storage architecture lock-in.

Remaining sprints: **16 → 17 → 18 → 19** (release build, pilot, production launch, stabilisation).
