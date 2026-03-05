begin;

-- Creates an org and adds the current user as OWNER.
-- Safe for local dev + repeatable after db reset.

create or replace function public.bootstrap_create_org(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_email := auth.jwt() ->> 'email';

  -- ensure profile exists (in case trigger didn’t run for some reason)
  insert into public.profiles (id, email, created_at)
  values (auth.uid(), v_email, now())
  on conflict (id) do update set email = excluded.email;

  insert into public.organizations (name)
  values (p_name)
  returning id into v_org_id;

  insert into public.org_members (org_id, user_id, org_role, status)
  values (v_org_id, auth.uid(), 'OWNER', 'ACTIVE')
  on conflict do nothing;

  return v_org_id;
end;
$$;

grant execute on function public.bootstrap_create_org(text) to authenticated;

commit;