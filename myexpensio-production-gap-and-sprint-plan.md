# MyExpensio — Production Gap Analysis & Sprint Plan
**Date:** 2026-05-09  
**Apps in scope:** User App · Admin App · CS (Console) App  
**Overall posture:** User App is UAT-ready. Admin App is 80% done. CS App is functionally complete but missing CI coverage.

---

## Executive Summary

The platform has strong core functionality. The User App is ready for structured testing, the CS Console is operationally sound, and the Admin App covers most workspace workflows. What stands between this and a production launch is a cluster of concrete gaps — most critically: **no payment gateway is wired up**, **three admin pages are still placeholder stubs**, and **dev-only routes are exposed on the live user app**. Everything else is polish, infrastructure hardening, and legal completeness.

---

## Gap Inventory

### 🔴 CRITICAL — Blockers (cannot go live without these)

| # | App | Gap | Detail |
|---|-----|-----|--------|
| C1 | User | **Payment gateway not integrated** | Billing page UI and types exist, `/api/billing/summary` route exists, env vars reference Stripe and ToyyibPay — but zero checkout initiation, webhook handlers, or payment confirmation flows exist in the codebase. PRO plan cannot actually be purchased by anyone. |
| C2 | Admin | **`/orgs` page is a hardcoded stub** | Shows a single hardcoded beta org UUID. No real org listing, no search, no pagination. Core admin workflow is broken. |
| C3 | Admin | **`/orgs/new` page is a placeholder** | Literally renders `<p>Placeholder create org form.</p>`. Cannot create organizations from the admin interface. |
| C4 | Admin | **`/orgs/[id]/invites` page is a placeholder** | Renders the org ID and nothing else. Invite management per-org is entirely missing. |
| C5 | User | **Dev routes exposed in production** | `/dev/gps-sim` (GPS simulator) and `/auth-test` pages exist and are accessible on the live production URL. These must be removed or gated behind a `NODE_ENV !== 'production'` guard before launch. |

---

### 🟠 HIGH — Required for Production Quality

| # | App | Gap | Detail |
|---|-----|-----|--------|
| H1 | CS | **CS App absent from CI** | `.github/workflows/validate.yml` only builds `user` and `admin`. The CS app has no automated build validation — a broken CS deploy could reach production silently. |
| H2 | All | **No error monitoring** | No Sentry (or equivalent) is integrated in any of the three apps. Uncaught runtime errors will be invisible in production. |
| H3 | All | **Production domains are still `*.vercel.app`** | All three apps are running on Vercel preview subdomains. Branded custom domains need to be configured, SSL verified, and cross-app URL env vars updated. |
| H4 | All | **Vercel production env vars not audited** | Multiple env vars are present in `.env.local` (SCAN_API_URL, CRON_SECRET, GMAIL_SMTP, billing keys, cross-app URLs) that must be explicitly set in each Vercel project's production environment. No audit has been done to confirm this. |
| H5 | All | **Transactional email flows untested in production** | Gmail SMTP is configured for invite emails and password resets. No evidence these have been end-to-end tested from the production Supabase + Vercel environment. |
| H6 | All | **No API rate limiting** | All API routes are unprotected against abusive request volumes. At minimum, route-calculation, export, and auth endpoints need rate limiting before launch. |
| H7 | Admin | **`/orgs/*` routes sit outside `(protected)` layout** | The `/orgs/page.tsx`, `/orgs/new/page.tsx`, and `/orgs/[id]/invites/page.tsx` files are outside the `(protected)` folder, meaning they may not benefit from the admin auth middleware. Auth gating needs to be verified or the pages moved into `(protected)`. |

---

### 🟡 MEDIUM — Launch Polish (should be done, not blockers)

| # | App | Gap | Detail |
|---|-----|-----|--------|
| M1 | User | **Export history / retry UX incomplete** | Flagged in progress.md. Export history page exists but retry and re-download polish is pending. |
| M2 | User | **Original statement attachment + highlight workflow** | TNG statement upload exists but the attachment-to-claim and highlight workflow is not implemented. Flagged in progress.md. |
| M3 | All | **No Privacy Policy or Terms of Service pages** | No legal pages exist in any app. Required before a public launch, especially for a financial data product. |
| M4 | All | **Release workflow only covers the User App** | The GitHub Actions release workflow bumps version, writes `version.json`, and creates a changelog only for `apps/user`. Admin and CS apps have no automated version management. |
| M5 | DB | **Recent migration files break naming convention** | Latest migrations (`add_auto_approve_invitations.sql`) don't follow the `YYYYMMDDHHMMSS_` timestamp prefix used by the rest of the schema. Supabase migration ordering may be unreliable. |
| M6 | User | **Billing page has no upgrade CTA path wired** | Even once a payment gateway is integrated (C1), the billing page in the User App needs a clear upgrade call-to-action that initiates checkout. The plan comparison UI is built, but the "Upgrade" button action is empty. |
| M7 | Admin | **Commission payout bank details have no validation** | Commission page allows saving bank name, account name, and account number fields with no format validation or confirmation step. |

---

## Sprint Plan

### Sprint 1 — Unblock the Critical Path *(Week 1–2)*

**Goal:** Remove all hard blockers so the platform can safely reach production.

**Tasks:**

1. **Remove dev routes from User App** — Delete or wrap `/dev/gps-sim` and `/auth-test` behind `process.env.NODE_ENV === 'development'`. One-line fix with big security impact.

2. **Fix `/orgs/*` auth gating** — Move or restructure the three `/orgs` pages so they fall under the `(protected)` middleware layout. Verify auth middleware fires correctly.

3. **Build real Admin `/orgs` list page** — Replace the hardcoded stub with a real `fetch('/api/workspace/org-search')` powered list. The API route already exists — it just needs a proper UI: paginated table, search input, status badge, link-to-detail.

4. **Build Admin `/orgs/new` create form** — Wire up a real org creation form (org name, workspace type TEAM/AGENT, contact email, initial owner email). Calls the CS app's `POST /api/console/workspaces` equivalent or a new admin-scoped API route.

5. **Build Admin `/orgs/[id]/invites` page** — Reuse the same invitation request pattern already built in `(protected)/invitations/page.tsx`. Scope it to a specific org ID from the route param.

6. **Wire payment gateway — ToyyibPay** — Implement the minimum viable checkout flow: create a bill via ToyyibPay API, redirect user to payment page, handle the callback webhook to update `subscription_status`. Stripe can follow in Sprint 2 as an alternative.

**Owner:** Engineering  
**Exit criteria:** All 5 critical gaps (C1–C5) resolved and verified on staging.

---

### Sprint 2 — Infrastructure & Reliability *(Week 3–4)*

**Goal:** Make the platform production-grade from an ops and reliability standpoint.

**Tasks:**

1. **Add CS App to CI** — Add `cs` to the `matrix.app` list in `.github/workflows/validate.yml`. Add necessary dummy env vars for the CS-specific keys.

2. **Integrate Sentry across all three apps** — Add `@sentry/nextjs` to user, admin, and CS apps. Configure DSN via Vercel env vars. Set up source map upload in CI.

3. **Audit and set all Vercel production env vars** — Walk through every key in each app's `.env.local` file and confirm it is set in the corresponding Vercel project's Production environment. Document what's set vs missing.

4. **Configure custom domains** — Set branded domains for all three apps in Vercel. Update `NEXT_PUBLIC_USER_APP_URL`, `NEXT_PUBLIC_WORKSPACE_APP_URL`, `NEXT_PUBLIC_CS_APP_URL` env vars to point to the new domains.

5. **End-to-end email flow test** — Trigger a real invitation flow from production Supabase. Confirm invite email lands, link is valid, new user can set password and log in. Do the same for password reset.

6. **Add rate limiting to high-risk API routes** — Use `upstash/ratelimit` (Redis-backed via Upstash) or Vercel's edge middleware. Priority routes: `/api/routes/alternatives`, `/api/exports`, `/api/auth/*`, `/api/scan/process`.

**Owner:** Engineering + DevOps  
**Exit criteria:** CS in CI, Sentry alerts firing, custom domains live, email confirmed working.

---

### Sprint 3 — Polish & Legal Completeness *(Week 5–6)*

**Goal:** Ship a product that's user-complete and legally defensible.

**Tasks:**

1. **Export history / retry UX** — Polish the exports page: show re-download button for completed exports, retry button for failed exports, clear status indicators with timestamps.

2. **Original statement attachment workflow** — Implement TNG statement PDF upload → parse → attach to claim → highlight matched items in the claim detail view.

3. **Privacy Policy and Terms of Service pages** — Add `/privacy` and `/terms` routes to the User App. Link from login page footer and settings page. Content can be drafted externally and dropped in as static pages.

4. **Billing upgrade CTA in User App** — Wire the "Upgrade to Pro" button on the billing page to initiate a ToyyibPay checkout session. After payment confirmation, reflect new tier on the page.

5. **Fix DB migration naming convention** — Rename `add_auto_approve_invitations.sql` to follow `YYYYMMDDHHMMSS_add_auto_approve_invitations.sql`. Run a migration ordering check.

6. **Extend release workflow to Admin + CS** — Add version bump and changelog generation steps for `apps/admin` and `apps/cs` in the GitHub Actions release workflow.

7. **Commission payout validation** — Add bank account number format validation (Malaysian format) and a confirmation dialog before saving payout details.

**Owner:** Engineering + Legal  
**Exit criteria:** All medium gaps resolved. Legal pages live. Exports polished. Platform sign-off for public launch.

---

## Gap Count Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 5 | All open — Sprint 1 |
| 🟠 High | 7 | All open — Sprint 2 |
| 🟡 Medium | 7 | All open — Sprint 3 |
| **Total** | **19** | **19 open** |

---

## Recommended First Actions (This Week)

1. **Delete `/dev/gps-sim` and `/auth-test`** — 15 minutes, zero risk.
2. **Verify `/orgs/*` auth middleware** — confirm or fix before any orgs page is built.
3. **Start ToyyibPay checkout integration** — longest lead time item, start immediately.
4. **Add CS to CI validate.yml** — 10-minute change, prevents silent breakage.
5. **Run a Vercel env var audit** — go through each project dashboard and document what's missing.
