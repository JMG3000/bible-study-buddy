import { beforeEach, describe, expect, it, vi } from "vitest";

const duplicateLessonToDraftMock = vi.fn();
const createSupabaseServerClientMock = vi.fn();

vi.mock("@/lib/duplicate-lessons", async () => {
  const actual = await vi.importActual<typeof import("@/lib/duplicate-lessons")>(
    "@/lib/duplicate-lessons",
  );

  return {
    ...actual,
    duplicateLessonToDraft: (...args: unknown[]) =>
      duplicateLessonToDraftMock(...args),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: (...args: unknown[]) =>
    createSupabaseServerClientMock(...args),
}));

import { POST } from "@/app/api/lessons/[id]/duplicate/route";
import { DuplicateLessonError } from "@/lib/duplicate-lessons";

function makeRequest() {
  return new Request("http://localhost/api/lessons/lesson-1/duplicate", {
    method: "POST",
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/lessons/[id]/duplicate", () => {
  beforeEach(() => {
    duplicateLessonToDraftMock.mockReset();
    createSupabaseServerClientMock.mockReset();
  });

  it("returns 400 when the lesson id is blank after trimming", async () => {
    createSupabaseServerClientMock.mockResolvedValue(null);

    const response = await POST(makeRequest(), makeParams("   "));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing lesson id.",
    });
    expect(duplicateLessonToDraftMock).not.toHaveBeenCalled();
  });

  it("returns 503 when Supabase is not configured", async () => {
    createSupabaseServerClientMock.mockResolvedValue(null);

    const response = await POST(makeRequest(), makeParams("lesson-1"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Lesson duplication is not available right now.",
    });
  });

  it("returns 401 when there is no authenticated user", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const response = await POST(makeRequest(), makeParams("lesson-1"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Sign in to duplicate lessons.",
    });
    expect(duplicateLessonToDraftMock).not.toHaveBeenCalled();
  });

  it("trims the lesson id and returns the new draft location on success", async () => {
    const fakeSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
    };
    createSupabaseServerClientMock.mockResolvedValue(fakeSupabase);
    duplicateLessonToDraftMock.mockResolvedValue({ id: "draft-1" });

    const response = await POST(makeRequest(), makeParams("  lesson-1  "));

    expect(duplicateLessonToDraftMock).toHaveBeenCalledWith({
      supabase: fakeSupabase,
      sourceLessonId: "lesson-1",
      userId: "user-1",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "draft-1",
      editorPath: "/dashboard/plans/draft-1",
    });
  });

  it("maps a DuplicateLessonError to its status and message", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
    });
    duplicateLessonToDraftMock.mockRejectedValue(
      new DuplicateLessonError("Keep five drafts or fewer.", 409),
    );

    const response = await POST(makeRequest(), makeParams("lesson-1"));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Keep five drafts or fewer.",
    });
  });

  it("falls back to a generic 500 error for unexpected failures", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
    });
    duplicateLessonToDraftMock.mockRejectedValue(new Error("unexpected"));

    const response = await POST(makeRequest(), makeParams("lesson-1"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "We could not duplicate that lesson yet.",
    });
  });
});