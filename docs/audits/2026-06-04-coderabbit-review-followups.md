# CodeRabbit Review Follow-Ups

Date: 2026-06-04

## Scope

Reviewed CodeRabbit CLI output from:

```powershell
~/.local/bin/coderabbit review --agent --type uncommitted --dir web
```

## Fixes Applied

- Updated `0018_seed_public_domain_starter_lessons.sql` so seed upserts refresh `author_id` and `author_handle` for lessons and study series.
- Removed `pg_temp` from `private.can_review_reports()` search paths in local migrations and added `0019_harden_review_function_search_path.sql` for the live database.
- Applied the live Supabase migration `harden_review_function_search_path`.
- Replaced duplicate-prone React list keys in private printed handout pages.
- Cleaned the same duplicate-prone list key pattern in lesson detail and dashboard lesson preview pages.
- Changed missing print-log metadata handling to use `notFound()`.
- Tightened report-only CSP `img-src` from any HTTPS image host to local and data images only.

## CSP Follow-Up Status

Strict nonce-based CSP was implemented in the next follow-up patch on 2026-06-04. CSP now lives in `web/src/proxy.ts` so each request receives a fresh nonce.

## Verification

Commands run:

```powershell
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
git diff --check
```

Result: all passed. `git diff --check` reported only Windows line-ending warnings.

Live database read-back was attempted after applying the migration, but the Supabase app connection requested reauthentication. After reconnecting, verify with:

```sql
select position('pg_temp' in pg_get_functiondef('private.can_review_reports()'::regprocedure)) = 0 as search_path_hardened,
       pg_get_functiondef('private.can_review_reports()'::regprocedure) like '%set search_path = public, private%' as explicit_search_path;
```

## Residual Risk

- CSP is nonce-enforced and should be watched in staging for provider compatibility.
- External image providers must be explicitly allowlisted if avatar or CDN rendering is added later.
