alter table public.lesson_plans
add column if not exists custom_tags text[] not null default '{}';

create index if not exists lesson_plans_custom_tags_gin
on public.lesson_plans using gin (custom_tags);

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

alter table public.lesson_plans disable trigger lesson_plans_set_updated_at;

update public.lesson_plans
set custom_tags = coalesce(custom_tags, '{}');

alter table public.lesson_plans enable trigger lesson_plans_set_updated_at;
