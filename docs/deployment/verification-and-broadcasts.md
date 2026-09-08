# Verification And Broadcasts

Policy ratified: 2026-09-02

Use `docs/monitors/bible-study-buddy-project-monitor.md` for volatile provider
status. This document defines the stable verification roles and evidence flow.

## Governing Verification Matrix

| System | Classification | Applicability | Authoritative evidence |
| --- | --- | --- | --- |
| Local validation | Universal mandatory gate | Every production proposal | Commit SHA plus command result summary in the pull request |
| CircleCI | Universal mandatory gate | Every production proposal | Terminal CircleCI check and workflow URL for the exact SHA |
| Vercel preview | Conditional mandatory gate | UI, routing, runtime, deployment, or environment-sensitive changes | Commit-specific deployment URL and terminal Vercel result |
| Supabase | Conditional mandatory gate | Migration, schema, generated-type, Auth, RLS, Storage, database-function, or Edge Function changes | Migration/test/advisor output and terminal provider result when available |
| CodeQL | Conditional security gate | Supported source-code changes once the emitted check is stable | Terminal GitHub CodeQL result |
| Dependency review | Conditional supply-chain gate | Manifest or lockfile changes once installed and stable | Terminal GitHub dependency-review result |
| Dependabot | Maintenance automation | Supported dependency ecosystems | Alerts and update pull requests; not a gate by itself |
| CodeRabbit | Advisory | Optional | Review comments only |
| Meticulous | Advisory | Optional | Visual/session observations only |
| Slack | Transport only | Notifications and authenticated command requests | Links to the originating provider; Slack is not the evidence store |
| Jira | Development ledger | Decisions, work, and evidence links | Tracking record only; Jira is not a technical merge gate |

CodeRabbit and Meticulous must never be configured as required checks.

## Single-Attempt State Model

```text
READY
  -> RUNNING(stage 1)
  -> PASS -> RUNNING(next stage)
  -> PASS -> ... -> COMPLETE

RUNNING(any stage)
  -> FAIL -> STOPPED
```

Rules:

- One automatic workflow attempt per commit and trigger.
- One execution per validation stage.
- Pass advances to the next stage.
- Failure terminates the current validation sequence.
- No downstream validation after the first failure.
- No automatic retry, retry loop, continuous retest, or failure-masking rerun.
- Failure notification and cleanup are allowed after termination.
- A new attempt requires a new commit or an explicit manual maintainer action.

## Canonical Application Sequence

CircleCI is the canonical clean-environment application validator and runs:

1. `npm ci`
2. tests
3. lint
4. typecheck
5. production build
6. dependency audit

The existing CircleCI job is sequential and therefore stops at the first
failed validation command. Its final `on_fail` Slack step is notification only;
it does not continue testing or retry the failed stage.

GitHub Actions application validation remains manual and supporting unless the
repository owner later makes it the canonical validator. CodeQL and targeted
security workflows may run independently because they validate different risk
surfaces, not because they repeat CircleCI.

## Supabase Verification

When Supabase-relevant files change, verify as applicable:

- migrations rebuild a clean local database;
- database and pgTAP tests pass;
- generated types have no unexplained drift;
- RLS covers anonymous, authenticated, ownership, and negative-access cases;
- database advisors report no unaccepted security findings;
- production migrations are version-controlled and deployed through CI.

A Supabase result may be `skipped` for a change that does not touch the
Supabase surface. A skipped result is not a waiver because the gate was not
applicable.

## Slack Broadcast Channel

- Channel: `#proj-bible-study-buddy`
- Channel ID: `C0B96SV684S`
- Purpose: compact notification of terminal validation, preview, security, and
  deployment results.

Slack messages should link to GitHub, CircleCI, Vercel, or Supabase rather than
copying provider output as if Slack were the source.

## Slack Command Endpoint

- Endpoint: `/api/devops/slack`
- Authentication: Slack request signing with `SLACK_SIGNING_SECRET`.
- Authorization: `SLACK_ALLOWED_CHANNEL_ID` and optional
  `SLACK_ALLOWED_USER_IDS`.
- A Slack command may request an action but cannot bypass pull-request,
  validation, signature, channel, user, or production-confirmation controls.

## Broadcast Format

```md
**Bible Study Buddy validation status**
- Branch: `dev-test`
- Commit: `<sha>`
- CircleCI: `<terminal status/workflow URL>`
- CodeQL: `<terminal status or not applicable>`
- Vercel preview: `<terminal status/commit URL or not applicable>`
- Supabase: `<terminal status or not applicable>`
- Advisory review: `<optional links>`
- Result: `<complete/stopped at stage>`
- Next action: `<new commit/manual decision>`
```

Broadcast once at the terminal result. Do not post a message that triggers an
automatic rerun.

## Branch-Protection Readiness

Before adding or changing required checks:

1. Inspect the current workflow definitions.
2. Observe the exact check names and GitHub App sources on a fresh commit.
3. Confirm one attempt and one terminal result per expected check.
4. Confirm non-applicable conditional checks terminate as `skipped`, `neutral`,
   or `success` rather than remaining pending.
5. Add only the stable signals to branch protection.

The policy decision is resolved. Production promotion remains separate and
requires the live applicable gates to pass for the exact proposed commit.
