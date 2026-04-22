-- MINIMAL DB OBJECT DEPENDENCY AUDIT
-- Run each block separately in Supabase SQL Editor.

-- BLOCK 1: candidate tables exist?
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relkind as relkind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by c.relname;

-- BLOCK 2: foreign keys that reference those tables
select
  src_ns.nspname as source_schema,
  src.relname as source_table,
  con.conname as constraint_name,
  tgt_ns.nspname as target_schema,
  tgt.relname as target_table,
  pg_get_constraintdef(con.oid) as constraint_def
from pg_constraint con
join pg_class src on src.oid = con.conrelid
join pg_namespace src_ns on src_ns.oid = src.relnamespace
join pg_class tgt on tgt.oid = con.confrelid
join pg_namespace tgt_ns on tgt_ns.oid = tgt.relnamespace
where con.contype = 'f'
  and tgt_ns.nspname = 'public'
  and tgt.relname in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by tgt.relname, src.relname, con.conname;

-- BLOCK 3: views or materialized views depending on those tables
select distinct
  view_ns.nspname as dependent_schema,
  view_cls.relname as dependent_object,
  case view_cls.relkind
    when 'v' then 'VIEW'
    when 'm' then 'MATERIALIZED VIEW'
    else view_cls.relkind::text
  end as object_type,
  base_ns.nspname as base_schema,
  base_cls.relname as base_table
from pg_depend dep
join pg_rewrite rw on rw.oid = dep.objid
join pg_class view_cls on view_cls.oid = rw.ev_class
join pg_namespace view_ns on view_ns.oid = view_cls.relnamespace
join pg_class base_cls on base_cls.oid = dep.refobjid
join pg_namespace base_ns on base_ns.oid = base_cls.relnamespace
where base_ns.nspname = 'public'
  and base_cls.relname in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by base_table, dependent_schema, dependent_object;

-- BLOCK 4: triggers on candidate tables
select
  ns.nspname as schema_name,
  cls.relname as table_name,
  trg.tgname as trigger_name,
  pg_get_triggerdef(trg.oid, true) as trigger_def
from pg_trigger trg
join pg_class cls on cls.oid = trg.tgrelid
join pg_namespace ns on ns.oid = cls.relnamespace
where ns.nspname = 'public'
  and not trg.tgisinternal
  and cls.relname in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by table_name, trigger_name;

-- BLOCK 5: RLS policies on candidate tables
select
  ns.nspname as schema_name,
  cls.relname as table_name,
  pol.polname as policy_name,
  case pol.polcmd
    when 'r' then 'SELECT'
    when 'a' then 'INSERT'
    when 'w' then 'UPDATE'
    when 'd' then 'DELETE'
    when '*' then 'ALL'
    else pol.polcmd::text
  end as command,
  pol.polpermissive as permissive,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
from pg_policy pol
join pg_class cls on cls.oid = pol.polrelid
join pg_namespace ns on ns.oid = cls.relnamespace
where ns.nspname = 'public'
  and cls.relname in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by table_name, policy_name;

-- BLOCK 6: indexes on candidate tables
select
  ns.nspname as schema_name,
  tbl.relname as table_name,
  idx.relname as index_name,
  pg_get_indexdef(i.indexrelid) as index_def
from pg_index i
join pg_class tbl on tbl.oid = i.indrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
join pg_class idx on idx.oid = i.indexrelid
where ns.nspname = 'public'
  and tbl.relname in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits'
  )
order by table_name, index_name;

-- BLOCK 7: functions mentioning the candidate table names
select
  ns.nspname as schema_name,
  p.proname as function_name,
  p.oid::regprocedure as signature
from pg_proc p
join pg_namespace ns on ns.oid = p.pronamespace
where ns.nspname not in ('pg_catalog', 'information_schema')
  and (
    lower(pg_get_functiondef(p.oid)) like '%agents%'
    or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'
    or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'
    or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'
    or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'
  )
order by schema_name, function_name;
