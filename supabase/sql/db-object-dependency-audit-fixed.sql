-- DB OBJECT DEPENDENCY AUDIT (FIXED)
-- Use this version if the earlier policy query fails in Supabase SQL Editor.

-- 1) Confirm table existence
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by table_name;

-- 2) Foreign keys referencing candidate tables
select
  tc.table_schema as source_schema,
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_schema as target_schema,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and ccu.table_schema = 'public'
  and ccu.table_name in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by target_table, source_table, source_column;

-- 3) Views depending on candidate tables
select
  view_schema,
  view_name,
  table_schema,
  table_name
from information_schema.view_table_usage
where table_schema = 'public'
  and table_name in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by table_name, view_schema, view_name;

-- 4) Triggers on candidate tables
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by event_object_table, trigger_name;

-- 5) Policies on candidate tables
-- Fixed version: query pg_policy directly instead of pg_policies view.
select
  n.nspname as schema_name,
  c.relname as table_name,
  p.polname as policy_name,
  case p.polcmd
    when 'r' then 'SELECT'
    when 'a' then 'INSERT'
    when 'w' then 'UPDATE'
    when 'd' then 'DELETE'
    when '*' then 'ALL'
    else p.polcmd::text
  end as command,
  p.polpermissive as permissive,
  pg_get_expr(p.polqual, p.polrelid) as using_expression,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expression
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by table_name, policy_name;

-- 6) Indexes on candidate tables
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by tablename, indexname;

-- 7) Functions / routines that mention candidate tables
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.oid::regprocedure as signature
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname not in ('pg_catalog', 'information_schema')
  and (
    lower(pg_get_functiondef(p.oid)) like '%agents%'
    or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'
    or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'
    or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'
    or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'
  )
order by schema_name, function_name;
