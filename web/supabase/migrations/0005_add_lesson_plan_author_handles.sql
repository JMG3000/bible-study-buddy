alter table public.lesson_plans
add column if not exists author_handle text;

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
    setweight(to_tsvector('simple', replace(coalesce(new.author_handle, ''), '-', ' ')), 'A') ||
    setweight(to_tsvector('english', array_to_string(new.materials, ' ')), 'C') ||
    setweight(to_tsvector('english', array_to_string(new.activities, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.discussion_questions, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.prayer_prompts, ' ')), 'C');

  return new;
end;
$$;

alter table public.lesson_plans disable trigger lesson_plans_set_updated_at;

update public.lesson_plans lp
set author_handle = p.handle
from public.profiles p
where p.user_id = lp.author_id
  and (lp.author_handle is null or lp.author_handle is distinct from p.handle);

alter table public.lesson_plans enable trigger lesson_plans_set_updated_at;

update public.lesson_plans
set author_handle = coalesce(author_handle, 'friend')
where author_handle is null;

alter table public.lesson_plans
alter column author_handle set not null;

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
with check (
  public.is_admin()
  or (auth.uid() = user_id and role = 'creator')
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
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
