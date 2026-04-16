alter table public.profiles
add column if not exists handle text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_handle_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_handle_format check (
      handle ~ '^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$'
    );
  end if;
end
$$;

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

with profile_sources as (
  select
    p.user_id,
    coalesce(
      nullif(a.raw_user_meta_data ->> 'preferred_username', ''),
      nullif(a.raw_user_meta_data ->> 'user_name', ''),
      nullif(a.raw_user_meta_data ->> 'display_name', ''),
      nullif(a.raw_user_meta_data ->> 'full_name', ''),
      nullif(p.display_name, ''),
      nullif(split_part(coalesce(a.email, ''), '@', 1), ''),
      'friend'
    ) as handle_source
  from public.profiles p
  left join auth.users a on a.id = p.user_id
)
update public.profiles p
set handle = public.resolve_profile_handle(profile_sources.handle_source, p.user_id)
from profile_sources
where p.user_id = profile_sources.user_id
  and (p.handle is null or btrim(p.handle) = '');

alter table public.profiles
alter column handle set not null;

create unique index if not exists profiles_handle_lower_uq
on public.profiles (lower(handle));

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
