# Bible Study Buddy: Free

Bible Study Buddy: Free is a Next.js application for creating, publishing,
browsing, saving, reporting, printing, and organizing Bible study lesson plans.

## Repository structure

- `web/` — Next.js application.
- `web/supabase/migrations/` — ordered Supabase schema migrations.
- `docs/` — current architecture, deployment, provider, security, and project-state documentation.
- `docs/audits/` — dated historical audit evidence. Do not use audit entries as current operational state.
- `docs/archive/` — superseded product-planning material retained for historical reference.
- `docs/superpowers/` — dated implementation plans/specifications. Treat them as historical unless a current document explicitly adopts them.

## Current capabilities

- Public lesson catalog and published lesson detail pages.
- OAuth-only creator accounts with profile handles.
- Private creator dashboard for drafts, study series, saved lessons, layout templates, and print logs.
- Layout template library for reusable lesson structures.
- Private print-log snapshots for edited handouts.
- Favorites, reporting, reviewer workflows, admin user tools, and recovery actions.
- Supabase RLS-first schema design.
- Vercel-ready Next.js deployment.

## Local development

Use one checkout and one Node/npm execution environment for a given dependency tree.
Do not share `web/node_modules` or `web/.next` across incompatible runtimes.

```bash
cd web
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The repository does not designate a machine-specific local filesystem path as project truth.
Legacy Windows/WSL filesystem guidance is retained in
`docs/architecture/windows-wsl-filesystem.md` only for environments that still use that topology.

## Environment

Start with `web/.env.example`, then create `web/.env.local`.

Required for Supabase-backed features:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for deployed environments:

- `NEXT_PUBLIC_SITE_URL` — the deployment's canonical public origin.

Optional integrations are documented in
`docs/providers/third-party-provider-inventory.md`.

## Database setup

Run SQL migrations from `web/supabase/migrations/` in ascending filename order.
The tracked migration set currently ends at
`0020_add_lesson_remix_parent.sql`.

Never edit an already-applied migration. Add a new ordered migration instead.
Migration `0020` remains a release-sensitive change and requires provider-level
validation before a production promotion that contains it.

## Quality checks

```bash
cd web
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

CircleCI is the canonical automatic clean-environment application validator.
See `docs/deployment/verification-and-broadcasts.md`.

## Current project truth

Use `docs/monitors/bible-study-buddy-project-monitor.md` for volatile branch,
PR, provider, and release-blocker state. Do not infer current state from dated
audits, archived plans, old PR descriptions, or local-machine paths.

## Documentation index

- App details: `web/README.md`
- Current project monitor: `docs/monitors/bible-study-buddy-project-monitor.md`
- Branch promotion policy: `docs/deployment/branch-promotion-policy.md`
- Verification/evidence roles: `docs/deployment/verification-and-broadcasts.md`
- Provider inventory: `docs/providers/third-party-provider-inventory.md`
- Meticulous/Vercel integration: `docs/deployment/meticulous-vercel.md`
- Security-test scope: `docs/security/local-pentest-readiness.md`
- Legacy Windows/WSL guidance: `docs/architecture/windows-wsl-filesystem.md`
- Historical audits: `docs/audits/`
- Historical product archive: `docs/archive/`
