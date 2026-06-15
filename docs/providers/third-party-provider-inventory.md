# Third-Party Provider Inventory

Last reviewed: 2026-06-15.

| Provider | Purpose | Runtime surface | Secret handling | Status |
| --- | --- | --- | --- | --- |
| Supabase | Database, Auth, RLS-protected app data, revalidation webhooks. | Server and browser clients. | Publishable key may be public; service role and webhook secret are server-only. | Active |
| Vercel | Hosting and deployment environment variables. | Deployment platform. | Secrets stored in Vercel env vars. | Active |
| Meticulous | Preview visual testing through Vercel preview deployments and the App Router recorder script. | Browser recorder on local development and Vercel preview only. | `NEXT_PUBLIC_METICULOUS_PROJECT_ID` may be public; `METICULOUS_API_TOKEN` is CI/API-only and currently inactive. | Active through Vercel preview |
| CircleCI | Build verification for install, lint, typecheck, build, and dependency audit. | CI runner. | Project secrets stay in CircleCI contexts/env vars. | Active |
| CodeRabbit | Pull request and diff review. | GitHub PR review and local CLI when explicitly approved. | Review upload may include code diff; do not run on sensitive unapproved diffs. | Active |
| Slack | Broadcast channel for integration connection status and DevOps metrics. | `#proj-bible-study-buddy` channel. | Do not post secrets, raw env values, private tokens, or service-role keys. | Active |
| Google OAuth | User sign-in. | Supabase Auth provider redirect flow. | OAuth client secret belongs in Supabase provider settings, not app code. | Active |
| GitHub OAuth | User sign-in. | Supabase Auth provider redirect flow. | OAuth client secret belongs in Supabase provider settings, not app code. | Active |
| OpenAI Moderation | Optional lesson content review before publishing. | Server-side fetch only. | `OPENAI_API_KEY` is server-only. | Optional |
| BibleGateway | Scripture reference outbound links. | Public outbound links from scripture chips. | No app secret. | Active |
| Scripture tooltip script | Optional third-party UI enhancement. | Browser script loaded only when env mode is not `off`. | No secret should be placed in script URL. | Disabled by default |
| Sentry | Optional runtime monitoring. | Not currently configured in source. | DSN can be public; auth tokens must remain server/CI-only. | Not configured |

## Provider Rules

- Do not add a new browser script provider until it is documented here.
- Keep `NEXT_PUBLIC_SCRIPTURE_TOOLTIP_MODE=off` unless the provider URL is approved.
- Do not expose service-role keys, webhook secrets, OAuth client secrets, OpenAI keys, or Sentry auth tokens through `NEXT_PUBLIC_*`.
- Keep Meticulous production recording disabled unless it is intentionally approved.
