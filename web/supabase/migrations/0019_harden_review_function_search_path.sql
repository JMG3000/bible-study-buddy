create or replace function private.can_review_reports()
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role::text in ('admin', 'reviewer', 'webmaster_supreme')
  );
$$;
