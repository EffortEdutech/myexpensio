# MyExpensio User Mobile v2 Comprehensive Sprint Plan

Date: 2026-05-22

## Purpose

This plan defines the first comprehensive sprint for the clean MyExpensio user mobile v2 rewrite in:

```text
apps/user-mobile-v2
```

The existing app remains the feature and behavior reference:

```text
apps/user
```

Do not change `apps/user` as part of this sprint.

## Sprint Principle

The sprint must not only build screens. It must establish the mobile architecture that will allow all existing user-facing features to return safely.

The core sprint outcome:

```text
User mobile v2 can run locally, persist expense/claim work in SQLite, queue offline mutations, and has a documented parity map for every current user app feature.
```

## Current v2 Baseline

Already completed:

- Expo / React Native app scaffold.
- Expo SDK 56 dependency setup.
- SQLite initialization.
- `expenses` local table.
- `sync_queue` local table.
- Local draft expense creation proof.
- TanStack Query hook pattern.
- Zustand device-state starter.
- Local-first architecture decision record.

Verified:

```text
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
```

## Existing User App Feature Inventory

The current app contains three major user spaces:

```text
Work Claims
Personal Expense
Business Space / My Income
```

### Shared Shell

Current behavior to preserve:

- Authenticated app shell.
- Header with `myexpensio` brand.
- Space switcher.
- Profile/settings dropdown.
- Subscription badge.
- Trial banner.
- Online/offline banner.
- Bottom navigation.
- Free / Pro / Premium gates.
- First-login setup completion.
- PWA install/update behavior for the existing web app.

Mobile v2 sprint requirement:

- Define native mobile equivalent for shell, navigation, subscription badge, offline indicator, and profile/settings entry point.
- Keep PWA-specific behavior documented but do not make it the native app runtime model.

### Auth And Account

Current behavior to preserve:

- Login.
- Forgot password.
- Change password.
- Accept invite.
- Complete first login.
- Sign out.
- Profile display and profile settings.
- Biometric login UI in current PWA.

Mobile v2 sprint requirement:

- Define auth storage policy.
- Define session refresh behavior.
- Define secure token storage strategy.
- Prepare biometric-login adapter boundary for native implementation.

### Work Claims Space

Current navigation:

```text
Home
Trips
Claims
Transactions
Export
```

Current behavior to preserve:

- Home dashboard with monthly stats.
- Recent trips.
- Recent claims.
- Start trip.
- Mileage calculator.
- Trip detail.
- Trip stop.
- Trip points.
- GPS, selected route, and odometer distance sources.
- Odometer override mode.
- Route alternatives.
- Route selection.
- Claims list.
- New claim.
- Claim detail.
- Claim item creation.
- Claim item edit/delete.
- Claim submission.
- Claim statuses.
- Transport claim items:
  - toll
  - parking
  - taxi
  - Grab
  - train
  - flight
  - mileage/trip-derived item
  - meals/lodging where supported by rates
- Receipt/ticket upload.
- TNG statement import.
- TNG transaction list.
- TNG transaction linking to claim items.
- TNG suggestions.
- TNG appendix preview for exports.
- Export jobs.
- Export history.
- Export download.
- Report template selection.
- Usage limits for route, trip, and export counts.

Sprint 1 mobile implementation focus:

- Local-first claims and claim items data model.
- Local draft claim flow.
- Local draft expense/transport item flow.
- Local receipt metadata and queued upload design.
- Sync queue behavior for create/update/delete.
- Server sync contract design for push/pull.

### Personal Expense Space

Current navigation:

```text
Personal Home
Expenses
Add
Bills
Tax
```

Current behavior to preserve:

- Personal dashboard.
- Personal expenses list.
- Add personal expense.
- Bills/commitments list.
- Add bill/commitment.
- Bill detail.
- Bill payment records.
- Bill document upload/view.
- Personal tax report.
- Personal ledger entries.

Sprint 1 requirement:

- Include tables and entity mapping in the parity plan.
- Do not build full UI in Sprint 1 unless the work-claims slice is complete.
- Ensure the local database model does not block adding personal ledger/commitment records later.

### Business Space / My Income

Current navigation:

```text
Business Dashboard
Income
Add
Expenses
Reports
```

Current behavior to preserve:

- Premium-gated business space.
- Business dashboard.
- Business income list.
- Add business income.
- Business expenses list.
- Add business expense.
- Business profit summary.
- Business tax report.
- Business ledger entries.

Sprint 1 requirement:

- Include business ledger entities in the parity map.
- Preserve Premium gating in app architecture.
- Do not build full business UI before the core offline sync design is stable.

### Settings, Billing, And Subscription

Current behavior to preserve:

- Settings page.
- Profile update.
- Rate settings.
- Billing summary.
- Billing checkout.
- Billing portal.
- Premium checkout.
- Subscription status.
- Usage counters.
- Free/Pro/Premium feature limits.
- Terms and privacy pages.

Sprint 1 requirement:

- Define mobile settings sections.
- Define which settings are locally cached.
- Define which billing/subscription data is online-only.
- Keep billing operations server-driven; do not queue payment mutations offline.

### Uploads, Scanning, And Files

Current behavior to preserve:

- Receipt upload.
- Bill document upload.
- Upload signing.
- Upload viewing.
- Scan processing.
- Document scanner.
- Scan preview/crop behavior.
- Receipt thumbnails.

Sprint 1 requirement:

- Define native file model:
  - local file URI
  - upload status
  - remote storage path
  - MIME type
  - file size
  - entity owner
  - retry status
- Implement receipt metadata table.
- Queue upload work separately from entity metadata sync.

## Sprint 1 Scope

### Must Build

1. App shell foundation.
2. Navigation foundation for the three spaces.
3. Local database migration system.
4. Local schema v1 for sprint entities.
5. Repository pattern for local reads/writes.
6. Sync queue model and helpers.
7. Sync state table.
8. Work-claims draft flow:
   - claim draft
   - claim item draft
   - expense/transport item draft
   - receipt metadata draft
9. Offline-first mutation behavior:
   - create locally
   - edit locally
   - soft-delete locally
   - queue sync item
10. Sync API contract document.
11. First sync client boundary:
   - push pending items
   - pull changed records
   - mark success/failure locally
12. Manual QA checklist.

### Must Document

1. Entity parity map.
2. Local schema map.
3. Server API contract.
4. Conflict rules.
5. Offline limitations.
6. Security and local-storage policy.
7. Receipt upload lifecycle.
8. Feature-gating rules.
9. What is intentionally deferred.

### Must Not Build Yet

These are not Sprint 1 implementation goals unless all must-build items are complete:

- Full TNG PDF parsing UI.
- Full export builder UI.
- Full business reports UI.
- Full personal tax UI.
- Billing checkout in native UI.
- Admin/manager approval workflows.
- Push notifications.
- Production app store release.

## Local Database Sprint Schema

Sprint 1 should define or prepare these local tables:

```text
schema_migrations
sync_state
sync_queue
profiles_cache
subscriptions_cache
spaces
claims
claim_items
expenses
receipts
trips
trip_points
routes_cache
tng_transactions
ledger_entries
commitments
commitment_payments
rate_versions_cache
usage_counters_cache
```

Only the minimum needed tables should receive full repository implementations in Sprint 1. The rest can start as schema placeholders if the entity shape is clear.

## Sync Contract Starting Point

Required endpoints:

```text
POST /sync/push
GET  /sync/pull
```

Optional supporting endpoints:

```text
GET  /sync/bootstrap
POST /files/prepare-upload
POST /files/complete-upload
GET  /dashboard/mobile-summary
```

Push request shape:

```json
{
  "device_id": "device_x",
  "client_time": "2026-05-22T00:00:00.000Z",
  "items": [
    {
      "queue_id": "sync_x",
      "entity_type": "claim_item",
      "entity_id": "claim_item_x",
      "operation": "create",
      "client_updated_at": "2026-05-22T00:00:00.000Z",
      "payload": {}
    }
  ]
}
```

Push response shape:

```json
{
  "accepted": [
    {
      "queue_id": "sync_x",
      "entity_type": "claim_item",
      "entity_id": "claim_item_x",
      "server_updated_at": "2026-05-22T00:00:01.000Z"
    }
  ],
  "rejected": [
    {
      "queue_id": "sync_y",
      "entity_type": "claim",
      "entity_id": "claim_y",
      "code": "CLAIM_LOCKED",
      "message": "Submitted claims cannot be edited."
    }
  ]
}
```

Pull response shape:

```json
{
  "cursor": "server_cursor_x",
  "changes": [
    {
      "entity_type": "claim",
      "entity_id": "claim_x",
      "operation": "upsert",
      "server_updated_at": "2026-05-22T00:00:01.000Z",
      "payload": {}
    }
  ]
}
```

## Conflict Rules

Initial rules:

- Draft claim: local user edits win until submitted.
- Draft claim item: local user edits win until parent claim is submitted.
- Submitted claim: server wins for status, approval, rejection, payment, locked totals, and audit fields.
- Rates and policies: server wins.
- Subscriptions and entitlements: server wins.
- TNG transaction claimed/link status: server wins after sync confirmation.
- Receipts: merge by receipt ID and upload status.
- Trips: local can keep recording while active; server wins once stopped and finalized unless an unresolved local point queue exists.
- Deletes: soft-delete first using `deleted_at`.

## Security And Privacy

Sprint 1 must define:

- No Supabase service role key in mobile app.
- Auth tokens stored in secure native storage.
- Local database contains user financial data and must be treated as sensitive.
- Receipt local files must be scoped to app storage.
- Sign-out must clear local user data or require explicit account switching policy.
- Billing/payment operations are online-only and server-driven.
- All server sync writes must enforce ownership and entitlement checks.

## Acceptance Criteria

Sprint 1 is complete only when:

- App starts locally.
- Typecheck passes.
- Expo export/bundle check passes or a documented native-only blocker exists.
- SQLite initializes through migrations.
- User can create a local draft claim or expense item.
- Local data survives app reload.
- A sync queue item is created for each local mutation.
- Pending sync queue can be listed.
- Sync contract is documented.
- Existing user app feature parity map is documented.
- `apps/user` remains untouched.
- Manual QA checklist exists.

## Verification Commands

Run from repo root:

```text
corepack pnpm -C apps/user-mobile-v2 typecheck
corepack pnpm -C apps/user-mobile-v2 exec expo export --platform web --clear
```

Run app:

```text
corepack pnpm dev:user-mobile-v2
```

## Commit Policy

Keep Sprint 1 commits focused:

1. Planning documents.
2. App shell/navigation.
3. Local DB migrations/schema.
4. Repositories and feature hooks.
5. Sync queue and sync client.
6. QA checklist and verification fixes.

Do not use broad `git add .` while unrelated worktree changes exist.

