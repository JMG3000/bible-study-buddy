# Windows 11, NTFS, and WSL Filesystem Architecture

Last verified locally: 2026-07-13.

## Supported Development Topology

Bible Study Buddy uses one physical checkout on the Windows 11 `C:` NTFS
volume. Windows and WSL use different path syntax to address the same files.

| Role | Windows path | WSL path |
| --- | --- | --- |
| Canonical repository | `C:\Users\LattePanda\Documents\BSB-Windows` | `/mnt/c/Users/LattePanda/Documents/BSB-Windows` |
| Next.js application | `C:\Users\LattePanda\Documents\BSB-Windows\web` | `/mnt/c/Users/LattePanda/Documents/BSB-Windows/web` |
| Supabase migrations | `...\web\supabase\migrations` | `.../web/supabase/migrations` |
| Project documentation | `...\docs` | `.../docs` |
| Local environment | `...\web\.env.local` | `.../web/.env.local` |
| Dependencies | `...\web\node_modules` | `.../web/node_modules` |
| Next.js output | `...\web\.next` | `.../web/.next` |
| Local operational logs | `...\logs\local` | `.../logs/local` |

- The host filesystem is NTFS.
- WSL exposes the `C:` volume through DrvFS/9P; Linux filesystem tools report
  the transport as `9p`/`v9fs`, not as a native ext4 filesystem.
- Use Windows paths in PowerShell and Windows applications.
- Use `/mnt/c/...` paths in WSL Bash and Linux applications.
- Run Node.js, npm, Git, and project validation from WSL for this checkout.

## Repository Architecture

| Location | Responsibility | Source of truth |
| --- | --- | --- |
| `.github/` | GitHub workflows, ownership, Dependabot | Yes |
| `.circleci/` | CircleCI validation pipeline | Yes |
| `docs/` | Architecture, deployment, provider, audit, and monitor records | Yes |
| `scripts/` | Operator automation | Yes |
| `web/src/` | Next.js application source | Yes |
| `web/supabase/migrations/` | Ordered Supabase schema history | Yes |
| `web/public/` | Static web assets | Yes |
| `web/node_modules/` | Runtime-specific installed packages | No; generated |
| `web/.next/` | Next.js build and development output | No; generated |
| `web/.env.local` | Local secrets and endpoints | No; local-only |
| `.vercel/` | Local Vercel project binding | No; generated/local |
| `logs/local/` | Local validation and runtime output | No; operational |

## WSL Workflow

```bash
cd /mnt/c/Users/LattePanda/Documents/BSB-Windows/web
cp .env.example .env.local
npm ci
npm run dev
```

- Expected application URL: `http://localhost:3000`.
- Populate `.env.local` with local/provider values; never commit it.
- Use `npm ci` to recreate the dependency tree from `package-lock.json`.

Validation:

```bash
cd /mnt/c/Users/LattePanda/Documents/BSB-Windows/web
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

Filesystem and Git identity checks:

```bash
cd /mnt/c/Users/LattePanda/Documents/BSB-Windows
pwd
stat -f -c 'WSL transport: %T' .
git status --short --branch
git remote -v
```

Expected path/transport: `/mnt/c/Users/LattePanda/Documents/BSB-Windows` and
`v9fs`/`9p`. Expected development branch: `dev-test` or a short-lived branch
based on `dev-test`. Expected GitHub remote:
`https://github.com/JMG3000/bible-study-buddy.git`.

## Pathological And Unsupported Locations

### Duplicate Active Checkouts

- `/mnt/d/repos/codex-projects/bible-study-buddy` was the local recovery source
  used to reconstruct the NTFS target.
- It is not the canonical checkout after this transition.
- Do not edit both checkouts. Divergent unpushed work, generated files, and
  provider configuration become indistinguishable.
- Keep the old checkout read-only until the NTFS target passes validation and
  any required history comparison is complete; decommission it separately.

### Mixed Path Syntax

- Do not pass `C:\...` paths to Linux commands in WSL.
- Do not pass `/mnt/c/...` paths to Windows-only tools that do not understand
  WSL paths.
- Do not use `\\wsl$\...\mnt\c\...` as another canonical alias for a file that
  Windows can address directly on `C:`.
- Quote paths in scripts even though the current root has no spaces; parent or
  future paths may contain them.

### Mixed Runtime Output

- Do not run Windows Node.js and WSL Node.js against the same
  `web/node_modules` tree. Native packages and executable shims are
  platform-specific.
- Do not reuse `web/.next` after switching runtimes, branches, Node versions, or
  package-lock state. Remove it and rebuild.
- Do not copy `node_modules`, `.next`, `.vercel`, or `logs/local` between
  checkouts. Recreate generated state from tracked configuration.

### NTFS And DrvFS Edge Cases

- Avoid files that differ only by letter case. Windows Git is configured with
  case-insensitive path handling for this checkout.
- Avoid relying on Linux ownership, mode bits, special files, or symlink
  behavior in `/mnt/c`; DrvFS translates Windows metadata.
- Keep tooling caches and temporary files out of tracked directories.
- Avoid moving the checkout under OneDrive-synchronized folders or deeply
  nested paths; sync locks and Windows path-length limits can destabilize
  installs and builds.

### Secrets And Operational Artifacts

- Never commit `.env`, `.env.local`, service-role keys, OAuth secrets, Slack
  secrets, deploy hooks, CI tokens, or OpenAI keys.
- Never treat ignored local logs as status evidence after the session that
  created them.
- Record durable status in `docs/monitors/bible-study-buddy-project-monitor.md`.

## Recovery Rules

1. Stop if both the canonical and legacy checkouts contain uncommitted changes.
2. Compare `git status --short --branch`, `git remote -v`, and HEAD in each
   checkout before copying or deleting anything.
3. Preserve tracked source through Git; do not recover it from `.next`,
   `node_modules`, logs, or editor caches.
4. Recreate dependencies with WSL `npm ci` in the canonical `web/` directory.
5. Run lint, typecheck, build, and audit before decommissioning a recovery
   checkout.
