# GitHub Security And Promotion Workflows

Date: 2026-06-05

## Scope

- Added `dev-test` as the development branch lane.
- Added production promotion from `dev-test` to `main` after validation and CodeQL pass.
- Added advanced CodeQL configuration.
- Added Dependabot configuration for npm, GitHub Actions, and Docker updates targeting `dev-test`.
- Added dependency review, secret-pattern scan, OpenSSF Scorecard, and CODEOWNERS.

## Commands

- `git status --short --branch`
- `git diff --check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm audit --audit-level=moderate`

## Result

Local validation passed:

- Diff whitespace check passed.
- Lint passed.
- Typecheck passed.
- Production build passed.
- Dependency audit found 0 vulnerabilities at `moderate` level or higher.

## Residual Risk

- GitHub branch protection must be configured in GitHub settings.
- Vercel production branch must remain `main` in Vercel settings.
- If `main` protection blocks `GITHUB_TOKEN` pushes, add a deliberate manual approval or production promotion token instead of weakening branch protection.

## Follow-Up Owner

Project maintainer.
