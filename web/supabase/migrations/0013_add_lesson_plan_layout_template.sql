alter table public.lesson_plans
  add column if not exists layout_template_id uuid references public.layout_templates(id) on delete set null,
  add column if not exists layout_content jsonb not null default '{}'::jsonb;

create index if not exists lesson_plans_layout_template_idx
  on public.lesson_plans (layout_template_id);
