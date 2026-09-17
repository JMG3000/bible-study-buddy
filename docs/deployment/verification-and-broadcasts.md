# Verification and Broadcasts

Policy ratified: 2026-09-02  
Documentation state reviewed: 2026-09-15

Use `docs/monitors/bible-study-buddy-project-monitor.md` for volatile provider
status. This document defines stable verification roles and evidence flow.

## Governing verification matrix

| System | Classification | Applicability | Authoritative evidence |
| --- | --- | --- | --- |
| Local validation | Universal mandatory gate | Every production proposal | Exact commit SHA plus fresh command results |
| CircleCI | Universal mandatory gate | Every production proposal | Terminal CircleCI check/workflow for exact SHA |
| Vercel preview | Conditional mandatory gate | UI, routing, runtime, deployment, environment-sensitive changes | Commit-specific deployment result |
| Supabase | Conditional mandatory gate | Migration/schema/generated types/Auth/RLS/Storage/database functions/Edge Functions | Migration/test/advisor output and provider result where available |
| CodeQL | Conditional security gate | Supported source changes once emitted/stable | Terminal GitHub CodeQL result |
| Dependency review | Conditional supply-chain gate | Manifest/lockfile changes once emitted/stable | Terminal GitHub dependency-review result |
| Dependabot | Maintenance automation | Supported dependency ecosystems | Alerts/update PRs; not a gate itself |
| CodeRabbit | Advisory | Optional | Review comments only |
| Meticulous | Advisory | Optional | Visual/session observations only |
| Slack | Transport only | Notifications/authenticated command requests | Links to originating provider; Slack is not evidence storage |
| Jira | Development ledger | Decisions/work/evidence links | Tracking record only |

CodeRabbit and Meticulous must never be configured as required checks under the
ratified policy.

## Canonical application sequence

CircleCI runs:

1. `npm ci`
2. tests
3. lint
4. typecheck
5. production build
6. `npm audit --audit-level=moderate`

The current CircleCI executor on `dev-test` is `cimg/node:24.11.1-browsers`.
The job is sequential and fail-fast. Its Slack failure/success steps are
notification only.

## GitHub Actions boundary

The current `dev-test` workflow definitions are manual-dispatch only. The
tracked `dev-test-gate.yml` still contains an obsolete `promote-to-main` job,
but its condition requires a push event while the workflow currently exposes
only `workflow_dispatch`; therefore that job is unreachable under the current
trigger definition.

PR #59 removes that obsolete production-authority code path. Until PR #59 is
integrated, documentation must describe it as **present but unreachable**, not
as already removed.

## Slack command boundary

Current `dev-test` source still contains the `promote-production confirm`
command and a production Vercel deploy-hook path. That implementation conflicts
with the ratified policy that Slack is transport only and must not possess
independent production authority.

PR #59 removes that command/path. Until PR #59 is integrated:

- do not use the Slack production command as an authorized promotion mechanism;
- do not document it as an approved release path;
- treat its removal as pending implementation work, not completed state.

## Supabase verification

When Supabase-relevant files change, verify as applicable:

- clean migration application in a non-production environment;
- database/pgTAP tests where present;
- generated-type drift;
- RLS positive and negative access paths;
- security advisor output;
- version-controlled production migration procedure.

A provider `skipped` result does not prove migration behavior. Current project
evidence shows per-PR Supabase preview branches are disabled, so migration
validation must be obtained through another approved non-production path before
production promotion containing migration `0020`.

## Broadcast rules

Slack status messages may summarize terminal outcomes and link to GitHub,
CircleCI, Vercel, or Supabase. Slack must not be treated as the evidence source
or authorization system.

Broadcast once at terminal state. Do not trigger automatic reruns from failure
notifications.

## Branch-protection readiness

Before requiring checks on `main`:

1. Observe exact emitted check names and GitHub App sources.
2. Confirm one terminal result per expected check.
3. Confirm non-applicable conditional checks terminate rather than hang.
4. Require only stable signals.
5. Verify the ruleset actually requires the pull-request/status-check contract.

Current enforcement status belongs in the project monitor.
