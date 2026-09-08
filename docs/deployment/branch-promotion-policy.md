# Branch Promotion Policy

Date adopted: 2026-06-05

Hybrid gate contract ratified by the repository owner: 2026-09-02

Use `docs/monitors/bible-study-buddy-project-monitor.md` for volatile branch,
workflow, deployment, and provider observations. This document governs policy.

## Branches

- `dev-test` is the development and integration branch.
- `main` is the production branch and remains Vercel's production branch.
- Production promotion occurs through a deliberate pull request from `dev-test` to `main`.
- No workflow may push directly to `main` as a substitute for the pull request.

## Governing Gate Contract

Every production proposal must satisfy the universal gates:

1. Fresh local validation at the proposed commit.
2. The canonical CircleCI validation workflow.

Additional gates apply only when the changed surface makes them relevant:

- Vercel preview is required for UI, routing, runtime, deployment, or
  environment-sensitive changes.
- Supabase validation is required for migrations, schema, generated types,
  Auth, RLS, Storage, database functions, or Edge Functions.
- CodeQL is required for supported source-code changes once the emitted check
  is active and stable.
- GitHub dependency review is required for manifest or lockfile changes once
  that workflow is installed and producing a stable check.

Dependabot alerts, security updates, and version-update pull requests are
maintenance automation. They are not themselves a per-pull-request gate.

CodeRabbit and Meticulous are advisory only. Their presence, absence, failure,
plan limitation, or provider availability must not determine merge eligibility.

Slack is notification and command transport only. A Slack message is not an
approval, waiver, validation result, or authoritative evidence record.

## Single-Attempt, Fail-Fast Execution

Validation is sequential and fail-fast:

`install -> test -> lint -> typecheck -> build -> dependency audit`

- Each automatic provider workflow runs at most once for a commit and trigger.
- Each validation stage runs once.
- A passing stage unlocks the next stage.
- A failed stage ends that validation sequence.
- Later validation stages do not run after the first failure.
- Failure notification or cleanup may run, but it must not execute another test
  or convert the failure into success.
- Automatic retries, retry loops, blanket reruns, and continuous retesting are
  prohibited.
- A new attempt requires a new commit or an explicit maintainer-initiated
  manual run. Provider-generated duplicate runs must not be treated as
  additional evidence.

CircleCI currently implements this behavior as one sequential job. GitHub
Actions workflows must preserve the same semantics when enabled.

## Local Validation

From the repository root, use the repository-defined commands:

```bash
npm --prefix web ci
npm --prefix web test
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run build
npm --prefix web audit --audit-level=moderate
```

Record the commit SHA and command result summary in the pull request. CircleCI
must independently repeat the canonical validation in a clean environment.

## Promotion Flow

1. Push development work to `dev-test`.
2. Run local validation at the proposed commit.
3. Allow CircleCI to execute once, sequentially and fail-fast.
4. Collect the applicable Vercel, Supabase, CodeQL, and dependency-review
   evidence.
5. Review the exact commit-specific evidence on the pull request.
6. Merge through the protected `main` pull-request path only when the governing
   gates pass.
7. Allow Vercel production to deploy from `main`.

## Branch Protection

- Require only active, stable checks that are emitted for the protected path.
- Select the expected GitHub App as the source when GitHub supports source
  binding for the check.
- A conditional check must return a terminal `success`, `neutral`, or `skipped`
  result when it is not applicable; it must not remain pending.
- Do not require CodeRabbit or Meticulous.
- Do not make Slack, Jira, or a supervisor/aggregator service an approval gate.
- Preserve non-fast-forward and branch-deletion protection.
- Validate new required checks on `dev-test` before enforcing them on `main`.

## Security And Provider Boundaries

- Store provider credentials in the provider's secret store, never in source.
- Keep CircleCI contexts and GitHub permissions least-privileged.
- Supabase production changes must use version-controlled migrations and
  CI-controlled credentials; do not make ad hoc production schema changes.
- Vercel preview evidence must correspond to the exact pull-request commit.
- Jira records decisions and evidence links but is not the technical source of
  truth and does not authorize a merge.

## Current Promotion Boundary

Ratifying this policy does not authorize merging PR #36 or deploying
production. Branch-protection changes must follow live workflow inspection and
successful observation of the exact check names to be required.
