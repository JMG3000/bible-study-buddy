# Verification And Broadcasts

Last source and limited live-status review: 2026-07-14.

Live queries were limited to GitHub repository/workflow state,
GitHub/CircleCI commit status surfaces, and Vercel commit/deployment status.
`Configured in source` does not prove provider settings are connected, healthy,
or authorized.

For volatile branch, workflow, deployment, and provider status, use
`docs/monitors/bible-study-buddy-project-monitor.md` as the authority.

## Promotion Gates And Supporting Systems

Mandatory promotion gates are fresh local validation at the promotion SHA plus
successful Vercel preview and Meticulous recorder review. GitHub Actions and
CircleCI are supporting automation, not mandatory passing gates while disabled
or unavailable. Slack is trigger/broadcast transport, not verification.

| Service | Classification | Role | Current status |
| --- | --- | --- | --- |
| Local WSL validation | Mandatory promotion gate | From the repository root, run `npm --prefix web test`, `npm --prefix web run lint`, `npm --prefix web run typecheck`, `npm --prefix web run build`, and `npm --prefix web audit --audit-level=moderate`. Use `npm --prefix web ci` for a clean install when required. | Passed 2026-07-14 on the delivery-baseline worktree based on `485e3fb`: 7 tests, lint, typecheck, build, audit, YAML parse, and diff check |
| Vercel preview | Mandatory promotion gate | Preview deployment verification, preview URL, build status, and runtime signal review. | Live `dev-test` deployment at `485e3fb` reported success; production configuration/settings unverified |
| Meticulous | Mandatory promotion gate | Visual/session review through the Vercel preview and App Router recorder. | Preview recorder configured; settings and session state unverified |
| GitHub Actions | Supporting automation | Manual validation, promotion, and secret-pattern scan workflows. | `Dev Test Gate and Production Promotion` manually disabled; `Security Review` active but source is manual-dispatch only; not an available mandatory gate |
| CircleCI | Supporting automation | Optional duplicate build verification for `dev-test` and `main`. | Heredoc terminators repaired and YAML parsed locally; remote still reports the pre-repair `Unable to parse YAML` state because no push/rerun occurred |
| CodeRabbit | Supporting evidence | Code review on PRs and configured review policy through `.coderabbit.yaml`. | Configured in source; settings and review state unverified |
| Supabase | Supporting release evidence | Database/schema/RLS verification through SQL editor and application smoke checks. | Client/schema integration configured; settings and deployed state unverified |
| Slack | Transport only | Broadcasts integration status and carries signed DevOps commands. | Endpoint/channel configured; settings and integration state unverified |

## Slack Broadcast Channel

- Channel: `#proj-bible-study-buddy`
- Channel ID: `C0B96SV684S`
- Purpose: integration status, deployment state, build verification, dependency audit status, preview readiness, Supabase schema/RLS notes, CodeRabbit review status, and Meticulous/Vercel preview notes.

## Slack Command Endpoint

- Endpoint: `/api/devops/slack`
- Request source: Slack slash command or Slack interactivity request.
- Authentication: Slack request signing with `SLACK_SIGNING_SECRET`.
- Authorization: `SLACK_ALLOWED_CHANNEL_ID` and optional comma-separated `SLACK_ALLOWED_USER_IDS`.

Supported commands:

| Command | Action |
| --- | --- |
| `status` | Returns the current verification source map. |
| `validate` | Triggers CircleCI validation for `dev-test`. |
| `deploy-preview` | Calls the configured Vercel preview deploy hook. |
| `promote-production confirm` | Calls the configured Vercel production deploy hook. The `confirm` argument is mandatory. |
| `help` | Shows the command list. |

Required server-side environment variables:

| Variable | Purpose |
| --- | --- |
| `SLACK_SIGNING_SECRET` | Verifies Slack request signatures. |
| `SLACK_ALLOWED_CHANNEL_ID` | Restricts commands to the project channel. |
| `SLACK_ALLOWED_USER_IDS` | Optional comma-separated user allowlist. |
| `SLACK_BROADCAST_WEBHOOK_URL` | Sends status broadcasts back to Slack. |
| `CIRCLECI_API_TOKEN` | Allows the `validate` command to trigger CircleCI. |
| `CIRCLECI_PROJECT_SLUG` | CircleCI project slug, for example `gh/JMG3000/bible-study-buddy`. |
| `VERCEL_PREVIEW_DEPLOY_HOOK_URL` | Allows the `deploy-preview` command to trigger Vercel. |
| `VERCEL_PRODUCTION_DEPLOY_HOOK_URL` | Allows the confirmed production promotion command to trigger Vercel. |

## Broadcast Format

Use this compact format for status updates:

```md
**Bible Study Buddy integration status**
- Branch: `dev-test`
- Commit: `<sha>`
- CircleCI: `<status>`
- CodeRabbit: `<status>`
- Vercel preview: `<status/url>`
- Supabase: `<status>`
- Meticulous via Vercel: `<status>`
- Blockers: `<none/list>`
- Next action: `<action>`
```

## Current Policy

- CodeQL is disabled and is not a verification source.
- GitHub Actions automatic triggers remain disabled in source. The gate workflow
  is also manually disabled in live GitHub state; the Security Review workflow
  is active but remains manual-dispatch only in source.
- GitHub branch-protection queries found no protection for `main` at `082c731`
  or `dev-test` at `485e3fb`.
- CircleCI cannot supply supporting validation while its remote status reports
  `Unable to parse YAML`. The source repair passes local YAML and shell checks;
  record provider validation only after an authorized push and successful run.
- Fresh local validation at the promotion SHA remains required. From the
  repository root, use `npm --prefix web test`, `npm --prefix web run lint`,
  `npm --prefix web run typecheck`, `npm --prefix web run build`, and
  `npm --prefix web audit --audit-level=moderate`; use `npm --prefix web ci`
  when a clean dependency install is required.
- Vercel preview plus Meticulous recorder review replaces the prior CI-tunnel Meticulous gate.
- GitHub Actions and CircleCI may add supporting evidence when available, but
  neither is a mandatory promotion gate in its current unavailable state.
- Slack may trigger validation and deploy hooks, but it is transport only and
  does not bypass signature verification, channel restrictions, user allowlists,
  or the `confirm` requirement for production.
