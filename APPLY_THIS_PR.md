# Next PR Pack — proxy rename + dead-file inventory

This pack is intentionally limited to two safe goals:

1. align both apps with the Next 16 `proxy.ts` convention
2. produce an inventory report for refactor debris before any deletions

## Files in this pack
- `apps/admin/proxy.ts`
- `apps/user/proxy.ts`
- `scripts/inventory-refactor-debris.ps1`

## Manual actions
After copying the files into repo root, run:

```powershell
Remove-Item .\apps\admin\middleware.ts
Remove-Item .\apps\user\middleware.ts
powershell -ExecutionPolicy Bypass -File .\scripts\inventory-refactor-debris.ps1
pnpm validate
```

## Expected result
- Next 16 middleware deprecation warning should be removed
- `.\reports\proxy-middleware-files.txt` will show remaining proxy/middleware files
- `.\reports\admin-refactor-candidates.txt` will list billing/referral/subscription candidates for the later deletion PR

## Recommended commit message
`chore: migrate middleware to proxy and inventory refactor debris`

## Not included on purpose
- no route deletions yet
- no billing deletions yet
- no database changes
