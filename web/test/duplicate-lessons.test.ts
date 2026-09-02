import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DuplicateLessonError,
  duplicateLessonToDraft,
} from "@/lib/duplicate-lessons";

type ChainResult = { data: unknown; error: unknown };

/**
 * Builds a minimal chainable stand-in for a Supabase query builder.
 * Every fluent method returns the same chain, and the chain resolves to
 * `result` whether it is awaited directly (matching queries that never call
 * `.single()`/`.maybeSingle()`) or terminated with `.single()`/`.maybeSingle()`.
 */
function createChain(result: ChainResult) {
  const chain: Record<string, unknown> = {};
  const fluentMethods = ["select", "eq", "order", "insert", "delete", "in"];

  for (const method of fluentMethods) {
    chain[method] = vi.fn(() => chain);
  }

  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.then = (
    onFulfilled: (value: ChainResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);

  return chain;
}

/**
 * Builds a fake Supabase client whose `.from(table)` calls pop the next
 * queued chain for that table, in call order.
 */
function createSupabaseMock(queues: Record<string, ChainResult[]>) {
  const chains: Record<string, ReturnType<typeof createChain>[]> = {};

  for (const [table, results] of Object.entries(queues)) {
    chains[table] = results.map((result) => createChain(result));
  }

  const from = vi.fn((table: string) => {
    const queue = chains[table];

    if (!queue || queue.length === 0) {
      throw new Error(`Unexpected call to from("${table}")`);
    }

    return queue.shift();
  });

  return { from } as unknown as SupabaseClient;
}

const sourceLesson = {
  id: "lesson-source",
  title: "Original Lesson",
  summary: "A summary",
  teaching_objective: "An objective",
  duration_minutes: 45,
  topic_tags: ["Faith"],
  audience_tags: ["Adults"],
  denomination_tags: ["Baptist"],
  custom_tags: ["custom"],
  layout_template_id: "layout-1",
  layout_content: { blocks: [] },
  opening_prayer: "Prayer",
  icebreaker: "Icebreaker",
  facilitator_notes: "Notes",
  materials: ["Bibles"],
  activities: ["Discuss"],
  discussion_questions: ["Why?"],
  prayer_prompts: ["Pray"],
  handout_urls: ["https://example.com/handout.pdf"],
};

const scriptureRow = {
  sequence: 1,
  book_code: 43,
  chapter_start: 13,
  verse_start: 1,
  chapter_end: 13,
  verse_end: 17,
  display_label: "John 13:1-17",
};

describe("DuplicateLessonError", () => {
  it("defaults to a 400 status", () => {
    const error = new DuplicateLessonError("Something went wrong");
    expect(error.status).toBe(400);
    expect(error.message).toBe("Something went wrong");
    expect(error.name).toBe("DuplicateLessonError");
    expect(error).toBeInstanceOf(Error);
  });

  it("accepts a custom status", () => {
    const error = new DuplicateLessonError("Not found", 404);
    expect(error.status).toBe(404);
  });
});

describe("duplicateLessonToDraft", () => {
  it("copies the source lesson into a new draft, including scripture references", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: sourceLesson, error: null },
        { data: { id: "lesson-new" }, error: null },
      ],
      scripture_refs: [
        { data: [scriptureRow], error: null },
        { data: null, error: null },
      ],
    });

    const result = await duplicateLessonToDraft({
      supabase,
      sourceLessonId: "lesson-source",
      userId: "user-1",
    });

    expect(result).toEqual({ id: "lesson-new" });
    expect(supabase.from).toHaveBeenNthCalledWith(1, "lesson_plans");
    expect(supabase.from).toHaveBeenNthCalledWith(2, "lesson_plans");
    expect(supabase.from).toHaveBeenNthCalledWith(3, "scripture_refs");
    expect(supabase.from).toHaveBeenNthCalledWith(4, "scripture_refs");

    const lessonPlansChain = (
      supabase.from as unknown as ReturnType<typeof vi.fn>
    ).mock.results[1].value as Record<string, ReturnType<typeof vi.fn>>;

    expect(lessonPlansChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        author_id: "user-1",
        parent_lesson_id: "lesson-source",
        status: "draft",
        title: "Original Lesson copy",
        summary: "A summary",
        topic_tags: ["Faith"],
        layout_content: { blocks: [] },
      }),
    );

    const scriptureInsertChain = (
      supabase.from as unknown as ReturnType<typeof vi.fn>
    ).mock.results[3].value as Record<string, ReturnType<typeof vi.fn>>;

    expect(scriptureInsertChain.insert).toHaveBeenCalledWith([
      {
        lesson_plan_id: "lesson-new",
        sequence: 1,
        book_code: 43,
        chapter_start: 13,
        verse_start: 1,
        chapter_end: 13,
        verse_end: 17,
        display_label: "John 13:1-17",
      },
    ]);
  });

  it("fills in defaults for nullable source fields", async () => {
    const sparseSource = {
      ...sourceLesson,
      topic_tags: null,
      audience_tags: null,
      denomination_tags: null,
      custom_tags: null,
      layout_template_id: null,
      layout_content: null,
      opening_prayer: null,
      icebreaker: null,
      facilitator_notes: null,
      materials: null,
      activities: null,
      discussion_questions: null,
      prayer_prompts: null,
      handout_urls: null,
    };

    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: sparseSource, error: null },
        { data: { id: "lesson-new" }, error: null },
      ],
      scripture_refs: [{ data: [], error: null }],
    });

    await duplicateLessonToDraft({
      supabase,
      sourceLessonId: "lesson-source",
      userId: "user-1",
    });

    const lessonPlansChain = (
      supabase.from as unknown as ReturnType<typeof vi.fn>
    ).mock.results[1].value as Record<string, ReturnType<typeof vi.fn>>;

    expect(lessonPlansChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        topic_tags: [],
        audience_tags: [],
        denomination_tags: [],
        custom_tags: [],
        layout_template_id: null,
        layout_content: {},
        materials: [],
        activities: [],
        discussion_questions: [],
        prayer_prompts: [],
        handout_urls: [],
      }),
    );
  });

  it("does not insert scripture rows when the source lesson has none", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: sourceLesson, error: null },
        { data: { id: "lesson-new" }, error: null },
      ],
      scripture_refs: [{ data: [], error: null }],
    });

    const result = await duplicateLessonToDraft({
      supabase,
      sourceLessonId: "lesson-source",
      userId: "user-1",
    });

    expect(result).toEqual({ id: "lesson-new" });
    expect(supabase.from).toHaveBeenCalledTimes(3);
  });

  it("throws a 404 error when the source lesson cannot be found", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [{ data: null, error: null }],
    });

    await expect(
      duplicateLessonToDraft({
        supabase,
        sourceLessonId: "missing-lesson",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({
      message: "We could not find that lesson.",
      status: 404,
    });
  });

  it("maps a draft-limit constraint violation to a 409 error", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [{ data: null, error: { code: "23514" } }],
    });

    await expect(
      duplicateLessonToDraft({
        supabase,
        sourceLessonId: "lesson-source",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message:
        "Keep five drafts or fewer at a time. Publish or delete one before duplicating another lesson.",
    });
  });

  it("maps a draft-limit message (case-insensitive) to a 409 error", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: null, error: { message: "Draft Limit exceeded for author" } },
      ],
    });

    await expect(
      duplicateLessonToDraft({
        supabase,
        sourceLessonId: "lesson-source",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("maps a missing parent_lesson_id column to a 503 migration error", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [{ data: null, error: { code: "PGRST204" } }],
    });

    await expect(
      duplicateLessonToDraft({
        supabase,
        sourceLessonId: "lesson-source",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({
      status: 503,
      message: "Run the lesson remix migration before duplicating lessons.",
    });
  });

  it("maps an unrecognized source error to a generic 500 error", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [{ data: null, error: { message: "connection reset" } }],
    });

    await expect(
      duplicateLessonToDraft({
        supabase,
        sourceLessonId: "lesson-source",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({
      status: 500,
      message: "We could not duplicate that lesson yet.",
    });
  });

  it("throws when the insert fails, without attempting cleanup", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: sourceLesson, error: null },
        { data: null, error: { message: "insert failed" } },
      ],
    });

    await expect(
      duplicateLessonToDraft({
        supabase,
        sourceLessonId: "lesson-source",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ status: 500 });

    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it("deletes the new draft and throws when reading scriptures fails", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: sourceLesson, error: null },
        { data: { id: "lesson-new" }, error: null },
        { data: null, error: null },
      ],
      scripture_refs: [{ data: null, error: { message: "read failed" } }],
    });

    await expect(
      duplicateLessonToDraft({
        supabase,
        sourceLessonId: "lesson-source",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ status: 500 });

    expect(supabase.from).toHaveBeenNthCalledWith(3, "scripture_refs");
    expect(supabase.from).toHaveBeenNthCalledWith(4, "lesson_plans");

    const deleteChain = (
      supabase.from as unknown as ReturnType<typeof vi.fn>
    ).mock.results[3].value as Record<string, ReturnType<typeof vi.fn>>;

    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith("id", "lesson-new");
  });

  it("deletes the new draft and throws when inserting scriptures fails", async () => {
    const supabase = createSupabaseMock({
      lesson_plans: [
        { data: sourceLesson, error: null },
        { data: { id: "lesson-new" }, error: null },
        { data: null, error: null },
      ],
      scripture_refs: [
        { data: [scriptureRow], error: null },
        { data: null, error: { message: "insert failed" } },
      ],
    });

    await expect(
      duplicateLessonToDraft({
        supabase,
        sourceLessonId: "lesson-source",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ status: 500 });

    expect(supabase.from).toHaveBeenNthCalledWith(4, "scripture_refs");
    expect(supabase.from).toHaveBeenNthCalledWith(5, "lesson_plans");

    const deleteChain = (
      supabase.from as unknown as ReturnType<typeof vi.fn>
    ).mock.results[4].value as Record<string, ReturnType<typeof vi.fn>>;

    expect(deleteChain.delete).toHaveBeenCalled();
    expect(deleteChain.eq).toHaveBeenCalledWith("id", "lesson-new");
  });
});