# Third-Party Provider Inventory

Source/live-state review: 2026-09-15.

This file records provider roles and the latest evidence available at the review
snapshot. Reverify live state before release-affecting action. Use
`docs/monitors/bible-study-buddy-project-monitor.md` for the complete current
release boundary.

| Provider | Purpose | Runtime surface | Secret handling | Current evidence |
| --- | --- | --- | --- | --- |
| Supabase | Database, Auth, RLS-protected app data, migrations, revalidation webhooks | Server/browser clients and provider platform | Publishable key may be public; service role/webhook secrets server-only | Source integration present. PR #59 Supabase Preview is skipped because per-PR preview branches are disabled. Migration `0020` non-production validation remains outstanding. |
| Vercel | Hosting, preview/production deployments, environment variables | Deployment platform | Secrets in Vercel env vars | PR #59 preview for `c8d4430...` reported Ready/success. Production configuration is not established by that preview result. |
| Meticulous | Optional preview visual/session testing | Browser recorder in configured development/preview contexts | Public project ID may be browser-visible; API token must remain CI/server-only | Advisory only. PR #59 bot report says project is deactivated and no test run occurred. |
| CircleCI | Canonical automatic clean-environment application validation | GitHub App -> CircleCI workflow | API/context secrets server/CI-only | Current filters include `dev-test`, `main`, Dependabot branches, and `codex/bsbuddy-*`. PR #59 produced one failing `validate` execution; recovered differential diagnosis attributes failure to pre-existing dependency audit findings, not BSBUDDY-6. |
| GitHub Actions | Supporting manual validation/security workflows | GitHub workflow service | Repository/environment secrets in GitHub | Current workflow definitions are manual-dispatch only. `dev-test-gate.yml` still contains an obsolete `promote-to-main` job that is unreachable under current triggers; PR #59 removes it. No PR-triggered workflow run was observed for `c8d4430...`. |
| CodeRabbit | PR/diff review | GitHub PR review | Review service processes approved repository diff/context | Advisory only. Auto review on PR #59 was skipped because the base is not the default branch. |
| Slack | Validation/preview command transport and status broadcasts | `/api/devops/slack` and configured workspace/channel | Signing secret, webhook URLs, tokens server-only | Current `dev-test` still contains `promote-production confirm` and a production deploy-hook path, which conflicts with ratified policy. PR #59 removes that authority. Do not treat the current production command as approved. |
| Google OAuth | User sign-in | Supabase Auth provider flow | OAuth client secret in provider settings | Supported in source; live provider configuration not verified in this review. |
| GitHub OAuth | User sign-in | Supabase Auth provider flow | OAuth client secret in provider settings | Supported in source; live provider configuration not verified in this review. |
| OpenAI Moderation | Optional lesson content review | Server-side request | `OPENAI_API_KEY` server-only | Optional source integration; provider configuration not verified in this review. |
| BibleGateway | Scripture-reference outbound links | Public browser links | No app secret | Source behavior only; endpoint not queried in this review. |
| Scripture tooltip script | Optional UI enhancement | Browser script when enabled | No secret in script URL | Disabled by default unless explicitly configured. |
| Sentry | Optional runtime monitoring | Not currently configured in tracked source | DSN may be public; auth tokens server/CI-only | Not configured in tracked source. |

## Provider rules

- Do not expose service-role keys, webhook secrets, OAuth client secrets, OpenAI keys, CI tokens, or deploy hooks through `NEXT_PUBLIC_*`.
- Keep Meticulous advisory; do not convert it into a required merge gate without a new policy decision.
- Slack must not retain or regain independent production authority after BSBUDDY-6 integration.
- A provider `skipped` result is not evidence that provider-specific behavior passed.
- Provider status must be tied to an exact SHA when used in a release decision.
