# Meticulous Through Vercel

Integration documentation reviewed: 2026-09-15.

## Policy status

Meticulous is **advisory only** under the ratified branch-promotion policy. Its
presence, absence, provider availability, or failure must not determine merge
eligibility.

The previous documentation describing a disagreement between competing
mandatory-provider policies is superseded.

## Source integration

The application can load the Meticulous recorder in development/preview contexts
when configured. `NEXT_PUBLIC_METICULOUS_PROJECT_ID` is browser-visible by
design; `METICULOUS_API_TOKEN` must not be exposed to browser code.

Recommended Vercel variables:

- `NEXT_PUBLIC_METICULOUS_PROJECT_ID` — Preview when recorder use is desired.
- `NEXT_PUBLIC_ENABLE_METICULOUS_RECORDER` — normally unset/false; enable only for explicit recorder testing outside normal preview behavior.

Do not configure production recording unless explicitly approved.

## Current provider observation

For PR #59 at `c8d4430b2e777ddea658cbf3db459d5f958aefe1`, the Meticulous bot reported
that no test run was triggered because the Meticulous project is deactivated.
That is an advisory-provider state, not a release-gate failure.

Do not reactivate Meticulous solely to satisfy promotion policy; reactivation is
a separate product/tooling decision.

## Deterministic rendering

The app supports Meticulous deterministic rendering headers through the source
integration. Verify the current implementation before relying on any specific
header behavior in a new test campaign.

## Related verification

See:

- `docs/deployment/branch-promotion-policy.md`
- `docs/deployment/verification-and-broadcasts.md`
- `docs/monitors/bible-study-buddy-project-monitor.md`
