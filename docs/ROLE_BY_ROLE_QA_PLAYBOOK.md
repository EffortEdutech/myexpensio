# myexpensio - Complete Role-by-Role QA Playbook
### User App, Workspace App, and CS Console

**Version:** 1.0  
**Date:** 20 May 2026  
**Purpose:** Give testers one easy-to-follow QA map for every major workflow in the myexpensio platform, split by role and workspace type.

---

## 1. How to Use This Playbook

Run this playbook in three passes:

1. **Access control pass** - prove each role can only enter the correct apps and workflows.
2. **Workflow pass** - perform the happy path plus branch cases for each role.
3. **Regression pass** - rerun failed/changed workflows after fixes.

Use this result legend in the Result column:

| Result | Meaning |
|---|---|
| PASS | Expected result observed |
| FAIL | Expected result not observed |
| BLOCKED | Cannot continue because setup, credentials, data, email, Stripe, or environment is missing |
| SKIP | Intentionally skipped with a written reason |

Use this environment table:

| App | Local URL | Production URL |
|---|---|---|
| User App | `http://localhost:3100` | `https://myexpensio-jade.vercel.app` |
| Workspace App | `http://localhost:3101` | `https://myexpensio-admin.vercel.app` |
| CS Console | `http://localhost:3102` | `https://myexpensio-cs.vercel.app` |

For API QA, disable automatic redirect following. Protected pages and routes often deny by redirecting to `/login`; if your tool follows the redirect, it may show final status `200` for the login HTML and look like a false failure.

---

## 2. Role Model

Every user is defined by two layers:

| Layer | Database field | Meaning |
|---|---|---|
| Platform role | `profiles.role` | Who the person is on the platform: `USER`, `SUPPORT`, `SUPER_ADMIN` |
| Workspace role | `org_members.org_role` | What the person can do inside one workspace |

Workspace behavior also depends on:

| Field | Values | Meaning |
|---|---|---|
| `organizations.workspace_type` | `TEAM`, `AGENT`, `INTERNAL` | Whether the workspace is a company team, partner/agent workspace, or internal workspace |

### Personas to Test

| Persona | `profiles.role` | Workspace type | `org_members.org_role` | Apps |
|---|---|---|---|---|
| Team Employee | `USER` | `TEAM` | `EMPLOYEE` | User App only |
| Team Manager | `USER` | `TEAM` | `MANAGER` | User App, Workspace App |
| Team Admin | `USER` | `TEAM` | `ADMIN` | User App, Workspace App |
| Team Owner | `USER` | `TEAM` | `OWNER` | User App, Workspace App |
| Agent Subscriber | `USER` | `AGENT` | `EMPLOYEE` | User App only |
| Agent Sales | `USER` | `AGENT` | `SALES` | User App, Workspace App |
| Agent Finance | `USER` | `AGENT` | `FINANCE` | User App, Workspace App |
| Agent Owner | `USER` | `AGENT` | `OWNER` | User App, Workspace App |
| Support Staff | `SUPPORT` | optional/internal | `MEMBER` or none | Workspace App read/ops, CS Console limited |
| Super Admin | `SUPER_ADMIN` | optional/internal | any or none | All apps |

### Current Seeded Users Observed

These accounts existed in the live seeded Supabase project on 20 May 2026. Update this table if the seed data changes.

| QA alias | Email | Observed role |
|---|---|---|
| `team_employee_seed` | `beta@test.com` | `USER`, Team `EMPLOYEE` |
| `team_owner_seed` | `effort.myexpensio@gmail.com` | `USER`, Team `OWNER` |
| `agent_owner_seed` | `rahenajessmin@gmail.com` | `USER`, Agent `OWNER` |
| `agent_employee_seed` | `didekhena@gmail.com` | `USER`, Agent `EMPLOYEE` |
| `super_admin_seed` | `myeffort.edutech@gmail.com` | `SUPER_ADMIN`, Team `OWNER` |
| `super_admin_seed_2` | `hernie@myexpensio.com` | `SUPER_ADMIN`, Team `OWNER` |

No `SUPPORT` seeded user was observed during the latest role matrix run. Create one through CS Console before running Support QA.

---

## 3. Required Test Data

Create or identify these workspaces before starting full QA:

| Data item | Recommended value | Used by |
|---|---|---|
| Team workspace | `QA Team Workspace` | Team owner/admin/manager/employee workflows |
| Agent workspace | `QA Agent Workspace` | Agent owner/sales/finance/subscriber workflows |
| Internal workspace | `QA Internal Workspace` or existing internal org | Support and super-admin workflows |
| Team owner | `qa-team-owner+<date>@example.com` | Team invitation and admin flows |
| Team admin | `qa-team-admin+<date>@example.com` | Team role branch |
| Team manager | `qa-team-manager+<date>@example.com` | Team role branch |
| Team employee | `qa-team-employee+<date>@example.com` | User app expense flow |
| Agent owner | `qa-agent-owner+<date>@example.com` | Agent invitation and payout flows |
| Agent sales | `qa-agent-sales+<date>@example.com` | Agent referral branch |
| Agent finance | `qa-agent-finance+<date>@example.com` | Agent finance branch |
| Agent subscriber | `qa-agent-subscriber+<date>@example.com` | Agent subscriber user flow |
| Support staff | `qa-support+<date>@example.com` | Console limited-access branch |
| Super admin | existing internal super admin | Platform setup and full CS operations |

Use real inboxes, aliases, or a mail testing tool for invitation and password-reset tests. If email delivery is unavailable, mark email-dependent tests as BLOCKED and continue with service-role session QA only.

---

## 4. Master Access-Control Matrix

Run this first. It catches most role-routing regressions quickly.

| ID | Role | User App | Workspace App | CS Console | Expected result |
|---|---|---|---|---|
| AC-01 | Unauthenticated | Denied protected pages | Denied protected pages | Denied protected pages | Redirect to login or 401/403 |
| AC-02 | Team Employee | Allowed | Denied | Denied | Employee cannot access admin/console |
| AC-03 | Team Manager | Allowed | Allowed, Team context | Denied | Manager sees Team admin workflows only |
| AC-04 | Team Admin | Allowed | Allowed, Team context | Denied | Admin sees Team admin workflows only |
| AC-05 | Team Owner | Allowed | Allowed, Team context | Denied | Owner sees Team owner controls |
| AC-06 | Agent Subscriber | Allowed | Denied | Denied | Subscriber cannot access admin/console |
| AC-07 | Agent Sales | Allowed | Allowed, Agent context | Denied | Sales sees agent referral workflows |
| AC-08 | Agent Finance | Allowed | Allowed, Agent context | Denied | Finance sees agent finance/payout workflows |
| AC-09 | Agent Owner | Allowed | Allowed, Agent context | Denied | Owner sees all agent controls |
| AC-10 | Support | Allowed | Allowed, internal support limits | Allowed, limited | No destructive/super-admin-only actions |
| AC-11 | Super Admin | Allowed | Allowed, internal/global | Allowed, full | Can switch/work across workspaces |

API spot checks:

| ID | App | Route | Employee expected | Workspace admin expected | Console staff expected |
|---|---|---|---|---|
| AC-API-01 | User | `GET /api/usage/current` | 200 | 200 | 200 |
| AC-API-02 | User | `GET /api/trips` | 200 | 200 | 200 |
| AC-API-03 | User | `GET /api/claims` | 200 | 200 | 200 |
| AC-API-04 | Workspace | `GET /api/workspace/me` | Denied | 200 | 200 for internal staff |
| AC-API-05 | Workspace | `GET /api/workspace/claims` | Denied | 200 | 200 or org-scope required |
| AC-API-06 | Workspace | `GET /api/workspace/members` | Denied | 200 | 400 when `org_id` is required |
| AC-API-07 | CS | `GET /api/console/workspaces` | Denied | Denied | 200 |
| AC-API-08 | CS | `GET /api/console/users` | Denied | Denied | 200 |
| AC-API-09 | CS | `GET /api/console/invitation-queue` | Denied | Denied | 200 |

---

## 5. Workflow Coverage Index

| Workflow | User App | Workspace App | CS Console | Roles |
|---|---|---|---|---|
| Login/logout/session routing | Yes | Yes | Yes | All |
| Direct invitation by Team owner/admin | User onboarding | Team invitations | Visible in users/members | Team Owner, Team Admin, Employee |
| Direct invitation by Agent owner/sales | User onboarding | Agent invitations/referrals | Visible in users/members | Agent Owner, Sales, Subscriber |
| Console-managed workspace creation | User onboarding | Workspace access | Workspace creation | Super Admin, Support branch |
| Console invitation queue | User onboarding | Request origin | Approve/reject/execute | Workspace roles, Console roles |
| Trip capture | Yes | Review through claims | Indirect | User roles |
| Claims | Create/submit | View/review | Search/audit indirect | Employee, Team admin roles |
| TnG import/linking | Yes | Review linked item | Indirect | User roles |
| Exports | Create/download history | Export jobs/history | Platform visibility | User, Workspace admin, Console |
| Billing and subscriptions | Checkout/portal/summary | Workspace billing summary | Subscription override | Owner, User, Console |
| Personal and business accounting | Spaces, ledger, reports | Not primary | User/subscription visibility | User, Premium user |
| Team rates/templates | Read rates | Configure team rates/templates | Global templates | Team Owner/Admin, Super Admin |
| Agent referrals/commission | Subscriber user flow | Referrals/commission/payout | Agent workspace ops | Agent roles, Console |
| Audit logs | Indirect | Workspace audit | Platform audit | Admin, Console |

---

## 6. User App Workflows

### U-01 Login, Logout, and Session Guard

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-01.1 | Unauthenticated | Open `/home`, `/trips`, `/claims`, `/exports`, `/settings` | Redirects to `/login` | |
| U-01.2 | Any active user | Log in with valid credentials or minted session | Lands on app home/dashboard | |
| U-01.3 | Any active user | Log out | Session clears and protected pages redirect to `/login` | |
| U-01.4 | Any active user | Log in, refresh browser, reopen app | Session persists if cookies are valid | |
| U-01.5 | User with `must_change_password=true` | Log in with temporary password | Redirected to `/change-password` before app access | |
| U-01.6 | Same user | Set new password and accept required consent | Password updated, user returns to login, `must_change_password=false` | |

Branches:

| Branch | Expected result |
|---|---|
| Wrong password | Clear invalid credentials message |
| Suspended workspace | Login denied or user is blocked from workspace data |
| No active membership | User cannot load workspace-specific data |

### U-02 Profile, Settings, and Rate Visibility

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-02.1 | Any active user | Open Settings/Profile | Email and display name are shown | |
| U-02.2 | Any active user | Update display name, department, company name if supported | Save succeeds and refresh keeps values | |
| U-02.3 | Team Employee | Open rate/settings area | Workspace mileage rate is visible | |
| U-02.4 | Agent Subscriber | Open rate/settings area | User app works; agent workspace admin controls are not visible | |
| U-02.5 | Any active user | Try weak password in change password modal | Validation blocks save | |
| U-02.6 | Any active user | Try mismatched password confirmation | Validation blocks save | |
| U-02.7 | Any active user | Save valid password | Password changes; user can log in with new password | |

### U-03 Spaces, Ledger, and Accounting

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-03.1 | Any active user | Open accounting/spaces area | Personal space exists or is auto-created | |
| U-03.2 | Free user | Try to open Business space if gated | Upgrade prompt or locked state appears | |
| U-03.3 | Premium user | Open Business space | Business space loads | |
| U-03.4 | User | Add personal expense ledger entry | Entry saved in Personal space | |
| U-03.5 | User | Mark personal expense as tax deductible | Deduction flag saves and appears in tax report | |
| U-03.6 | User | Add business income entry | Allowed only in Business space | |
| U-03.7 | User | Try income entry in Personal space | Validation error: income only supported in Business space | |
| U-03.8 | User | Edit ledger entry | Values update without changing ownership | |
| U-03.9 | User | Delete ledger entry | Entry removed from list and summary | |
| U-03.10 | User | Generate personal tax report | Report returns correct date-range totals | |
| U-03.11 | Premium user | Generate business profit summary/P&L PDF | Report/PDF returns business-space totals | |

### U-04 Trips - Selected Route

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-04.1 | Any user | Open Trips and create new selected-route trip | Origin/destination form appears | |
| U-04.2 | User | Enter valid origin and destination | Route alternatives load | |
| U-04.3 | User | Select a route and save | Trip becomes FINAL with selected-route distance | |
| U-04.4 | User | View trip detail | Distance source, vehicle type, route details shown | |
| U-04.5 | User | Edit editable trip fields before claim use | Save succeeds | |
| U-04.6 | User | Delete unused trip | Trip removed | |

Branches:

| Branch | Expected result |
|---|---|
| Invalid location | Clear validation/error message |
| Route API failure | User sees retryable route error |
| Free route limit reached | Route calculation is blocked with limit message |
| Motorcycle vehicle type | Vehicle type persists and carries to mileage claim item |

### U-05 Trips - Odometer

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-05.1 | User | Create odometer trip | Odometer inputs appear | |
| U-05.2 | User | Enter valid start/end or manual distance | Trip saves as FINAL | |
| U-05.3 | User | Upload odometer evidence if supported | Evidence saves or preview appears | |
| U-05.4 | User | View detail | Odometer distance has priority over route/GPS distance | |

Branches:

| Branch | Expected result |
|---|---|
| Negative distance | Validation blocks save |
| End lower than start | Validation blocks save |
| Unsupported upload type | Upload rejected with file-type message |

### U-06 Trips - GPS Tracking

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-06.1 | Mobile/desktop browser | Start GPS trip and grant location permission | Trip created as DRAFT, timer starts | |
| U-06.2 | User | Add points by movement or simulator | Points count increases | |
| U-06.3 | User | Stop trip | Trip becomes FINAL and distance is calculated | |
| U-06.4 | User | Resume/reopen active draft trip | App resumes draft state | |

Branches:

| Branch | Expected result |
|---|---|
| Location denied | Clear permission error |
| Browser has no geolocation | Unsupported message |
| Stop trip with too few/no points | Safe validation/error, no corrupt distance |
| Draft abandoned | Known gap: stale DRAFT GPS trips may remain |

### U-07 Claim Drafting

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-07.1 | User | Create claim with title and period | DRAFT claim created | |
| U-07.2 | User | Open DRAFT claim | Total is zero and Add Item controls are visible | |
| U-07.3 | User | Edit claim title/period while DRAFT | Save succeeds | |
| U-07.4 | User | Delete empty DRAFT claim | Claim removed | |

Branches:

| Branch | Expected result |
|---|---|
| Missing title | Validation error |
| Period end before start | Validation error |
| Item date outside period | Known gap: API may allow; note if UI blocks |

### U-08 Claim Items

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-08.1 | User | Add mileage item from selected-route car trip | Amount calculates from distance and rate | |
| U-08.2 | User | Add mileage item from odometer motorcycle trip | Item saves with motorcycle vehicle type | |
| U-08.3 | User | Add receipt item with merchant, amount, date | Item saves and total updates | |
| U-08.4 | User | Upload receipt image/PDF if supported | Upload succeeds and receipt path is stored | |
| U-08.5 | User | Add meal item | Item saves and total updates | |
| U-08.6 | User | Add lodging item | Item saves and total updates | |
| U-08.7 | User | Add per-diem item | Item saves and total updates | |
| U-08.8 | User | Edit each item type while claim is DRAFT | Item updates and total recalculates | |
| U-08.9 | User | Delete an item while claim is DRAFT | Item removed and total recalculates | |

Branches:

| Branch | Expected result |
|---|---|
| Mileage trip already used if duplicate prevention exists | Duplicate blocked or clearly allowed by design |
| Negative amount | Validation blocks save |
| Unsupported receipt file type | Upload rejected |
| Motorcycle rate | Known risk: verify whether motorcycle uses correct rate or defaults to car |

### U-09 TnG Statement Import and Linking

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-09.1 | User | Upload valid TnG PDF statement | Transactions parse into review table | |
| U-09.2 | User | Review parsed transaction fields | Date, merchant, amount, reference look sane | |
| U-09.3 | User | Link transaction to claim item | Claim item shows TnG reference / paid via TnG | |
| U-09.4 | User | Unlink transaction if supported | Link removed cleanly | |
| U-09.5 | User | Delete imported statement batch if supported | Batch and transactions removed or marked deleted | |

Branches:

| Branch | Expected result |
|---|---|
| Duplicate PDF upload | Known risk: duplicates may be created; note behavior |
| Non-TnG PDF | Parser rejects with useful error |
| Transaction sector unsupported for linking | Clear unsupported-sector message |
| Link transaction to submitted claim item | Blocked because claim is locked |

### U-10 Claim Submission and Locking

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-10.1 | User | Submit claim with at least one item | Status changes to SUBMITTED | |
| U-10.2 | User | Refresh claim detail | Edit/Add/Delete controls are gone | |
| U-10.3 | User | Directly call edit item on submitted claim | API denies with conflict/validation error | |
| U-10.4 | User | Submit same claim again | 409 conflict or idempotent safe response | |

Branches:

| Branch | Expected result |
|---|---|
| Submit empty claim | Blocked |
| Submission while total recalculation RPC fails | Fallback sum is used or clear server error |

### U-11 Exports

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-11.1 | User | Open Exports | Export history loads | |
| U-11.2 | User | Generate PDF for submitted claim | Export created and downloadable | |
| U-11.3 | User | Generate CSV for submitted claim | CSV downloads with one row per item | |
| U-11.4 | User | Generate XLSX for submitted claim | XLSX opens with correct totals | |
| U-11.5 | User | Download export from history | Signed URL or file download works | |
| U-11.6 | User | Try export with DRAFT claim | Blocked or excludes draft depending on design | |

Branches:

| Branch | Expected result |
|---|---|
| Free export limit reached | Generation blocked with limit message |
| Expired download URL | User gets useful guidance or can regenerate |
| Invalid export format | API returns validation error |

### U-12 Billing and Subscription

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| U-12.1 | Free user/workspace | Open Billing | Tier and usage counters shown | |
| U-12.2 | Free user/workspace | Exhaust route/trip/export limit | Limit blocks next action | |
| U-12.3 | Eligible user | Start Pro checkout | Stripe Checkout URL returned/opened | |
| U-12.4 | Tester | Complete Stripe test payment | Redirects to success page | |
| U-12.5 | User | Refresh Billing | Tier is PRO/PREMIUM as appropriate | |
| U-12.6 | Pro user/workspace | Open billing portal | Stripe portal URL returned/opened | |
| U-12.7 | Pro user/workspace | Try checkout again | Existing subscription conflict or portal redirect | |
| U-12.8 | Tester | Simulate payment failed webhook | Billing status/grace behavior is visible | |

Branches:

| Branch | Expected result |
|---|---|
| Stripe env missing | Checkout returns config validation error, not crash |
| Webhook signature invalid | Webhook rejects request |
| Grace period | Known risk: UI/enforcement may not surface grace period |

---

## 7. Team Workspace App Workflows

### T-01 Team Owner Login and Dashboard

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| T-01.1 | Team Owner | Open Workspace App | Dashboard loads with Team workspace context | |
| T-01.2 | Team Owner | Confirm nav | Dashboard, Members, Invitations, Claims, Rates, Settings, Audit visible as applicable | |
| T-01.3 | Team Owner | Try Agent-only referrals page | Hidden or forbidden | |
| T-01.4 | Team Employee | Try Workspace App | Redirected away or denied | |

### T-02 Team Settings

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| T-02.1 | Team Owner | Open Settings | Workspace profile and billing summary visible | |
| T-02.2 | Team Owner | Update display name/contact fields | Save succeeds | |
| T-02.3 | Team Admin | Update allowed settings | Save succeeds if Admin is allowed | |
| T-02.4 | Team Manager | Try to update settings | Denied if manager lacks permission | |
| T-02.5 | Team Owner/Admin | Submit invalid contact/email | Validation error | |

### T-03 Team Rates

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| T-03.1 | Team Owner/Admin | Open Rates | Current rate/template shown | |
| T-03.2 | Team Owner/Admin | Add team rate | Rate saves and becomes active based on effective date | |
| T-03.3 | Team Manager | Open Rates | Read access only if allowed | |
| T-03.4 | Team Manager | Try to add/edit team rate | Denied | |
| T-03.5 | Team Owner/Admin | Test template vs team rate conflict | Document which rate wins in User App calculation | |

### T-04 Direct Invitation by Team Owner/Admin

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| T-04.1 | Team Owner/Admin | Open Invitations/Members and invite `EMPLOYEE` | New user created or existing user added; onboarding email sent for new user | |
| T-04.2 | Invited Employee | Open email and log in with temporary password | User is forced to `/change-password` | |
| T-04.3 | Invited Employee | Set password and consent | User can access User App | |
| T-04.4 | Team Owner/Admin | Refresh Members | Employee is ACTIVE | |
| T-04.5 | Team Owner/Admin | Invite `MANAGER` | Manager can access Workspace App after onboarding | |
| T-04.6 | Team Owner/Admin | Invite `ADMIN` | Admin can access Workspace App after onboarding | |

Branches:

| Branch | Expected result |
|---|---|
| Duplicate active member | Blocked with conflict |
| Duplicate pending invitation | Blocked or existing invitation shown |
| Invalid role for TEAM (`SALES`, `FINANCE`) | Validation error |
| Existing user invited | Added to org without forced password reset |
| Email send failure | Invitation/member state is clear and warning is shown |

### T-05 Team Member Management

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| T-05.1 | Team Owner | View members | All active/removed/pending relevant rows shown | |
| T-05.2 | Team Owner | Promote Employee to Manager | Role updates and audit log is written | |
| T-05.3 | Team Owner | Promote Manager to Admin | Role updates | |
| T-05.4 | Team Owner | Demote Admin to Employee | Role updates and admin loses Workspace access | |
| T-05.5 | Team Owner | Remove Employee | Status changes to REMOVED or row removed | |
| T-05.6 | Team Owner | Try to remove/demote last Owner | Blocked with conflict | |
| T-05.7 | Team Admin/Manager | Try role changes | Denied unless explicitly allowed by design | |

### T-06 Team Claims Review

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| T-06.1 | Team Owner/Admin/Manager | Open Claims | Submitted team claims listed | |
| T-06.2 | Actor | Filter by status/date/employee if available | Results match filters | |
| T-06.3 | Actor | Open claim detail | Items, mileage, receipt/TnG data, totals visible | |
| T-06.4 | Actor | Verify claim is read-only | No employee edit controls | |
| T-06.5 | Actor | Try approve/reject | Known gap: no approval/rejection endpoint currently exists | |

### T-07 Team Billing and Usage

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| T-07.1 | Team Owner | Open billing summary | Subscription and usage counters visible | |
| T-07.2 | Team Admin/Manager | Open billing summary | Visible or restricted according to design | |
| T-07.3 | Team Owner | Trigger upgrade or portal if available | Stripe flow starts | |
| T-07.4 | Internal staff with no `org_id` | Open org-scoped billing API | API requires `org_id` | |

### T-08 Team Audit Log

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| T-08.1 | Team Owner/Admin | Open Audit | Workspace events shown | |
| T-08.2 | Actor | Filter by invite/member/claim/rate event | Matching events shown | |
| T-08.3 | Actor | Confirm actor, timestamp, metadata | Values match actions performed | |

---

## 8. Agent Workspace App Workflows

### A-01 Agent Owner Login and Dashboard

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| A-01.1 | Agent Owner | Open Workspace App | Dashboard loads with Agent workspace context | |
| A-01.2 | Agent Owner | Confirm nav | Referrals, Commission/Payout, Members, Settings visible as applicable | |
| A-01.3 | Agent Owner | Try Team-only claims/rates workflow | Hidden or forbidden if not applicable | |
| A-01.4 | Agent Subscriber | Try Workspace App | Redirected away or denied | |

### A-02 Direct Invitation by Agent Owner/Sales

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| A-02.1 | Agent Owner | Invite `EMPLOYEE` subscriber | Subscriber onboarding email sent; user is added as Agent subscriber | |
| A-02.2 | Agent Sales | Invite `EMPLOYEE` subscriber | Allowed if Sales can invite customers | |
| A-02.3 | Agent Owner | Invite `SALES` staff | Staff can access Workspace App after onboarding | |
| A-02.4 | Agent Owner | Invite `FINANCE` staff | Staff can access Workspace App after onboarding | |
| A-02.5 | Invited user | Complete first login/password/consent | Lands in correct app based on role | |

Branches:

| Branch | Expected result |
|---|---|
| Agent Sales invites `SALES` or `FINANCE` staff | Denied unless design permits staff invitations |
| Agent Finance invites subscriber | Denied unless design permits finance invitations |
| Invalid role for AGENT (`ADMIN`, `MANAGER`) | Validation error |
| Existing user invited | Added to agent workspace without password reset |

### A-03 Agent Referrals

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| A-03.1 | Agent Owner/Sales | Open Referrals | Referral/subscriber list loads | |
| A-03.2 | Agent Owner/Sales | Create referral/invite customer | Referral record and/or invitation created | |
| A-03.3 | Agent Owner/Sales | Search/filter referrals | Results match filters | |
| A-03.4 | Team Owner | Open Agent referrals endpoint/page | 403: referrals are Agent-only | |
| A-03.5 | Agent Finance | Open referrals | Read-only or denied according to design | |

### A-04 Agent Commission and Payout

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| A-04.1 | Agent Owner | Open commission dashboard | Commission totals and subscriber metrics visible | |
| A-04.2 | Agent Finance | Open commission dashboard | Finance can view commission if allowed | |
| A-04.3 | Agent Sales | Open commission dashboard | Denied or read-only according to design | |
| A-04.4 | Agent Owner | Update payout settings | Save succeeds | |
| A-04.5 | Agent Finance | Update payout settings | Denied unless explicitly allowed | |
| A-04.6 | Agent Owner/Finance | Request payout if feature is present | Payout request created with correct status | |

### A-05 Agent Member Management

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| A-05.1 | Agent Owner | View staff and subscribers | Staff and subscribers separated or clearly labeled | |
| A-05.2 | Agent Owner | Change staff role Sales to Finance | Role updates and access changes | |
| A-05.3 | Agent Owner | Change subscriber Employee to Sales | Subscriber becomes staff and gets Workspace access | |
| A-05.4 | Agent Owner | Remove subscriber | Subscriber loses membership/access | |
| A-05.5 | Agent Owner | Try remove/demote last Owner | Blocked | |

### A-06 Agent Settings and Billing

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| A-06.1 | Agent Owner | Open Settings | Agent workspace profile visible | |
| A-06.2 | Agent Owner | Update profile/contact fields | Save succeeds | |
| A-06.3 | Agent Sales/Finance | Try to update settings | Denied unless allowed by design | |
| A-06.4 | Agent Owner | Open billing/usage | Agent subscription/status visible if applicable | |

---

## 9. CS Console Workflows

### C-01 Console Login and Role Boundaries

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| C-01.1 | Unauthenticated | Open any protected CS page | Redirect to login | |
| C-01.2 | Team/Agent regular user | Log into CS | Denied with unauthorized error | |
| C-01.3 | Support | Log into CS | Console opens with limited actions | |
| C-01.4 | Super Admin | Log into CS | Console opens with full actions | |

### C-02 Workspace Search, Create, Edit, Suspend

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| C-02.1 | Console staff | Open Workspaces | All workspaces listed | |
| C-02.2 | Console staff | Search by name/email/type/status | Matching workspaces shown | |
| C-02.3 | Super Admin | Create TEAM workspace with owner | Org created, owner user created/added, onboarding email sent if new | |
| C-02.4 | Super Admin | Create AGENT workspace with owner | Agent org created, owner added, onboarding email sent if new | |
| C-02.5 | Super Admin | Try duplicate workspace name | Validation/conflict error | |
| C-02.6 | Console staff | Edit workspace profile/status | Save succeeds if role permits | |
| C-02.7 | Console staff | Suspend workspace | Workspace status becomes SUSPENDED | |
| C-02.8 | Workspace user | Try to use app while suspended | Blocked or shown suspended state | |
| C-02.9 | Console staff | Reactivate workspace | Access restored | |

Support branch:

| Branch | Expected result |
|---|---|
| Support tries destructive workspace update | Denied if action is super-admin-only |
| Super Admin performs same action | Allowed and audit logged |

### C-03 Console Workspace Members

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| C-03.1 | Console staff | Open members drawer for TEAM workspace | Team members listed | |
| C-03.2 | Console staff | Add TEAM `EMPLOYEE` | User created/added and email sent if new | |
| C-03.3 | Console staff | Add TEAM `ADMIN`/`MANAGER`/`OWNER` | Correct role access after onboarding | |
| C-03.4 | Console staff | Add invalid TEAM role `SALES` | Validation error | |
| C-03.5 | Console staff | Open members drawer for AGENT workspace | Staff and subscribers listed | |
| C-03.6 | Console staff | Add AGENT `EMPLOYEE`, `SALES`, `FINANCE`, `OWNER` | Correct role/access after onboarding | |
| C-03.7 | Console staff | Add invalid AGENT role `ADMIN` | Validation error | |
| C-03.8 | Console staff | Change org role | Membership updates and access changes | |
| C-03.9 | Console staff | Remove member | Member loses workspace access | |

### C-04 Console Users

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| C-04.1 | Console staff | Open Users | Users listed with profiles and memberships | |
| C-04.2 | Console staff | Search by email/name | Matching users shown | |
| C-04.3 | Console staff | Open user detail/edit drawer | Profile and membership list shown | |
| C-04.4 | Super Admin | Change `profiles.role` USER to SUPPORT | User gains Console/Workspace support access | |
| C-04.5 | Support | Try to promote user to SUPER_ADMIN | Denied | |
| C-04.6 | Super Admin | Change membership role from user drawer | Role changes and audit logged | |
| C-04.7 | Console staff | Trigger password reset | Supabase reset email sent | |

### C-05 Console Invitation Queue

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| C-05.1 | Console staff | Open Invitation Queue | Requests listed with status | |
| C-05.2 | Console staff | Filter by PENDING/APPROVED/REJECTED/EXECUTED | Filter works | |
| C-05.3 | Console staff | Approve pending request | Status becomes APPROVED | |
| C-05.4 | Console staff | Reject pending request with reason | Status becomes REJECTED and reason persists | |
| C-05.5 | Console staff | Execute approved request | User is created/added, onboarding email sent if new, status EXECUTED | |
| C-05.6 | Console staff | Execute request for existing user | Existing user added without password reset | |
| C-05.7 | Console staff | Try execute rejected/expired request | Blocked | |
| C-05.8 | Invited user | Complete first login/change password | Onboarding completes, consent/audit recorded | |

Branches:

| Branch | Expected result |
|---|---|
| Request role invalid for workspace type | Validation error |
| Email send fails after user creation | Request exposes warning and recoverable state |
| Auto-approve enabled | Request may skip manual approve and execute immediately |

### C-06 Console Subscriptions

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| C-06.1 | Console staff | Open Subscriptions | Workspace/user subscription rows listed | |
| C-06.2 | Console staff | Search/filter by tier/status/workspace | Results match filters | |
| C-06.3 | Super Admin | Override workspace to PRO | User/Workspace App shows unlimited entitlements | |
| C-06.4 | Super Admin | Override back to FREE | Limits are enforced again | |
| C-06.5 | Support | Try subscription override | Denied if support is read-only/limited | |
| C-06.6 | Console staff | Verify audit entry | Subscription change is logged with actor and reason | |

### C-07 Console Rates, Templates, and Assignments

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| C-07.1 | Console/Super Admin | Open global rates/templates | Templates listed | |
| C-07.2 | Super Admin | Create rate template | Template saves | |
| C-07.3 | Super Admin | Edit rate template | Template updates | |
| C-07.4 | Super Admin | Assign template to workspace | Workspace uses assigned template | |
| C-07.5 | Super Admin | Remove assignment | Workspace falls back to team/default rate | |
| C-07.6 | Support | Try template mutation | Denied if support cannot mutate | |

### C-08 Console Audit, System, and Referrals

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| C-08.1 | Console staff | Open Audit | Platform audit events listed | |
| C-08.2 | Console staff | Filter by workspace/user/action/date | Filters work | |
| C-08.3 | Console staff | Open System/health page if present | Health/config information loads | |
| C-08.4 | Console staff | Open Referrals | Agent referral records visible | |
| C-08.5 | Console staff | Filter referrals by agent/status | Results match filters | |

---

## 10. Super-Admin Workspace App Workflows

Some platform-admin workflows live in the Workspace App under `/api/admin/*` and `/orgs`.

### S-01 Platform Orgs

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| S-01.1 | Super Admin | Open `/orgs` | All orgs visible | |
| S-01.2 | Super Admin | Create TEAM org | Org created with owner membership | |
| S-01.3 | Super Admin | Create AGENT org | Org created with owner membership | |
| S-01.4 | Support or regular workspace user | Open `/orgs` | Denied unless support is explicitly allowed | |
| S-01.5 | Super Admin | Filter orgs by type/status | Results match filters | |

### S-02 Platform Config

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| S-02.1 | Super Admin | Open platform config/settings | Current free limits and config visible | |
| S-02.2 | Super Admin | Change route/trip/export limits | Config saves | |
| S-02.3 | Free user | Hit changed limit in User App | New limit is enforced | |
| S-02.4 | Support | Try changing platform config | Denied if support is not allowed | |

### S-03 Admin Audit and Templates

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| S-03.1 | Super Admin | Open admin audit | Platform/admin events visible | |
| S-03.2 | Super Admin | Create/edit/delete template | Mutations work and audit is written | |
| S-03.3 | Super Admin | Assign template to org | Org rate behavior changes accordingly | |

---

## 11. End-to-End Scenario Suites

These are the best "full story" flows. Run them after isolated role tests pass.

### E2E-01 Team Owner Invites Employee, Employee Submits Claim

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| E2E-01.1 | Super Admin/CS | Create or verify active TEAM workspace | Workspace active | |
| E2E-01.2 | Team Owner | Invite Employee | Email sent, member pending/active depending flow | |
| E2E-01.3 | Employee | First login, change password, consent | User App access works | |
| E2E-01.4 | Employee | Create selected-route trip | FINAL trip exists | |
| E2E-01.5 | Employee | Create claim and add mileage/receipt/meal items | Claim total correct | |
| E2E-01.6 | Employee | Submit claim | Claim SUBMITTED and locked | |
| E2E-01.7 | Team Owner/Admin/Manager | Review claim | Claim visible read-only | |
| E2E-01.8 | Employee | Generate PDF/CSV/XLSX exports | Files created and downloadable | |
| E2E-01.9 | Team Owner/Admin | Check audit | Invitation/member/claim/export events visible where implemented | |

### E2E-02 Team Role Branches

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| E2E-02.1 | Team Owner | Invite Admin | Admin gets Workspace access | |
| E2E-02.2 | Team Owner | Invite Manager | Manager gets Workspace access | |
| E2E-02.3 | Team Admin | Try team settings/rates/member actions | Only allowed admin actions succeed | |
| E2E-02.4 | Team Manager | Try settings/rates/member actions | Restricted actions denied | |
| E2E-02.5 | Team Employee | Try Workspace App | Denied | |

### E2E-03 Agent Owner Invites Subscriber

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| E2E-03.1 | Super Admin/CS | Create or verify active AGENT workspace | Workspace active | |
| E2E-03.2 | Agent Owner | Invite subscriber as `EMPLOYEE` | Email sent and subscriber added | |
| E2E-03.3 | Subscriber | Complete first login | User App access works, Workspace denied | |
| E2E-03.4 | Agent Owner/Sales | View referrals/subscribers | Subscriber/referral appears | |
| E2E-03.5 | Agent Owner/Finance | View commission | Commission area loads | |
| E2E-03.6 | Team Owner | Try Agent referrals | 403 or hidden | |

### E2E-04 Agent Staff Branches

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| E2E-04.1 | Agent Owner | Invite Sales staff | Sales can access Workspace App | |
| E2E-04.2 | Agent Sales | Invite subscriber | Allowed if Sales can invite customers | |
| E2E-04.3 | Agent Sales | Try payout settings | Denied | |
| E2E-04.4 | Agent Owner | Invite Finance staff | Finance can access Workspace App | |
| E2E-04.5 | Agent Finance | View commission/payout | Allowed if designed | |
| E2E-04.6 | Agent Finance | Invite customer/staff | Denied unless design permits | |

### E2E-05 Console Creates Workspace and Executes Invitation

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| E2E-05.1 | Super Admin | Create TEAM workspace in CS | Owner created/added | |
| E2E-05.2 | Super Admin | Add member through workspace drawer | Member created/added | |
| E2E-05.3 | Invited user | Complete first login | Correct app access by role | |
| E2E-05.4 | Super Admin | Change role in CS user drawer | Access changes immediately after refresh/relogin | |
| E2E-05.5 | Super Admin | Suspend workspace | Users blocked | |
| E2E-05.6 | Super Admin | Reactivate workspace | Users restored | |

### E2E-06 Billing and Limit Enforcement

| Step | Actor | Action | Expected result | Result |
|---|---|---|---|---|
| E2E-06.1 | Free user/workspace | Exhaust free route/export limit | Blocked with limit message | |
| E2E-06.2 | User/Owner | Upgrade through Stripe test checkout | Subscription becomes active | |
| E2E-06.3 | User | Repeat previously blocked action | Now succeeds | |
| E2E-06.4 | Console Super Admin | Override subscription to FREE | Limits apply again | |
| E2E-06.5 | Console Super Admin | Override subscription to PRO | Unlimited entitlements return | |

---

## 12. Negative and Security Regression Tests

| ID | Area | Test | Expected result | Result |
|---|---|---|---|---|
| NEG-01 | Auth | Use expired session cookie | Redirect or 401/403 | |
| NEG-02 | Auth | Use Team employee session on Workspace API | Denied | |
| NEG-03 | Auth | Use Workspace admin session on CS API | Denied | |
| NEG-04 | Auth | Use Agent subscriber session on Workspace API | Denied | |
| NEG-05 | Auth | Try role mutation as non-owner/non-console | Denied | |
| NEG-06 | Cross-org | Team owner requests another org with `org_id` query | Ignored or denied; cannot cross org | |
| NEG-07 | Internal org scope | Internal staff calls org-scoped endpoint without `org_id` | Endpoint either returns global view or clear `org_id required` |
| NEG-08 | Invitation | Reuse onboarding link after completion | Blocked | |
| NEG-09 | Invitation | Accept invite as a different email | Blocked | |
| NEG-10 | Invitation | Accept expired invite | Blocked | |
| NEG-11 | Claims | Edit submitted claim | Blocked | |
| NEG-12 | Claims | Delete another user's claim | Blocked | |
| NEG-13 | Trips | Fetch another user's trip by ID | Blocked | |
| NEG-14 | TnG | Link another user's transaction | Blocked | |
| NEG-15 | Exports | Download another user's export | Blocked | |
| NEG-16 | Uploads | Upload unsupported file type | Rejected | |
| NEG-17 | Billing | Forge Stripe webhook without valid signature | Rejected | |
| NEG-18 | Console | Support tries super-admin-only mutation | Denied | |

---

## 13. Known Product Gaps to Mark During QA

These should be recorded as known gaps, not rediscovered as fresh regressions unless behavior changes.

| Gap | Severity | Where to observe |
|---|---|---|
| Claim approval/rejection is missing | Critical workflow gap | Team claims review |
| Motorcycle mileage may use the same rate as car | Medium | Mileage claim calculation |
| TnG duplicate import may not be prevented | Medium/Low | TnG statement upload |
| TnG parser is layout-sensitive | Medium | Statement parsing |
| Stale GPS DRAFT trips may remain forever | Low | GPS trip abandonment |
| Claim item dates may not be API-validated against claim period | Low | Claim item creation |
| Export download expiry messaging may be unclear | Low | Export history/download |
| Stripe grace period may not surface in UI/enforcement | Medium | Failed payment branch |
| Direct invitations and console invitation queue are separate systems | Medium | Invitation audit and support tracing |

---

## 14. Sign-Off Sheet

| Section | Owner | Date | Pass/Fail | Notes |
|---|---|---|---|---|
| Access control matrix | | | | |
| User App workflows | | | | |
| Team Workspace workflows | | | | |
| Agent Workspace workflows | | | | |
| CS Console workflows | | | | |
| Super-admin workflows | | | | |
| End-to-end scenario suites | | | | |
| Negative/security regression tests | | | | |

Overall result:

| Result | Selected |
|---|---|
| PASS | |
| CONDITIONAL PASS | |
| FAIL | |

Release notes / exceptions:

```
Add tester notes here.
```

