# MyExpensio Refactor Lock

Status: **LOCKED BASELINE (post-green build / post-green Vercel)**

This document freezes the current accepted architecture after the refactor and cleanup work.

## 1. Locked product surface

### User app is in scope
The user app remains the primary production app for:
- authentication
- setup / invite acceptance
- claims
- claim items
- trips
- odometer flow
- Touch ’n Go parsing / linking
- exports
- settings
- usage checks

### Admin app is in scope
The admin app remains in scope for:
- dashboard
- claims oversight
- audit views
- exports oversight
- members / invitations
- org management
- rates
- templates
- platform settings

## 2. Explicitly locked out from admin runtime surface

These legacy admin monetization areas are **not part of the locked baseline**:
- admin billing pages
- admin billing APIs
- admin billing webhooks
- admin referral pages
- admin referral APIs
- admin billing/referral helper libraries
- old partner monetization surfaces tied to that stack

If a future PR wants to bring any of these back, it must:
1. have a fresh functional design
2. have a fresh data model review
3. have a new route/API approval
4. not reuse half-removed legacy files blindly

## 3. Repo structure assumptions now locked

Required:
- root `pnpm-workspace.yaml`
- `packages/domain`
- `apps/user`
- `apps/admin`
- `apps/user/proxy.ts`
- `apps/admin/proxy.ts`

Not expected anymore:
- nested `pnpm-workspace.yaml` inside apps
- app-level `middleware.ts` for Next 16 route proxy migration
- admin billing/referral source trees that were deleted during cleanup

## 4. Rules for future PRs

### Allowed
- improve existing locked pages
- improve validation
- improve shared domain typing
- improve rates/templates/claims/audit/export features already in scope
- documentation updates that match reality

### Not allowed without a fresh design pass
- reintroducing legacy admin billing
- reintroducing legacy admin referrals
- adding hidden workspace-level package manifests
- bypassing `packages/domain` with duplicated app-local domain types
- schema drops mixed together with unrelated UI cleanup

## 5. Validation rule

Before merge, the minimum check remains:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\refactor-lock-audit.ps1
pnpm validate
```

If both pass, the repo is considered aligned to the lock baseline.

## 6. Why this lock exists

This lock exists because the project already passed through:
- missing module errors
- Next route typing errors
- proxy/middleware migration issues
- workspace package resolution issues
- stale legacy admin monetization imports
- build-break loops caused by partially deleted code

The goal now is stability first, then deliberate feature evolution.
