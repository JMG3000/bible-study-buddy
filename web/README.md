# Bible Study Buddy: Free

Bible Study Buddy: Free is a `Next.js` application for creating, sharing,
browsing, printing, and moderating Bible study lesson plans. This repo now
includes:

- a public catalog and lesson detail flow
- creator dashboard routes
- an admin moderation queue
- print-ready lesson pages
- Supabase schema and RLS migration files
- a webhook revalidation endpoint for Vercel/Next cache invalidation
- live Supabase-backed read helpers for public and authenticated pages

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` when you are ready to connect Supabase and
the optional scripture tooltip provider.

## Routes

- `/`
- `/plans`
- `/plans/[slug]`
- `/create`
- `/dashboard`
- `/dashboard/plans/[id]`
- `/dashboard/saved`
- `/admin/reports`
- `/api/revalidate/supabase`

## Data and backend

- The production schema lives in `supabase/migrations/0001_initial_schema.sql`.
- `src/lib/supabase` contains the client bootstrapping helpers.
- `src/lib/lesson-plans.ts` reads from Supabase when `.env.local` is configured.
- Without Supabase environment variables, public pages fall back to empty-state
  messaging instead of mock data.

## Next implementation steps

1. Provision a Supabase project and fill in `.env.local`.
2. Apply the SQL migration.
3. Wire auth into dashboard and admin route protection.
4. Add server actions for draft save, publish, favorite, and report flows.
5. Connect scripture tooltip configuration and deployment secrets.
