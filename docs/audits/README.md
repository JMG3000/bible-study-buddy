# Audit Index

> **Historical evidence boundary:** Every entry in `docs/audits/` is a dated,
> point-in-time record. Audit results, workflow descriptions, provider states,
> dependency-audit outcomes, and production-authority paths in these files are
> **not current operational instructions**. Use
> `docs/monitors/bible-study-buddy-project-monitor.md` for current state and
> `docs/deployment/branch-promotion-policy.md` for current release policy.

Sanitized audit summaries live here and are safe to commit. Full raw logs belong
under `logs/local/YYYY-MM-DD/*.local.md`, which is ignored by Git.

Historical records are intentionally preserved rather than rewritten to match
later architecture. When a historical audit conflicts with current policy or
source, the current monitor/policy wins for present-tense decisions.

| Date | Area | Historical result / note |
| --- | --- | --- |
| 2026-06-04 | Validation and security logging | Established local/raw and tracked/sanitized audit lanes. |
| 2026-06-04 | Secret exposure review | Point-in-time review found expected env variable names and no tracked hardcoded secret values. |
| 2026-06-04 | Provider stability | Third-party surface documented before later provider/governance changes. |
| 2026-06-04 | CSP readiness | CSP work progressed from report-only toward nonce-enforced behavior. |
| 2026-06-04 | Public-domain starter content | Starter content and source/license evidence recorded. |
| 2026-06-04 | CodeRabbit review follow-ups | Point-in-time code-review fixes and local validation recorded. |
| 2026-06-04 | CSP nonce and WSL CLI stability | Historical WSL/CLI stability evidence. |
| 2026-06-05 | Analytics and visual testing | Historical Meticulous CI experiments; later superseded by preview-recorder usage and later advisory-only policy. |
| 2026-06-05 | GitHub security and promotion workflows | Historical GitHub Actions promotion/security design; current policy forbids automation from substituting for deliberate `dev-test -> main` PR promotion. |
| 2026-06-06 | Meticulous promotion gate and skill restore | Historical experiment; Meticulous is now advisory only. |
| 2026-06-15 | CodeQL disabled and Meticulous through Vercel | Historical provider configuration snapshot. |
| 2026-06-15 | Verification sources and Slack broadcasts | Historical integration/broadcast design snapshot. |
| 2026-06-16 | Slack-controlled DevOps workflow | Historical introduction of Slack production-deploy authority; that authority is now contrary to ratified policy and is targeted for removal by PR #59. |

Do not promote, merge, change CI, or restore an old authority path based solely
on an audit entry.
