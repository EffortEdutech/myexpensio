# DB Object Audit Report

- Generated at: 2026-04-22 14:54:45
- Repo root: C:\Users\user\Documents\00 Reimbursement Assistant\myexpensio
- Scanned files: 50

| Table | Hits | Type Residue | SQL/Schema Hits |
|---|---:|---:|---:|
| agents | 11 | 1 | 10 |
| commission_plans | 10 | 0 | 10 |
| commission_ledger | 10 | 0 | 10 |
| referral_attributions | 10 | 0 | 10 |
| referral_visits | 10 | 0 | 10 |

## agents

- [type_residue] apps/admin/lib/types.ts:203 -> agents: {
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:7 -> --   agents
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:20 -> 'agents',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:47 -> 'agents',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:64 -> 'agents',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:83 -> 'agents',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:104 -> 'agents',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:121 -> 'agents',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:138 -> lower(pg_get_functiondef(p.oid)) like '%agents%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:156 -> --     lower(pg_get_functiondef(p.oid)) like '%agents%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:165 -> -- select 'agents' as table_name, count(*) from public.agents

## commission_plans

- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:8 -> --   commission_plans
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:21 -> 'commission_plans',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:48 -> 'commission_plans',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:65 -> 'commission_plans',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:84 -> 'commission_plans',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:105 -> 'commission_plans',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:122 -> 'commission_plans',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:139 -> or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:157 -> --     or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:167 -> -- select 'commission_plans', count(*) from public.commission_plans

## commission_ledger

- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:9 -> --   commission_ledger
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:22 -> 'commission_ledger',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:49 -> 'commission_ledger',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:66 -> 'commission_ledger',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:85 -> 'commission_ledger',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:106 -> 'commission_ledger',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:123 -> 'commission_ledger',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:140 -> or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:158 -> --     or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:169 -> -- select 'commission_ledger', count(*) from public.commission_ledger

## referral_attributions

- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:10 -> --   referral_attributions
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:23 -> 'referral_attributions',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:50 -> 'referral_attributions',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:67 -> 'referral_attributions',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:86 -> 'referral_attributions',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:107 -> 'referral_attributions',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:124 -> 'referral_attributions',
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:141 -> or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:159 -> --     or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:171 -> -- select 'referral_attributions', count(*) from public.referral_attributions

## referral_visits

- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:11 -> --   referral_visits
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:24 -> 'referral_visits'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:51 -> 'referral_visits'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:68 -> 'referral_visits'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:87 -> 'referral_visits'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:108 -> 'referral_visits'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:125 -> 'referral_visits'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:142 -> or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:160 -> --     or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'
- [sql_or_schema] supabase/migrations/db-object-dependency-audit.sql:173 -> -- select 'referral_visits', count(*) from public.referral_visits;

## Reviewer note
Repo-side results are only part of the audit.
Use sql/db-object-dependency-audit.sql to confirm live database dependencies.
