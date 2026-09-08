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

  it("uses the heuristic fallback when the results array is present but empty", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-api-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), {
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

  it("uses the heuristic fallback when flagged is not a boolean", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-api-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [{ flagged: "true" }] }), {
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

  it("trusts an explicit boolean false from OpenAI and approves clean content", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-api-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [{ flagged: false }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await reviewLessonContent({
      title: "A gentle lesson",
      summary: "Summary",
      teachingObjective: "Objective",
    });

    expect(result).toEqual({
      approved: true,
      provider: "openai",
    });
  });

  it("trusts an explicit boolean true from OpenAI even for clean-looking text", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-api-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [{ flagged: true }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await reviewLessonContent({
      title: "A gentle lesson",
      summary: "Summary",
      teachingObjective: "Objective",
    });

    expect(result).toMatchObject({
      approved: false,
      provider: "openai",
    });
  });
});
