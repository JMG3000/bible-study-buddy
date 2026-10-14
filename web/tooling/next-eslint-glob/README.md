# Next.js lint directory-glob adapter

Temporary, development-only replacement for `fast-glob` in
`@next/eslint-plugin-next@16.3.8`. This removes the dependency chain affected by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
without downgrading Next.js, disabling lint rules, or changing the audit gate.

The pinned plugin uses only `globSync(string, { onlyDirectories: true })` in
`getRootDirs`. This package is not a general replacement for fast-glob. Other
calls fail closed. Tinyglobby is pinned, directory expansion is disabled, and
absolute paths and requested trailing slashes are preserved. Pattern length
and nesting are bounded before matching or filesystem access.

The root manifest scopes the override to the exact plugin version. npm 11+
is required for local-package overrides; npm 9 rejects their file comparator.
Node 22.13+ supports the synchronous ESM adapter through the plugin's CommonJS
consumer, matching the project's Node 24 CI runtime without lint exemptions.
Next upgrades require rechecking the consumer and running the real consumer
regression tests, lint, build, and all-dependency audit. Remove this adapter
when the official dependency chain has a compatible published security fix.

Tests: `npm test -- test/next-eslint-glob.test.ts` (from `web`).
