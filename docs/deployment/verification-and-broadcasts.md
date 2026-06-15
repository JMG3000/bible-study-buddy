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
