# Post-deletion fix pack

The deletion PR worked, but 4 survivors still referenced the deleted helper
`@/lib/billing/http`.

This pack fixes that by:
- restoring the tiny generic HTTP helper as `apps/admin/lib/http.ts`
- repointing `audit` and `orgs` to `@/lib/http`
- deleting the now-orphaned `apps/admin/app/api/admin/partners` API

## Apply

1. Copy these files into repo root.
2. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fix-post-deletion-imports.ps1
pnpm validate
```

## Recommended commit message
`fix: restore shared admin http helper after billing deletion`
