# Meticulous Through Vercel

Last reviewed: 2026-07-14.

## Active Setup

Meticulous is connected through Vercel preview deployments, not through an active GitHub Actions visual-test gate.

The application loads the Meticulous recorder script from the App Router root layout when any of these are true:

- `NODE_ENV=development`
- `VERCEL_ENV=preview`
- `NEXT_PUBLIC_ENABLE_METICULOUS_RECORDER=true`

The recorder uses `NEXT_PUBLIC_METICULOUS_PROJECT_ID` through `web/src/lib/env.ts`.

## Vercel Environment Variables

Configure these in Vercel project settings:

- `NEXT_PUBLIC_METICULOUS_PROJECT_ID`: set for Preview. Set for Development if local Vercel dev needs it. Do not set for Production unless production recording is intentionally approved.
- `NEXT_PUBLIC_ENABLE_METICULOUS_RECORDER`: normally unset or `false`; set to `true` only for explicit recorder testing outside preview.

Do not put `METICULOUS_API_TOKEN` in browser-exposed variables. It is only needed for CI/API-driven Meticulous runs, which are currently inactive for this project.

## Preview Review Flow

1. Push work to `dev-test`.
2. Verify the Vercel preview deployment for the branch.
3. Open and exercise the preview so Meticulous can record sessions.
4. Review Meticulous results in the Meticulous project dashboard.
5. Broadcast the preview/Meticulous status to `#proj-bible-study-buddy`.
6. The older broad promotion policy requires local validation, CircleCI,
   CodeRabbit, Vercel, Supabase, and Meticulous preview review to pass or be
   explicitly waived. A newer classification instead treats local validation,
   Vercel preview, and Meticulous review as mandatory and the other providers as
   supporting evidence.
7. This provider-policy disagreement is an unresolved governance decision; do
   not merge or promote to production until maintainers select the governing
   policy and its gates pass or are explicitly waived.

## Deterministic Rendering

The app supports Meticulous deterministic rendering headers:

- `meticulous-is-test: 1`
- `meticulous-simulated-date`

These are handled in `web/src/lib/meticulous.ts`.

## Deferred CI Mode

The prior GitHub Actions/CircleCI tunnel-style Meticulous jobs are not the active source of truth while GitHub Actions minutes are exhausted. If CI-driven visual testing is restored later, prefer a dedicated workflow and keep Vercel preview recording documented here as the normal manual review path.

## Related Verification

See `docs/deployment/verification-and-broadcasts.md` for the full verification source list and Slack broadcast channel.
