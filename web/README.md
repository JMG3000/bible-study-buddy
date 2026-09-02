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
cd /mnt/c/Users/<your-username>/Documents/<repo-root>/web
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

This repository is stored on Windows NTFS and executed through WSL. Prefer
`npm ci` for a clean, lockfile-controlled install. Do not reuse this
`node_modules` or `.next` directory with Windows Node.js. See
`../docs/architecture/windows-wsl-filesystem.md`.

For every deployed environment, set `NEXT_PUBLIC_SITE_URL` to that
environment's canonical public origin. The value controls OAuth callback URLs,
metadata, lesson and series sharing URLs, `robots.txt`, `sitemap.xml`, and
whether application cookies use the secure flag.

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

The current tracked sequence ends at `0020_add_lesson_remix_parent.sql`.

## Scripts

```bash
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

## Notes

- Public pages are designed to stay browseable without sign-in.
- Creator, dashboard, admin, settings, and auth routes are marked noindex.
- Private print logs are stored as user-owned snapshots and are not public.
