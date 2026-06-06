# Sprint 12 — Backend / NestJS Sync API and Supabase Integration — Sign-off

**Date:** 2026-05-30
**Status:** ✅ SIGNED OFF

---

## Scope

Sprint 12 delivered the three server-side sync endpoints in `apps/user`
(Next.js) that the mobile app calls. All endpoints sit behind Supabase JWT auth
and enforce user-ownership before touching any data.

---

## Deliverables

### New files (apps/user)

| File | Endpoint | Purpose |
|---|---|---|
| `app/api/sync/bootstrap/route.ts` | `GET /api/sync/bootstrap` | Returns profile, subscription, spaces, rate version, usage counters for fresh login |
| `app/api/sync/push/route.ts` | `POST /api/sync/push` | Accepts mobile mutations, upserts to Supabase, returns accepted/rejected per item |
| `app/api/sync/pull/route.ts` | `GET /api/sync/pull?cursor=` | Returns delta changes since cursor for all user entities |

---

## Bootstrap endpoint

Returns a full snapshot for a fresh device. Payload contains:

- `profile` — from `profiles` table
- `subscription` — latest from `subscriptions`
- `spaces` — all non-deleted spaces owned by user
- `rate_version` — latest `user_rate_versions` row
- `usage_counters` — all current usage counter rows

---

## Push endpoint — supported entity types

| Entity type | Operations | Conflict rule |
|---|---|---|
| `claim` | create / update / delete | Rejects edits to non-DRAFT claims (`CLAIM_LOCKED`) |
| `claim_item` | create / update / delete | Upsert by id |
| `trip` | create / update / delete | Upsert by id |
| `tng_transaction` | create / update | Upsert by id |
| `tng_statement_batch` | create / update | Upsert by id |
| `ledger_entry` | create / update / delete | Upsert by id |
| `commitment` | create / update / delete | Upsert by id |
| `commitment_payment` | create / update | Upsert by id |
| `export_job`, `receipt`, `expense` | acknowledged, not persisted | Deferred Sprint 13 |

---

## Pull endpoint — entities returned

| Entity type | Table | Scope |
|---|---|---|
| `claim` | `claims` | `user_id = auth user` |
| `claim_item` | `claim_items` | via `claims.user_id` join |
| `trip` | `trips` | `user_id = auth user` |
| `tng_transaction` | `tng_transactions` | `user_id = auth user` |
| `ledger_entry` | `ledger_entries` | `user_id = auth user` |
| `commitment` | `commitments` | `user_id = auth user` |

Soft-deleted rows are included with `operation: "delete"` so mobile can tombstone them.
Page size: 200 claims / 500 items per pull.

---

## Bug fixes applied during Sprint 12 sign-off (2026-05-30)

| File | Issue | Fix |
|---|---|---|
| `app/api/sync/bootstrap/route.ts` | Dead import `nowIso` from non-existent `@/lib/time` — would break build | Removed import |
| `src/sync/pullEngine.ts` (mobile) | `tng_transaction` and `commitment` not handled in `applyChange` switch — changes silently dropped | Added both cases |

---

## Security notes

- Every endpoint calls `supabase.auth.getUser()` and returns 401 if no session
- Push endpoint enforces `user_id = authenticated user` on all upserts
- Submitted/approved claims are write-protected server-side (`CLAIM_LOCKED` rejection)
- No admin or cross-user data access possible via these routes

---

## Known deferred items

- Receipt binary upload endpoint → Sprint 13
- XLSX / PDF export generation via server → Sprint 13
- TNG PDF parsing endpoint → Sprint 13
- Pagination cursor on pull (currently a single page per fetch) → Sprint 14
