alter table public.lesson_plans
  add column if not exists parent_lesson_id uuid references public.lesson_plans(id) on delete set null;

create index if not exists lesson_plans_parent_lesson_idx
  on public.lesson_plans (parent_lesson_id)
  where parent_lesson_id is not null;
