# Bible Study Buddy Project Monitor

Timestamp: 2026-06-19 03:31:24 -05:00

## Executive Status

- Overall: **locally healthy; external provider state not reverified**.
- Repository: `JMG3000/bible-study-buddy`
- Active branch: `dev-test`
- HEAD: `082c731` (`Merge remote-tracking branch 'origin/main' into dev-test`)
- Remote tracking: local `dev-test`, `origin/dev-test`, and `origin/main` all point to `082c731` in the locally available Git state.
- Working tree before this monitor refresh: clean.
- Production branch policy: `main` remains the Vercel production branch; `dev-test` remains the preview/development branch.
- External provider state was not queried during this recovery pass. Provider statuses below reflect committed documentation last reviewed on 2026-06-15.

## Recovered Project Memory

Bible Study Buddy: Free is a Next.js App Router application for creating,
publishing, browsing, saving, reporting, printing, and organizing Bible study
lesson plans. It uses TypeScript, Supabase Auth/Postgres with RLS, server actions,
Vercel deployments, CircleCI validation, CodeRabbit review, Meticulous preview
recording, and signed Slack DevOps commands.

Current product surfaces include:

- Public lesson and study-series browsing.
- OAuth creator accounts and profile handles.
- Draft creation, editing, publishing, layout templates, and study series.
- Saved lessons and private editable print-log snapshots.
- Lesson reporting, reviewer conversations, moderation, and admin user tools.
- Webmaster Supreme recovery controls.
- Supabase webhook revalidation and Slack-triggered validation/deploy hooks.

Repository shape:

- 21 App Router page components plus API/auth routes.
- 19 ordered Supabase migrations (`0001` through `0019`).
- Local and Docker development paths.
- CI/CD, security, provider, content-source, and audit documentation.

## Local Validation - 2026-06-19

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.2.9 / Turbopack.
- `npm audit --audit-level=moderate`: passed; 0 vulnerabilities.
- `git diff --check`: passed.
- Unresolved `TODO`, `FIXME`, `HACK`, or `XXX` markers: none found.
- Runtime used for validation: Node.js 24.14.1, npm 11.12.1.

## Branch And Delivery State

- `dev-test` is the active development/testing branch.
- Local `main` is at `a7dd1bb` and is 12 commits behind its locally known remote,
  but `origin/main` and `origin/dev-test` both point to `082c731`.
- GitHub Actions automatic `push`, `pull_request`, and scheduled triggers remain
  commented out. Manual `workflow_dispatch` is still enabled.
- The documented pause is scheduled to expire on 2026-07-01; as of this
  2026-06-19 monitor, that date is still in the future. Recheck Actions minutes
  and repository settings before restoring triggers on or after that date.
- CircleCI is configured to validate `dev-test` and `main` with install, lint,
  typecheck, build, audit, and optional Slack broadcasts.
- Production promotion is designed as a deliberate fast-forward from `dev-test`
  to `main` after local validation and Vercel/Meticulous preview review.

## Provider And Integration Memory

Per documentation last reviewed 2026-06-15:

- Supabase: active for Auth, Postgres, RLS, and revalidation webhooks.
- Vercel: active for preview and production deployment.
- Meticulous: active through Vercel preview recording; production recording is
  disabled unless explicitly approved.
- CircleCI: active build-verification source.
- CodeRabbit: active PR/diff review source.
- Slack: project channel `#proj-bible-study-buddy` (`C0B96SV684S`) with signed,
  channel-restricted DevOps commands.
- CodeQL: disabled and not an active promotion gate.
- Sentry: not configured.
- OpenAI Moderation: optional, server-side only.

## Important Operational Constraints

- Do not promote production solely from this local monitor; verify the current
  Vercel preview and Meticulous session state first.
- Do not expose Supabase service keys, OAuth secrets, Slack signing secrets,
  deployment hooks, CircleCI tokens, or OpenAI keys through `NEXT_PUBLIC_*`.
- Run Supabase migrations in order. Enum-extending migrations must be committed
  separately before later migrations that depend on the new enum values.
- GitHub Actions automation must remain a deliberate policy decision while the
  minutes/settings issue is unresolved.
- The local log files are ignored operational artifacts and are not project
  source of truth.

## Recent History

- `082c731` (2026-06-16): merged the remote production line into `dev-test`.
- `feb5596` (2026-06-15): added the signed Slack-controlled DevOps workflow.
- `dd714fc` (2026-06-15): aligned verification around Vercel previews.
- `35d029f` (2026-06-13): fixed pre-production blockers, dependency overrides,
  workflow pausing, and recorder/security configuration.
- `8bceeea` / `4292368` (2026-06-05 to 2026-06-06): introduced and refined the Meticulous
  preview gate.
- `e41f9eb` / `b67bcc2` (2026-06-05): added security, promotion, analytics, and
  workflow hardening.
- April 2026 work established layouts, printing, series, moderation, roles,
  favorites, reports, and creator editing.

## Current Risks And Follow-Ups

1. Recheck GitHub Actions minutes and re-enable intended automatic triggers on or
   after 2026-07-01 if capacity and repository settings permit.
2. Verify current CircleCI, Vercel preview, Meticulous, Supabase schema/RLS, and
   Slack integration status externally before production promotion.
3. Fast-forward the local `main` branch only when deliberately preparing or
   confirming production state.
4. Review Dependabot branches before merging major runtime/toolchain updates,
   especially Node 26, TypeScript 6, and Next.js updates.

## Next Recommended Action

Keep development on `dev-test`. Before the next production release, run the local
quality gates again, verify Vercel/Meticulous preview behavior, confirm Supabase
migrations through `0019`, then deliberately fast-forward `main` under the branch
promotion policy.
