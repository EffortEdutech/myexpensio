# Sprint 16 — Bootstrap & Org Context Fix — Sign-off

**Date:** 2026-06-09
**Status:** ✅ SIGNED OFF
**Commit:** `2bff950`

---

## Problem

V2 mobile was completely role-blind. Users who belong to a TEAM or AGENT
workspace had their subscription tier resolved from their own USER row only —
missing the ORG-level subscription. The app had no concept of org role
(`OWNER`, `ADMIN`, `EMPLOYEE`, etc.) or workspace type (`TEAM`, `AGENT`).

This caused two visible bugs:
1. TEAM/AGENT members always showed as FREE tier even when their org had PRO.
2. All users could edit rates in Settings regardless of their org role.

---

## Root Cause (6 layers)

| Layer | Gap |
|---|---|
| Backend `/api/sync/bootstrap` | Never called `get_active_org()` RPC; org context absent from payload |
| `migrations.ts` | `profiles_cache` had no columns for `org_id`, `org_role`, `workspace_type`, `effective_tier` |
| `bootstrapEngine.ts` | Never read `org_context` from payload; never wrote it to SQLite |
| `useOrgContext()` | Did not exist — no hook for reading org context in UI |
| `useSubscription` | Read only USER-level `subscriptions_cache`; ignored ORG tier |
| `App.tsx` Settings | No role gate on rates inputs — all users could edit |

---

## Deliverables

### 1. Backend — `apps/user/app/api/sync/bootstrap/route.ts` ✅

Added `get_active_org()` RPC call after fetching subscription. If the user
belongs to an org, also queries `organizations.workspace_type` (not returned
by the RPC). Returns a new `org_context` key in the payload:

```ts
org_context: {
  org_id: string,
  org_role: string,          // e.g. "OWNER", "ADMIN", "EMPLOYEE"
  workspace_type: string | null, // "TEAM" | "AGENT" | "INTERNAL"
  effective_tier: string,    // org subscription tier, falls back to "FREE"
}
```

---

### 2. SQLite migration 14 — `src/local-db/migrations.ts` ✅

New migration `profiles_cache_org_context_sprint16` (id 14) adds four columns
to `profiles_cache`:

| Column | Type | Purpose |
|---|---|---|
| `org_id` | `TEXT` | FK to org the user belongs to |
| `org_role` | `TEXT` | User's role within that org |
| `workspace_type` | `TEXT` | TEAM / AGENT / INTERNAL |
| `effective_tier` | `TEXT` | Resolved subscription tier (ORG > USER > FREE) |

---

### 3. Bootstrap engine — `src/sync/bootstrapEngine.ts` ✅

After upserting the profile row, reads `payload.org_context` and runs a
follow-up `UPDATE profiles_cache SET org_id=?, org_role=?, ...` for users
with an active org. Solo users (no `org_id`) are left untouched — their tier
resolves through the normal `subscriptions_cache` path.

---

### 4. New hook — `src/features/auth/hooks/useOrgContext.ts` ✅

```ts
useOrgContext() → {
  orgId, orgRole, workspaceType, effectiveTier,
  canManageRates,    // true for OWNER/ADMIN; always true for solo user
  canApproveClaims,  // true for OWNER/ADMIN/MANAGER
  isLoading
}
```

Reads from `profiles_cache` via a `useQuery` (staleTime 60s). Solo users
(no org row) always get `canManageRates: true` since there is no admin
hierarchy.

---

### 5. Subscription tier fix — `src/features/subscription/hooks/useSubscription.ts` ✅

Added a second `useQuery` (`fetchEffectiveTier`) reading `effective_tier`
from `profiles_cache`. Tier resolution priority:

```
effectiveTierFromOrg  (ORG-resolved, Sprint 16 path)
  ?? userTierActive   (USER subscriptions_cache, legacy)
  ?? "FREE"
```

TEAM/AGENT members now correctly inherit their org's PRO/PREMIUM tier.

---

### 6. Rates gate — `App.tsx` ✅

Settings panel now calls `useOrgContext()`. For non-OWNER/ADMIN roles:
- Yellow locked banner: "🔒 Rates are managed by your team/organisation admin (your role: EMPLOYEE)"
- All `RateInputRow` and `SettingsTextField` set `editable={false}`
- `onChangeText` guards: `(v) => canManageRates && updateRates(...)`
- Save/Reset buttons hidden

`SettingsTextField` and `RateInputRow` components updated to accept an
optional `editable?: boolean` prop (default `true` for backward compat).

---

## QA Scenarios

| # | Scenario | Expected |
|---|---|---|
| O1 | Solo user (no org) logs in | `canManageRates = true`, rates editable, no banner |
| O2 | TEAM OWNER logs in | `canManageRates = true`, rates editable |
| O3 | TEAM EMPLOYEE logs in | Yellow banner shown, inputs read-only, save button hidden |
| O4 | AGENT FINANCE logs in | Yellow banner shown, inputs read-only |
| O5 | TEAM member (org has PRO) | `useSubscription().tier === "PRO"` even if user row is FREE |
| O6 | Fresh install (no bootstrap yet) | Defaults to FREE + solo behaviour — no crash |

---

## Files Changed

| File | Change |
|---|---|
| `apps/user/app/api/sync/bootstrap/route.ts` | Added org context query + payload key |
| `apps/user-mobile-v2/src/local-db/migrations.ts` | Migration 14 — 4 new columns on profiles_cache |
| `apps/user-mobile-v2/src/sync/bootstrapEngine.ts` | Read + write org_context fields |
| `apps/user-mobile-v2/src/features/auth/hooks/useOrgContext.ts` | New hook (created) |
| `apps/user-mobile-v2/src/features/subscription/hooks/useSubscription.ts` | Dual-query tier resolution |
| `apps/user-mobile-v2/App.tsx` | Rates gate + locked banner |
