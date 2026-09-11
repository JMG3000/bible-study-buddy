import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workflowPath = fileURLToPath(
  new URL("../../.github/workflows/dev-test-gate.yml", import.meta.url),
);

describe("manual GitHub Actions validation", () => {
  const workflow = readFileSync(workflowPath, "utf8");

  it("retains an explicit manual validation trigger", () => {
    expect(workflow).toMatch(/^\s*workflow_dispatch:\s*$/m);
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm run typecheck");
    expect(workflow).toContain("npm run build");
  });

  it("contains no main-branch promotion authority", () => {
    expect(workflow).not.toMatch(/^\s*promote-to-main:\s*$/m);
    expect(workflow).not.toContain("contents: write");
    expect(workflow).not.toContain("git push");
    expect(workflow).not.toContain("GITHUB_TOKEN");
  });
});
