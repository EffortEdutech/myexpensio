# Archive — Superseded / Historical Docs

Nothing here is needed for day-to-day development. Kept for record only. None of these were deleted — just moved here on 2026-07-02 during the docs reorganization, in case any of the reasoning inside is useful later.

## `2026-05-legacy-db-cleanup-and-refactor-lock/`
A completed, self-contained engineering initiative from 2026-05-10: auditing and (carefully, non-destructively) cleaning up legacy monetization/referral database tables, followed by locking the post-cleanup architecture as a baseline.
- `db-audit/` — the audit process: findings, templates, checklists, migration drafts (explicitly labeled "draft only, no destructive SQL" throughout).
- `refactor/` — the lock-in process after cleanup: route surface snapshot, DB alignment lock, guardrail scripts, final release lock.
- **Why archived:** this was a time-boxed cleanup effort, not an evergreen reference. The guardrail scripts it produced (`audit:refactor-lock`, `audit:db-runtime`, etc., per `refactor/REFACTOR_GUARDRAILS_PR.md`) should still exist in `package.json` if still in use — check there, not here, for whether the tooling is still active.

## `2026-06-pwa-strategy-drafts-superseded/`
Three overlapping planning drafts from 2026-06-10/11/12, all covering the same ground (getting `user-mobile-v2` running as an installable PWA on iPhone, with one draft also covering an Android EAS build fix):
- `pwa-strategy-user-mobile-v2.md`
- `sprint-plan-mobile-pwa-v2.md`
- `sprint-plan-pwa-user-mobile-v2.md`
- **Why archived:** all three were superseded four days later by `apps/user-mobile-v2/docs/SPRINT_23_IOS_PWA_ANDROID_BUILD_PLAN.md` (created 2026-06-14), which combines an Android track and a PWA track into one authoritative, still-in-progress plan. **That is the current doc — use it, not these.**

## `mini-accounting-brainstorm.md`
Informal brainstorm/chat notes proposing a "mini accounting" bookkeeping feature for e-hailing drivers and solo businesses.
- **Why archived:** its target-user framing was carried forward almost verbatim into the formal `02-product-specs/01_PREMIUM_ACCOUNTING_SPEC.md`. This is the rough draft that preceded that spec — the spec is now the source of truth.

## `subscription_matrix_SUPERSEDED.html`
Describes an older subscription architecture: a separate `profiles.subscription_plan` column, a `subscription_status` table, and **two separate Stripe webhooks** (`STRIPE_WEBHOOK_SECRET` for org PRO + `STRIPE_PREMIUM_WEBHOOK_SECRET` for individual PREMIUM).
- **Why archived:** this was replaced by the unified `subscriptions` table + single webhook design in the `20260515_s14_unified_subscriptions.sql` migration. Following this doc's env var names or webhook setup today will not work against the current code. The current source of truth for tier limits is `apps/user/lib/entitlements.ts`; for billing flow, see `04-billing-payments/01_STRIPE_SETUP_GUIDE.md` and `SHIP_READINESS_ACTION_PLAN.md`.
