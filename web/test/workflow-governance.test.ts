import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

interface Workflow {
  on: Record<string, unknown>;
  permissions: { contents: string };
  jobs: Record<string, {
    permissions?: { contents?: string };
    steps: Array<{ run?: string }>;
  }>;
}

const require = createRequire(import.meta.url);
const { load } = require("js-yaml") as { load: (source: string) => Workflow };
const workflow = load(readFileSync(
  new URL("../../.github/workflows/dev-test-gate.yml", import.meta.url), "utf8",
));

describe("supporting application workflow authority", () => {
  it("runs the complete validation sequence only on manual dispatch", () => {
    expect(Object.keys(workflow.on)).toEqual(["workflow_dispatch"]);
    expect(workflow.jobs.validate.steps.flatMap((step) => step.run ?? [])).toEqual([
      "npm ci", "npm test", "npm run lint", "npm run typecheck",
      "npm run build", "npm audit --audit-level=moderate",
    ]);
  });

  it("grants validation no repository-write or promotion job", () => {
    expect(workflow.permissions.contents).toBe("read");
    expect(Object.keys(workflow.jobs)).toEqual(["validate"]);
    for (const job of Object.values(workflow.jobs)) {
      expect(job.permissions?.contents ?? workflow.permissions.contents).toBe("read");
    }
  });
});
