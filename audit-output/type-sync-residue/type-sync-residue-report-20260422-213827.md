# Type Sync + Schema Residue Audit

Generated: 2026-04-22 21:38:48

Scanned files: 267
Residue files: 24
Runtime hit files: 14
Likely type files with hits: 1
Docs-only files with hits: 10

## Summary by term

| Term | Match Count |
|---|---:|
| agents | 57 |
| commission_plans | 51 |
| commission_ledger | 55 |
| referral_attributions | 57 |
| referral_visits | 51 |
| v_partner_commission_summary | 8 |
| commission_plan_id | 19 |

## Likely type files

- `apps\admin\lib\types.ts` (1 matches)

## Runtime hits

### `apps\admin\lib\types.ts`
- line 203 - term `agents` - `agents: {`

### `install-db-runtime-audit-fix.ps1`
- line 27 - term `agents` - `table = 'agents'`
- line 28 - term `agents` - `keywords = @('agents', 'agent_code', 'commission_plan_id', 'parent_agent_id')`
- line 28 - term `commission_plan_id` - `keywords = @('agents', 'agent_code', 'commission_plan_id', 'parent_agent_id')`
- line 31 - term `commission_plans` - `table = 'commission_plans'`
- line 32 - term `commission_plans` - `keywords = @('commission_plans', 'commission plan', 'commission_plan_id')`
- line 32 - term `commission_plan_id` - `keywords = @('commission_plans', 'commission plan', 'commission_plan_id')`
- line 35 - term `commission_ledger` - `table = 'commission_ledger'`
- line 36 - term `commission_ledger` - `keywords = @('commission_ledger', 'ledger_entry_type', 'commission_amount', 'payout_batch_id')`
- line 39 - term `referral_attributions` - `table = 'referral_attributions'`
- line 40 - term `referral_attributions` - `keywords = @('referral_attributions', 'attributed_agent_id', 'referred_user_id', 'referred_org_id')`
- line 43 - term `referral_visits` - `table = 'referral_visits'`
- line 44 - term `referral_visits` - `keywords = @('referral_visits', 'visit_source', 'utm_source', 'utm_medium', 'utm_campaign')`

### `scripts\db-object-dependency-audit.ps1`
- line 15 - term `agents` - `'agents',`
- line 16 - term `commission_plans` - `'commission_plans',`
- line 17 - term `commission_ledger` - `'commission_ledger',`
- line 18 - term `referral_attributions` - `'referral_attributions',`
- line 19 - term `referral_visits` - `'referral_visits'`

### `scripts\db-runtime-audit.ps1`
- line 17 - term `agents` - `table = 'agents'`
- line 18 - term `agents` - `keywords = @('agents', 'agent_code', 'commission_plan_id', 'parent_agent_id')`
- line 18 - term `commission_plan_id` - `keywords = @('agents', 'agent_code', 'commission_plan_id', 'parent_agent_id')`
- line 21 - term `commission_plans` - `table = 'commission_plans'`
- line 22 - term `commission_plans` - `keywords = @('commission_plans', 'commission plan', 'commission_plan_id')`
- line 22 - term `commission_plan_id` - `keywords = @('commission_plans', 'commission plan', 'commission_plan_id')`
- line 25 - term `commission_ledger` - `table = 'commission_ledger'`
- line 26 - term `commission_ledger` - `keywords = @('commission_ledger', 'ledger_entry_type', 'commission_amount', 'payout_batch_id')`
- line 29 - term `referral_attributions` - `table = 'referral_attributions'`
- line 30 - term `referral_attributions` - `keywords = @('referral_attributions', 'attributed_agent_id', 'referred_user_id', 'referred_org_id')`
- line 33 - term `referral_visits` - `table = 'referral_visits'`
- line 34 - term `referral_visits` - `keywords = @('referral_visits', 'visit_source', 'utm_source', 'utm_medium', 'utm_campaign')`

### `scripts\db-runtime-audit-fixed.ps1`
- line 16 - term `agents` - `table = 'agents'`
- line 17 - term `agents` - `keywords = @('agents', 'agent_code', 'commission_plan_id', 'parent_agent_id')`
- line 17 - term `commission_plan_id` - `keywords = @('agents', 'agent_code', 'commission_plan_id', 'parent_agent_id')`
- line 20 - term `commission_plans` - `table = 'commission_plans'`
- line 21 - term `commission_plans` - `keywords = @('commission_plans', 'commission plan', 'commission_plan_id')`
- line 21 - term `commission_plan_id` - `keywords = @('commission_plans', 'commission plan', 'commission_plan_id')`
- line 24 - term `commission_ledger` - `table = 'commission_ledger'`
- line 25 - term `commission_ledger` - `keywords = @('commission_ledger', 'ledger_entry_type', 'commission_amount', 'payout_batch_id')`
- line 28 - term `referral_attributions` - `table = 'referral_attributions'`
- line 29 - term `referral_attributions` - `keywords = @('referral_attributions', 'attributed_agent_id', 'referred_user_id', 'referred_org_id')`
- line 32 - term `referral_visits` - `table = 'referral_visits'`
- line 33 - term `referral_visits` - `keywords = @('referral_visits', 'visit_source', 'utm_source', 'utm_medium', 'utm_campaign')`

### `scripts\type-sync-schema-residue-audit.ps1`
- line 19 - term `agents` - `'agents',`
- line 20 - term `commission_plans` - `'commission_plans',`
- line 21 - term `commission_ledger` - `'commission_ledger',`
- line 22 - term `referral_attributions` - `'referral_attributions',`
- line 23 - term `referral_visits` - `'referral_visits',`
- line 24 - term `v_partner_commission_summary` - `'v_partner_commission_summary',`
- line 25 - term `commission_plan_id` - `'commission_plan_id'`

### `scripts\x type-sync-schema-residue-audit.ps1`
- line 19 - term `agents` - `'agents',`
- line 20 - term `commission_plans` - `'commission_plans',`
- line 21 - term `commission_ledger` - `'commission_ledger',`
- line 22 - term `referral_attributions` - `'referral_attributions',`
- line 23 - term `referral_visits` - `'referral_visits',`
- line 24 - term `v_partner_commission_summary` - `'v_partner_commission_summary',`
- line 25 - term `commission_plan_id` - `'commission_plan_id'`

### `supabase\migrations\20260423_legacy_monetization_db_cleanup.sql`
- line 7 - term `commission_plans` - `--   - organizations.commission_plan_id still references commission_plans`
- line 7 - term `commission_plan_id` - `--   - organizations.commission_plan_id still references commission_plans`
- line 17 - term `v_partner_commission_summary` - `drop view if exists public.v_partner_commission_summary;`
- line 21 - term `commission_plan_id` - `drop constraint if exists organizations_commission_plan_id_fkey;`
- line 24 - term `commission_plan_id` - `drop column if exists commission_plan_id;`
- line 27 - term `commission_ledger` - `alter table if exists public.commission_ledger`
- line 28 - term `commission_ledger` - `drop constraint if exists commission_ledger_referral_attribution_id_fkey;`
- line 30 - term `commission_ledger` - `alter table if exists public.commission_ledger`
- line 31 - term `commission_ledger` - `drop constraint if exists commission_ledger_agent_id_fkey;`
- line 33 - term `commission_ledger` - `alter table if exists public.commission_ledger`
- line 34 - term `commission_ledger` - `drop constraint if exists commission_ledger_commission_plan_id_fkey;`
- line 34 - term `commission_plan_id` - `drop constraint if exists commission_ledger_commission_plan_id_fkey;`
- line 36 - term `referral_attributions` - `alter table if exists public.referral_attributions`
- line 37 - term `referral_attributions` - `drop constraint if exists referral_attributions_agent_id_fkey;`
- line 39 - term `referral_attributions` - `alter table if exists public.referral_attributions`
- line 40 - term `referral_attributions` - `drop constraint if exists referral_attributions_commission_plan_id_fkey;`
- line 40 - term `commission_plan_id` - `drop constraint if exists referral_attributions_commission_plan_id_fkey;`
- line 42 - term `referral_attributions` - `alter table if exists public.referral_attributions`
- line 43 - term `referral_attributions` - `drop constraint if exists referral_attributions_first_visit_id_fkey;`
- line 45 - term `referral_attributions` - `alter table if exists public.referral_attributions`
- line 46 - term `referral_attributions` - `drop constraint if exists referral_attributions_last_visit_id_fkey;`
- line 48 - term `referral_visits` - `alter table if exists public.referral_visits`
- line 49 - term `referral_visits` - `drop constraint if exists referral_visits_agent_id_fkey;`
- line 51 - term `agents` - `alter table if exists public.agents`
- line 52 - term `agents` - `drop constraint if exists agents_parent_agent_id_fkey;`
- line 54 - term `agents` - `alter table if exists public.agents`
- line 55 - term `agents` - `drop constraint if exists agents_commission_plan_id_fkey;`
- line 55 - term `commission_plan_id` - `drop constraint if exists agents_commission_plan_id_fkey;`
- line 58 - term `commission_ledger` - `drop table if exists public.commission_ledger;`
- line 59 - term `referral_attributions` - `drop table if exists public.referral_attributions;`
- line 60 - term `referral_visits` - `drop table if exists public.referral_visits;`
- line 63 - term `agents` - `drop table if exists public.agents;`
- line 64 - term `commission_plans` - `drop table if exists public.commission_plans;`

### `supabase\migrations\db-object-dependency-audit.sql`
- line 7 - term `agents` - `--   agents`
- line 8 - term `commission_plans` - `--   commission_plans`
- line 9 - term `commission_ledger` - `--   commission_ledger`
- line 10 - term `referral_attributions` - `--   referral_attributions`
- line 11 - term `referral_visits` - `--   referral_visits`
- line 20 - term `agents` - `'agents',`
- line 21 - term `commission_plans` - `'commission_plans',`
- line 22 - term `commission_ledger` - `'commission_ledger',`
- line 23 - term `referral_attributions` - `'referral_attributions',`
- line 24 - term `referral_visits` - `'referral_visits'`
- line 47 - term `agents` - `'agents',`
- line 48 - term `commission_plans` - `'commission_plans',`
- line 49 - term `commission_ledger` - `'commission_ledger',`
- line 50 - term `referral_attributions` - `'referral_attributions',`
- line 51 - term `referral_visits` - `'referral_visits'`
- line 64 - term `agents` - `'agents',`
- line 65 - term `commission_plans` - `'commission_plans',`
- line 66 - term `commission_ledger` - `'commission_ledger',`
- line 67 - term `referral_attributions` - `'referral_attributions',`
- line 68 - term `referral_visits` - `'referral_visits'`
- line 83 - term `agents` - `'agents',`
- line 84 - term `commission_plans` - `'commission_plans',`
- line 85 - term `commission_ledger` - `'commission_ledger',`
- line 86 - term `referral_attributions` - `'referral_attributions',`
- line 87 - term `referral_visits` - `'referral_visits'`
- line 104 - term `agents` - `'agents',`
- line 105 - term `commission_plans` - `'commission_plans',`
- line 106 - term `commission_ledger` - `'commission_ledger',`
- line 107 - term `referral_attributions` - `'referral_attributions',`
- line 108 - term `referral_visits` - `'referral_visits'`
- line 121 - term `agents` - `'agents',`
- line 122 - term `commission_plans` - `'commission_plans',`
- line 123 - term `commission_ledger` - `'commission_ledger',`
- line 124 - term `referral_attributions` - `'referral_attributions',`
- line 125 - term `referral_visits` - `'referral_visits'`
- line 138 - term `agents` - `lower(pg_get_functiondef(p.oid)) like '%agents%'`
- line 139 - term `commission_plans` - `or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'`
- line 140 - term `commission_ledger` - `or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'`
- line 141 - term `referral_attributions` - `or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'`
- line 142 - term `referral_visits` - `or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'`
- line 156 - term `agents` - `--     lower(pg_get_functiondef(p.oid)) like '%agents%'`
- line 157 - term `commission_plans` - `--     or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'`
- line 158 - term `commission_ledger` - `--     or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'`
- line 159 - term `referral_attributions` - `--     or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'`
- line 160 - term `referral_visits` - `--     or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'`
- line 165 - term `agents` - `-- select 'agents' as table_name, count(*) from public.agents`
- line 167 - term `commission_plans` - `-- select 'commission_plans', count(*) from public.commission_plans`
- line 169 - term `commission_ledger` - `-- select 'commission_ledger', count(*) from public.commission_ledger`
- line 171 - term `referral_attributions` - `-- select 'referral_attributions', count(*) from public.referral_attributions`
- line 173 - term `referral_visits` - `-- select 'referral_visits', count(*) from public.referral_visits;`

### `supabase\migrations\db-object-dependency-audit-fixed.sql`
- line 11 - term `agents` - `'agents',`
- line 12 - term `commission_plans` - `'commission_plans',`
- line 13 - term `commission_ledger` - `'commission_ledger',`
- line 14 - term `referral_attributions` - `'referral_attributions',`
- line 15 - term `referral_visits` - `'referral_visits'`
- line 38 - term `agents` - `'agents',`
- line 39 - term `commission_plans` - `'commission_plans',`
- line 40 - term `commission_ledger` - `'commission_ledger',`
- line 41 - term `referral_attributions` - `'referral_attributions',`
- line 42 - term `referral_visits` - `'referral_visits'`
- line 55 - term `agents` - `'agents',`
- line 56 - term `commission_plans` - `'commission_plans',`
- line 57 - term `commission_ledger` - `'commission_ledger',`
- line 58 - term `referral_attributions` - `'referral_attributions',`
- line 59 - term `referral_visits` - `'referral_visits'`
- line 74 - term `agents` - `'agents',`
- line 75 - term `commission_plans` - `'commission_plans',`
- line 76 - term `commission_ledger` - `'commission_ledger',`
- line 77 - term `referral_attributions` - `'referral_attributions',`
- line 78 - term `referral_visits` - `'referral_visits'`
- line 104 - term `agents` - `'agents',`
- line 105 - term `commission_plans` - `'commission_plans',`
- line 106 - term `commission_ledger` - `'commission_ledger',`
- line 107 - term `referral_attributions` - `'referral_attributions',`
- line 108 - term `referral_visits` - `'referral_visits'`
- line 121 - term `agents` - `'agents',`
- line 122 - term `commission_plans` - `'commission_plans',`
- line 123 - term `commission_ledger` - `'commission_ledger',`
- line 124 - term `referral_attributions` - `'referral_attributions',`
- line 125 - term `referral_visits` - `'referral_visits'`
- line 138 - term `agents` - `lower(pg_get_functiondef(p.oid)) like '%agents%'`
- line 139 - term `commission_plans` - `or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'`
- line 140 - term `commission_ledger` - `or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'`
- line 141 - term `referral_attributions` - `or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'`
- line 142 - term `referral_visits` - `or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'`

### `supabase\migrations\db-object-dependency-audit-minimal.sql`
- line 14 - term `agents` - `'agents',`
- line 15 - term `commission_plans` - `'commission_plans',`
- line 16 - term `commission_ledger` - `'commission_ledger',`
- line 17 - term `referral_attributions` - `'referral_attributions',`
- line 18 - term `referral_visits` - `'referral_visits'`
- line 38 - term `agents` - `'agents',`
- line 39 - term `commission_plans` - `'commission_plans',`
- line 40 - term `commission_ledger` - `'commission_ledger',`
- line 41 - term `referral_attributions` - `'referral_attributions',`
- line 42 - term `referral_visits` - `'referral_visits'`
- line 65 - term `agents` - `'agents',`
- line 66 - term `commission_plans` - `'commission_plans',`
- line 67 - term `commission_ledger` - `'commission_ledger',`
- line 68 - term `referral_attributions` - `'referral_attributions',`
- line 69 - term `referral_visits` - `'referral_visits'`
- line 85 - term `agents` - `'agents',`
- line 86 - term `commission_plans` - `'commission_plans',`
- line 87 - term `commission_ledger` - `'commission_ledger',`
- line 88 - term `referral_attributions` - `'referral_attributions',`
- line 89 - term `referral_visits` - `'referral_visits'`
- line 114 - term `agents` - `'agents',`
- line 115 - term `commission_plans` - `'commission_plans',`
- line 116 - term `commission_ledger` - `'commission_ledger',`
- line 117 - term `referral_attributions` - `'referral_attributions',`
- line 118 - term `referral_visits` - `'referral_visits'`
- line 134 - term `agents` - `'agents',`
- line 135 - term `commission_plans` - `'commission_plans',`
- line 136 - term `commission_ledger` - `'commission_ledger',`
- line 137 - term `referral_attributions` - `'referral_attributions',`
- line 138 - term `referral_visits` - `'referral_visits'`
- line 151 - term `agents` - `lower(pg_get_functiondef(p.oid)) like '%agents%'`
- line 152 - term `commission_plans` - `or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'`
- line 153 - term `commission_ledger` - `or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'`
- line 154 - term `referral_attributions` - `or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'`
- line 155 - term `referral_visits` - `or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'`

### `type-sync-schema-residue-audit-fixed.ps1`
- line 19 - term `agents` - `'agents',`
- line 20 - term `commission_plans` - `'commission_plans',`
- line 21 - term `commission_ledger` - `'commission_ledger',`
- line 22 - term `referral_attributions` - `'referral_attributions',`
- line 23 - term `referral_visits` - `'referral_visits',`
- line 24 - term `v_partner_commission_summary` - `'v_partner_commission_summary',`
- line 25 - term `commission_plan_id` - `'commission_plan_id'`

### `type-sync-schema-residue-audit-fixed-v2.ps1`
- line 19 - term `agents` - `'agents',`
- line 20 - term `commission_plans` - `'commission_plans',`
- line 21 - term `commission_ledger` - `'commission_ledger',`
- line 22 - term `referral_attributions` - `'referral_attributions',`
- line 23 - term `referral_visits` - `'referral_visits',`
- line 24 - term `v_partner_commission_summary` - `'v_partner_commission_summary',`
- line 25 - term `commission_plan_id` - `'commission_plan_id'`

### `type-sync-schema-residue-audit-fixed-v3.ps1`
- line 19 - term `agents` - `'agents',`
- line 20 - term `commission_plans` - `'commission_plans',`
- line 21 - term `commission_ledger` - `'commission_ledger',`
- line 22 - term `referral_attributions` - `'referral_attributions',`
- line 23 - term `referral_visits` - `'referral_visits',`
- line 24 - term `v_partner_commission_summary` - `'v_partner_commission_summary',`
- line 25 - term `commission_plan_id` - `'commission_plan_id'`

## Docs-only hits

- `docs\db-audit\CANDIDATE_DROP_ORDER_TEMPLATE.md` (13 matches)
- `docs\db-audit\DB_OBJECT_AUDIT_REPORT_TEMPLATE.md` (5 matches)
- `docs\db-audit\DB_OBJECT_DEPENDENCY_CHECKLIST.md` (5 matches)
- `docs\db-audit\DB_RUNTIME_AUDIT_CHECKLIST.md` (5 matches)
- `docs\db-audit\INITIAL_FINDINGS.md` (10 matches)
- `docs\db-audit\LEGACY_TABLE_CANDIDATES_REPORT_TEMPLATE.md` (10 matches)
- `docs\db-audit\MIGRATION_DRAFT_LEGACY_MONETIZATION.md` (1 matches)
- `docs\db-audit\RESIDUE_SEARCH_TERMS.md` (7 matches)
- `docs\db-audit\TYPE_SYNC_MANUAL_REPLACEMENT_GUIDE.md` (7 matches)
- `docs\refactor\DB_ALIGNMENT_LOCK.md` (5 matches)
