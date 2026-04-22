# Type Sync Manual Replacement Guide

Use this after running the residue audit.

## 1. Find the committed DB type files

Common candidates:
- `apps/admin/lib/types.ts`
- `apps/user/lib/types.ts`
- `packages/**/types.ts`
- `packages/**/database.ts`

The audit script flags likely candidates automatically.

## 2. Regenerate types

Typical Supabase CLI patterns:

### Linked project
```bash
supabase gen types typescript --linked --schema public
```

### Local project
```bash
supabase gen types typescript --local --schema public
```

Examples:
```bash
supabase gen types typescript --linked --schema public > apps/admin/lib/types.ts
supabase gen types typescript --linked --schema public > apps/user/lib/types.ts
```

If both apps import the same shared file, regenerate that shared file instead.

## 3. What must disappear from generated types

Tables:
- `agents`
- `commission_plans`
- `commission_ledger`
- `referral_attributions`
- `referral_visits`

Views:
- `v_partner_commission_summary`

Columns:
- `organizations.commission_plan_id`

## 4. Re-run residue audit

Success state:
- no runtime code hits for removed schema objects
- no committed DB type hits for removed schema objects
- only docs/history may still contain those names

## 5. Then run
```powershell
pnpm validate
```
