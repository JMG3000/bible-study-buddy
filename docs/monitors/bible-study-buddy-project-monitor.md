# Bible Study Buddy Project Monitor

Timestamp: 2026-07-22 00:05 CDT

## Executive Status

- Overall: **The NTFS checkout and controlled delivery branch are current; the
  corrective commit is pushed; local test, lint, typecheck, build, and CircleCI
  configuration checks pass; dependency audits fail; the feature-branch
  CircleCI run failed at an undisclosed step; provider-gate governance remains
  unresolved; merge and production promotion remain blocked.**
- Canonical Windows checkout:
  `C:\Users\LattePanda\Documents\BSB-Windows`.
- Canonical WSL checkout:
  `/mnt/c/Users/LattePanda/Documents/BSB-Windows`.
- Repository: `JMG3000/bible-study-buddy`.
- Controlled branch: `codex/restore-delivery-baseline`.
- Base: `origin/dev-test` at `485e3fb`.
- Corrective commit:
  `bdd0b831c5a3f0b6a09e2e038093d0b7e92a50a0` (`bdd0b83`). It is pushed,
  and local and remote controlled-branch heads matched at the verified
  snapshot.
- Before this monitor-only working-tree update, the controlled branch was
  0 commits behind and 4 commits ahead of `origin/dev-test`.
- No merge or production deployment is authorized by this status.

## Reconstruction Status

- The NTFS target began as an empty Git repository and was reconstructed from
  the recovery checkout at `/mnt/d/repos/codex-projects/bible-study-buddy`.
- GitHub is configured as `origin`; `dev-test` tracks `origin/dev-test`.
- The NTFS checkout is canonical. The `/mnt/d/...` recovery checkout is a
  legacy duplicate; do not edit both copies.
- Filesystem architecture and path hazards are documented in
  `docs/architecture/windows-wsl-filesystem.md`.
- `.codex/config.toml` is excluded through repository-local Git metadata. No
  secret or configuration value is recorded here.

## Current Local Validation

Fresh results for `codex/restore-delivery-baseline` at the 2026-07-22 snapshot:

| Gate | Result | Evidence / qualification |
| --- | --- | --- |
| `npm test` | Pass | Exit 0 |
| `npm run lint` | Pass | Exit 0 |
| `npm run typecheck` | Pass | Exit 0 |
| `npm run build` | Pass | Exit 0 |
| `circleci config validate` | Pass | Exit 0 |
| `circleci config process` | Pass | Exit 0; processed configuration restores executable `<<JSON` |
| CircleCI success Slack script | Pass | `bash -n` |
| CircleCI failure Slack script | Pass | `bash -n` |
| `npm audit --audit-level=moderate` | **Fail** | 21 high-severity vulnerabilities: `brace-expansion` and `js-yaml` through development tooling, plus `sharp` through production Next.js |
| `npm audit --omit=dev` | **Fail** | 3 high-severity `sharp`/libvips vulnerabilities; npm reports no fix available |

Additional dependency evidence:

- Dependabot alert 17 is open and high severity for development dependency
  `brace-expansion` in `web/package-lock.json`.
- Advisory: `GHSA-3jxr-9vmj-r5cp` / `CVE-2026-13149`.
- Dependency remediation is a separate change requiring explicit
  authorization; the audit failures are not waived by the passing functional
  gates.

## CircleCI Configuration And Remote Run

- `.circleci/config.yml` uses the YAML-safe heredoc form `\<<JSON` in source.
  Local CircleCI processing restores executable `<<JSON` in the shell script.
- Local `circleci config validate` and `circleci config process` both exit 0.
- Extracted success and failure Slack scripts pass `bash -n`.
- Workflow branch filters are exactly:
  - `dev-test`
  - `main`
  - `codex/restore-delivery-baseline`
- The corrective feature-branch push triggered CircleCI
  `validate-and-test`; the workflow reached the validation job but ended in a
  terminal failure at `2026-07-22T05:03:18Z`.
- The available GitHub and read-only provider surfaces do not expose the failed
  CircleCI step. The remote failure cause is therefore **unknown**. In
  particular, this monitor does not attribute the failure to dependency audit
  or any other step without authenticated job output.

## GitHub And Vercel Status

- GitHub Actions runs for corrective SHA `bdd0b83`: **0**.
- Source GitHub Actions workflows remain manual-dispatch oriented; live workflow
  enablement, required-check policy, and branch protection require owner-level
  verification and decision.
- Vercel deployment for `bdd0b83` succeeded at
  `2026-07-22T05:02:51Z`.
- Preview URL:
  `https://bible-study-buddy-jy48vvm3e-jacob-garretts-projects.vercel.app`.
- A successful preview is not authorization to merge or promote production.

## Application And Integration Inventory

- Next.js App Router application with TypeScript and React 19.
- Supabase Auth/Postgres integration with RLS-oriented migrations.
- Public lessons and series; authenticated creation and dashboards.
- Layout templates, saved lessons, private print logs, reporting, review, and
  administration surfaces.
- Vercel Analytics and optional Meticulous preview recording are present in
  source.
- A signed, channel-restricted Slack DevOps endpoint can trigger configured
  CircleCI validation and Vercel deploy hooks.
- Docker, CodeRabbit, OAuth providers, OpenAI Moderation, BibleGateway, and the
  optional scripture-tooltip integration remain source/configuration concerns;
  this snapshot does not claim their external settings are verified.

## Provider And Governance Status

| Provider/system | Current evidence | Remaining gap |
| --- | --- | --- |
| CircleCI | Feature-branch run triggered, reached validation, and failed terminally | Authenticated failed-step output is required |
| Vercel | `bdd0b83` preview deployment succeeded | Production settings and promotion remain unverified/unauthorized |
| GitHub Actions | 0 runs for `bdd0b83` | Workflow enablement and required-check policy unresolved |
| GitHub branch protection | No current protection/settings verification in this snapshot | Verify and deliberately configure `dev-test` and `main` |
| Supabase | Clients, migrations, RLS, and webhook route exist in source | Deployed schema, environment, auth, and webhook settings unverified |
| Slack | Signed command endpoint and channel restriction exist in source | Workspace/channel integration state unverified |
| Meticulous | Preview recorder integration exists in source | Provider settings and session state unverified |
| CodeRabbit | Review policy exists in source | Provider settings and review state unverified |

- The mandatory-provider gate policy remains unresolved. Older broad-provider
  requirements and the newer local-plus-selected-provider classification have
  not been reconciled.
- Do not merge to `dev-test`, merge to `main`, or promote production until the
  policy is decided and every mandatory gate passes or is explicitly waived by
  an authorized maintainer.

## Filesystem And Path Risks

1. Duplicate checkout at `/mnt/d/repos/codex-projects/bible-study-buddy` can
   diverge from the canonical NTFS checkout.
2. Windows Node.js and WSL Node.js must not share mutable `web/node_modules` or
   `web/.next` state across incompatible execution contexts.
3. Windows path syntax in Bash, or `/mnt/c` syntax in incompatible Windows
   tools, can target the wrong path or fail.
4. Case-only filenames, Linux permission assumptions, and symlink assumptions
   are unsafe on NTFS through DrvFS/9P.
5. `.env.local`, `.next`, `node_modules`, `.vercel`, and local logs are
   machine-local state, not portable source-controlled state.
6. Decommissioning the legacy `/mnt/d/...` checkout requires explicit deletion
   approval after the NTFS checkout is accepted as authoritative.

## Historical And Superseded Facts

- The 2026-07-14 pre-push snapshot is historical. Its statements that no remote
  controlled branch existed, the corrective work remained local, and a
  feature-branch push would not trigger CircleCI are superseded.
- The prior CircleCI filters limited to `dev-test` and `main` are superseded;
  the controlled feature branch is now included exactly as listed above.
- The prior local audit result of 0 vulnerabilities is superseded by the fresh
  failing audits and open Dependabot alert documented above.
- The prior remote CircleCI `Unable to parse YAML` observation is superseded by
  the current triggered run, successful local validation/processing, and
  undisclosed remote step failure.
- Historical July 13/14 validation and pre-reconciliation branch counts remain
  useful only as Git-history context, not current release-readiness evidence.

## Current Blockers

1. CircleCI failed remotely, and the failed step is unavailable through the
   current read-only surfaces.
2. Dependency audits report high-severity advisories, including production
   `sharp`/libvips advisories with no npm-provided fix.
3. Mandatory provider-gate policy, workflow enablement, branch protections, and
   provider settings are unresolved.
4. Production promotion has not been authorized.

## Next Recommended Actions

1. Inspect the failed CircleCI job with authenticated CircleCI access and
   capture the exact failed step and log evidence.
2. Obtain separate authorization for dependency remediation; assess the
   `sharp`/Next production path independently from development-tooling
   advisories.
3. After any corrective change, rerun all mandatory local and provider gates,
   including both audit scopes and the CircleCI remote workflow.
4. Resolve the mandatory-provider policy and deliberately configure workflow
   enablement, required checks, branch protections, and production-provider
   settings before merge or production promotion.
