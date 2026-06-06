# CSP Nonce And WSL CLI Stability

Date: 2026-06-04

## Scope

Resolve two follow-up issues:

- Replace the deferred CSP nonce recommendation with a real Next.js nonce pipeline.
- Stabilize WSL-based CodeRabbit runs that can inherit bogus terminal dimensions.

## Changes

- Moved CSP generation from static `next.config.ts` headers into `proxy.ts`.
- Generated a fresh nonce per request and set it on both request and response CSP headers.
- Removed production `unsafe-inline` and `unsafe-eval` from `script-src` and `style-src`.
- Kept `unsafe-eval` only in development, following Next.js development guidance.
- Passed the nonce to optional scripture tooltip scripts and JSON-LD script tags.
- Removed small inline style attributes that would conflict with strict style CSP.
- Added `scripts/coderabbit-review-web.ps1`, which forces sane `TERM`, `COLUMNS`, `LINES`, and `stty` dimensions before running CodeRabbit through WSL.
- Runtime header check confirmed `/` returns enforced `Content-Security-Policy` with a per-request nonce and no report-only CSP header.

## Notes

Nonce CSP forces dynamic rendering so framework scripts can receive a fresh nonce per request. This is an intentional security tradeoff.

The WSL wrapper corrects inherited terminal dimensions, but it cannot repair a Windows-side `Wsl/Service/CreateInstance/E_ACCESSDENIED` state. If that error appears, restart WSL or the host session, then use the wrapper.

## Verification

Commands run:

```powershell
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
git diff --check
```

Result: all passed. `git diff --check` reported only Windows line-ending warnings.

Runtime header check:

```text
StatusCode: 200
HasReportOnly: False
CSP includes: script-src 'self' 'nonce-...' 'strict-dynamic'
```

## References

- Next.js CSP guide: https://nextjs.org/docs/app/guides/content-security-policy
