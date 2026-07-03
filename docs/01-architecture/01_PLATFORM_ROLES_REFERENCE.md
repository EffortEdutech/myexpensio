# myexpensio Platform — Users, Roles & Database Reference
**Version:** 1.0 | Date: 26 Apr 2026

---

## The Most Important Thing to Understand First

There are **TWO separate role systems** that exist at the same time for every user.
They live in **two different tables** and mean completely different things.

```
profiles.role          → WHO YOU ARE on the platform (platform-level)
org_members.org_role   → WHAT YOU DO inside a specific workspace (workspace-level)
```

Every user has:
- Exactly ONE `profiles` row (their identity)
- One or more `org_members` rows (one per workspace they belong to)

---

## Table 1 — `profiles.role` (Platform-Level Role)

> **Database table:** `profiles`
> **Column:** `role`
> **This is set once. It controls which apps the user can access.**

| Role value | Who | Can access | Set by |
|---|---|---|---|
| `USER` | Any regular user — Team employee, Agent subscriber | MyExpensio (apps/user) only | Default on account creation |
| `SUPPORT` | Internal EffortEdutech support staff | MyExpensio + Expensio Workspace (read-only) + Expensio Console (limited) | Console SUPER_ADMIN |
| `SUPER_ADMIN` | Internal EffortEdutech super admin (you/Eff) | All 3 apps — full access everywhere | Console SUPER_ADMIN |

**Key rule:** Every person on the platform starts as `USER`. The only people with `SUPPORT` or `SUPER_ADMIN` are EffortEdutech internal staff.

---

## Table 2 — `org_members.org_role` (Workspace-Level Role)

> **Database table:** `org_members`
> **Column:** `org_role`
> **This controls what the user can DO inside one specific workspace.**

The valid roles differ depending on the workspace type.

### For TEAM workspaces

| Role value | Who | What they can do |
|---|---|---|
| `OWNER` | Company owner / person who registered the workspace | Full access — manage members, view all claims, configure rates, export |
| `ADMIN` | Finance/HR admin | Same as OWNER minus billing |
| `MANAGER` | Department manager / approver | View all team claims, manage team members |
| `EMPLOYEE` | Regular staff member | Submit own claims, track own trips, export own data |
| `MEMBER` | Legacy role (old system) | Treated same as EMPLOYEE — kept for backward compat |

### For AGENT workspaces

| Role value | Who | What they can do |
|---|---|---|
| `OWNER` | Agency owner / partner who registered | Full access — all modules, payout settings |
| `SALES` | Sales staff | Invite new customers, track referrals |
| `FINANCE` | Finance staff | View commission dashboard, request payouts |

---

## Table 3 — `organizations.workspace_type` (What Kind of Workspace)

> **Database table:** `organizations`
> **Column:** `workspace_type`
> **This defines the PURPOSE of the workspace, not the user's role.**

| Type value | What it is | Who uses it |
|---|---|---|
| `TEAM` | A company workspace. The company owns the subscription. | Company employees submit claims to their team manager |
| `AGENT` | A partner/reseller workspace. Agent recruits individual paying users. | Agent and their sales/finance staff manage referrals and commissions |
| `INTERNAL` | EffortEdutech's own internal workspace | Internal staff (SUPPORT + SUPER_ADMIN) |
| `PERSONAL` | Legacy type — no longer used for new accounts | Ignored in new code |

---

## The Full Picture — How It All Connects

Every user identity is built from **3 things combined**:

```
profiles.role (platform role)
    +
organizations.workspace_type (what kind of workspace)
    +
org_members.org_role (what they do inside that workspace)
    =
What the user can see and do
```

---

## Master Reference Table — All Personas

| Who you'd call them | `profiles.role` | `workspace_type` | `org_role` | Which apps |
|---|---|---|---|---|
| **Team Employee** | `USER` | `TEAM` | `EMPLOYEE` | MyExpensio (user app) |
| **Team Manager** | `USER` | `TEAM` | `MANAGER` | MyExpensio + Workspace App |
| **Team Admin** (finance/HR) | `USER` | `TEAM` | `ADMIN` | MyExpensio + Workspace App |
| **Team Owner** (company owner) | `USER` | `TEAM` | `OWNER` | MyExpensio + Workspace App |
| **Agent User** (individual subscriber) | `USER` | `AGENT` | `EMPLOYEE` | MyExpensio (user app) |
| **Agent Sales Staff** | `USER` | `AGENT` | `SALES` | MyExpensio + Workspace App |
| **Agent Finance Staff** | `USER` | `AGENT` | `FINANCE` | MyExpensio + Workspace App |
| **Agent Owner** (partner/reseller) | `USER` | `AGENT` | `OWNER` | MyExpensio + Workspace App |
| **Internal Support** | `SUPPORT` | `INTERNAL` | `MEMBER` (or none) | Workspace App (read) + Console |
| **Internal Super Admin** (Eff) | `SUPER_ADMIN` | `INTERNAL` | `MEMBER` (or none) | All 3 apps — full access |

---

## Which Database Tables Are Involved Per Action

### When a user logs into MyExpensio (apps/user)

| Action | Tables read |
|---|---|
| Auth check | `auth.users` (Supabase) |
| Load user profile | `profiles` |
| Load their workspace | `org_members` → `organizations` |
| Show their claims | `claims`, `claim_items` |
| Show their trips | `trips` |
| Check route limit | `usage_counters`, `platform_config` |

### When a Team Manager logs into Expensio Workspace (apps/admin)

| Action | Tables read |
|---|---|
| Auth check | `auth.users` → `profiles` → `org_members` |
| Load workspace context | `organizations` (workspace_type = TEAM) |
| View team claims | `claims`, `claim_items`, `profiles` (for user names) |
| View members | `org_members` → `profiles` |
| View audit trail | `audit_logs` |
| View billing/usage | `subscription_status`, `usage_counters` |
| Submit invitation request | `invitation_requests` (INSERT) |

### When an Agent Owner logs into Expensio Workspace (apps/admin)

| Action | Tables read |
|---|---|
| Auth check | `auth.users` → `profiles` → `org_members` |
| Load workspace context | `organizations` (workspace_type = AGENT) |
| View referrals | `referrals` |
| View commission | `commissions`, `agent_payout_settings` |
| View/edit payout settings | `agent_payout_settings` |
| Submit invitation request | `invitation_requests` (INSERT) |

### When Console Staff logs into Expensio Console (apps/cs)

| Action | Tables read |
|---|---|
| Auth check | `auth.users` → `profiles` (role must be SUPPORT or SUPER_ADMIN) |
| Platform dashboard | `organizations`, `profiles`, `claims`, `export_jobs` |
| Invitation queue | `invitation_requests`, `organizations`, `profiles` |
| Execute invitation | `auth.users` (create), `profiles`, `org_members` (write) |
| Manage workspaces | `organizations` (read/write status) |
| Manage users | `profiles` (read/write role) |
| Override subscription | `subscription_status` (write) |
| Edit platform config | `platform_config` (write) |
| All actions | → `audit_logs` (write) |

---

## The Two Tables That Define Every User

### `profiles` — Identity + Platform Role

```sql
profiles (
  id           uuid   -- same as auth.users.id (Supabase Auth)
  email        text
  display_name text
  role         text   -- 'USER' | 'SUPPORT' | 'SUPER_ADMIN'
  department   text   -- optional
  company_name text   -- optional (their employer, outside the platform)
  created_at
)
```

### `org_members` — Workspace Membership + Role

```sql
org_members (
  org_id   uuid  -- which workspace
  user_id  uuid  -- which user (links to profiles.id)
  org_role text  -- 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
                 -- 'SALES' | 'FINANCE' | 'MEMBER'
  status   text  -- 'ACTIVE' | 'REMOVED'
  created_at
)
-- Primary key: (org_id, user_id) → one row per user per workspace
```

**A user can belong to multiple workspaces** (rare but possible — e.g., someone who is both a Team employee at their company AND an Agent Owner).

---

## Common Confusion Points — Answered

### "Is Agent a role or a workspace type?"
**Agent is a workspace type** (`organizations.workspace_type = 'AGENT'`). It is not a role. Inside an Agent workspace, users have roles: `OWNER`, `SALES`, `FINANCE`.

### "Where does 'Team Manager' live in the database?"
`org_members.org_role = 'MANAGER'` inside an `organizations` row where `workspace_type = 'TEAM'`.

### "What is SUPER_ADMIN? Is it a workspace role?"
No. `SUPER_ADMIN` lives only in `profiles.role`. It is a platform-level role. It does NOT appear in `org_members`. It means "EffortEdutech internal staff with full access to everything."

### "Can the same person be both a Team Manager AND an Agent Owner?"
Yes — they would have two rows in `org_members`: one for the TEAM workspace (org_role = MANAGER) and one for the AGENT workspace (org_role = OWNER). Their `profiles.role` would still be `USER`.

### "What is MEMBER? Is it still used?"
`MEMBER` is a legacy role from the early build. It behaves the same as `EMPLOYEE`. New workspaces should use `EMPLOYEE` for team staff. `MEMBER` is kept so old accounts don't break.

### "How does Console staff get access to all workspaces?"
They have `profiles.role = SUPER_ADMIN` or `SUPPORT`. The Console app's API routes use the **service role client** (bypasses RLS entirely) so they can read/write all orgs. Regular users' API routes use the anon client which enforces RLS.

---

## Workspace App Access Rule (apps/admin)

A user can log into Expensio Workspace if **either**:
- `profiles.role` = `SUPPORT` or `SUPER_ADMIN` (internal staff — sees all workspaces)
- **OR** they have at least one active `org_members` row where `org_role` is in `['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE']`

Regular employees (`EMPLOYEE` role) **cannot** log into Workspace App — they only use MyExpensio (user app).

---

## Summary Diagram

```
                    PLATFORM LAYER
                   ┌──────────────────────────────────┐
                   │  profiles.role                    │
                   │  USER       → normal user         │
                   │  SUPPORT    → internal staff      │
                   │  SUPER_ADMIN → internal admin     │
                   └──────────────────────────────────┘
                              ↓
                    WORKSPACE LAYER
        ┌─────────────────────────────────────────────────────┐
        │  organizations.workspace_type                        │
        │                                                      │
        │  TEAM workspace          AGENT workspace             │
        │  org_members.org_role:   org_members.org_role:       │
        │  - OWNER                 - OWNER                     │
        │  - ADMIN                 - SALES                     │
        │  - MANAGER               - FINANCE                   │
        │  - EMPLOYEE                                          │
        └─────────────────────────────────────────────────────┘
                              ↓
                    APP LAYER
        ┌──────────────────────────────────────────────────────┐
        │  apps/user (MyExpensio)   → ALL users                │
        │  apps/admin (Workspace)   → OWNER/ADMIN/MANAGER/     │
        │                             SALES/FINANCE +          │
        │                             SUPPORT/SUPER_ADMIN      │
        │  apps/cs (Console)        → SUPPORT/SUPER_ADMIN only │
        └──────────────────────────────────────────────────────┘
```
