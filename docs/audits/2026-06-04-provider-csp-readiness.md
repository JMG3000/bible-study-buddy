# 2026-06-04 Provider And CSP Readiness

## Purpose

Document the current third-party provider surface and the CSP hardening path.

## Sanitized Results

- Third-party provider inventory created at `docs/providers/third-party-provider-inventory.md`.
- Optional scripture tooltip provider remains disabled by default.
- Initially added `Content-Security-Policy-Report-Only` in `web/next.config.ts`.
- Replaced that observation layer with nonce-enforced CSP in `web/src/proxy.ts` on 2026-06-04.
- Production build passed after CSP nonce enforcement.

## Residual Risk

- CSP is now enforcing with per-request nonces.
- Staging/browser observations should confirm no required provider is blocked.
- If a tooltip script provider is enabled later, its approved origin must be added to the provider inventory and CSP.
