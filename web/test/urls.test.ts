import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "@/lib/urls";

describe("sanitizeNextPath", () => {
  it("keeps an internal post-auth destination", () => {
    expect(sanitizeNextPath("/dashboard/plans/lesson-1?tab=edit")).toBe(
      "/dashboard/plans/lesson-1?tab=edit",
    );
  });

  it.each(["https://attacker.example/steal", "//attacker.example/steal"])(
    "rejects external redirect target %s",
    (value) => {
      expect(sanitizeNextPath(value)).toBe("/dashboard");
    },
  );
});
