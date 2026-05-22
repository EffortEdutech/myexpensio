# Sprint 1 Comprehensive Checklist

Date: 2026-05-22

Parent plan:

```text
docs/USER_MOBILE_V2_COMPREHENSIVE_SPRINT_PLAN.md
```

## Sprint Goal

Create a real local-first foundation for MyExpensio user mobile v2 while preserving a complete map of existing user app features.

## Guardrails

- [ ] Do not change `apps/user`.
- [ ] Do not call Supabase directly from mobile screens.
- [ ] Do not store service role or secret keys in the mobile app.
- [ ] Do not make billing/payment mutations offline.
- [ ] Do not hard-delete synced records by default.
- [ ] Do not build isolated screens without wiring them to repositories and sync rules.

## Planning And Parity

- [ ] Document all current app spaces: Work Claims, Personal Expense, Business Space.
- [ ] Document current Work Claims routes and behavior.
- [ ] Document current Personal Expense routes and behavior.
- [ ] Document current Business Space routes and behavior.
- [ ] Document auth and invite flows.
- [ ] Document settings, billing, and subscription flows.
- [ ] Document upload, scan, and file flows.
- [ ] Document TNG import/link/export flows.
- [ ] Document trip, route, GPS, odometer, and mileage flows.
- [ ] Document reports and export flows.

## App Shell

- [x] Create native app shell.
- [x] Add safe-area aware layout.
- [x] Add header pattern.
- [ ] Add profile/settings entry point.
- [x] Add offline/sync status indicator.
- [x] Add trial/subscription badge placeholder.
- [x] Add three-space navigation model:
  - Work Claims
  - Personal Expense
  - Business Space
- [ ] Add feature-gate boundary for Free, Pro, Premium.

## Auth Foundation

- [ ] Define auth API client boundary.
- [ ] Define secure token storage.
- [ ] Define session restore.
- [ ] Define sign-out local cleanup policy.
- [ ] Prepare biometric login abstraction.
- [ ] Prepare accept-invite flow mapping.
- [ ] Prepare complete-first-login flow mapping.

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
- [ ] Space repository.
- [ ] Cached subscription repository.

## Work Claims Slice

- [x] Claims list reads from SQLite.
- [x] Create local draft claim.
- [ ] Edit local draft claim title/period.
- [ ] Soft-delete local draft claim.
- [x] Create local claim item.
- [ ] Edit local claim item.
- [ ] Soft-delete local claim item.
- [ ] Add local transport item types.
- [x] Attach local receipt metadata.
- [x] Show sync status per claim/item.
- [ ] Prevent submitted claim edits locally.

## Receipt And File Uploads

- [x] Define receipt entity model.
- [x] Store local file URI.
- [x] Store remote storage path after upload.
- [x] Track upload status separately from entity sync status.
- [x] Queue upload work.
- [ ] Retry failed uploads.
- [ ] Handle missing local file.
- [ ] Define signed upload API contract.
- [ ] Define uploaded file view URL behavior.

## Trips And Mileage Preparation

- [ ] Define local trip model.
- [ ] Define local trip point model.
- [ ] Define active trip lifecycle.
- [ ] Define GPS permission flow.
- [ ] Define odometer photo/override flow.
- [ ] Define route alternatives cache model.
- [ ] Define route selection sync behavior.

## TNG Preparation

- [ ] Define local TNG statement model.
- [ ] Define local TNG transaction model.
- [ ] Define import status lifecycle.
- [ ] Define claim-item link behavior.
- [ ] Define unlink behavior.
- [ ] Define duplicate transaction policy.
- [ ] Define export appendix dependency.

## Personal Expense Preparation

- [ ] Define personal space local model.
- [ ] Define personal expense as ledger entry or expense subtype.
- [ ] Define bill/commitment local model.
- [ ] Define commitment payment model.
- [ ] Define personal tax report cache needs.

## Business Space Preparation

- [ ] Define business space local model.
- [ ] Define income ledger entry.
- [ ] Define business expense ledger entry.
- [ ] Define business profit summary cache.
- [ ] Define business tax report cache.
- [ ] Preserve Premium feature gate.

## Sync Engine

- [x] Define `POST /sync/push`.
- [x] Define `GET /sync/pull`.
- [x] Define bootstrap sync.
- [ ] Define sync cursor storage.
- [ ] Define retry/backoff behavior.
- [ ] Define conflict result handling.
- [ ] Define rejected mutation UX.
- [ ] Define server-wins merge helper.
- [ ] Define local-wins draft helper.
- [ ] Define file upload sync as separate worker.

## API Client

- [x] Create base API client.
- [x] Attach auth token.
- [x] Normalize API errors.
- [ ] Handle offline/network failure.
- [x] Add sync API client.
- [ ] Add file upload API client.

## UI And UX

- [x] Use native controls and touch-friendly layout.
- [x] Show local-first instant updates.
- [x] Show subtle pending/synced/failed states.
- [x] Avoid blocking UI on sync.
- [x] Add empty states.
- [x] Add loading states.
- [ ] Add error states.
- [ ] Add retry actions.
- [ ] Confirm destructive local deletes.

## Verification

- [x] Run typecheck.
- [ ] Run Expo bundle/export check.
- [ ] Start app locally.
- [ ] Create draft offline.
- [ ] Confirm draft persists after reload.
- [x] Confirm sync queue item is created.
- [ ] Confirm failed network does not lose local data.
- [ ] Confirm no `apps/user` files were modified.

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

