# Bible Study Buddy: Free Web App

This directory contains the Next.js application for Bible Study Buddy: Free.

## Stack

- Next.js App Router
- TypeScript
- Supabase Auth and Postgres
- Supabase SSR helpers
- Server actions for private and authenticated workflows

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Docker

From the repository root:

```bash
docker compose up --build
```

Or from this directory:

```bash
docker build -t bible-study-buddy-free-web .
docker run --env-file .env.local -p 3000:3000 bible-study-buddy-free-web
```

## Key routes

- `/` - home page
- `/plans` - public catalog
- `/plans/[slug]` - published lesson detail, favorites, reports, and print flow
- `/series/[slug]` - public study series
- `/create` - authenticated lesson draft creation
- `/dashboard` - creator workspace
- `/dashboard/plans/[id]` - owner-only lesson editing and publishing
- `/dashboard/layouts` - layout template library
- `/dashboard/printed` - private saved print logs
- `/dashboard/saved` - private saved lessons
- `/admin/reports` - reviewer/admin moderation queue
- `/admin/users` - admin user management

## Supabase migrations

Migration files live in `supabase/migrations/`.

Run them in filename order. When a migration adds enum values, run that file by
itself before running any later migration that uses the new enum values.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Notes

- Public pages are designed to stay browseable without sign-in.
- Creator, dashboard, admin, settings, and auth routes are marked noindex.
- Private print logs are stored as user-owned snapshots and are not public.
