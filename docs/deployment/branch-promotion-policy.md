# Branch Promotion Policy

Date adopted: 2026-06-05  
Hybrid gate contract ratified: 2026-09-02  
Documentation state reviewed: 2026-09-15

Use `docs/monitors/bible-study-buddy-project-monitor.md` for volatile branch,
workflow, deployment, and provider observations. This document governs policy.

## Branches

- `dev-test` is the development and integration branch.
- `main` is the production branch and remains the intended Vercel production branch.
- Production promotion occurs through a deliberate pull request from `dev-test` to `main`.
- No workflow, Slack command, deploy hook, or automation may substitute for the owner-controlled pull-request promotion decision.

## Governing gate contract

Every production proposal must satisfy:

1. Fresh local validation at the exact proposed commit.
2. Canonical CircleCI validation for that exact commit.

Additional gates apply when the changed surface makes them relevant:

- Vercel preview for UI, routing, runtime, deployment, or environment-sensitive changes.
- Supabase validation for migrations, schema, generated types, Auth, RLS, Storage, database functions, or Edge Functions.
- CodeQL for supported source-code changes only when the emitted check exists and is stable.
- Dependency review for manifest/lockfile changes only when that check exists and is stable.

Dependabot is maintenance automation, not a release gate by itself.
CodeRabbit and Meticulous are advisory and must not determine merge eligibility.
Slack is transport only and is not approval, waiver, validation evidence, or merge authority.
Jira is a ledger, not technical merge authority.

## Single-attempt, fail-fast execution

Canonical application validation is sequential:

`install -> test -> lint -> typecheck -> build -> dependency audit`

- One automatic provider workflow attempt per commit and trigger.
- One execution per validation stage.
- Failure terminates that validation sequence.
- No automatic retry loops or failure-masking reruns.
- A new attempt requires a new commit or explicit maintainer action.

## Local validation

```bash
npm --prefix web ci
npm --prefix web test
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run build
npm --prefix web audit --audit-level=moderate
```

Record the exact commit SHA and command results. CircleCI must independently
repeat the canonical sequence in its clean environment.

## Promotion flow

1. Establish the exact `dev-test` candidate SHA.
2. Reconcile any `main`-only divergence before declaring the final candidate.
3. Run fresh local validation.
4. Obtain canonical CircleCI evidence.
5. Obtain all applicable provider evidence for that exact candidate.
6. Confirm repository protection/rulesets enforce the intended promotion contract.
7. Review the `dev-test -> main` pull request and explicitly authorize promotion.
8. Merge only after every required gate passes or an authorized policy waiver is explicitly recorded.
9. Allow production deployment from `main`.

## Branch protection requirements

`main` must require the intended pull-request path and stable required checks
before production promotion is authorized. Preserve non-fast-forward and branch
deletion protection.

Current enforcement status is volatile and belongs in the project monitor. A
ruleset that only blocks deletion/non-fast-forward changes does **not** satisfy
this policy by itself.

## Current promotion boundary

This policy does not authorize PR #36, PR #59, or any production deployment.
The current monitor records that `main` does not yet enforce the full required
PR/status-check contract, so production promotion remains blocked until that
control is implemented and verified.
