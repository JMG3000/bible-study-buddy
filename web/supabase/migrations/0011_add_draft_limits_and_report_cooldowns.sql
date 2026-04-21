alter table public.profiles
  add column if not exists report_cooldown_until timestamptz,
  add column if not exists dismissed_review_count integer not null default 0;

create index if not exists profiles_report_cooldown_idx
  on public.profiles (report_cooldown_until);

create or replace function public.enforce_draft_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  existing_draft_count integer;
begin
  if new.status <> 'draft' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.status = 'draft'
     and old.author_id = new.author_id then
    return new;
  end if;

  select count(*)
  into existing_draft_count
  from public.lesson_plans lp
  where lp.author_id = new.author_id
    and lp.status = 'draft'
    and (tg_op <> 'UPDATE' or lp.id <> old.id);

  if existing_draft_count >= 5 then
    raise exception 'Draft limit exceeded. Keep five drafts or fewer at a time.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists lesson_plans_enforce_draft_limit on public.lesson_plans;
create trigger lesson_plans_enforce_draft_limit
before insert or update on public.lesson_plans
for each row execute function public.enforce_draft_limit();
