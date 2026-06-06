# Audit Index

Sanitized audit summaries live here and are safe to commit. Full raw logs belong under `logs/local/YYYY-MM-DD/*.local.md`, which is ignored by git.

| Date | Area | Summary | Result | Residual risk | Owner |
| --- | --- | --- | --- | --- | --- |
| 2026-06-04 | Validation and security logging | Established local/raw and tracked/sanitized audit lanes. | Ready for implementation verification. | Full Codex Security scan and DAST require staging scope and tooling. | Project maintainer |
| 2026-06-04 | Secret exposure review | Prior scan found expected env variable names only, not tracked secret values. | No tracked hardcoded secret values identified. | Install Gitleaks for git-history verification. | Project maintainer |
| 2026-06-04 | Provider stability | Current third-party surface documented before CSP hardening. | Inventory created. | Optional tooltip provider must remain disabled until approved. | Project maintainer |
| 2026-06-04 | CSP readiness | Started with report-only CSP, then moved to nonce-enforced CSP after CodeRabbit follow-up. | Build passed. | Watch staging for provider compatibility. | Project maintainer |
| 2026-06-04 | Public-domain starter content | Added 5 original lessons and 2 study series using Scripture references only. | Live Supabase verification passed. | Continue documenting any future source/license use. | Project maintainer |
| 2026-06-04 | CodeRabbit review follow-ups | Fixed verified migration, Supabase function, React key, metadata, and CSP image-scope findings from the uncommitted web review. | Local lint, typecheck, build, audit, and diff checks passed. | Supabase MCP read-back still needs reauthentication. | Project maintainer |
| 2026-06-04 | CSP nonce and WSL CLI stability | Moved CSP to per-request nonce generation and added a WSL-safe CodeRabbit wrapper with fixed terminal dimensions. | Local lint, typecheck, build, audit, and diff checks passed. | WSL service access still requires host/session repair if `wsl.exe` returns access denied. | Project maintainer |
| 2026-06-05 | Analytics and visual testing | Added Vercel Analytics, Meticulous App Router recorder wiring, deterministic date helper, and CircleCI validation/Meticulous jobs on `dev-test`. | Local lint, typecheck, build, and dependency audit passed. | Meticulous requires `METICULOUS_API_TOKEN` in CircleCI project secrets and approved project ID env in Vercel. | Project maintainer |
