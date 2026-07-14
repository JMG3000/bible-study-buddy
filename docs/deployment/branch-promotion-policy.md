# Branch Promotion Policy

Date adopted: 2026-06-05

Current delivery-state review: 2026-07-14.

Use `docs/monitors/bible-study-buddy-project-monitor.md` as the authority for
volatile branch, workflow, deployment, and provider-status observations.

## Branches

- `dev-test` is the development and testing branch.
- `main` is the production branch and should remain the branch Vercel uses for production deployments.
- Live refs reviewed on 2026-07-14: `dev-test` at `485e3fb`; `main` at
  `082c731`. The controlled local branch equals live `origin/dev-test`.

## Promotion Flow

1. Development work is pushed to `dev-test`.
2. Vercel creates a preview deployment from `dev-test`.
3. Meticulous connects through the Vercel preview by using the App Router recorder script and the Vercel preview URL.
4. Fresh local validation at the promotion SHA remains required. From the
   repository root, run `npm --prefix web test`, `npm --prefix web run lint`,
   `npm --prefix web run typecheck`, `npm --prefix web run build`, and
   `npm --prefix web audit --audit-level=moderate`; use `npm --prefix web ci`
   when a clean install is required. The delivery-baseline worktree passed this
   local gate set on 2026-07-14.
5. If local validation and Vercel/Meticulous preview review pass, promote `main` deliberately.
6. Vercel production should deploy from `main`.

## Safety Rules

- The promotion job uses `--ff-only`, so it will fail instead of creating a surprise merge commit if `main` has diverged.
- Keep `main` protected in GitHub branch protection. The 2026-07-14 live query
  found no branch protection for either `main` at `082c731` or `dev-test` at
  `485e3fb`; this is an unresolved policy gap.
- If branch protection blocks the default GitHub Actions token from pushing, use that failure as a signal to configure a deliberate production promotion token or require manual approval.
- Dependabot update pull requests target `dev-test`, not `main`.
- Automatic GitHub Actions triggers remain disabled in source. Both workflows
  retain `workflow_dispatch`, but live GitHub state shows `Dev Test Gate and
  Production Promotion` manually disabled; `Security Review` is active and
  source-limited to manual dispatch.
- CircleCI cannot supply supporting validation while its remote status is
  `Unable to parse YAML`. The heredoc terminators at `.circleci/config.yml:61`
  and `.circleci/config.yml:81` are repaired locally and local YAML/shell checks
  pass; provider execution remains unverified until an authorized push/rerun.
- GitHub Actions and CircleCI are supporting automation, not mandatory passing
  gates while disabled or unavailable. Slack is transport only. Mandatory gates
  remain fresh local validation plus Vercel preview/Meticulous review.
- CodeQL is disabled for this repository and is not an active promotion gate.

## Required GitHub Settings

- Decide whether to enable `Dev Test Gate and Production Promotion`; source
  `workflow_dispatch` alone does not override its live disabled state.
- Add deliberate protection for `main` and `dev-test`, requiring only checks
  that are active and passing.
- Enable Dependabot alerts and Dependabot security updates in repository security settings.
- Do not require CodeQL/code scanning until the repository has code scanning enabled again.
- Confirm Vercel production branch is set to `main`; `dev-test` should remain a
  preview/development branch. The live `dev-test` deployment at `485e3fb`
  reported success, but production configuration/settings remain unverified.
- Confirm Meticulous has access to Vercel preview URLs and that `NEXT_PUBLIC_METICULOUS_PROJECT_ID` is configured for Vercel preview environments.
