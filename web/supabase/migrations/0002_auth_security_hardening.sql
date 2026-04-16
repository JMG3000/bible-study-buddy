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
    setweight(to_tsvector('english', array_to_string(new.materials, ' ')), 'C') ||
    setweight(to_tsvector('english', array_to_string(new.activities, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.discussion_questions, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.prayer_prompts, ' ')), 'C');

  return new;
end;
$$;

create or replace view public.public_creator_profiles
with (security_invoker = true) as
select
  user_id,
  display_name,
  avatar_url
from public.profiles;

grant select on public.public_creator_profiles to anon, authenticated;
