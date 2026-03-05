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

  -- If you already have an org with this name, reuse it
  select o.id into v_org_id
  from public.organizations o
  join public.org_members m on m.org_id = o.id
  where o.name = p_name
    and m.user_id = auth.uid()
    and m.status = 'ACTIVE'
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  v_email := auth.jwt() ->> 'email';

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