# Bible Study Buddy Project Monitor

Evidence snapshot: 2026-09-15

This file records volatile project state. Re-read authoritative systems before
executing a release-affecting change.

## Authority order

1. Exact Git objects and provider/runtime evidence.
2. GitHub branch, PR, ruleset, and check state.
3. Provider validation evidence.
4. Jira decision/evidence ledger.
5. Project documentation.
6. Agent reports/conversation summaries.

## Current Git baseline

- Repository: `JMG3000/bible-study-buddy`
- `main`: `0c58d03015a6c9909f8cc1e1f6f5ff2a5bd50318`
- `dev-test`: `faa4ac99ddd8d32a5a091b76cc060885a3b780e4`
- Merge base: `73d428d696f1cbe7383711d7493306e5228e3c1c`
- Divergence: `dev-test` is 35 commits ahead and 1 commit behind `main`.
- The `main`-only change is the README update represented by `0c58d030...`.

Do not describe the branches as synchronized.

## PR #36 — production promotion

- State: open, unmerged.
- Head: `dev-test` at `faa4ac99...`.
- Base branch: `main`.
- GitHub reports the PR as mechanically mergeable.
- The PR body contains stale synchronization evidence, including an older head
  and older ahead/behind counts.

PR #36 remains the deliberate `dev-test -> main` promotion vehicle, but it is
**not release-ready**. Mechanical mergeability is not authorization.

## PR #59 — BSBUDDY-6 authority removal

- State: open, unmerged.
- Base: `dev-test` at `faa4ac99...`.
- Head: `c8d4430b2e777ddea658cbf3db459d5f958aefe1`.
- Scope: nine files; removes Slack production-deploy authority and obsolete
  GitHub Actions production-promotion code while preserving validation/preview
  paths.
- No dependency manifest or lockfile change is included.

Current GitHub/provider observations for `c8d4430...`:

- Vercel: success.
- Vercel Preview Comments: success/no unresolved feedback.
- CircleCI `validate`: failure.
- Supabase Preview: skipped because per-PR preview branches are disabled.
- GitHub Actions PR-triggered runs: none observed.
- CodeRabbit: automatic review skipped because the base is not the default branch.
- Meticulous: no run; project reported deactivated.

## CircleCI diagnosis

CircleCI remains the canonical automatic application validator. Current
`dev-test` configuration uses `cimg/node:24.11.1-browsers` and executes:

`npm ci -> test -> lint -> typecheck -> build -> npm audit --audit-level=moderate`

The recovered Codex investigation reproduced the dependency-audit failure on
both:

- base `faa4ac99...`
- PR #59 head `c8d4430...`

Both passed the earlier validation stages and failed on the same pre-existing
dependency-security findings. Therefore the evidence supports:

- CircleCI orchestration is functioning;
- BSBUDDY-6 did not introduce the audit failure;
- the dependency-security issue is a separate failure domain.

Do not change CircleCI orchestration merely to make this failure disappear.

## Dependency remediation status

A prior Codex session reported a local-only remediation candidate:

- branch: `codex/bsbuddy-6-dependency-remediation-v2`
- commit: `a9a1b41ea85914a407cbec60e41c180c42d11ea3`
- tree: `47ae43d7329601e50678eab62769a8cbb744ebfe`
- files: `web/package.json`, `web/package-lock.json`
- reported validation: `npm ci`, tests (51), lint, typecheck, build, and audit with 0 vulnerabilities.

Current GitHub does **not** contain that branch/commit and cannot resolve
`a9a1b41...`. Treat the prior result as historical local evidence only. Before
publication, recover or reconstruct the exact candidate and perform fresh
verification against the exact artifact.

## Production-governance enforcement

Current `main` ruleset evidence shows:

- deletion protection;
- non-fast-forward protection;
- Copilot code-review behavior.

It does **not** currently enforce the required pull-request path or canonical
status checks. Branch readback also reports required-status-check enforcement
off.

This is a current production-promotion blocker.

## Current implementation/policy mismatches

Current `dev-test` still contains:

1. Slack `promote-production confirm` plus a production Vercel deploy-hook path.
2. A `promote-to-main` GitHub Actions job in `dev-test-gate.yml`.

The GitHub Actions job is unreachable under the current manual-only trigger
because its condition requires a push event. PR #59 removes both obsolete
production-authority surfaces. Until PR #59 integrates, describe them as
**present in source but not approved by policy**, not as already removed.

## Supabase release state

Migration `web/supabase/migrations/0020_add_lesson_remix_parent.sql` exists in
the `dev-test` release line. Current evidence does not establish successful
execution against an isolated non-production Supabase environment.

Supabase Preview on PR #59 is skipped because per-PR preview branches are
disabled. A skipped provider check is not migration validation.

## Recovery state

Independent off-host recovery durability has not been proven by current project
evidence. Do not delete historical recovery material until file-level durability
and read-back are verified.

## Current blockers

1. Dependency remediation is not durably present on GitHub and requires exact-artifact recovery/reconstruction plus fresh verification.
2. PR #59 remains open/unmerged and its head still has a failing CircleCI dependency-audit gate.
3. `dev-test` remains one commit behind `main`; final branch reconciliation is incomplete.
4. Supabase migration `0020` non-production validation is outstanding.
5. `main` does not enforce the intended PR/status-check promotion contract.
6. PR #36 promotion evidence is stale and must be refreshed only after the final candidate is known.
7. Off-host recovery durability remains unproven.

## Next continuation rule

```text
VERIFY CURRENT TRUTH
        ↓
SELECT ONE FAILURE DOMAIN
        ↓
MAKE ONE CONTROLLED CHANGE
        ↓
VALIDATE EXACT SHA
        ↓
RECORD EVIDENCE
        ↓
INTEGRATE
```

Do not combine dependency remediation, BSBUDDY-6 authority removal, Supabase
migration validation, branch reconciliation, and production promotion into one
undifferentiated change.
