# Verification And Broadcasts

Last reviewed: 2026-06-15.

## Verification Sources

Use these services together before production promotion:

| Service | Role | Current status |
| --- | --- | --- |
| CircleCI | Build verification for `dev-test` and `main`: install, lint, typecheck, build, and dependency audit. | Active |
| CodeRabbit | Code review on PRs and configured review policy through `.coderabbit.yaml`. | Active |
| Vercel | Preview and production deployment verification, preview URLs, build status, and runtime signal review. | Active |
| Supabase | Database/schema/RLS verification through SQL editor, MCP checks, and application integration smoke checks. | Active |
| Meticulous | Visual/session review through Vercel preview deployments and the App Router recorder. | Active through Vercel preview |
| Slack | Broadcast channel for integration connection status and DevOps metrics. | Active channel selected |

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
- GitHub Actions automatic triggers remain paused while Actions minutes are unavailable.
- Manual local validation remains required before promotion.
- Vercel preview plus Meticulous recorder review replaces the prior CI-tunnel Meticulous gate.
- Slack may trigger validation and deploy hooks, but it does not bypass signature verification, channel restrictions, user allowlists, or the `confirm` requirement for production.
