-- Create org
with org as (
  insert into public.organizations (name)
  values ('MyExpensio Dev Org')
  returning id
),
me as (
  select id, email from public.profiles
  where lower(email) = lower('myeffort.edutech@gmail.com')
)
insert into public.org_members (org_id, user_id, org_role)
select org.id, me.id, 'OWNER'
from org, me
on conflict do nothing;