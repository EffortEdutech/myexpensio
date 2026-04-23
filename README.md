# myexpensio

MyExpensio is a monorepo for the mileage, trip, Touch 'n Go, export, and claim workflow platform.

## Current release lock

This repository is now locked to the post-refactor baseline:

- user app and admin app both build successfully
- legacy admin monetization runtime surface has been removed
- legacy referral and commission DB runtime references are clean
- runtime DB audit is now scoped to runtime code only
- release validation is expected to pass through `pnpm validate:full`

## Apps

### apps/user
End-user app for:
- trips
- claims
- Touch 'n Go import/linking
- exports
- settings and rates usage

### apps/admin
Internal admin app for:
- dashboard and org oversight
- claims oversight
- members and invitations
- export jobs and templates
- audit views
- platform settings and rates administration

## Shared packages

Use the shared packages folder for cross-app config, domain helpers, and reusable business rules.

## Local development

### Start user app
```powershell
pnpm -C apps/user dev
```

### Start admin app
```powershell
pnpm -C apps/admin dev
```

## Validation commands

### Standard build validation
```powershell
pnpm validate
```

### Runtime DB audit
```powershell
pnpm audit:db-runtime
pnpm audit:db-runtime:strict
```

### Full release validation
```powershell
pnpm validate:full
```

## Release guardrails

The release lock expects all of the following to remain true:

- `scripts/db-runtime-audit.ps1` exists and passes in strict mode
- legacy admin billing/referral route groups do not return to runtime
- `audit-output/` stays untracked
- root validation commands remain available for repeatable checks

## Deployment

Both apps are deployed separately, but validated from the monorepo root.

Recommended release order:
1. run `pnpm validate:full`
2. confirm Vercel green for user app
3. confirm Vercel green for admin app
4. tag the release baseline

## Suggested tag

```text
release/refactor-lock-v1
```
