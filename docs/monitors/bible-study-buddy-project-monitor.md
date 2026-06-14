# Bible Study Buddy Project Monitor

Timestamp: 2026-06-13 20:12:18 -05:00

## Snapshot

- Repo: `JMG3000/bible-study-buddy`
- Current branch: `dev-test`
- Current local/remote HEAD before this fix commit: `579da56` (`Update layout.tsx`)
- `origin/main`: `4292368` (`Use Meticulous preview recorder script`)
- Local branch sync: `dev-test` is aligned with `origin/dev-test`
- Working tree after fixes: pending local changes for workflow pause, recorder repair, dependency updates, and this monitor report

## Monitor Freshness

- Previous automation monitor timestamp: `2026-06-13 16:42:36 -05:00`
- Age at review: under 28 hours
- Decision: no pause needed to rerun the automation before continuing

## Current Local Validation

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run build`: passed
- `npm audit --audit-level=moderate`: passed, 0 vulnerabilities
- `git diff --check`: passed; Windows CRLF conversion warnings only
- Meticulous wiring grep: passed
- Dependency tree check: confirmed patched `next`, `react`, `react-dom`, `postcss`, `ws`, and scoped `brace-expansion` overrides

## Fixes Applied In This Pass

- Repaired the Meticulous recorder in `web/src/app/layout.tsx` by removing literal placeholder text and restoring:
  - nonce support
  - `data-project-id={env.meticulousProjectId}`
  - `NEXT_PUBLIC_ENABLE_METICULOUS_RECORDER`
  - production-environment flag handling
- Upgraded app runtime packages:
  - `next` to `16.2.9`
  - `eslint-config-next` to `16.2.9`
  - `react` to `19.2.7`
  - `react-dom` to `19.2.7`
- Added scoped npm overrides:
  - `minimatch@3.1.5 -> brace-expansion@1.1.15`
  - `minimatch@10.2.5 -> brace-expansion@5.0.6`
  - `postcss@8.5.10`
  - `ws@8.20.1`
- Temporarily paused automatic GitHub Actions triggers until 2026-07-01:
  - `Dev Test Gate and Production Promotion`
  - `Security Review`
- Kept `workflow_dispatch` enabled for manual targeted runs.
- Fixed the secret-pattern scan so it no longer self-matches its own literal secret patterns.
- Set `persist-credentials: false` on checkout steps where credentials do not need to persist.

## GitHub Actions Minutes Review

- Safe to temporarily disable automatic GitHub Actions triggers while minutes are exhausted.
- Reason: current remote blockers include paid/settings-dependent jobs (`CodeQL` upload, dependency review, Scorecard/SARIF) and exhausted Actions minutes; pushing with automatic triggers still enabled would consume unavailable quota and create predictable failures.
- Local validation is currently the source of truth until GitHub Actions minutes reset or manual runs are explicitly triggered.
- Re-enable automatic triggers on or after 2026-07-01 by restoring `push`, `pull_request`, and `schedule` events in the workflow files.

## Remaining External Blockers

- GitHub CodeQL/code scanning requires repository settings support before it can be a reliable required gate.
- GitHub Dependency Review requires Dependency Graph/GitHub Advanced Security support.
- Meticulous still requires recorded sessions and valid project/token configuration before it can be meaningful as a promotion gate.
- GitHub Actions automation remains intentionally paused until minutes are available again.

## Next Recommended Action

- Commit this local fix set on `dev-test`.
- Push `dev-test` with automatic GitHub Actions triggers paused.
- Do not promote to `main` until either local release approval is explicit or GitHub Actions minutes/settings are restored.
