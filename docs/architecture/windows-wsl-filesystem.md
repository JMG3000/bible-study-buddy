# Windows 11, NTFS, and WSL Filesystem Guidance

Historical topology review: 2026-07-13.
Current documentation boundary reviewed: 2026-09-15.

> This file is environment guidance, not a declaration of the project's current
> canonical machine or checkout path. Earlier project work used a Windows/WSL
> NTFS checkout and recovery copy. Those machine-specific locations are
> historical and must not be used to infer current repository state.

## Supported principle

Use one physical checkout as the active working copy for a task, and use one
compatible Node/npm execution environment for its generated dependency/build
state.

- Use Windows paths with Windows-native tools.
- Use `/mnt/<drive>/...` paths with WSL/Linux tools when working on Windows-mounted storage.
- Do not run Windows Node.js and WSL Node.js against the same `node_modules` tree.
- Recreate `node_modules` with `npm ci` after switching incompatible runtimes or lockfile states.
- Rebuild `.next` after switching runtimes, branches, Node versions, or dependency-lock state.

## Repository architecture

| Location | Responsibility | Source of truth |
| --- | --- | --- |
| `.github/` | GitHub workflows, ownership, Dependabot | Yes |
| `.circleci/` | CircleCI validation pipeline | Yes |
| `docs/` | Architecture, deployment, provider, audit, and monitor records | Yes, subject to each document's authority boundary |
| `web/src/` | Next.js application source | Yes |
| `web/supabase/migrations/` | Ordered Supabase schema history | Yes |
| `web/public/` | Static web assets | Yes |
| `web/node_modules/` | Runtime-specific installed packages | No; generated |
| `web/.next/` | Next.js build/development output | No; generated |
| `web/.env.local` | Local secrets/endpoints | No; local-only |
| `.vercel/` | Local Vercel binding | No; generated/local |
| `logs/local/` | Local validation/runtime output | No; operational |

## Generic local workflow

```bash
cd <repo-root>/web
cp .env.example .env.local
npm ci
npm run dev
```

Validation:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

Confirm repository identity before relying on a checkout:

```bash
pwd
git status --short --branch
git rev-parse HEAD
git remote -v
```

Expected remote repository:
`https://github.com/JMG3000/bible-study-buddy.git`.

## Windows/WSL-specific hazards

- Do not mix Windows path syntax and WSL path syntax in tools that do not understand both.
- Avoid duplicate simultaneously writable checkouts.
- Avoid relying on Linux ownership/mode/symlink semantics on Windows-mounted NTFS.
- Keep tooling caches and temporary files out of tracked directories.
- Avoid storing the active checkout in sync-managed folders when file locks or path translation destabilize builds.

## Recovery boundary

Historical recovery locations must not be deleted merely because they are no
longer the active checkout. Current project evidence still does not establish
independent off-host recovery durability. Destructive recovery cleanup therefore
requires separate verification and authorization.

For current branch, PR, provider, and release state, use
`docs/monitors/bible-study-buddy-project-monitor.md`.
