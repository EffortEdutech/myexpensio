# myexpensio — UAT Workflow Audit
### Code-Level Review · May 2026

---

## Executive Summary

This audit covers all three apps in the myexpensio monorepo — **User App** (port 3100), **Workspace Admin App** (port 3101), and **CS Console** (port 3102). The review was conducted by reading every API route, shared library, and key page component.

**Overall verdict:** The platform is structurally sound and builds successfully. Stripe billing, trip tracking, claim submission, and export generation are all wired end-to-end. Six issues require attention before a public launch; none are blockers for a controlled beta.

---

## Apps and Route Coverage

| App | API Routes Audited | UI Pages |
|---|---|---|
| User App | 40 routes | ~56 pages (SSG confirmed) |
| Workspace Admin | 23 routes | ~20 pages |
| CS Console | 14 routes | ~10 pages |

---

## Workflow Inventory

### W1 — User Registration & Onboarding

**Path:** Invite email → `/accept-invite` page → `POST /api/invite/accept` → app dashboard

**How it works:**

Workspace admins (or CS) create invitations. The invited user receives an email with a link containing the `invite_id`. On the `/accept-invite` page, the user authenticates via Supabase magic link or OTP, then the server validates the invite (checks PENDING status, not expired, email matches the authenticated session), upserts an `org_members` row, marks the invitation ACCEPTED, and writes an `INVITE_ACCEPTED` audit log.

**Issues found:**

- **MEDIUM — Dual invitation systems in parallel.** The admin app has both `/api/workspace/invitations` (direct invitations) and the CS console has `/api/console/invitation-queue` (managed invitation requests). There is no cross-linking. A workspace admin sending a direct invitation bypasses the CS queue entirely. This is fine for an MVP but creates two separate audit trails that could confuse CS staff if a user reports invite problems.

- **LOW — `display_name` not pre-populated from email.** If the invited user skips the optional display_name field, their profile shows a blank name in all admin views. A sensible fallback (first part of their email) would reduce data quality issues.

---

### W2 — Trip Recording

**Path:** `POST /api/trips` → GPS tracking or route selection → `POST /api/trips/[id]/stop` (GPS) or route confirmed → trip becomes FINAL

**How it works:**

Three modes are supported:
- **GPS_TRACKING** — trip created as DRAFT, points streamed via `POST /api/trips/[id]/points`, ended by `POST /api/trips/[id]/stop` which calculates `gps_distance_m` and sets status FINAL.
- **SELECTED_ROUTE** — user picks origin/destination, route options fetched from `/api/routes/alternatives`, user selects one, `POST /api/routes/select` stores `selected_route_distance_m`.
- **ODOMETER** — distance entered manually as `odometer_distance_m`; trip created directly as FINAL.

Distance is always reconciled through `deriveDistance()` in `packages/domain` which enforces priority: odometer override > selected route > GPS.

Usage counter `trips_created` is incremented per trip, and the FREE tier limit is enforced at the API layer before insert.

**Issues found:**

- **MEDIUM — Motorcycle mileage rate not fully wired.** The `vehicle_type` field (`'car' | 'motorcycle'`) is persisted on both trips and claim items. However, the rate lookup in `packages/domain/src/rates.ts` applies a single per-km rate without a branch for vehicle type. Motorcycle rates (which in Malaysia are lower than car rates) will silently default to the car rate. This will cause overpayment for motorcycle users on reimbursement exports.

- **LOW — GPS tracking has no timeout/staleness guard.** A DRAFT GPS trip that is never stopped (e.g. the app is killed) stays DRAFT forever. There is no cron or TTL to auto-close stale GPS trips. Orphaned DRAFT trips will accumulate and appear in trip lists.

---

### W3 — Claim Creation & Submission

**Path:** `POST /api/claims` → add items → `POST /api/claims/[id]/submit` → claim locked as SUBMITTED

**How it works:**

Claims are created as DRAFT. Users add items (`POST /api/claims/[id]/items`) of types: mileage (linked to a trip), receipt (with optional upload URL), meal, lodging, per-diem, and TnG-linked transactions. On submission, the server recalculates `total_amount` via the `recalc_claim_total` Supabase RPC (with a direct SUM fallback if the RPC is unavailable), then locks the claim to SUBMITTED status. No edits are possible after submission.

**Issues found:**

- **CRITICAL — No claim approval/rejection endpoint.** After a user submits a claim, workspace admins can **view** it (read-only via `GET /api/workspace/claims/[claimId]`) but there is **no PATCH/POST endpoint to approve or reject it**. The claim status enum likely includes APPROVED/REJECTED (based on the export references to `status`), but the server-side transition does not exist. This means the full lifecycle cannot be completed — submitted claims cannot be formally approved. Exports still work (they export SUBMITTED claims), so the immediate impact is workflow visibility only.

- **LOW — `period_start` and `period_end` are not validated against claim items.** A claim can have a date range that does not encompass its item dates. The UI presumably enforces this, but the API does not.

---

### W4 — TnG Statement Import

**Path:** `POST /api/tng/parse` (upload PDF) → transactions appear → link to claim items via `POST /api/transactions/[tng_id]/link`

**How it works:**

Users upload their Touch 'n Go eWallet PDF statement. The server parses it using `pdf-parse` to extract transactions (date, amount, merchant, reference). Parsed transactions are stored in a `tng_transactions` table. Users then review and link individual transactions to claim items (claim_items with `paid_via_tng = true`). The linking creates the `tng_transaction_id` foreign key on the claim item.

**Issues found:**

- **MEDIUM — PDF parsing is brittle.** TnG changes its statement PDF layout without notice. The parser (`/api/tng/parse`) uses text position matching which will silently produce wrong results if TnG changes their format. There is no version detection or validation of parsed output. A bad parse will load transactions with wrong amounts into the database with no visible error.

- **LOW — No deduplication guard on TnG import.** If a user uploads the same statement PDF twice, duplicate `tng_transactions` rows will be created. There is no unique constraint on (user_id, reference_number, date, amount) to prevent duplicates.

---

### W5 — Export Generation

**Path:** `POST /api/exports` → PDF/CSV/XLSX generated → stored → `GET /api/exports/[id]/download`

**How it works:**

Export accepts an array of `claim_ids`, a `format` (CSV, XLSX, PDF), and optional `template_id` and `pdf_layout` config. It checks the `exports_created` usage counter against the org's entitlement before proceeding. The export is built server-side, stored (presumably in Supabase storage or as a base64 blob), and accessible via a signed download URL.

Usage limit is enforced per month. FREE tier limits come from `platform_config` table (admin-editable). PRO tier is unlimited.

**Issues found:**

- **LOW — `exports/debug` route is exposed in production build.** `GET /api/exports/debug` exists in the user app without any auth guard visible in a quick read. If it logs or returns raw claim data, it should be removed before public launch. (Dev route — similar to `dev/gps-sim` which has been removed.)

- **LOW — Export download URL expiry not communicated to UI.** The `/api/exports/[id]/download` route likely generates a short-lived signed URL from Supabase Storage. If the user bookmarks the URL or tries to re-download after expiry, they get a 403 with no explanation. The export history page should guide the user to re-generate.

---

### W6 — Billing & Subscription

**Path:** UI billing page → `POST /api/billing/checkout` → Stripe Checkout → webhook → `subscription_status` updated → `GET /api/billing/summary`

**How it works:**

The billing flow uses Stripe Checkout in `subscription` mode. Stripe customer records are created on first checkout and persisted in `subscription_status.stripe_customer_id`. The webhook handler at `POST /api/billing/webhook` listens for five events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. On each event it calls `upsertSubscription()` which writes tier, billing_status, period dates, and grace_until into `subscription_status`.

The billing portal (`POST /api/billing/portal`) lets existing subscribers manage their plan via Stripe's hosted portal.

**Issues found:**

- **HIGH — Stripe environment variables not yet set in production.** The app code is correct. However, the Stripe price IDs, webhook secret, and secret key must be added to Vercel before the billing flow works in production. See `docs/STRIPE_SETUP_GUIDE.md` for the step-by-step. Until these are set, checkout returns a 400 (`No Stripe price configured for plan`).

- **MEDIUM — Grace period logic exists in webhook but UI does not surface it.** The `subscription_status` table has a `grace_until` column and the webhook sets it on `invoice.payment_failed`. However, the billing summary page and usage limit enforcement do not appear to read `grace_until` — a failed payment immediately triggers FREE-tier limits. Users with a payment failure will lose Pro access without warning.

- **LOW — No Stripe customer portal return URL configured in code.** `POST /api/billing/portal` calls `billingPortal.sessions.create()` and returns `portal_url`. The `return_url` passed to Stripe is hardcoded (or read from env). Confirm the return URL resolves correctly in production.

---

### W7 — Workspace Administration

**Path:** Workspace Admin app → members, claims, rates, settings, exports (review)

**How it works:**

Workspace admins (accessed via the admin app on port 3101) can:
- View and manage org members (`/api/workspace/members`)
- Send direct invitations (`/api/workspace/invitations`)
- View submitted claims — read-only (`/api/workspace/claims`)
- Configure mileage rates (`/api/workspace/rates`, `/api/workspace/team-rates`)
- View billing status (`/api/workspace/billing`)
- Manage settings (`/api/workspace/settings`)
- View audit log (`/api/workspace/audit`)

**Issues found:**

- **CRITICAL — (Same as W3)** Claim approval/rejection is missing. Admins can see SUBMITTED claims but cannot act on them.

- **MEDIUM — Team rates vs. rate templates can conflict.** The admin app allows both workspace-specific rate overrides (`team-rates`) and assignment of a `rate_template_name` from the super-admin. If both are set, the code must have a clear priority rule. Verify that `rate_template_name` takes precedence over team-specific overrides, or document which wins.

---

### W8 — CS Console & Super-Admin

**Path:** CS Console app (port 3102) → manage all orgs, users, subscriptions, invitation queue

**How it works:**

CS console staff can:
- Search and view all workspaces and users
- Approve/reject invitation requests (`/api/console/invitation-queue/[requestId]`)
- Manage subscription tiers (`/api/console/subscriptions`)
- Trigger password resets (`/api/console/users/[userId]/reset-password`)
- View system health (`/api/console/system`)
- View audit logs (`/api/console/audit`)
- Manage referrals (`/api/console/referrals`)

The super-admin (Expensio Workspace admin app) additionally manages:
- Rate templates across all orgs
- Platform-wide org settings (`/api/admin/settings`)
- Org creation (`POST /api/admin/settings` with `action: create_org`)
- Assignments (`/api/admin/assignments`)

**Issues found:**

- **MEDIUM — `platform_config` table vs. hardcoded PLAN_DEFAULTS.** The billing routes read Free tier limits from `platform_config` (admin-editable). The entitlements library (`usage-limits.ts`) appears to read from the same table but has hardcoded fallbacks. Confirm that the admin settings UI actually writes to `platform_config` and that both paths read from the same source. A mismatch would cause inconsistent limit enforcement.

- **LOW — CS console has no bulk action support.** The invitation queue processes one request at a time. For a launch with many early signups, CS staff will need to approve each individually. A bulk approve button is a UX nicety, not a blocker.

---

## Issue Summary

| ID | Severity | Workflow | Description |
|---|---|---|---|
| A1 | **CRITICAL** | W3, W7 | No claim approval/rejection API endpoint — submitted claims cannot be actioned by workspace admins |
| A2 | **HIGH** | W6 | Stripe env vars not set in Vercel production — billing is non-functional until configured |
| A3 | **MEDIUM** | W2 | Motorcycle mileage rate not branched — defaults silently to car rate |
| A4 | **MEDIUM** | W4 | TnG PDF parser brittle — no version detection, no deduplication |
| A5 | **MEDIUM** | W6 | Grace period (`grace_until`) not read by usage enforcement or UI |
| A6 | **MEDIUM** | W1 | Dual invitation systems (direct + queue) create split audit trails |
| A7 | **MEDIUM** | W7, W8 | Rate template vs. team rate priority rule needs explicit verification |
| A8 | **MEDIUM** | W8 | `platform_config` vs. hardcoded PLAN_DEFAULTS — confirm single source of truth |
| A9 | **LOW** | W5 | `api/exports/debug` route may be exposed without auth guard |
| A10 | **LOW** | W2 | Stale DRAFT GPS trips never auto-closed |
| A11 | **LOW** | W3 | Claim date range not validated against item dates at API level |
| A12 | **LOW** | W5 | Export download URL expiry not communicated in UI |
| A13 | **LOW** | W1 | `display_name` not defaulted when user skips field on invite accept |
| A14 | **LOW** | W6 | Stripe billing portal `return_url` needs production URL verification |

---

## Recommendations — Pre-Launch Priority

**Do before public launch:**

1. **Build claim approval/rejection endpoint** (A1). Minimum: `PATCH /api/workspace/claims/[claimId]` with `{ action: 'approve' | 'reject', reason?: string }`. Update claim status, write audit log. This is the single most important missing feature.

2. **Configure Stripe in Vercel production** (A2). Follow `docs/STRIPE_SETUP_GUIDE.md`. Roll the exposed test key that was shared in chat and generate a new one.

3. **Verify motorcycle rate calculation** (A3). Check `packages/domain/src/rates.ts` and confirm the per-km rate applied uses the correct rate for the `vehicle_type` on the trip/claim item.

**Do before scaling beyond beta:**

4. **Add TnG deduplication** (A4) — unique constraint on `(user_id, reference, amount, date)` in the `tng_transactions` table.

5. **Surface grace period in billing UI** (A5) — show a banner when `billing_status = 'PAST_DUE'` and `grace_until` is in the future.

6. **Remove or auth-gate `exports/debug`** (A9).

---

*Audit performed May 2026 — myexpensio v3.1.2*
