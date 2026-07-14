# Bible Study Buddy Project Monitor

Timestamp: 2026-07-14

## Executive Status

- Overall: **NTFS target reconstructed; controlled branch based on live
  `origin/dev-test` and ahead by two existing commits before this reconciliation;
  local delivery gates pass; provider-gate governance remains unresolved;
  merge and production promotion are blocked**.
- Canonical Windows checkout:
  `C:\Users\LattePanda\Documents\BSB-Windows`.
- Canonical WSL checkout:
  `/mnt/c/Users/LattePanda/Documents/BSB-Windows`.
- Host filesystem: Windows 11 `C:` NTFS volume.
- WSL filesystem view: DrvFS/9P (`v9fs` reported by Linux filesystem tools).
- Repository: `JMG3000/bible-study-buddy`.
- Controlled branch: `codex/restore-delivery-baseline`, based on live
  `origin/dev-test` at `485e3fb` and ahead by two existing delivery-baseline
  commits before this reconciliation.
- Pre-push snapshot before this reconciliation: no
  `origin/codex/restore-delivery-baseline` remote branch existed and the feature
  branch had not been pushed.
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
- `.codex/config.toml` is excluded locally through repository-local Git exclude
  metadata. Its contents are intentionally not recorded here.

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
| CircleCI | `.circleci/config.yml` validates only `dev-test` and `main`; heredoc indentation repaired and YAML parsed locally | At the pre-push snapshot, remote still reported the pre-repair `Unable to parse YAML` state; the feature branch is excluded by branch filters |
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
  live `origin/dev-test` at `485e3fb`. At the pre-push snapshot, its two existing
  delivery-baseline commits and this reconciliation remained local.
- Automatic GitHub Actions `push`, `pull_request`, and scheduled triggers remain
  commented out in both tracked workflows.
- The validation job now runs `npm test` after `npm ci` and before lint,
  typecheck, and build. Automatic triggers remain disabled, source remains
  manual-dispatch only, and the live gate workflow remains manually disabled.
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
  YAML parsing and shell syntax checks pass. At the pre-push snapshot, no remote
  rerun had occurred.
- `.circleci/config.yml` branch filters allow only `dev-test` and `main`.
  Pushing `codex/restore-delivery-baseline` will not trigger CircleCI, so the
  feature-branch remote observation cannot prove CircleCI execution or its
  `npm test` step. This remains an external validation and governance gap; the
  filters are unchanged because changing them is outside this reconciliation.
- GitHub/CircleCI commit status and Vercel commit status were queried. The
  Vercel deployment associated with live `dev-test` reported success.
- The older broad provider policy and newer local-plus-Vercel-plus-Meticulous
  classification disagree about mandatory gates. This remains an unresolved
  governance decision; merge and production promotion are blocked until
  maintainers choose a policy and its gates pass or are explicitly waived.

## Provider And Integration Status

| Provider/system | Source state | Live state on 2026-07-14 |
| --- | --- | --- |
| Supabase | Clients, environment contract, migrations, RLS, and webhook route configured | Settings and deployed state unverified |
| Vercel | Deployment model, analytics, env contract, and deploy hooks configured | Live `dev-test` deployment reported success; production configuration/settings unverified |
| Meticulous | Preview recorder integration configured; production recording disabled by policy | Settings and session state unverified |
| CircleCI | Validation pipeline and Slack broadcast path configured; YAML repaired and parsed locally; branch filters allow only `dev-test` and `main` | At the pre-push snapshot, queried remote state remained `Unable to parse YAML`; feature-branch pushes are filtered out |
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

1. Complete the currently authorized one-shot push of
   `codex/restore-delivery-baseline` and observe available feature-branch remote
   status without merging or promoting production.
2. Treat the expected absence of a CircleCI run as inconclusive: feature-branch
   pushes are filtered out, so proving the repaired configuration and `npm test`
   requires the repaired commit to reach `dev-test` or `main`, or an explicitly
   authorized and configured manual path that changes or bypasses the filters.
   Rerunning an earlier eligible-branch commit cannot validate the repair.
3. Decide whether to enable `Dev Test Gate and Production Promotion`, and add
   deliberate protection for `main` and `dev-test` before relying on branch
   gates.
4. Resolve the mandatory-provider policy disagreement between the older broad
   gate list and newer local-plus-Vercel-plus-Meticulous classification; do not
   merge or promote to production before that decision.
5. Verify production Vercel configuration plus Supabase, Slack, Meticulous,
   OAuth, CodeRabbit, and remaining provider settings before production
   promotion.
6. Decommission the legacy `/mnt/d/...` checkout only after NTFS validation and
   explicit deletion approval.

## Next Recommended Action

Complete the currently authorized one-shot push of
`codex/restore-delivery-baseline` and observe available feature-branch remote
status without merging or deploying production. The feature-branch push will
not trigger CircleCI because its filters allow only `dev-test` and `main`;
record that as an external validation/governance gap rather than a passing or
failing result. Resolve the provider-gate disagreement, absent branch
protection, and unverified provider settings separately; decommission the
legacy `/mnt/d/...` checkout only with explicit approval.
