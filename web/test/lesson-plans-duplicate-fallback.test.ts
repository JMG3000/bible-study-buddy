import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const createSupabaseStaticClientMock = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseStaticClient: () => createSupabaseStaticClientMock(),
}));

import {
  getFeaturedPlans,
  getPublishedLessonAttributionById,
} from "@/lib/lesson-plans";

type ChainResult = { data: unknown; error: unknown };

function createChain(result: ChainResult) {
  const chain: Record<string, unknown> = {};
  const fluentMethods = ["select", "eq", "order", "limit", "in", "not"];

  for (const method of fluentMethods) {
    chain[method] = vi.fn(() => chain);
  }

  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.then = (
    onFulfilled: (value: ChainResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);

  return chain;
}

/** Queues chain results per table, popping the next one on each `.from(table)` call. */
function createSupabaseMock(queues: Record<string, ChainResult[]>) {
  const chains: Record<string, ReturnType<typeof createChain>[]> = {};

  for (const [table, results] of Object.entries(queues)) {
    chains[table] = results.map((result) => createChain(result));
  }

  const from = vi.fn((table: string) => {
    const queue = chains[table] ?? [];
    return queue.shift() ?? createChain({ data: [], error: null });
  });

  return { from } as unknown as SupabaseClient;
}

const baseRow = {
  id: "lesson-1",
  author_id: "author-1",
  slug: "lesson-slug",
  status: "published",
  moderation_state: "approved",
  title: "Lesson Title",
  summary: "Summary",
  teaching_objective: "Objective",
  duration_minutes: 30,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  published_at: "2026-01-02T00:00:00.000Z",
};

describe("getPublishedLessonAttributionById", () => {
  beforeEach(() => {
    createSupabaseStaticClientMock.mockReset();
  });

  it("returns null without querying when the id is missing", async () => {
    const result = await getPublishedLessonAttributionById(null);
    expect(result).toBeNull();
    expect(createSupabaseStaticClientMock).not.toHaveBeenCalled();
  });

  it("returns null without querying when the id is an empty string", async () => {
    const result = await getPublishedLessonAttributionById("");
    expect(result).toBeNull();
    expect(createSupabaseStaticClientMock).not.toHaveBeenCalled();
  });

  it("returns null when Supabase is not configured", async () => {
    createSupabaseStaticClientMock.mockReturnValue(null);
    const result = await getPublishedLessonAttributionById("lesson-1");
    expect(result).toBeNull();
  });

  it("returns the attribution for a published lesson with a slug", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        {
          data: { id: "lesson-1", slug: "lesson-slug", title: "Lesson Title" },
          error: null,
        },
      ],
    });
    createSupabaseStaticClientMock.mockReturnValue(supabase);

    const result = await getPublishedLessonAttributionById("lesson-1");

    expect(supabase.from).toHaveBeenCalledWith("lesson_plans");
    expect(result).toEqual({
      id: "lesson-1",
      slug: "lesson-slug",
      title: "Lesson Title",
    });
  });

  it("returns null when the query returns an error", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [{ data: null, error: { message: "boom" } }],
    });
    createSupabaseStaticClientMock.mockReturnValue(supabase);

    const result = await getPublishedLessonAttributionById("lesson-1");
    expect(result).toBeNull();
  });

  it("returns null when no matching row exists", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [{ data: null, error: null }],
    });
    createSupabaseStaticClientMock.mockReturnValue(supabase);

    const result = await getPublishedLessonAttributionById("lesson-1");
    expect(result).toBeNull();
  });

  it("returns null if the matched row unexpectedly has no slug", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: { id: "lesson-1", slug: null, title: "Lesson Title" }, error: null },
      ],
    });
    createSupabaseStaticClientMock.mockReturnValue(supabase);

    const result = await getPublishedLessonAttributionById("lesson-1");
    expect(result).toBeNull();
  });
});

describe("lesson plan fallback selects (parent_lesson_id column rollout)", () => {
  beforeEach(() => {
    createSupabaseStaticClientMock.mockReset();
  });

  it("uses parent_lesson_id directly when the column is available", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        {
          data: [{ ...baseRow, parent_lesson_id: "parent-1", author_handle: "handle", custom_tags: ["tag"] }],
          error: null,
        },
      ],
      scripture_refs: [{ data: [], error: null }],
      study_series_lessons: [{ data: [], error: null }],
    });
    createSupabaseStaticClientMock.mockReturnValue(supabase);

    const [plan] = await getFeaturedPlans();

    expect(plan.parentLessonId).toBe("parent-1");
    expect(plan.customTags).toEqual(["tag"]);
    expect(supabase.from).toHaveBeenCalledTimes(3);
  });

  it("falls back to the legacy select when parent_lesson_id is missing, without losing custom tags", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: null, error: { code: "PGRST204", message: "column parent_lesson_id does not exist" } },
        {
          data: [{ ...baseRow, author_handle: "handle", custom_tags: ["tag"] }],
          error: null,
        },
      ],
      scripture_refs: [{ data: [], error: null }],
      study_series_lessons: [{ data: [], error: null }],
    });
    createSupabaseStaticClientMock.mockReturnValue(supabase);

    const [plan] = await getFeaturedPlans();

    expect(plan.parentLessonId).toBeNull();
    expect(plan.customTags).toEqual(["tag"]);
  });

  it("falls back twice when both parent_lesson_id and custom_tags are missing", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: null, error: { code: "PGRST204", message: "column parent_lesson_id does not exist" } },
        { data: null, error: { code: "PGRST204", message: "column custom_tags does not exist" } },
        {
          data: [{ ...baseRow, author_handle: "handle" }],
          error: null,
        },
      ],
      scripture_refs: [{ data: [], error: null }],
      study_series_lessons: [{ data: [], error: null }],
    });
    createSupabaseStaticClientMock.mockReturnValue(supabase);

    const [plan] = await getFeaturedPlans();

    expect(plan.parentLessonId).toBeNull();
    expect(plan.customTags).toEqual([]);
  });

  it("returns no plans when the parent_lesson_id fallback hits an unrelated error", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: null, error: { code: "PGRST204", message: "column parent_lesson_id does not exist" } },
        { data: null, error: { code: "500", message: "unexpected database failure" } },
      ],
    });
    createSupabaseStaticClientMock.mockReturnValue(supabase);

    const plans = await getFeaturedPlans();

    expect(plans).toEqual([]);
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });
});