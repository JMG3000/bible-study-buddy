do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'user'
      and enumtypid = 'public.user_role'::regtype
  ) then
    alter type public.user_role add value 'user';
  end if;
end
$$;

alter table public.profiles
alter column role set default 'user';

update public.profiles p
set role = case
  when p.role = 'admin' then 'admin'::public.user_role
  when exists (
    select 1
    from public.lesson_plans lp
    where lp.author_id = p.user_id
  ) then 'creator'::public.user_role
  else 'user'::public.user_role
end;

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
with check (
  public.is_admin()
  or (auth.uid() = user_id and role = 'user')
);

create schema if not exists private;

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
    and p.role <> 'admin';

  return null;
end;
$$;

drop trigger if exists lesson_plans_sync_profile_role_after_insert on public.lesson_plans;
create trigger lesson_plans_sync_profile_role_after_insert
after insert on public.lesson_plans
for each row execute function private.sync_profile_role_from_lessons();

drop trigger if exists lesson_plans_sync_profile_role_after_delete on public.lesson_plans;
create trigger lesson_plans_sync_profile_role_after_delete
after delete on public.lesson_plans
for each row execute function private.sync_profile_role_from_lessons();
