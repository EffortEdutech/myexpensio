-- Verification query: returns rows only if legacy monetization DB objects still exist.

select
  case c.relkind
    when 'r' then 'table'
    when 'v' then 'view'
    when 'm' then 'materialized_view'
    else c.relkind::text
  end as object_type,
  format('%I.%I', n.nspname, c.relname) as object_name
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
order by 1, 2;
