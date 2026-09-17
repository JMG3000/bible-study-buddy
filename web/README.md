# Bible Study Buddy: Free Web App

This directory contains the Next.js application for Bible Study Buddy: Free.

## Stack

- Next.js App Router
- TypeScript
- Supabase Auth and Postgres
- Supabase SSR helpers
- Server actions for private and authenticated workflows

## Run locally

From the repository root:

```bash
cd web
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Use one Node/npm runtime for a given `node_modules` tree. Do not reuse
`node_modules` or `.next` across incompatible Windows/Linux runtimes or across
dependency-lock changes.

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

- `/` — home page
- `/plans` — public catalog
- `/plans/[slug]` — published lesson detail, favorites, reports, and print flow
- `/series/[slug]` — public study series
- `/create` — authenticated lesson draft creation
- `/dashboard` — creator workspace
- `/dashboard/plans/[id]` — owner-only lesson editing and publishing
- `/dashboard/layouts` — layout template library
- `/dashboard/printed` — private saved print logs
- `/dashboard/saved` — private saved lessons
- `/admin/reports` — reviewer/admin moderation queue
- `/admin/users` — admin user management

## Supabase migrations

Migration files live in `supabase/migrations/` and run in filename order.
The tracked sequence currently ends at `0020_add_lesson_remix_parent.sql`.
Migration `0020` has not been established by current project evidence as
successfully validated against an isolated non-production Supabase environment.
Treat that provider validation as outstanding before production promotion.

## Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

CircleCI repeats the canonical sequence in a clean environment. Current release
state belongs in `../docs/monitors/bible-study-buddy-project-monitor.md`, not in
this README.
