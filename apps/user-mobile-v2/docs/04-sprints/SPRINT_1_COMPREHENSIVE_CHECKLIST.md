# Sprint 1 Comprehensive Checklist

Date: 2026-05-22

Parent plan:

```text
docs/USER_MOBILE_V2_COMPREHENSIVE_SPRINT_PLAN.md
```

## Sprint Goal

Create a real local-first foundation for MyExpensio user mobile v2 while preserving a complete map of existing user app features.

## Guardrails

- [x] Do not change `apps/user`.
- [x] Do not call Supabase directly from mobile screens.
- [x] Do not store service role or secret keys in the mobile app.
- [x] Do not make billing/payment mutations offline.
- [x] Do not hard-delete synced records by default.
- [x] Do not build isolated screens without wiring them to repositories and sync rules.

## Planning And Parity

- [x] Document all current app spaces: Work Claims, Personal Expense, Business Space.
- [x] Document current Work Claims routes and behavior.
- [x] Document current Personal Expense routes and behavior.
- [x] Document current Business Space routes and behavior.
- [x] Document auth and invite flows.
- [x] Document settings, billing, and subscription flows.
- [x] Document upload, scan, and file flows.
- [x] Document TNG import/link/export flows.
- [x] Document trip, route, GPS, odometer, and mileage flows.
- [x] Document reports and export flows.

## App Shell

- [x] Create native app shell.
- [x] Add safe-area aware layout.
- [x] Add header pattern.
- [x] Add profile/settings entry point.
- [x] Add offline/sync status indicator.
- [x] Add trial/subscription badge placeholder.
- [x] Add three-space navigation model:
  - Work Claims
  - Personal Expense
  - Business Space
- [x] Add feature-gate boundary for Free, Pro, Premium.

## Auth Foundation

- [x] Define auth API client boundary.
- [x] Define secure token storage.
- [x] Define session restore.
- [x] Define sign-out local cleanup policy.
- [x] Prepare biometric login abstraction.
- [x] Prepare accept-invite flow mapping.
- [x] Prepare complete-first-login flow mapping.

## Local Database

- [x] Add `schema_migrations`.
- [x] Add migration runner.
- [x] Add `sync_state`.
- [x] Add `sync_queue`.
- [x] Add `profiles_cache`.
- [x] Add `subscriptions_cache`.
- [x] Add `spaces`.
- [x] Add `claims`.
- [x] Add `claim_items`.
- [x] Add `expenses`.
- [x] Add `receipts`.
- [x] Add `trips`.
- [x] Add `trip_points`.
- [x] Add `routes_cache`.
- [x] Add `tng_transactions`.
- [x] Add `ledger_entries`.
- [x] Add `commitments`.
- [x] Add `commitment_payments`.
- [x] Add `rate_versions_cache`.
- [x] Add `usage_counters_cache`.

## Repository Layer

- [x] Repository reads never call network.
- [x] Repository writes persist locally first.
- [x] Repository writes create sync queue items.
- [x] Claim repository.
- [x] Claim item repository.
- [x] Expense repository.
- [x] Receipt repository.
- [x] Sync queue repository.
- [x] Sync state repository.
- [x] Space repository.
- [x] Cached subscription repository.

## Work Claims Slice

- [x] Claims list reads from SQLite.
- [x] Create local draft claim.
- [x] Edit local draft claim title/period.
- [x] Soft-delete local draft claim.
- [x] Create local claim item.
- [x] Edit local claim item.
- [x] Soft-delete local claim item.
- [x] Add local transport item types.
- [x] Attach local receipt metadata.
- [x] Show sync status per claim/item.
- [x] Prevent submitted claim edits locally.

## Receipt And File Uploads

- [x] Define receipt entity model.
- [x] Store local file URI.
- [x] Store remote storage path after upload.
- [x] Track upload status separately from entity sync status.
- [x] Queue upload work.
- [x] Retry failed uploads.
- [x] Handle missing local file.
- [x] Define signed upload API contract.
- [x] Define uploaded file view URL behavior.

## Trips And Mileage Preparation

- [x] Define local trip model.
- [x] Define local trip point model.
- [x] Define active trip lifecycle.
- [x] Define GPS permission flow.
- [x] Define odometer photo/override flow.
- [x] Define route alternatives cache model.
- [x] Define route selection sync behavior.

## TNG Preparation

- [x] Define local TNG statement model.
- [x] Define local TNG transaction model.
- [x] Define import status lifecycle.
- [x] Define claim-item link behavior.
- [x] Define unlink behavior.
- [x] Define duplicate transaction policy.
- [x] Define export appendix dependency.

## Personal Expense Preparation

- [x] Define personal space local model.
- [x] Define personal expense as ledger entry or expense subtype.
- [x] Define bill/commitment local model.
- [x] Define commitment payment model.
- [x] Define personal tax report cache needs.

## Business Space Preparation

- [x] Define business space local model.
- [x] Define income ledger entry.
- [x] Define business expense ledger entry.
- [x] Define business profit summary cache.
- [x] Define business tax report cache.
- [x] Preserve Premium feature gate.

## Sync Engine

- [x] Define `POST /sync/push`.
- [x] Define `GET /sync/pull`.
- [x] Define bootstrap sync.
- [x] Define sync cursor storage.
- [x] Define retry/backoff behavior.
- [x] Define conflict result handling.
- [x] Define rejected mutation UX.
- [x] Define server-wins merge helper.
- [x] Define local-wins draft helper.
- [x] Define file upload sync as separate worker.

## API Client

- [x] Create base API client.
- [x] Attach auth token.
- [x] Normalize API errors.
- [x] Handle offline/network failure.
- [x] Add sync API client.
- [x] Add file upload API client.

## UI And UX

- [x] Use native controls and touch-friendly layout.
- [x] Show local-first instant updates.
- [x] Show subtle pending/synced/failed states.
- [x] Avoid blocking UI on sync.
- [x] Add empty states.
- [x] Add loading states.
- [x] Add error states.
- [x] Add retry actions.
- [x] Confirm destructive local deletes.

## Verification

- [x] Run typecheck.
- [x] Run Expo bundle/export check.
- [x] Start app locally.
- [x] Add in-app local-first smoke test.
- [x] Create draft offline.
- [ ] Confirm draft persists after reload.
- [x] Confirm sync queue item is created.
- [x] Confirm failed network does not lose local data.
- [ ] Confirm no `apps/user` files were modified.

Runtime note:

```text
2026-05-22: Expo web server started on http://localhost:8082 and returned HTTP 200.
```

## Commands

Run from repo root:

```text
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
corepack pnpm dev:user-mobile-v2
```

## Commit Reminder

When committing Sprint 1 work, stage only relevant files:

```text
git add docs/USER_MOBILE_V2_COMPREHENSIVE_SPRINT_PLAN.md apps/user-mobile-v2
```

Avoid:

```text
git add .
```

