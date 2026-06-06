create table if not exists public.printed_lesson_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  lesson_plan_id uuid references public.lesson_plans(id) on delete set null,
  lesson_slug_snapshot text,
  lesson_title_snapshot text not null,
  print_title text not null,
  print_summary text not null default '',
  print_payload jsonb not null default '{}'::jsonb,
  layout_template_id uuid references public.layout_templates(id) on delete set null,
  layout_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists printed_lesson_logs_user_updated_idx
  on public.printed_lesson_logs (user_id, updated_at desc);

create index if not exists printed_lesson_logs_lesson_plan_idx
  on public.printed_lesson_logs (lesson_plan_id, updated_at desc);

alter table public.printed_lesson_logs enable row level security;

drop trigger if exists printed_lesson_logs_set_updated_at on public.printed_lesson_logs;
create trigger printed_lesson_logs_set_updated_at
before update on public.printed_lesson_logs
for each row execute function public.set_updated_at();

drop policy if exists "printed_lesson_logs_select_own" on public.printed_lesson_logs;
create policy "printed_lesson_logs_select_own"
on public.printed_lesson_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "printed_lesson_logs_insert_own" on public.printed_lesson_logs;
create policy "printed_lesson_logs_insert_own"
on public.printed_lesson_logs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "printed_lesson_logs_update_own" on public.printed_lesson_logs;
create policy "printed_lesson_logs_update_own"
on public.printed_lesson_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "printed_lesson_logs_delete_own" on public.printed_lesson_logs;
create policy "printed_lesson_logs_delete_own"
on public.printed_lesson_logs
for delete
to authenticated
using (auth.uid() = user_id);
