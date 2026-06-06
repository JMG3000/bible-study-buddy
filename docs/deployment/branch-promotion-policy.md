# Branch Promotion Policy

Date adopted: 2026-06-05

## Branches

- `dev-test` is the development and testing branch.
- `main` is the production branch and should remain the branch Vercel uses for production deployments.

## Promotion Flow

1. Development work is pushed to `dev-test`.
2. GitHub Actions runs the `Dev Test Gate and Production Promotion` workflow.
3. The workflow validates lint, typecheck, production build, dependency audit, and CodeQL advanced analysis.
4. If every gate passes, the workflow fast-forwards `main` to match `dev-test`.
5. Vercel production should deploy from `main`.

## Safety Rules

- The promotion job uses `--ff-only`, so it will fail instead of creating a surprise merge commit if `main` has diverged.
- Keep `main` protected in GitHub branch protection.
- If branch protection blocks the default GitHub Actions token from pushing, use that failure as a signal to configure a deliberate production promotion token or require manual approval.
- Dependabot update pull requests target `dev-test`, not `main`.

## Required GitHub Settings

- Enable GitHub Actions for the repository.
- Enable Dependabot alerts and Dependabot security updates in repository security settings.
- Enable CodeQL/code scanning. The repository contains an advanced CodeQL workflow, so avoid enabling a duplicate default CodeQL setup.
- Add branch protection for `main` requiring status checks from the promotion gate and CodeQL before direct human merges.
- Confirm Vercel production branch is set to `main`; `dev-test` should remain a preview/development branch.
