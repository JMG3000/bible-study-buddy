import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendMessage, POST_AUTH_REDIRECT_COOKIE } from "@/lib/urls";

class RedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`REDIRECT:${url}`);
  }
}

const redirectMock = vi.fn((url: string) => {
  throw new RedirectSignal(url);
});
const cookieSetMock = vi.fn();
const cookiesMock = vi.fn(async () => ({
  set: cookieSetMock,
  get: vi.fn(),
  getAll: vi.fn(() => []),
}));
const revalidatePathMock = vi.fn();
const duplicateLessonToDraftMock = vi.fn();
const getCurrentViewerMock = vi.fn();
const createSupabaseServerClientMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

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

vi.mock("@/lib/lesson-plans", () => ({
  getCurrentViewer: () => getCurrentViewerMock(),
  getViewerLessonReportAccess: vi.fn(),
}));

import { duplicateLessonAction } from "@/app/plans/[slug]/actions";
import { DuplicateLessonError } from "@/lib/duplicate-lessons";

function buildFormData(fields: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return formData;
}

async function captureRedirectUrl(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    if (error instanceof RedirectSignal) {
      return error.url;
    }

    throw error;
  }

  throw new Error("Expected the action to redirect.");
}

const viewer = {
  userId: "user-1",
  displayName: "Test User",
  handle: "test-user",
  role: "user" as const,
};

describe("duplicateLessonAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    cookieSetMock.mockClear();
    cookiesMock.mockClear();
    revalidatePathMock.mockClear();
    duplicateLessonToDraftMock.mockReset();
    getCurrentViewerMock.mockReset();
    createSupabaseServerClientMock.mockReset();
  });

  it("redirects back without duplicating when the lesson id is missing", async () => {
    getCurrentViewerMock.mockResolvedValue(viewer);

    const url = await captureRedirectUrl(
      duplicateLessonAction(buildFormData({ returnPath: "/plans/lesson-1" })),
    );

    expect(url).toBe("/plans/lesson-1");
    expect(duplicateLessonToDraftMock).not.toHaveBeenCalled();
  });

  it("stores the return path and redirects to login when signed out", async () => {
    getCurrentViewerMock.mockResolvedValue(null);

    const url = await captureRedirectUrl(
      duplicateLessonAction(
        buildFormData({
          lessonPlanId: "lesson-1",
          returnPath: "/plans/lesson-1",
        }),
      ),
    );

    expect(url).toBe("/login");
    expect(cookieSetMock).toHaveBeenCalledWith(
      POST_AUTH_REDIRECT_COOKIE,
      "/plans/lesson-1",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(duplicateLessonToDraftMock).not.toHaveBeenCalled();
  });

  it("redirects with an error when Supabase is not configured", async () => {
    getCurrentViewerMock.mockResolvedValue(viewer);
    createSupabaseServerClientMock.mockResolvedValue(null);

    const url = await captureRedirectUrl(
      duplicateLessonAction(
        buildFormData({
          lessonPlanId: "lesson-1",
          returnPath: "/plans/lesson-1",
        }),
      ),
    );

    expect(url).toBe(
      appendMessage(
        "/plans/lesson-1",
        "duplicateError",
        "Lesson duplication is not available right now.",
      ),
    );
  });

  it("duplicates the lesson and redirects to the new draft on success", async () => {
    getCurrentViewerMock.mockResolvedValue(viewer);
    const fakeSupabase = { fake: true };
    createSupabaseServerClientMock.mockResolvedValue(fakeSupabase);
    duplicateLessonToDraftMock.mockResolvedValue({ id: "draft-1" });

    const url = await captureRedirectUrl(
      duplicateLessonAction(
        buildFormData({
          lessonPlanId: "lesson-1",
          returnPath: "/plans/lesson-1",
        }),
      ),
    );

    expect(duplicateLessonToDraftMock).toHaveBeenCalledWith({
      supabase: fakeSupabase,
      sourceLessonId: "lesson-1",
      userId: "user-1",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(url).toBe(
      appendMessage("/dashboard/plans/draft-1", "saved", "Duplicated as a new draft."),
    );
  });

  it("redirects with the DuplicateLessonError message on failure", async () => {
    getCurrentViewerMock.mockResolvedValue(viewer);
    createSupabaseServerClientMock.mockResolvedValue({ fake: true });
    duplicateLessonToDraftMock.mockRejectedValue(
      new DuplicateLessonError("Keep five drafts or fewer.", 409),
    );

    const url = await captureRedirectUrl(
      duplicateLessonAction(
        buildFormData({
          lessonPlanId: "lesson-1",
          returnPath: "/plans/lesson-1",
        }),
      ),
    );

    expect(url).toBe(
      appendMessage("/plans/lesson-1", "duplicateError", "Keep five drafts or fewer."),
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("redirects with a generic message for unexpected failures", async () => {
    getCurrentViewerMock.mockResolvedValue(viewer);
    createSupabaseServerClientMock.mockResolvedValue({ fake: true });
    duplicateLessonToDraftMock.mockRejectedValue(new Error("boom"));

    const url = await captureRedirectUrl(
      duplicateLessonAction(
        buildFormData({
          lessonPlanId: "lesson-1",
          returnPath: "/plans/lesson-1",
        }),
      ),
    );

    expect(url).toBe(
      appendMessage(
        "/plans/lesson-1",
        "duplicateError",
        "We could not duplicate that lesson yet.",
      ),
    );
  });

  it("falls back to /plans when returnPath is unsafe", async () => {
    getCurrentViewerMock.mockResolvedValue(viewer);

    const url = await captureRedirectUrl(
      duplicateLessonAction(
        buildFormData({ returnPath: "https://attacker.example/steal" }),
      ),
    );

    expect(url).toBe("/plans");
  });
});