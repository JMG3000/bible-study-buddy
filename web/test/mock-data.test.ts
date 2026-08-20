import { describe, expect, it } from "vitest";
import { lessonPlans } from "@/lib/mock-data";

describe("mock-data lessonPlans", () => {
  it("has a parentLessonId field on every fixture", () => {
    expect(lessonPlans.length).toBeGreaterThan(0);
    for (const plan of lessonPlans) {
      expect(plan).toHaveProperty("parentLessonId");
    }
  });

  it("defaults parentLessonId to null for every fixture", () => {
    expect(lessonPlans.every((plan) => plan.parentLessonId === null)).toBe(true);
  });

  it("keeps fixture ids unique", () => {
    const ids = lessonPlans.map((plan) => plan.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});