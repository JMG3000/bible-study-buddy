# Bible Study Buddy: Free
Dev-Test:
[![Dependabot Updates](https://github.com/JMG3000/bible-study-buddy/actions/workflows/dependabot/dependabot-updates/badge.svg?branch=dev-test)](https://github.com/JMG3000/bible-study-buddy/actions/workflows/dependabot/dependabot-updates)

Main:
[![Dependabot Updates](https://github.com/JMG3000/bible-study-buddy/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/JMG3000/bible-study-buddy/actions/workflows/dependabot/dependabot-updates)

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

## Windows 11 + WSL development

The canonical checkout is stored on the Windows `C:` NTFS volume and operated
from WSL:

- Windows: `C:\Users\LattePanda\Documents\BSB-Windows`
- WSL: `/mnt/c/Users/LattePanda/Documents/BSB-Windows`

```bash
cd /mnt/c/Users/LattePanda/Documents/BSB-Windows/web
npm ci
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

Use WSL Node.js/npm consistently. Do not share `web/node_modules` or
`web/.next` with Windows Node.js. See
`docs/architecture/windows-wsl-filesystem.md` for the canonical path map,
generated paths, and unsupported/pathological locations.

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

Required for deployed environments:

- `NEXT_PUBLIC_SITE_URL` - the deployment's canonical public origin. It drives
  OAuth callback URLs, metadata, lesson and series sharing URLs, `robots.txt`,
  `sitemap.xml`, and whether application cookies use the secure flag.

Optional:

- `SUPABASE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SCRIPTURE_TOOLTIP_MODE`
- `NEXT_PUBLIC_SCRIPTURE_TOOLTIP_SCRIPT_URL`

## Database setup

Run SQL migrations from `web/supabase/migrations/` in ascending filename order.
The current tracked migration set is `0001` through `0020`.

Run enum-extending migrations by themselves before later migrations that depend
on the new enum values. Never edit an already-applied migration; add a new
ordered migration.

## Quality checks

```bash
cd web
npm test
npm run lint
npm run typecheck
npm run build
```

## Documentation index

- App details: `web/README.md`
- Windows/WSL filesystem architecture:
  `docs/architecture/windows-wsl-filesystem.md`
- Current project monitor: `docs/monitors/bible-study-buddy-project-monitor.md`
- Branch promotion: `docs/deployment/branch-promotion-policy.md`
- Verification and broadcasts:
  `docs/deployment/verification-and-broadcasts.md`
- Provider inventory: `docs/providers/third-party-provider-inventory.md`
- Early planning archive: `docs/archive/`
