-- 20260423_legacy_monetization_db_cleanup.sql
-- Migration-only cleanup for legacy monetization / referral objects.
-- Safe assumptions based on completed DB object audit:
--   - no policy dependencies
--   - no function/RPC dependencies from the audit scope
--   - dependent view exists
--   - organizations.commission_plan_id still references commission_plans
--
-- Notes:
--   - intentionally does NOT drop billing_touch_updated_at()
--   - avoids CASCADE on table drops
--   - uses IF EXISTS for re-runnable safety where possible

begin;

-- 1) Drop dependent view first
drop view if exists public.v_partner_commission_summary;

-- 2) Remove external org dependency
alter table if exists public.organizations
  drop constraint if exists organizations_commission_plan_id_fkey;

alter table if exists public.organizations
  drop column if exists commission_plan_id;

-- 3) Remove internal FK chain explicitly
alter table if exists public.commission_ledger
  drop constraint if exists commission_ledger_referral_attribution_id_fkey;

alter table if exists public.commission_ledger
  drop constraint if exists commission_ledger_agent_id_fkey;

alter table if exists public.commission_ledger
  drop constraint if exists commission_ledger_commission_plan_id_fkey;

alter table if exists public.referral_attributions
  drop constraint if exists referral_attributions_agent_id_fkey;

alter table if exists public.referral_attributions
  drop constraint if exists referral_attributions_commission_plan_id_fkey;

alter table if exists public.referral_attributions
  drop constraint if exists referral_attributions_first_visit_id_fkey;

alter table if exists public.referral_attributions
  drop constraint if exists referral_attributions_last_visit_id_fkey;

alter table if exists public.referral_visits
  drop constraint if exists referral_visits_agent_id_fkey;

alter table if exists public.agents
  drop constraint if exists agents_parent_agent_id_fkey;

alter table if exists public.agents
  drop constraint if exists agents_commission_plan_id_fkey;

-- 4) Drop child/leaf tables first
drop table if exists public.commission_ledger;
drop table if exists public.referral_attributions;
drop table if exists public.referral_visits;

-- 5) Drop parent tables last
drop table if exists public.agents;
drop table if exists public.commission_plans;

commit;
