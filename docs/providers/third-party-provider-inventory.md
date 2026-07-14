# Third-Party Provider Inventory

Last source and limited live-status review: 2026-07-14.

Live queries were limited to GitHub repository/workflow state,
GitHub/CircleCI commit status surfaces, and Vercel commit/deployment status.
Provider configuration/settings remain unverified unless explicitly stated.
Use `docs/monitors/bible-study-buddy-project-monitor.md` as the authority for
volatile branch, workflow, deployment, and provider-status observations.

| Provider | Purpose | Runtime surface | Secret handling | Status |
| --- | --- | --- | --- | --- |
| Supabase | Database, Auth, RLS-protected app data, revalidation webhooks. | Server and browser clients. | Publishable key may be public; service role and webhook secret are server-only. | Configured in source; settings and deployed state unverified |
| Vercel | Hosting and deployment environment variables. | Deployment platform. | Secrets stored in Vercel env vars. | Live `dev-test` deployment at `485e3fb` reported success; production configuration/settings unverified |
| Meticulous | Preview visual testing through Vercel preview deployments and the App Router recorder script. | Browser recorder on local development and Vercel preview only. | `NEXT_PUBLIC_METICULOUS_PROJECT_ID` may be public; source documentation describes `METICULOUS_API_TOKEN` as CI/API-only and inactive in the documented path. | Preview recorder configured; settings and session state unverified |
| CircleCI | Build verification for install, lint, typecheck, build, and dependency audit; triggerable from the Slack DevOps command endpoint. | CI runner and CircleCI API. | `CIRCLECI_API_TOKEN` is server-only; project secrets stay in CircleCI contexts/env vars. | YAML repaired and parsed locally; queried remote state remains the pre-repair `Unable to parse YAML`; no push/rerun occurred |
| GitHub Actions | Manual validation, promotion, and security review workflows. | GitHub workflow service. | Repository/environment secrets remain in GitHub. | `Dev Test Gate and Production Promotion` manually disabled; `Security Review` active but source is manual-dispatch only; other settings unverified |
| CodeRabbit | Pull request and diff review. | GitHub PR review and local CLI when explicitly approved. | Review upload may include code diff; do not run on sensitive unapproved diffs. | Policy configured; settings and review state unverified |
| Slack | Broadcast channel for integration connection status and DevOps metrics; signed DevOps command input. | `#proj-bible-study-buddy` channel and `/api/devops/slack`. | `SLACK_SIGNING_SECRET` and webhook URLs are server-only. Do not post secrets, raw env values, private tokens, or service-role keys. | Endpoint/channel configured; settings and integration state unverified |
| Google OAuth | User sign-in. | Supabase Auth provider redirect flow. | OAuth client secret belongs in Supabase provider settings, not app code. | Supported in source; provider settings unverified |
| GitHub OAuth | User sign-in. | Supabase Auth provider redirect flow. | OAuth client secret belongs in Supabase provider settings, not app code. | Supported in source; provider settings unverified |
| OpenAI Moderation | Optional lesson content review before publishing. | Server-side fetch only. | `OPENAI_API_KEY` is server-only. | Optional |
| BibleGateway | Scripture reference outbound links. | Public outbound links from scripture chips. | No app secret. | Configured in source; endpoint not queried |
| Scripture tooltip script | Optional third-party UI enhancement. | Browser script loaded only when env mode is not `off`. | No secret should be placed in script URL. | Disabled by default |
| Sentry | Optional runtime monitoring. | Not currently configured in source. | DSN can be public; auth tokens must remain server/CI-only. | Not configured |

## Provider Rules

- Do not add a new browser script provider until it is documented here.
- Keep `NEXT_PUBLIC_SCRIPTURE_TOOLTIP_MODE=off` unless the provider URL is approved.
- Do not expose service-role keys, webhook secrets, OAuth client secrets, OpenAI keys, or Sentry auth tokens through `NEXT_PUBLIC_*`.
- Keep Meticulous production recording disabled unless it is intentionally approved.
- Slack DevOps commands must remain signed, channel-restricted, and allowlisted for sensitive operations.
