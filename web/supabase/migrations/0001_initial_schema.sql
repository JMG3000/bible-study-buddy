create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'creator', 'admin');
create type public.lesson_plan_status as enum ('draft', 'published', 'unpublished');
create type public.moderation_state as enum ('none', 'under_review', 'actioned');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.report_reason as enum (
  'inaccurate',
  'inappropriate',
  'copyright',
  'spam',
  'other'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.set_first_published_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'published' and old.published_at is null then
    new.published_at = coalesce(new.published_at, timezone('utc', now()));
  end if;

  if new.status = 'draft' and old.published_at is null then
    new.published_at = null;
  end if;

  return new;
end;
$$;

create or replace function public.lock_slug_after_publish()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.published_at is not null and new.slug is distinct from old.slug then
    raise exception 'Published lesson plan slugs are immutable';
  end if;

  return new;
end;
$$;

create or replace function public.lesson_plans_search_tsv()
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
    setweight(to_tsvector('english', coalesce(new.teaching_objective, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.opening_prayer, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.icebreaker, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.facilitator_notes, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(new.topic_tags, ' ')), 'A') ||
    setweight(to_tsvector('english', array_to_string(new.audience_tags, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.denomination_tags, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.custom_tags, ' ')), 'B') ||
    setweight(to_tsvector('simple', replace(coalesce(new.author_handle, ''), '-', ' ')), 'A') ||
    setweight(to_tsvector('english', array_to_string(new.materials, ' ')), 'C') ||
    setweight(to_tsvector('english', array_to_string(new.activities, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.discussion_questions, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.prayer_prompts, ' ')), 'C');

  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  handle text not null,
  avatar_url text,
  bio text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_handle_format check (
    handle ~ '^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$'
  )
);

create unique index profiles_handle_lower_uq on public.profiles (lower(handle));

create or replace function public.normalize_profile_handle(source text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(source, '')), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.resolve_profile_handle(
  source text,
  existing_user_id uuid default null
)
returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  normalized text;
  base_handle text;
  candidate text;
  suffix integer := 1;
begin
  normalized := public.normalize_profile_handle(source);

  if normalized = '' then
    normalized := 'friend';
  end if;

  base_handle := left(normalized, 30);

  if base_handle = '' then
    base_handle := 'friend';
  end if;

  candidate := base_handle;

  while exists (
    select 1
    from public.profiles p
    where lower(p.handle) = lower(candidate)
      and (existing_user_id is null or p.user_id <> existing_user_id)
  ) loop
    suffix := suffix + 1;
    candidate := concat(
      trim(trailing '-' from left(base_handle, greatest(1, 30 - length(suffix::text) - 1))),
      '-',
      suffix::text
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.current_profile_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin', false)
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_name text;
  fallback_handle text;
begin
  fallback_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    split_part(coalesce(new.email, 'creator'), '@', 1),
    'New Creator'
  );

  fallback_handle := public.resolve_profile_handle(
    coalesce(
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'friend'), '@', 1),
      'friend'
    ),
    new.id
  );

  insert into public.profiles (user_id, display_name, handle)
  values (new.id, fallback_name, fallback_handle)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create table public.bible_books (
  book_code smallint primary key,
  sort_order smallint not null unique,
  testament text not null check (testament in ('old', 'new')),
  display_name text not null,
  slug text not null unique,
  osis_code text not null unique,
  usfm_code text not null unique
);

create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(user_id) on delete restrict,
  author_handle text not null,
  slug text,
  status public.lesson_plan_status not null default 'draft',
  moderation_state public.moderation_state not null default 'none',
  title text not null,
  summary text not null,
  teaching_objective text not null,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  topic_tags text[] not null default '{}',
  audience_tags text[] not null default '{}',
  denomination_tags text[] not null default '{}',
  custom_tags text[] not null default '{}',
  opening_prayer text,
  icebreaker text,
  facilitator_notes text,
  materials text[] not null default '{}',
  activities text[] not null default '{}',
  discussion_questions text[] not null default '{}',
  prayer_prompts text[] not null default '{}',
  handout_urls text[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  search_tsv tsvector not null default ''::tsvector,
  check ((status <> 'published') or slug is not null)
);

create table public.scripture_refs (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  sequence smallint not null,
  book_code smallint not null references public.bible_books(book_code),
  chapter_start integer not null check (chapter_start > 0),
  verse_start integer not null check (verse_start > 0),
  chapter_end integer not null check (chapter_end > 0),
  verse_end integer not null check (verse_end > 0),
  sort_start bigint generated always as (
    book_code::bigint * 1000000 +
    chapter_start::bigint * 1000 +
    verse_start::bigint
  ) stored,
  sort_end bigint generated always as (
    book_code::bigint * 1000000 +
    chapter_end::bigint * 1000 +
    verse_end::bigint
  ) stored,
  display_label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (lesson_plan_id, sequence),
  check (
    chapter_end > chapter_start or
    (chapter_end = chapter_start and verse_end >= verse_start)
  )
);

create table public.favorites (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, lesson_plan_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  reporter_id uuid not null references public.profiles(user_id) on delete cascade,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'open',
  admin_note text,
  reviewed_by uuid references public.profiles(user_id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (lesson_plan_id, reporter_id)
);

create unique index lesson_plans_slug_uq
  on public.lesson_plans (slug)
  where slug is not null;

create index lesson_plans_author_updated_idx
  on public.lesson_plans (author_id, updated_at desc);

create index lesson_plans_status_published_idx
  on public.lesson_plans (status, published_at desc);

create index lesson_plans_search_tsv_gin
  on public.lesson_plans using gin (search_tsv);

create index lesson_plans_topic_tags_gin
  on public.lesson_plans using gin (topic_tags);

create index lesson_plans_audience_tags_gin
  on public.lesson_plans using gin (audience_tags);

create index lesson_plans_denomination_tags_gin
  on public.lesson_plans using gin (denomination_tags);

create index lesson_plans_custom_tags_gin
  on public.lesson_plans using gin (custom_tags);

create index scripture_refs_plan_sequence_idx
  on public.scripture_refs (lesson_plan_id, sequence);

create index scripture_refs_book_sort_idx
  on public.scripture_refs (book_code, sort_start, sort_end);

create index reports_status_created_idx
  on public.reports (status, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger lesson_plans_set_updated_at
before update on public.lesson_plans
for each row execute function public.set_updated_at();

create trigger lesson_plans_set_first_published_at
before update on public.lesson_plans
for each row execute function public.set_first_published_at();

create trigger lesson_plans_lock_slug_after_publish
before update on public.lesson_plans
for each row execute function public.lock_slug_after_publish();

create trigger lesson_plans_search_tsv_update
before insert or update on public.lesson_plans
for each row execute function public.lesson_plans_search_tsv();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.bible_books (book_code, sort_order, testament, display_name, slug, osis_code, usfm_code)
values
  (1, 1, 'old', 'Genesis', 'genesis', 'Gen', 'GEN'),
  (2, 2, 'old', 'Exodus', 'exodus', 'Exod', 'EXO'),
  (3, 3, 'old', 'Leviticus', 'leviticus', 'Lev', 'LEV'),
  (4, 4, 'old', 'Numbers', 'numbers', 'Num', 'NUM'),
  (5, 5, 'old', 'Deuteronomy', 'deuteronomy', 'Deut', 'DEU'),
  (6, 6, 'old', 'Joshua', 'joshua', 'Josh', 'JOS'),
  (7, 7, 'old', 'Judges', 'judges', 'Judg', 'JDG'),
  (8, 8, 'old', 'Ruth', 'ruth', 'Ruth', 'RUT'),
  (9, 9, 'old', '1 Samuel', '1-samuel', '1Sam', '1SA'),
  (10, 10, 'old', '2 Samuel', '2-samuel', '2Sam', '2SA'),
  (11, 11, 'old', '1 Kings', '1-kings', '1Kgs', '1KI'),
  (12, 12, 'old', '2 Kings', '2-kings', '2Kgs', '2KI'),
  (13, 13, 'old', '1 Chronicles', '1-chronicles', '1Chr', '1CH'),
  (14, 14, 'old', '2 Chronicles', '2-chronicles', '2Chr', '2CH'),
  (15, 15, 'old', 'Ezra', 'ezra', 'Ezra', 'EZR'),
  (16, 16, 'old', 'Nehemiah', 'nehemiah', 'Neh', 'NEH'),
  (17, 17, 'old', 'Esther', 'esther', 'Esth', 'EST'),
  (18, 18, 'old', 'Job', 'job', 'Job', 'JOB'),
  (19, 19, 'old', 'Psalms', 'psalms', 'Ps', 'PSA'),
  (20, 20, 'old', 'Proverbs', 'proverbs', 'Prov', 'PRO'),
  (21, 21, 'old', 'Ecclesiastes', 'ecclesiastes', 'Eccl', 'ECC'),
  (22, 22, 'old', 'Song of Songs', 'song-of-songs', 'Song', 'SNG'),
  (23, 23, 'old', 'Isaiah', 'isaiah', 'Isa', 'ISA'),
  (24, 24, 'old', 'Jeremiah', 'jeremiah', 'Jer', 'JER'),
  (25, 25, 'old', 'Lamentations', 'lamentations', 'Lam', 'LAM'),
  (26, 26, 'old', 'Ezekiel', 'ezekiel', 'Ezek', 'EZK'),
  (27, 27, 'old', 'Daniel', 'daniel', 'Dan', 'DAN'),
  (28, 28, 'old', 'Hosea', 'hosea', 'Hos', 'HOS'),
  (29, 29, 'old', 'Joel', 'joel', 'Joel', 'JOL'),
  (30, 30, 'old', 'Amos', 'amos', 'Amos', 'AMO'),
  (31, 31, 'old', 'Obadiah', 'obadiah', 'Obad', 'OBA'),
  (32, 32, 'old', 'Jonah', 'jonah', 'Jonah', 'JON'),
  (33, 33, 'old', 'Micah', 'micah', 'Mic', 'MIC'),
  (34, 34, 'old', 'Nahum', 'nahum', 'Nah', 'NAM'),
  (35, 35, 'old', 'Habakkuk', 'habakkuk', 'Hab', 'HAB'),
  (36, 36, 'old', 'Zephaniah', 'zephaniah', 'Zeph', 'ZEP'),
  (37, 37, 'old', 'Haggai', 'haggai', 'Hag', 'HAG'),
  (38, 38, 'old', 'Zechariah', 'zechariah', 'Zech', 'ZEC'),
  (39, 39, 'old', 'Malachi', 'malachi', 'Mal', 'MAL'),
  (40, 40, 'new', 'Matthew', 'matthew', 'Matt', 'MAT'),
  (41, 41, 'new', 'Mark', 'mark', 'Mark', 'MRK'),
  (42, 42, 'new', 'Luke', 'luke', 'Luke', 'LUK'),
  (43, 43, 'new', 'John', 'john', 'John', 'JHN'),
  (44, 44, 'new', 'Acts', 'acts', 'Acts', 'ACT'),
  (45, 45, 'new', 'Romans', 'romans', 'Rom', 'ROM'),
  (46, 46, 'new', '1 Corinthians', '1-corinthians', '1Cor', '1CO'),
  (47, 47, 'new', '2 Corinthians', '2-corinthians', '2Cor', '2CO'),
  (48, 48, 'new', 'Galatians', 'galatians', 'Gal', 'GAL'),
  (49, 49, 'new', 'Ephesians', 'ephesians', 'Eph', 'EPH'),
  (50, 50, 'new', 'Philippians', 'philippians', 'Phil', 'PHP'),
  (51, 51, 'new', 'Colossians', 'colossians', 'Col', 'COL'),
  (52, 52, 'new', '1 Thessalonians', '1-thessalonians', '1Thess', '1TH'),
  (53, 53, 'new', '2 Thessalonians', '2-thessalonians', '2Thess', '2TH'),
  (54, 54, 'new', '1 Timothy', '1-timothy', '1Tim', '1TI'),
  (55, 55, 'new', '2 Timothy', '2-timothy', '2Tim', '2TI'),
  (56, 56, 'new', 'Titus', 'titus', 'Titus', 'TIT'),
  (57, 57, 'new', 'Philemon', 'philemon', 'Phlm', 'PHM'),
  (58, 58, 'new', 'Hebrews', 'hebrews', 'Heb', 'HEB'),
  (59, 59, 'new', 'James', 'james', 'Jas', 'JAS'),
  (60, 60, 'new', '1 Peter', '1-peter', '1Pet', '1PE'),
  (61, 61, 'new', '2 Peter', '2-peter', '2Pet', '2PE'),
  (62, 62, 'new', '1 John', '1-john', '1John', '1JN'),
  (63, 63, 'new', '2 John', '2-john', '2John', '2JN'),
  (64, 64, 'new', '3 John', '3-john', '3John', '3JN'),
  (65, 65, 'new', 'Jude', 'jude', 'Jude', 'JUD'),
  (66, 66, 'new', 'Revelation', 'revelation', 'Rev', 'REV');

alter table public.profiles enable row level security;
alter table public.bible_books enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.scripture_refs enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth.uid() = user_id or public.is_admin());

create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
with check (
  public.is_admin()
  or (auth.uid() = user_id and role = 'user')
);

create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (auth.uid() = user_id or public.is_admin())
with check (
  public.is_admin()
  or (
    auth.uid() = user_id
    and role = public.current_profile_role()
  )
);

create policy "bible_books_public_select"
on public.bible_books
for select
using (true);

create policy "lesson_plans_select_visible"
on public.lesson_plans
for select
using (
  status = 'published'
  or auth.uid() = author_id
  or public.is_admin()
);

create policy "lesson_plans_insert_owner"
on public.lesson_plans
for insert
with check (
  auth.uid() = author_id
  and status = 'draft'
);

create policy "lesson_plans_update_owner_or_admin"
on public.lesson_plans
for update
using (auth.uid() = author_id or public.is_admin())
with check (auth.uid() = author_id or public.is_admin());

create policy "lesson_plans_delete_draft_owner_or_admin"
on public.lesson_plans
for delete
using (
  public.is_admin()
  or (auth.uid() = author_id and status = 'draft')
);

create policy "scripture_refs_select_visible_parent"
on public.scripture_refs
for select
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (
        lp.status = 'published'
        or lp.author_id = auth.uid()
        or public.is_admin()
      )
  )
);

create policy "scripture_refs_insert_owner_or_admin"
on public.scripture_refs
for insert
with check (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (lp.author_id = auth.uid() or public.is_admin())
  )
);

create policy "scripture_refs_update_owner_or_admin"
on public.scripture_refs
for update
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (lp.author_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (lp.author_id = auth.uid() or public.is_admin())
  )
);

create policy "scripture_refs_delete_owner_or_admin"
on public.scripture_refs
for delete
using (
  exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and (lp.author_id = auth.uid() or public.is_admin())
  )
);

create policy "favorites_select_own"
on public.favorites
for select
using (auth.uid() = user_id);

create policy "favorites_insert_own_for_published"
on public.favorites
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and lp.status = 'published'
  )
);

create policy "favorites_delete_own"
on public.favorites
for delete
using (auth.uid() = user_id);

create policy "reports_select_reporter_or_admin"
on public.reports
for select
using (auth.uid() = reporter_id or public.is_admin());

create policy "reports_insert_for_published"
on public.reports
for insert
with check (
  auth.uid() = reporter_id
  and exists (
    select 1
    from public.lesson_plans lp
    where lp.id = lesson_plan_id
      and lp.status = 'published'
  )
);

create policy "reports_update_admin_only"
on public.reports
for update
using (public.is_admin())
with check (public.is_admin());
