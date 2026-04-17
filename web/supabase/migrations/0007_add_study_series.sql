create or replace function public.study_series_search_tsv()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  select p.handle
  into new.author_handle
  from public.profiles p
  where p.user_id = new.author_id;

  new.author_handle := coalesce(new.author_handle, 'friend');

  new.search_tsv :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'A') ||
    setweight(to_tsvector('simple', replace(coalesce(new.author_handle, ''), '-', ' ')), 'A');

  return new;
end;
$$;

create table public.study_series (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(user_id) on delete restrict,
  author_handle text not null,
  slug text,
  status public.lesson_plan_status not null default 'draft',
  title text not null,
  summary text not null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  search_tsv tsvector not null default ''::tsvector,
  check ((status <> 'published') or slug is not null)
);

create table public.study_series_lessons (
  series_id uuid not null references public.study_series(id) on delete cascade,
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  position smallint not null check (position >= 1 and position <= 100),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (series_id, lesson_plan_id),
  unique (series_id, position)
);

create unique index study_series_slug_uq
  on public.study_series (slug)
  where slug is not null;

create index study_series_author_updated_idx
  on public.study_series (author_id, updated_at desc);

create index study_series_status_published_idx
  on public.study_series (status, published_at desc);

create index study_series_search_tsv_gin
  on public.study_series using gin (search_tsv);

create index study_series_lessons_series_idx
  on public.study_series_lessons (series_id, position);

create index study_series_lessons_lesson_idx
  on public.study_series_lessons (lesson_plan_id, series_id);

create trigger study_series_set_updated_at
before update on public.study_series
for each row execute function public.set_updated_at();

create trigger study_series_set_first_published_at
before update on public.study_series
for each row execute function public.set_first_published_at();

create trigger study_series_lock_slug_after_publish
before update on public.study_series
for each row execute function public.lock_slug_after_publish();

create trigger study_series_search_tsv_update
before insert or update on public.study_series
for each row execute function public.study_series_search_tsv();

alter table public.study_series enable row level security;
alter table public.study_series_lessons enable row level security;

create policy "study_series_select_visible"
on public.study_series
for select
using (
  status = 'published'
  or auth.uid() = author_id
  or public.is_admin()
);

create policy "study_series_insert_owner"
on public.study_series
for insert
with check (
  auth.uid() = author_id
  and status = 'draft'
);

create policy "study_series_update_owner_or_admin"
on public.study_series
for update
using (auth.uid() = author_id or public.is_admin())
with check (auth.uid() = author_id or public.is_admin());

create policy "study_series_delete_draft_owner_or_admin"
on public.study_series
for delete
using (
  public.is_admin()
  or (auth.uid() = author_id and status = 'draft')
);

create policy "study_series_lessons_select_visible_parent"
on public.study_series_lessons
for select
using (
  exists (
    select 1
    from public.study_series s
    where s.id = series_id
      and (
        s.status = 'published'
        or s.author_id = auth.uid()
        or public.is_admin()
      )
  )
);

create policy "study_series_lessons_insert_owner_or_admin"
on public.study_series_lessons
for insert
with check (
  exists (
    select 1
    from public.study_series s
    where s.id = series_id
      and (s.author_id = auth.uid() or public.is_admin())
  )
  and exists (
    select 1
    from public.study_series s
    join public.lesson_plans lp on lp.id = lesson_plan_id
    where s.id = series_id
      and (
        public.is_admin()
        or (s.author_id = auth.uid() and lp.author_id = auth.uid())
      )
  )
);

create policy "study_series_lessons_update_owner_or_admin"
on public.study_series_lessons
for update
using (
  exists (
    select 1
    from public.study_series s
    join public.lesson_plans lp on lp.id = lesson_plan_id
    where s.id = series_id
      and (
        public.is_admin()
        or (s.author_id = auth.uid() and lp.author_id = auth.uid())
      )
  )
)
with check (
  exists (
    select 1
    from public.study_series s
    join public.lesson_plans lp on lp.id = lesson_plan_id
    where s.id = series_id
      and (
        public.is_admin()
        or (s.author_id = auth.uid() and lp.author_id = auth.uid())
      )
  )
);

create policy "study_series_lessons_delete_owner_or_admin"
on public.study_series_lessons
for delete
using (
  exists (
    select 1
    from public.study_series s
    join public.lesson_plans lp on lp.id = lesson_plan_id
    where s.id = series_id
      and (
        public.is_admin()
        or (s.author_id = auth.uid() and lp.author_id = auth.uid())
      )
  )
);
