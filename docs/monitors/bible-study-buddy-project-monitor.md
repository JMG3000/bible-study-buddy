# Bible Study Buddy Project Monitor

Timestamp: 2026-07-14

## Executive Status

- Overall: **NTFS target reconstructed; controlled branch based on live
  `origin/dev-test`; local delivery gates pass; CircleCI source repaired locally;
  provider settings remain unverified**.
- Canonical Windows checkout:
  `C:\Users\LattePanda\Documents\BSB-Windows`.
- Canonical WSL checkout:
  `/mnt/c/Users/LattePanda/Documents/BSB-Windows`.
- Host filesystem: Windows 11 `C:` NTFS volume.
- WSL filesystem view: DrvFS/9P (`v9fs` reported by Linux filesystem tools).
- Repository: `JMG3000/bible-study-buddy`.
- Controlled branch: `codex/restore-delivery-baseline`, based on `485e3fb`,
  which equaled live `origin/dev-test` after fetch.
- Previous local `dev-test` HEAD: `52057e4` (`feat: add lesson duplication and
  remix attribution`), two commits behind live `origin/dev-test`.
- The fetch advanced `origin/dev-test` through `197c1b1` (`actions/checkout` v7)
  and `485e3fb` (`eslint-config-next` 16.2.10).
- Live branch snapshot: `origin/dev-test` is `485e3fb`; `origin/main` is
  `082c731`.
- Remote URL: `https://github.com/JMG3000/bible-study-buddy.git`.
- GitHub repository/workflow state, GitHub/CircleCI commit status surfaces, and
  Vercel commit/deployment status were queried on 2026-07-14. Provider settings
  were not verified.

## Reconstruction Status

- The NTFS target began as an empty Git repository with no commits, files, or
  remote.
- It was reconstructed from the clean local recovery checkout at
  `/mnt/d/repos/codex-projects/bible-study-buddy`.
- GitHub was restored as `origin`; `dev-test` tracks `origin/dev-test`.
- The recovery checkout is now a legacy duplicate, not the canonical working
  directory. Do not edit both copies.
- Filesystem architecture and path hazards are documented in
  `docs/architecture/windows-wsl-filesystem.md`.

## Local System Inventory

| System | Local evidence | Status |
| --- | --- | --- |
| Git checkout | 140 tracked files before this documentation update; branch and remote restored | Verified locally |
| WSL | Linux `6.18.33.1-microsoft-standard-WSL2`; Ubuntu 24.04.4 LTS | Verified locally |
| Node.js | `v24.14.1` | Verified locally |
| npm | `11.11.0` | Verified locally |
| Next.js tooling | Next.js `^16.2.9`; `eslint-config-next` 16.2.10 after `485e3fb` | Configured in source |
| Application routes | 21 `page.tsx` files and 5 `route.ts` handlers | Verified locally |
| Supabase schema | 20 migrations, `0001` through `0020` | Verified locally |
| Dependencies | Local install updated for the delivery-baseline worktree; Vitest 4.1.10 added as a development dependency | Verified locally; audit reports 0 vulnerabilities |
| Build output | Next.js 16.2.9/Turbopack production output generated from the delivery-baseline worktree | Verified locally on 2026-07-14 |
| Docker | `docker-compose.yml` and `web/Dockerfile` present | Configured; not run |
| GitHub Actions | Two source workflows with manual dispatch only | `Dev Test Gate and Production Promotion` manually disabled; `Security Review` active |
| CircleCI | `.circleci/config.yml` intends to validate `dev-test` and `main`; heredoc indentation repaired and YAML parsed locally | Remote still reports the pre-repair `Unable to parse YAML` state; no push or rerun authorized |
| CodeRabbit | `.coderabbit.yaml` present | Configured; provider settings unverified |

## Application Status

- Next.js App Router application with TypeScript and React 19.
- Supabase Auth/Postgres integration with RLS-oriented migrations.
- Public lessons and series; authenticated creation and dashboards.
- Layout templates, saved lessons, private print logs, reporting, review, and
  administration surfaces.
- Recent application work adds lesson duplication/remix attribution and migration
  `0020_add_lesson_remix_parent.sql`.
- The two live commits beyond the prior local HEAD update `actions/checkout` to
  v7 and `eslint-config-next` to 16.2.10.
- Vercel Analytics and optional Meticulous preview recorder are present in
  source.
- Signed, channel-restricted Slack DevOps endpoint can trigger CircleCI
  validation and configured Vercel deploy hooks.

## Local Validation - 2026-07-14

Fresh results for the delivery-baseline worktree based on `485e3fb`:

- CircleCI configuration: local PyYAML parse passed after indenting the two
  heredoc terminators; extracted shell bodies also passed `bash -n` during the
  focused repair check.
- `npm test`: passed; 3 Vitest files and 7 tests cover redirect sanitization,
  Slack signature/replay/requester boundaries, and malformed moderation output.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.2.9/Turbopack; 29 route entries plus
  the proxy were emitted.
- `npm audit --audit-level=moderate`: passed; 0 vulnerabilities.
- `git diff --check`: passed.
- Runtime: Node.js 24.14.1 and npm 11.11.0.
- WSL/NTFS test-runner note: the runner uses Linux `/tmp` when inherited temp
  configuration points at an unavailable or Windows-mounted path.

Historical 2026-07-13 results at `52057e4` are superseded for local delivery
readiness. They remain available in Git history.

## Branch And Delivery Status

- `dev-test` remains the development/testing branch; live `origin/dev-test` is
  `485e3fb`.
- `main` remains the intended Vercel production branch; live `origin/main` is
  `082c731`.
- The controlled local branch `codex/restore-delivery-baseline` was created from
  live `origin/dev-test` at `485e3fb`; delivery-baseline changes remain local.
- Automatic GitHub Actions `push`, `pull_request`, and scheduled triggers remain
  commented out in both tracked workflows.
- Both workflows retain `workflow_dispatch` in source. In live GitHub state,
  `Dev Test Gate and Production Promotion` is manually disabled; `Security
  Review` is active but its source triggers are manual-dispatch only.
- The documented Actions pause expired on 2026-07-01. Because source still has
  automatic triggers disabled, repository-owner verification and a deliberate
  re-enable/extend decision are required.
- Neither `main` at `082c731` nor `dev-test` at `485e3fb` has GitHub branch
  protection.
- CircleCI still reports the pre-repair `Unable to parse YAML` remote state.
  Locally, the invalid heredoc terminators at `.circleci/config.yml:61` and
  `.circleci/config.yml:81` were indented into their YAML block scalars; local
  YAML parsing and shell syntax checks pass. No push or remote rerun occurred.
- GitHub/CircleCI commit status and Vercel commit status were queried. The
  Vercel deployment associated with live `dev-test` reported success.
- Production promotion remains a deliberate fast-forward after local and
  preview verification.

## Provider And Integration Status

| Provider/system | Source state | Live state on 2026-07-14 |
| --- | --- | --- |
| Supabase | Clients, environment contract, migrations, RLS, and webhook route configured | Settings and deployed state unverified |
| Vercel | Deployment model, analytics, env contract, and deploy hooks configured | Live `dev-test` deployment reported success; production configuration/settings unverified |
| Meticulous | Preview recorder integration configured; production recording disabled by policy | Settings and session state unverified |
| CircleCI | Validation pipeline and Slack broadcast path configured; YAML repaired and parsed locally | Queried remote state remains `Unable to parse YAML`; no push/rerun occurred |
| CodeRabbit | Review policy configured | Settings and review state unverified |
| Slack | Signed command endpoint and project channel ID configured | Settings and channel/integration state unverified |
| GitHub Actions | Source workflows are manual-dispatch only | Gate workflow manually disabled; Security Review active; other settings unverified |
| Google/GitHub OAuth | Supported through Supabase Auth | Provider settings unverified |
| OpenAI Moderation | Optional server-side integration | Not configured locally |
| BibleGateway | Public outbound scripture links configured | Endpoint not queried |
| Scripture tooltip script | Optional and disabled by default | Not queried |
| Sentry | No source integration | Not configured |

## Filesystem And Path Risks

1. Duplicate active checkout at `/mnt/d/repos/codex-projects/bible-study-buddy`.
2. Windows Node.js and WSL Node.js sharing `web/node_modules` or `web/.next`.
3. Windows path syntax used in Bash or `/mnt/c` syntax used in incompatible
   Windows tools.
4. Case-only filenames, Linux permission assumptions, or symlink assumptions on
   NTFS through DrvFS.
5. Treating `.env.local`, `.next`, `node_modules`, `.vercel`, or local logs as
   portable/source-controlled state.

## Current Blockers And Decisions

1. Review the local delivery-baseline commits; authorize a push separately only
   if remote CircleCI and preview validation should begin.
2. After an authorized push, verify CircleCI parses and executes the repaired
   configuration; local parsing does not prove provider execution.
3. Decide whether to enable `Dev Test Gate and Production Promotion`, and add
   deliberate protection for `main` and `dev-test` before relying on branch
   gates.
4. Verify production Vercel configuration plus Supabase, Slack, Meticulous,
   OAuth, CodeRabbit, and remaining provider settings before production
   promotion.
5. Decommission the legacy `/mnt/d/...` checkout only after NTFS validation and
   explicit deletion approval.

## Next Recommended Action

Review the local commits in the canonical NTFS checkout. The next authorization,
if desired, should allow pushing `codex/restore-delivery-baseline` and observing
CircleCI/Vercel preview results without merging or deploying production. Resolve
absent branch protection and unverified provider settings separately;
decommission the legacy `/mnt/d/...` checkout only with explicit approval.
