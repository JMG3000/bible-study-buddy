do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'webmaster_supreme'
      and enumtypid = 'public.user_role'::regtype
  ) then
    alter type public.user_role add value 'webmaster_supreme';
  end if;
end
$$;

create schema if not exists private;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_profile_role()::text in ('admin', 'webmaster_supreme'),
    false
  )
$$;

create or replace function private.can_review_reports()
returns boolean
language sql
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role::text in ('admin', 'reviewer', 'webmaster_supreme')
  );
$$;

create or replace function private.sync_profile_role_from_lessons()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_user_id uuid;
begin
  if tg_op = 'DELETE' then
    target_user_id := old.author_id;
  else
    target_user_id := new.author_id;
  end if;

  if target_user_id is null then
    return null;
  end if;

  update public.profiles p
  set role = case
    when exists (
      select 1
      from public.lesson_plans lp
      where lp.author_id = target_user_id
    ) then 'creator'::public.user_role
    else 'user'::public.user_role
  end
  where p.user_id = target_user_id
    and p.role::text not in ('admin', 'reviewer', 'webmaster_supreme');

  return null;
end;
$$;
