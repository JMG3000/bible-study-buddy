# Analytics, Meticulous, And CircleCI Setup

Date: 2026-06-05

## Scope

- Added Vercel Web Analytics to the App Router root layout.
- Added Meticulous recorder script wiring for local development and Vercel preview environments, with both recording token and project ID support.
- Added a deterministic rendering helper for Meticulous simulated-date headers.
- Added CircleCI validation and Meticulous companion-assets workflow for `dev-test` and `main`; as of 2026-06-15, Vercel preview recorder capture is the active Meticulous path.

## Commands

- `npm install @vercel/analytics`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm audit --audit-level=moderate`
- `git diff --check`
- `~/.local/bin/coderabbit review --agent --type uncommitted --dir web`
- `actionlint` when available, otherwise GitHub Actions remote validation after push
- `circleci config validate` when available, otherwise CircleCI remote validation after push

## Result

Local validation passed:

- Lint passed.
- Typecheck passed.
- Production build passed.
- Dependency audit found 0 vulnerabilities at `moderate` level or higher.
- Linear tracking issue created: `JAK-6`.
- Meticulous recorder wiring is validated by checking for `NEXT_PUBLIC_ENABLE_METICULOUS_RECORDER`, `NEXT_PUBLIC_METICULOUS_PROJECT_ID`, `data-recording-token`, and the deterministic `meticulous-is-test=1` helper.
- Project-local skills are restored in the ignored `.agents/skills` lane for the tool groups used by the project.

## Residual Risk

- CircleCI/GitHub Actions Meticulous runs require `METICULOUS_API_TOKEN`, but CI-driven Meticulous is currently inactive.
- Vercel preview capture requires `NEXT_PUBLIC_METICULOUS_PROJECT_ID` to be configured for Vercel preview deployments.
- Recorder capture intentionally loads for development, Vercel preview, or when `NEXT_PUBLIC_ENABLE_METICULOUS_RECORDER=true`. Keep `NEXT_PUBLIC_METICULOUS_PROJECT_ID` configured where recorder capture is expected.
- Meticulous project settings should keep request stubbing compatible with App Router server components and static assets.

## Follow-Up Owner

Project maintainer.
