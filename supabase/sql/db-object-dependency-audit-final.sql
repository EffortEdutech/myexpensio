-- DB object dependency audit (final, safe version)
-- Goal: inspect whether any remaining DB objects still reference the legacy monetization objects.

-- -----------------------------------------------------------------------------
-- BLOCK 1: target objects still present?
-- -----------------------------------------------------------------------------
select
  case c.relkind
    when 'r' then 'table'
    when 'v' then 'view'
    when 'm' then 'materialized_view'
    else c.relkind::text
  end as object_type,
  n.nspname as schema_name,
  c.relname as object_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'agents',
    'commission_plans',
    'commission_ledger',
    'referral_attributions',
    'referral_visits',
    'v_partner_commission_summary'
  )
order by 1, 2, 3;

-- -----------------------------------------------------------------------------
-- BLOCK 2: view definitions containing legacy names
-- -----------------------------------------------------------------------------
select
  schemaname,
  viewname,
  definition
from pg_views
where lower(definition) like '%agents%'
   or lower(definition) like '%commission_plans%'
   or lower(definition) like '%commission_ledger%'
   or lower(definition) like '%referral_attributions%'
   or lower(definition) like '%referral_visits%'
   or lower(definition) like '%v_partner_commission_summary%'
order by schemaname, viewname;

-- -----------------------------------------------------------------------------
-- BLOCK 3: function bodies containing legacy names
-- -----------------------------------------------------------------------------
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where lower(pg_get_functiondef(p.oid)) like '%agents%'
   or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'
   or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'
   or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'
   or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'
   or lower(pg_get_functiondef(p.oid)) like '%v_partner_commission_summary%'
order by 1, 2, 3;

-- -----------------------------------------------------------------------------
-- BLOCK 4: row level security policies containing legacy names
-- -----------------------------------------------------------------------------
select
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
from pg_policies
where lower(coalesce(qual, '')) like '%agents%'
   or lower(coalesce(qual, '')) like '%commission_plans%'
   or lower(coalesce(qual, '')) like '%commission_ledger%'
   or lower(coalesce(qual, '')) like '%referral_attributions%'
   or lower(coalesce(with_check, '')) like '%agents%'
   or lower(coalesce(with_check, '')) like '%commission_plans%'
   or lower(coalesce(with_check, '')) like '%commission_ledger%'
   or lower(coalesce(with_check, '')) like '%referral_attributions%'
   or lower(coalesce(with_check, '')) like '%referral_visits%'
   or lower(coalesce(qual, '')) like '%referral_visits%'
order by schemaname, tablename, policyname;

-- -----------------------------------------------------------------------------
-- BLOCK 5: trigger functions containing legacy names
-- -----------------------------------------------------------------------------
select distinct
  tn.nspname as trigger_schema,
  tc.relname as table_name,
  t.tgname as trigger_name,
  pn.nspname as function_schema,
  p.proname as function_name
from pg_trigger t
join pg_class tc on tc.oid = t.tgrelid
join pg_namespace tn on tn.oid = tc.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pn on pn.oid = p.pronamespace
where not t.tgisinternal
  and (
    lower(pg_get_functiondef(p.oid)) like '%agents%'
    or lower(pg_get_functiondef(p.oid)) like '%commission_plans%'
    or lower(pg_get_functiondef(p.oid)) like '%commission_ledger%'
    or lower(pg_get_functiondef(p.oid)) like '%referral_attributions%'
    or lower(pg_get_functiondef(p.oid)) like '%referral_visits%'
    or lower(pg_get_functiondef(p.oid)) like '%v_partner_commission_summary%'
  )
order by 1, 2, 3, 4, 5;
