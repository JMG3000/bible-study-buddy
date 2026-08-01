import { afterEach, describe, expect, it, vi } from "vitest";
import { reviewLessonContent } from "@/lib/content-review";

describe("reviewLessonContent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the heuristic fallback when OpenAI omits moderation results", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-api-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await reviewLessonContent({
      title: "A bullshit lesson",
      summary: "Summary",
      teachingObjective: "Objective",
    });

    expect(result).toMatchObject({
      approved: false,
      provider: "heuristic",
    });
  });
});
