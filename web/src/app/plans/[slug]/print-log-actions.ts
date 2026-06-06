"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCurrentViewer,
  isMissingPrintedLessonLogsError,
} from "@/lib/lesson-plans";

type SavePrintLogInput = {
  lessonPlanId: string;
  lessonSlug: string | null;
  lessonTitle: string;
  printTitle: string;
  printSummary: string;
  printPayload: Record<string, unknown>;
  layoutTemplateId: string | null;
  layoutContent: Record<string, unknown>;
};

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 2000) : fallback;
}

function cleanPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function savePrintLogAction(input: SavePrintLogInput) {
  const [viewer, supabase] = await Promise.all([
    getCurrentViewer(),
    createSupabaseServerClient(),
  ]);

  if (!viewer) {
    return {
      ok: false,
      message: "Sign in before saving a private print log.",
    };
  }

  if (!supabase) {
    return {
      ok: false,
      message: "Private print logs are not available in this environment yet.",
    };
  }

  const printTitle = cleanText(input.printTitle, "Printed lesson");
  const lessonTitle = cleanText(input.lessonTitle, printTitle);

  const { error } = await supabase.from("printed_lesson_logs").insert({
    user_id: viewer.userId,
    lesson_plan_id: cleanText(input.lessonPlanId) || null,
    lesson_slug_snapshot: cleanText(input.lessonSlug).slice(0, 160) || null,
    lesson_title_snapshot: lessonTitle,
    print_title: printTitle || lessonTitle,
    print_summary: cleanText(input.printSummary),
    print_payload: cleanPayload(input.printPayload),
    layout_template_id: cleanText(input.layoutTemplateId) || null,
    layout_content: cleanPayload(input.layoutContent),
  });

  if (isMissingPrintedLessonLogsError(error)) {
    return {
      ok: false,
      message:
        "Run the 0016_add_private_printed_lesson_logs.sql migration before saving print logs.",
    };
  }

  if (error) {
    return {
      ok: false,
      message: "We could not save that print log yet. Please try again.",
    };
  }

  revalidatePath("/dashboard/printed");

  return {
    ok: true,
    message: "Saved to your private print log.",
  };
}
