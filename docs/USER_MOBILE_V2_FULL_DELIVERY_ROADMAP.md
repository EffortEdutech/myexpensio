# MyExpensio User Mobile v2 Full Delivery Roadmap

Date: 2026-05-22

## Purpose

This roadmap covers the complete path to finish the clean MyExpensio user mobile v2 app, from architecture foundation through production release and post-launch stabilization.

Implementation folder:

```text
apps/user-mobile-v2
```

Behavior reference:

```text
apps/user
```

Core rule:

```text
Do not change apps/user as part of the mobile v2 rewrite unless a separate explicit task says so.
```

## Finish Definition

The mobile v2 app is finished only when:

- All required user-facing features from the current user app are available or intentionally marked web-only.
- Local-first expense, claim, receipt, trip, and relevant ledger workflows work offline.
- Sync is reliable, observable, retryable, and conflict-aware.
- Auth, invite, profile, settings, subscription, and feature-gating flows are production-safe.
- Receipt/file uploads are durable across app restarts and network failures.
- QA passes across Android, iOS, and a web smoke target if kept enabled.
- Release builds are produced and tested.
- Rollout and rollback plans are documented.
- Old app behavior parity is verified using a role-by-role and feature-by-feature checklist.

## Delivery Phases

```text
Phase 0: Planning and foundations
Phase 1: Local-first core
Phase 2: Work Claims parity
Phase 3: Trips, mileage, routes, and odometer
Phase 4: TNG import, transaction linking, and export support
Phase 5: Personal Expense space
Phase 6: Business Space / My Income
Phase 7: Settings, billing, subscription, and account
Phase 8: Sync hardening, security, and performance
Phase 9: QA, release preparation, and launch
Phase 10: Post-launch stabilization
```

## Sprint 0: Project Baseline And Parity Lock

Status:

```text
Started
```

Goal:

Create the v2 workspace, document the architecture decision, and lock the existing app as the product reference.

Deliverables:

- Expo / React Native app scaffold.
- Local-first decision record.
- Initial SQLite proof.
- Initial sync queue proof.
- Full feature inventory.
- Full delivery roadmap.
- Commit discipline for avoiding unrelated local changes.

Acceptance:

- `apps/user-mobile-v2` exists.
- `apps/user` remains untouched by rewrite work.
- Typecheck passes.
- Initial v2 commit is pushed.
- Sprint roadmap is pushed.

## Sprint 1: Local-First Core And Work Claims Draft Slice

Goal:

Build the first real local-first vertical slice: app shell, local DB migrations, draft claim/expense/claim-item persistence, receipt metadata, and queue-backed mutations.

Primary features:

- Native app shell.
- Three-space navigation foundation:
  - Work Claims
  - Personal Expense
  - Business Space
- Migration runner.
- Core local tables:
  - `schema_migrations`
  - `sync_state`
  - `sync_queue`
  - `profiles_cache`
  - `subscriptions_cache`
  - `spaces`
  - `claims`
  - `claim_items`
  - `expenses`
  - `receipts`
- Work claim draft creation.
- Claim item draft creation.
- Local expense/transport item draft.
- Local receipt metadata.
- Pending/synced/failed UI states.

Backend/API planning:

- Draft `POST /sync/push`.
- Draft `GET /sync/pull`.
- Draft `GET /sync/bootstrap`.
- Draft file upload lifecycle.

Acceptance:

- User can create local draft claim or expense item.
- Data survives app restart.
- Every local mutation creates a sync queue item.
- Pending sync queue can be listed.
- Basic offline behavior works with no data loss.
- Typecheck passes.
- Bundle/export check passes or native-only caveat is documented.

## Sprint 2: Auth, Session, Bootstrap Sync, And User Shell

Goal:

Make the app usable by real authenticated users and bootstrap local data safely.

Features:

- Login.
- Logout.
- Session restore.
- Secure token storage.
- Forgot password entry point.
- Change password path.
- Invite acceptance mapping.
- Complete-first-login flow.
- Profile cache.
- Organization/workspace membership bootstrap.
- Subscription/entitlement cache.
- Space switcher data.
- Offline banner and sync status indicator.

Sync:

- Bootstrap pull after login.
- Store sync cursor per user/device.
- Clear or isolate local data on sign-out.
- Handle expired sessions.

Acceptance:

- User can log in and land in the mobile shell.
- User identity, org membership, spaces, subscription tier, and profile are cached locally.
- App can reopen while offline and display cached shell data.
- Sign-out behavior is explicit and tested.
- No secret keys are present in mobile source.

## Sprint 3: Work Claims Core Parity

Status:

```text
Signed off
```

Sprint package:

```text
apps/user-mobile-v2/docs/SPRINT_3_WORK_CLAIMS_CORE_PARITY.md
docs/USER_MOBILE_V2_SPRINT_3_WORK_CLAIMS_CORE_PARITY.md
```

Goal:

Complete the main claims workflow before expanding into advanced modules.

Features:

- Claims list.
- Claim detail.
- New claim.
- Edit draft claim title/date period.
- Add/edit/delete claim items.
- Claim totals.
- Claim statuses.
- Submit claim.
- Submitted-claim lock behavior.
- Manual transport items:
  - toll
  - parking
  - taxi
  - Grab
  - train
  - flight
  - meals
  - lodging
- Receipt attachment per item.
- Rate version cache for claim calculations.

Sync:

- Push claim mutations.
- Pull server claim updates.
- Server-wins handling for submitted/approved/rejected claims.
- Rejected mutation UX.

Acceptance:

- A user can create a claim offline, add items, attach receipt metadata, reopen the app, and see the same draft.
- A user can sync the draft when online.
- Submitted claims cannot be locally edited except allowed actions.
- Claim totals match server totals after sync.

## Sprint 4: Trips, Mileage, Routes, GPS, And Odometer

Goal:

Port the full trip and mileage workflow into native mobile, where it matters most.

Features:

- Trips list.
- Start trip.
- Active trip screen.
- GPS permission flow.
- Trip point capture.
- Stop trip.
- Trip detail.
- Odometer mode.
- Odometer photo metadata.
- Manual odometer distance.
- Mileage calculator.
- Route alternatives.
- Route selection.
- Route cache.
- Distance source display:
  - GPS
  - selected route
  - odometer override
- Create mileage claim item from trip.

Sync:

- Local trip points queue.
- Push trip points in batches.
- Pull finalized trip.
- Handle active-trip conflict.
- Handle interrupted GPS sessions.

Acceptance:

- User can start and stop a trip with weak or no network.
- GPS points are not lost across app background/reopen where platform allows.
- Mileage can be added to a claim.
- Route alternatives and selected routes remain consistent with server state.

## Sprint 5: Receipt, Scan, And File Upload Hardening

Goal:

Make file capture and upload durable enough for production expense workflows.

Features:

- Camera/gallery receipt capture.
- Receipt preview.
- Local receipt file persistence.
- Receipt metadata table.
- Upload queue.
- Upload retry.
- Upload failure recovery.
- View uploaded receipt.
- Bill document upload groundwork.
- Odometer photo groundwork.
- Scan processing API boundary.
- Scan preview/crop parity decision.

Sync:

- Separate file upload worker from entity sync worker.
- Prepare upload.
- Complete upload.
- Link uploaded file to local entity.
- Reconcile remote file state.

Acceptance:

- Receipt remains attached after app restart before upload.
- Receipt uploads when network returns.
- Failed upload can retry.
- Entity sync does not incorrectly mark file upload complete before file is uploaded.

## Sprint 6: TNG Import, Transactions, Linking, And Appendix Support

Goal:

Port the TNG workflow needed for toll/parking claims and export appendix support.

Features:

- TNG landing screen.
- Statement upload/import entry.
- Import status.
- Transaction list.
- Transaction grouping by statement.
- Claim item linking.
- Claim item unlinking.
- TNG suggestions for claim detail.
- Duplicate transaction policy.
- Claimed/unclaimed status.
- Appendix preview data model.

Sync:

- Server-driven parsing.
- Pull parsed transaction results.
- Link/unlink mutation queue.
- Server-wins link status.

Acceptance:

- User can import a statement or start an import flow.
- Parsed transactions appear locally after sync.
- User can link toll/parking items to TNG transactions.
- Link status survives sync and app restart.

## Sprint 7: Exports, Reports, And Usage Limits

Goal:

Bring over export/report behavior with clear online-only boundaries.

Features:

- Export screen.
- Claim selection for export.
- Report template selection.
- Export format selection.
- Export job creation.
- Export history.
- Export download/open.
- TNG appendix inclusion.
- Usage counter display.
- Free/Pro/Premium export gating.

Reports:

- Work claim export support.
- Personal tax report path.
- Business profit/tax report path.

Sync/online policy:

- Export generation is online-only.
- Export history can be cached.
- Export job creation is not queued offline unless explicitly approved later.

Acceptance:

- User can create supported export jobs online.
- User sees correct usage/gating state.
- Export history is visible.
- Offline export behavior is explicit and user-friendly.

## Sprint 8: Personal Expense Space Parity

Goal:

Port the Personal Expense space after the work-claims foundation is stable.

Features:

- Personal home/dashboard.
- Personal expenses list.
- Add personal expense.
- Edit/delete personal expense.
- Bills/commitments list.
- Add bill/commitment.
- Bill detail.
- Payment records.
- Bill document metadata/upload.
- Personal tax report entry.
- Personal ledger entries.

Sync:

- Ledger entry queue.
- Commitment queue.
- Commitment payment queue.
- Document upload queue.
- Server-wins tax report/reference data.

Acceptance:

- User can manage personal expenses offline.
- User can manage bills and payments with local persistence.
- Personal space respects subscription/feature rules.

## Sprint 9: Business Space / My Income Parity

Goal:

Port Premium business features.

Features:

- Premium gate.
- Business dashboard.
- Income list.
- Add/edit/delete income.
- Business expenses list.
- Add/edit/delete business expense.
- Business reports screen.
- Profit summary.
- Business tax report entry.
- Business ledger entries.

Sync:

- Ledger entry queue.
- Report summary cache.
- Server-wins subscription gate.

Acceptance:

- Premium user can manage business income and expenses.
- Non-Premium user sees correct gate.
- Business summary and reports match server after sync.

## Sprint 10: Settings, Billing, Account, And Legal

Goal:

Complete account and administrative user-facing settings.

Features:

- Settings home.
- Profile settings.
- Rate settings.
- Subscription summary.
- Billing summary.
- Checkout/portal handoff.
- Premium checkout handoff.
- Terms.
- Privacy.
- Account/support links.
- Biometric login settings.

Online policy:

- Billing checkout and portal are online-only.
- Subscription state is server-wins.
- Profile edits can be queued only if low-risk; sensitive account changes are online-only.

Acceptance:

- User can view/update profile according to policy.
- User can see subscription and billing state.
- User can open checkout/portal flows safely.
- Terms/privacy are accessible.

## Sprint 11: Sync Engine Production Hardening

Goal:

Turn the sync proof into production infrastructure.

Work:

- Queue processor.
- Batch push.
- Delta pull.
- Sync cursors.
- Retry with backoff.
- Conflict result model.
- Dead-letter/failed queue handling.
- Sync logs for debugging.
- Background sync triggers.
- Foreground sync triggers.
- Network reconnect sync.
- App-open sync.
- Manual retry.
- Per-entity merge policies.
- Sync health UI.

Acceptance:

- Sync recovers from network loss.
- Duplicate push does not create duplicate server records.
- Failed mutations are visible and retryable.
- Conflicts are handled according to documented policy.
- Sync load is batched and reasonable.

## Sprint 12: Backend/NestJS Sync API And Supabase Integration

Goal:

Build the backend layer that mobile sync depends on.

Work:

- NestJS app/module structure if not already present.
- Auth middleware using Supabase JWT.
- Permission checks.
- `GET /sync/bootstrap`.
- `POST /sync/push`.
- `GET /sync/pull`.
- File upload prepare/complete endpoints.
- Dashboard mobile summary endpoint.
- Aggregation APIs.
- Validation DTOs.
- Idempotency keys.
- Conflict response codes.
- Server audit fields.
- Supabase RLS review.

Acceptance:

- Mobile can sync through NestJS without direct Supabase writes from screens.
- Server rejects unauthorized writes.
- Push is idempotent.
- Pull returns only authorized user/org data.
- Backend tests cover key sync behaviors.

## Sprint 13: Security, Privacy, Compliance, And Data Retention

Goal:

Make the mobile app safe for financial and receipt data.

Work:

- Local data sensitivity review.
- Secure token storage review.
- Local database clear policy.
- Account switching policy.
- Receipt file cleanup.
- Upload cleanup.
- PDPA/privacy copy review.
- Terms/privacy accessibility.
- RLS policy review.
- No secret key leakage.
- Error logging redaction.
- Device ID policy.
- Session expiry handling.

Acceptance:

- Sensitive data is not logged.
- Sign-out clears or isolates local financial data by policy.
- Lost/stolen device assumptions are documented.
- Server-side auth and RLS are verified.

## Sprint 14: Performance, Accessibility, And UX Polish

Goal:

Make the app pleasant and reliable under real mobile use.

Work:

- Large claims list performance.
- Large TNG transaction list performance.
- Receipt thumbnail performance.
- SQLite indexes.
- Pagination/windowing.
- Pull-to-refresh.
- Keyboard-safe forms.
- Safe-area checks.
- Loading skeletons.
- Empty states.
- Error states.
- Accessibility labels.
- Touch target sizing.
- Dark/light mode decision.
- Offline-first UX copy.

Acceptance:

- Key screens remain responsive with realistic data volume.
- Forms are usable on small phones.
- Important actions have accessible labels.
- No obvious layout overlap across target devices.

## Sprint 15: End-To-End QA And Feature Parity Sign-Off

Goal:

Prove the v2 app matches current user app behavior where required.

QA Matrix:

- Free user.
- Pro user.
- Premium user.
- Invited user first login.
- Work Claims user.
- Personal Expense user.
- Business Space user.
- Offline user.
- Weak network user.
- Android.
- iOS.

Required scenarios:

- Login/logout.
- Accept invite.
- Create work claim.
- Add claim items.
- Attach receipt.
- Submit claim.
- Start/stop trip.
- Add mileage to claim.
- Import/link TNG transaction.
- Export claim.
- Add personal expense.
- Add bill and payment.
- Add business income/expense.
- View billing/subscription state.
- Sync after offline work.
- Conflict/rejected mutation handling.

Acceptance:

- QA checklist passes.
- Known gaps are documented.
- Release blockers are fixed or explicitly deferred.

## Sprint 16: Release Build And Store Preparation

Goal:

Prepare installable builds and release process.

Work:

- App icon/splash assets.
- Bundle identifiers.
- Environment config.
- EAS/build configuration or chosen build process.
- Android build.
- iOS build.
- Internal distribution.
- Crash/logging decision.
- Versioning policy.
- Release notes.
- Store screenshots.
- Privacy labels/data safety forms.
- TestFlight/internal test track.

Acceptance:

- Internal Android build installs and runs.
- Internal iOS build installs and runs if Apple account is available.
- Production environment variables are separated from development.
- Release checklist is complete.

## Sprint 17: Pilot Rollout

Goal:

Release to a small controlled group before full launch.

Work:

- Select pilot users.
- Migrate/prepare accounts.
- Monitor sync errors.
- Monitor upload errors.
- Collect UX feedback.
- Compare server records with expected mobile state.
- Fix pilot blockers.
- Decide rollout readiness.

Acceptance:

- Pilot users complete core work claims flow.
- No unresolved data-loss issues.
- Sync failures are diagnosable.
- Release/no-release decision is documented.

## Sprint 18: Production Launch And Old App Transition

Goal:

Launch v2 and define the role of the old app.

Work:

- Public release.
- User communication.
- Support FAQ.
- Rollback plan.
- Old app transition policy.
- Feature gap disclosure if any.
- Production monitoring.
- Hotfix workflow.

Acceptance:

- Users can install/use v2.
- Support knows what changed.
- Rollback plan exists.
- Old app remains available or is retired according to a documented decision.

## Sprint 19: Post-Launch Stabilization

Goal:

Stabilize after real-world usage.

Work:

- Fix top crash/error issues.
- Optimize sync batches.
- Improve failed upload recovery.
- Improve offline conflict UX.
- Address pilot/production feedback.
- Add missing analytics or logs.
- Reduce support issues.

Acceptance:

- No critical data-loss bugs.
- Sync failure rate is acceptable.
- Upload retry behavior is reliable.
- User support issues are triaged.

## Final Feature Parity Matrix

| Area | Current App Feature | Mobile v2 Sprint |
|---|---|---|
| Shell | Header, space switcher, profile menu, bottom nav | 2 |
| Auth | Login, forgot/change password, invite, first login | 2 |
| Work Home | Dashboard, recent trips, recent claims | 3 |
| Claims | List, create, detail, submit, statuses | 3 |
| Claim Items | Manual items, edit/delete, totals | 3 |
| Receipts | Attach, preview, upload, view | 5 |
| Trips | Start, stop, detail, points | 4 |
| Mileage | GPS, route, odometer, claim item | 4 |
| Routes | Alternatives, selection, cache | 4 |
| TNG | Import, transactions, link/unlink, suggestions | 6 |
| Exports | Jobs, history, download, templates | 7 |
| Reports | Work/personal/business reports | 7, 8, 9 |
| Personal | Expenses, bills, tax, ledger | 8 |
| Business | Income, expenses, dashboard, reports | 9 |
| Settings | Profile, rates, legal, account | 10 |
| Billing | Summary, checkout, portal, subscription | 10 |
| Sync | Push, pull, retry, conflict, health | 11 |
| Backend | NestJS sync APIs, permissions, validation | 12 |
| Security | Local storage, RLS, privacy, cleanup | 13 |
| QA | Role/device/offline parity testing | 15 |
| Release | Builds, store prep, internal testing | 16 |
| Launch | Pilot, production, transition | 17-18 |

## Non-Negotiables

- Do not rewrite the old `apps/user` while building v2.
- Do not let mobile screens write directly to Supabase.
- Do not treat TanStack Query as the persistent database.
- Do not rely on PWA background sync as the native mobile strategy.
- Do not ship without tested offline create/edit/retry flows.
- Do not ship without a tested receipt upload retry path.
- Do not ship without sign-out/local-data policy.
- Do not ship without a rollback plan.

## Commit Strategy

Recommended commit grouping:

1. Roadmap and sprint docs.
2. App shell/navigation.
3. Local DB migrations/schema.
4. Repositories.
5. Work Claims UI.
6. Sync engine.
7. Backend sync APIs.
8. Receipts/files.
9. Trips/mileage.
10. TNG.
11. Personal.
12. Business.
13. Settings/billing.
14. QA/release.

Avoid:

```text
git add .
```

while unrelated working-tree changes exist.

