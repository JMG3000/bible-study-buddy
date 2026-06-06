# Third-Party Provider Inventory

Last reviewed: 2026-06-04.

| Provider | Purpose | Runtime surface | Secret handling | Status |
| --- | --- | --- | --- | --- |
| Supabase | Database, Auth, RLS-protected app data, revalidation webhooks. | Server and browser clients. | Publishable key may be public; service role and webhook secret are server-only. | Active |
| Vercel | Hosting and deployment environment variables. | Deployment platform. | Secrets stored in Vercel env vars. | Active |
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

