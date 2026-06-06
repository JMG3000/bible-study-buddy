alter table public.printed_lesson_logs
  add column if not exists archived_at timestamptz;

create index if not exists printed_lesson_logs_user_archived_updated_idx
  on public.printed_lesson_logs (user_id, archived_at, updated_at desc);
