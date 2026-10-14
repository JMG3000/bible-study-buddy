import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve("@next/eslint-plugin-next"));
const { globSync } = pluginRequire("fast-glob") as {
  globSync: (pattern: unknown, options?: Record<string, unknown>) => string[];
};
const { getRootDirs } = require("@next/eslint-plugin-next/dist/utils/get-root-dirs") as {
  getRootDirs: (context: { cwd: string; settings: { next?: { rootDir?: string | string[] } } }) => string[];
};
const fixture = mkdtempSync(join(tmpdir(), "bsbuddy-eslint-glob-"));
for (const dir of ["alpha", "beta", ".hidden", "alpha/nested"]) {
  mkdirSync(join(fixture, "apps", dir), { recursive: true });
}
writeFileSync(join(fixture, "apps", "not-a-directory"), "fixture");
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

function roots(rootDir?: string | string[]) {
  return getRootDirs({ cwd: fixture, settings: { next: { rootDir } } }).sort();
}

describe("Next.js lint root discovery compatibility", () => {
  it("uses the application cwd when no root setting is configured", () => {
    expect(roots()).toEqual([fixture]);
  });

  it("preserves literal roots without expanding nested directories", () => {
    expect(roots(`${fixture}/apps/alpha`)).toEqual([`${fixture}/apps/alpha`]);
    expect(roots(`${fixture}/apps/alpha/`)).toEqual([`${fixture}/apps/alpha/`]);
  });

  it("finds only visible matching directories and preserves absolute paths", () => {
    expect(roots(`${fixture}/apps/*`)).toEqual([
      `${fixture}/apps/alpha`, `${fixture}/apps/beta`,
    ]);
  });

  it("supports brace patterns and root arrays", () => {
    expect(roots(`${fixture}/apps/{alpha,beta}/`)).toEqual([
      `${fixture}/apps/alpha/`, `${fixture}/apps/beta/`,
    ]);
    expect(roots([`${fixture}/apps/alpha`, `${fixture}/missing`])).toEqual([
      `${fixture}/apps/alpha`,
    ]);
  });

  it("preserves relative directory roots", () => {
    expect(roots("src")).toEqual(["src"]);
    expect(roots("src/")).toEqual(["src/"]);
  });

  it("rejects excessive nesting before recursive matching or filesystem access", () => {
    const pattern = `${fixture}/${"{".repeat(101)}a,b${"}".repeat(101)}/*`;
    expect(() => roots(pattern)).toThrow(/glob nesting exceeds 100/);
  });

  it("rejects oversized patterns before filesystem access", () => {
    expect(() => roots(`${fixture}/${"a".repeat(10001)}/*`)).toThrow(/glob pattern exceeds 10000/);
  });

  it("fails closed if the pinned plugin requests an unsupported glob contract", () => {
    expect(() => globSync("src", { onlyDirectories: true, dot: true }))
      .toThrow(/unsupported Next.js glob options/);
  });

  it("fails closed if the pinned plugin stops passing individual strings", () => {
    expect(() => globSync(["src"], { onlyDirectories: true }))
      .toThrow(/Next.js glob pattern must be a string/);
  });
});
