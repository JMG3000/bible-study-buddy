do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'reviewer'
      and enumtypid = 'public.user_role'::regtype
  ) then
    alter type public.user_role add value 'reviewer';
  end if;
end
$$;

create schema if not exists private;

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
      and p.role in ('admin'::public.user_role, 'reviewer'::public.user_role)
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
    and p.role not in ('admin'::public.user_role, 'reviewer'::public.user_role);

  return null;
end;
$$;

alter table public.reports
  add column if not exists assigned_reviewer_id uuid references public.profiles(user_id) on delete set null,
  add column if not exists resolution_note text,
  add column if not exists archived_at timestamptz,
  add column if not exists reporter_handle_snapshot text,
  add column if not exists creator_handle_snapshot text,
  add column if not exists reviewer_handle_snapshot text;

create index if not exists reports_assigned_reviewer_status_idx
  on public.reports (assigned_reviewer_id, status, created_at desc);

create table if not exists public.report_review_threads (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  creator_id uuid not null references public.profiles(user_id) on delete cascade,
  reviewer_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.report_review_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.report_review_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists report_review_threads_creator_idx
  on public.report_review_threads (creator_id, updated_at desc);

create index if not exists report_review_threads_reviewer_idx
  on public.report_review_threads (reviewer_id, updated_at desc);

create index if not exists report_review_messages_thread_idx
  on public.report_review_messages (thread_id, created_at asc);

alter table public.report_review_threads enable row level security;
alter table public.report_review_messages enable row level security;

drop trigger if exists report_review_threads_set_updated_at on public.report_review_threads;
create trigger report_review_threads_set_updated_at
before update on public.report_review_threads
for each row execute function public.set_updated_at();

create or replace function public.touch_report_review_thread()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  update public.report_review_threads
  set updated_at = timezone('utc', now())
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists report_review_messages_touch_thread on public.report_review_messages;
create trigger report_review_messages_touch_thread
after insert on public.report_review_messages
for each row execute function public.touch_report_review_thread();

drop policy if exists "reports_select_reporter_or_admin" on public.reports;
create policy "reports_select_participants_or_reviewers"
on public.reports
for select
to authenticated
using (
  auth.uid() = reporter_id
  or (select private.can_review_reports())
  or exists (
    select 1
    from public.report_review_threads rrt
    where rrt.report_id = reports.id
      and rrt.creator_id = auth.uid()
  )
);

drop policy if exists "reports_update_admin_only" on public.reports;
create policy "reports_update_reviewer_or_admin"
on public.reports
for update
to authenticated
using ((select private.can_review_reports()))
with check ((select private.can_review_reports()));

drop policy if exists "report_review_threads_select_participants" on public.report_review_threads;
create policy "report_review_threads_select_participants"
on public.report_review_threads
for select
to authenticated
using (
  creator_id = auth.uid()
  or public.is_admin()
  or ((select private.can_review_reports()) and reviewer_id = auth.uid())
);

drop policy if exists "report_review_threads_insert_reviewer_or_admin" on public.report_review_threads;
create policy "report_review_threads_insert_reviewer_or_admin"
on public.report_review_threads
for insert
to authenticated
with check (
  public.is_admin()
  or (
    (select private.can_review_reports())
    and reviewer_id = auth.uid()
  )
);

drop policy if exists "report_review_threads_update_reviewer_or_admin" on public.report_review_threads;
create policy "report_review_threads_update_reviewer_or_admin"
on public.report_review_threads
for update
to authenticated
using (
  public.is_admin()
  or (
    (select private.can_review_reports())
    and reviewer_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or (
    (select private.can_review_reports())
    and reviewer_id = auth.uid()
  )
);

drop policy if exists "report_review_threads_delete_reviewer_or_admin" on public.report_review_threads;
create policy "report_review_threads_delete_reviewer_or_admin"
on public.report_review_threads
for delete
to authenticated
using (
  public.is_admin()
  or (
    (select private.can_review_reports())
    and reviewer_id = auth.uid()
  )
);

drop policy if exists "report_review_messages_select_thread_participants" on public.report_review_messages;
create policy "report_review_messages_select_thread_participants"
on public.report_review_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.report_review_threads rrt
    where rrt.id = report_review_messages.thread_id
      and (
        rrt.creator_id = auth.uid()
        or public.is_admin()
        or (
          (select private.can_review_reports())
          and rrt.reviewer_id = auth.uid()
        )
      )
  )
);

drop policy if exists "report_review_messages_insert_thread_participants" on public.report_review_messages;
create policy "report_review_messages_insert_thread_participants"
on public.report_review_messages
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.report_review_threads rrt
    where rrt.id = report_review_messages.thread_id
      and (
        rrt.creator_id = auth.uid()
        or public.is_admin()
        or (
          (select private.can_review_reports())
          and rrt.reviewer_id = auth.uid()
        )
      )
  )
);
