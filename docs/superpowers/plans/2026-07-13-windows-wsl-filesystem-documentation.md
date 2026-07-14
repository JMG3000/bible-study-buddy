# Windows/WSL Filesystem Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh all local project-status documentation for the canonical
Windows 11 NTFS checkout and its WSL execution path.

**Architecture:** Maintain one physical checkout on `C:` and expose it through
Windows and WSL path aliases. Separate locally verified evidence from source-only
provider configuration and document generated, secret, obsolete, and
cross-runtime path hazards.

**Tech Stack:** Markdown, Git, Windows 11 NTFS, WSL2 Ubuntu, Node.js, npm,
Next.js, Supabase, Vercel, CircleCI, CodeRabbit, Meticulous, Slack.

---

### Task 1: Filesystem architecture

**Files:**
- Create: `docs/architecture/windows-wsl-filesystem.md`

- [x] Document canonical Windows, WSL, application, migration, environment,
  dependency, output, and log paths.
- [x] Document obsolete duplicate checkouts, mixed-runtime dependency trees,
  path-syntax misuse, case collisions, DrvFS metadata limitations, and secret or
  generated paths.
- [x] Add WSL setup, validation, and recovery commands with expected results.

### Task 2: Entry-point documentation

**Files:**
- Modify: `README.md`
- Modify: `web/README.md`

- [x] Replace generic local-development directions with Windows 11 + WSL
  commands rooted at `/mnt/c/Users/LattePanda/Documents/BSB-Windows`.
- [x] Correct the migration guidance through `0020`.
- [x] Expand the documentation index to include architecture, status,
  deployment, verification, and provider documents.

### Task 3: Current system status

**Files:**
- Modify: `docs/monitors/bible-study-buddy-project-monitor.md`
- Modify: `docs/deployment/verification-and-broadcasts.md`
- Modify: `docs/providers/third-party-provider-inventory.md`
- Modify: `docs/deployment/branch-promotion-policy.md`

- [x] Record current local branch, commit, runtime, route, migration, workflow,
  and filesystem state.
- [x] Mark unqueried external providers as configured in source rather than
  live-verified.
- [x] Mark the July 1 GitHub Actions pause date as expired while preserving the
  current disabled automatic triggers.

### Task 4: Verification

**Files:**
- Modify: `docs/monitors/bible-study-buddy-project-monitor.md` only if validation
  results require correction.

- [x] Run `git diff --check`; expect exit code 0.
- [x] Run documentation path/status scans; expect no obsolete canonical-path or
  stale status claims outside historical context.
- [x] From `web/`, run `npm ci`, `npm run lint`, `npm run typecheck`,
  `npm run build`, and `npm audit --audit-level=moderate`.
- [x] Update the monitor with actual results and final working-tree state.
