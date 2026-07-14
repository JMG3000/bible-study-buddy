# Windows 11, NTFS, and WSL Filesystem Design

## Goal

Make `C:\Users\LattePanda\Documents\BSB-Windows` the canonical Windows 11
checkout and document its WSL view, system status, generated paths, and unsafe
or obsolete path patterns.

## Operating Model

- One physical Git checkout lives on the Windows `C:` NTFS volume.
- Windows tools address it as `C:\Users\LattePanda\Documents\BSB-Windows`.
- WSL tools address the same files as
  `/mnt/c/Users/LattePanda/Documents/BSB-Windows` through DrvFS/9P.
- Linux Node.js, npm, Git, and project commands run from WSL.
- Git history and tracked files remain the source of truth. Generated output,
  dependencies, local secrets, and logs do not.

## Documentation Units

1. `docs/architecture/windows-wsl-filesystem.md`
   - Canonical Windows/WSL path map.
   - Repository directory responsibilities.
   - Generated and secret path classifications.
   - Problematic/pathological locations and recovery rules.
2. `docs/monitors/bible-study-buddy-project-monitor.md`
   - Current local Git, runtime, application, database, CI, and provider state.
   - Clear distinction between locally verified facts and external services that
     were not queried.
3. `README.md`
   - Windows 11 + WSL setup and navigation commands.
   - Current documentation index.
4. Provider and verification docs
   - Replace ambiguous live-status claims with source-configuration status and
     explicit live-verification state.
   - Record the expired GitHub Actions pause date without silently re-enabling
     workflows.

## Path Rules

- Canonical Windows root:
  `C:\Users\LattePanda\Documents\BSB-Windows`.
- Canonical WSL root:
  `/mnt/c/Users/LattePanda/Documents/BSB-Windows`.
- Canonical application root: `<repo>/web`.
- Never maintain `/mnt/d/repos/codex-projects/bible-study-buddy` as a second
  active checkout after the NTFS transition is accepted.
- Never share `web/node_modules` or `web/.next` between Windows Node.js and WSL
  Node.js executions.
- Never commit `web/.env.local`, generated output, or runtime logs.
- Treat Windows case-insensitivity, DrvFS permission translation, and symlink
  behavior as constraints; avoid case-only path differences and Linux-native
  permission assumptions.

## Status Semantics

- `Verified locally`: observed from the NTFS target during this audit.
- `Configured in source`: implementation or configuration exists in tracked
  files but the provider was not queried.
- `Not configured`: no active tracked implementation exists.
- `Optional`: supported but inactive without environment configuration.
- `Decision required`: a dated policy expired while the source configuration
  remained unchanged.

## Validation

- Confirm Git branch, HEAD, tracking, and clean baseline before edits.
- Confirm NTFS target visibility through WSL DrvFS/9P.
- Run Markdown consistency/path scans and `git diff --check`.
- Install dependencies in the NTFS target with WSL npm when absent.
- Run lint, typecheck, production build, and moderate dependency audit.
- Record failures as current evidence; do not copy old pass results forward.
