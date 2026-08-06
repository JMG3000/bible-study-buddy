# Bible Study Buddy: Free
Main:
[![Dependabot Updates](https://github.com/JMG3000/bible-study-buddy/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/JMG3000/bible-study-buddy/actions/workflows/dependabot/dependabot-updates)

Dev-Test:
[![Dependabot Updates](https://github.com/JMG3000/bible-study-buddy/actions/workflows/dependabot/dependabot-updates/badge.svg?branch=dev-test)](https://github.com/JMG3000/bible-study-buddy/actions/workflows/dependabot/dependabot-updates)

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/JMG3000/bible-study-buddy?utm_source=oss&utm_medium=github&utm_campaign=JMG3000%2Fbible-study-buddy&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

Bible Study Buddy: Free is a Next.js app for creating, publishing, browsing,
saving, reporting, printing, and organizing Bible study lesson plans.

The repository is intentionally small:

- `web/` - the Next.js application.
- `web/supabase/migrations/` - SQL migrations for the Supabase-backed schema.
- `docs/archive/` - early product planning notes kept for reference.

## Current capabilities

- Public lesson catalog and published lesson detail pages.
- OAuth-only creator accounts with profile handles.
- Private creator dashboard for drafts, study series, saved lessons, layout
  templates, and print logs.
- Layout template library for reusable lesson structures.
- Private print-log snapshots for edited handouts.
- Favorites, reporting, reviewer workflows, admin user tools, and Webmaster
  Supreme-only recovery actions.
- Supabase RLS-first schema design.
- Vercel-ready Next.js deployment.

## Local development

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Docker development

From the repository root:

```bash
docker compose up --build
```

The app runs at `http://localhost:3000`. Docker uses the `web/.env.local` file
when it exists.

## Environment

Start with `web/.env.example`, then create `web/.env.local`.

Required for Supabase-backed features:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `SUPABASE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SCRIPTURE_TOOLTIP_MODE`
- `NEXT_PUBLIC_SCRIPTURE_TOOLTIP_SCRIPT_URL`

## Database setup

Run SQL migrations from `web/supabase/migrations/` in ascending order.

Important current follow-up migrations:

- `0014_add_missing_role_enum_values.sql`
- `0015_repair_reviewer_role_and_review_threads.sql`
- `0016_add_private_printed_lesson_logs.sql`

Run `0014` by itself first. Then run `0015`, then `0016`.

## Quality checks

```bash
cd web
npm run lint
npm run typecheck
npm run build
```

## Documentation index

- App details: `web/README.md`
- Early planning archive: `docs/archive/`

