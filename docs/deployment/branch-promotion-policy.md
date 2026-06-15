# Branch Promotion Policy

Date adopted: 2026-06-05

## Branches

- `dev-test` is the development and testing branch.
- `main` is the production branch and should remain the branch Vercel uses for production deployments.

## Promotion Flow

1. Development work is pushed to `dev-test`.
2. Vercel creates a preview deployment from `dev-test`.
3. Meticulous connects through the Vercel preview by using the App Router recorder script and the Vercel preview URL.
4. Local validation remains required before promotion: lint, typecheck, production build, and dependency audit.
5. If local validation and Vercel/Meticulous preview review pass, promote `main` deliberately.
6. Vercel production should deploy from `main`.

## Safety Rules

- The promotion job uses `--ff-only`, so it will fail instead of creating a surprise merge commit if `main` has diverged.
- Keep `main` protected in GitHub branch protection.
- If branch protection blocks the default GitHub Actions token from pushing, use that failure as a signal to configure a deliberate production promotion token or require manual approval.
- Dependabot update pull requests target `dev-test`, not `main`.
- Automatic GitHub Actions triggers are paused while Actions minutes are unavailable; manual `workflow_dispatch` remains available for targeted checks.
- CodeQL is disabled for this repository and is not an active promotion gate.

## Required GitHub Settings

- GitHub Actions can stay available for manual `workflow_dispatch`, but automatic triggers should remain paused until project minutes are available again.
- Enable Dependabot alerts and Dependabot security updates in repository security settings.
- Do not require CodeQL/code scanning until the repository has code scanning enabled again.
- Add branch protection for `main` requiring the checks that are actually active for the repository.
- Confirm Vercel production branch is set to `main`; `dev-test` should remain a preview/development branch.
- Confirm Meticulous has access to Vercel preview URLs and that `NEXT_PUBLIC_METICULOUS_PROJECT_ID` is configured for Vercel preview environments.
