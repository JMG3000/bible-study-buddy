# Analytics, Meticulous, And CircleCI Setup

Date: 2026-06-05

## Scope

- Added Vercel Web Analytics to the App Router root layout.
- Added optional Meticulous recorder script wiring through `NEXT_PUBLIC_METICULOUS_PROJECT_ID`.
- Added a deterministic rendering helper for Meticulous simulated-date headers.
- Added CircleCI validation and Meticulous companion-assets workflow for `dev-test` and `main`.

## Commands

- `npm install @vercel/analytics`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm audit --audit-level=moderate`

## Result

Local validation passed:

- Lint passed.
- Typecheck passed.
- Production build passed.
- Dependency audit found 0 vulnerabilities at `moderate` level or higher.
- Linear tracking issue created: `JAK-6`.

## Residual Risk

- CircleCI Meticulous run requires `METICULOUS_API_TOKEN` to be configured as a CircleCI secret.
- Vercel must provide `NEXT_PUBLIC_METICULOUS_PROJECT_ID` for recorder capture to load.
- Meticulous project settings should keep request stubbing compatible with App Router server components and static assets.

## Follow-Up Owner

Project maintainer.
