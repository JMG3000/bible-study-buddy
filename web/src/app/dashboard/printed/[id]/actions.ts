"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appendMessage } from "@/lib/urls";
import {
  getCurrentViewer,
  isMissingPrintedLessonLogsError,
} from "@/lib/lesson-plans";

function readText(formData: FormData, key: string, maxLength = 4000) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function readLines(formData: FormData, key: string) {
  return readText(formData, key, 12000)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readLayoutFields(formData: FormData) {
  const fields: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("layoutField:") || typeof value !== "string") {
      continue;
    }

    const fieldKey = key.replace("layoutField:", "").trim();

    if (fieldKey.length === 0) {
      continue;
    }

    fields[fieldKey] = value.trim().slice(0, 4000);
  }

  return fields;
}

function buildPayload(formData: FormData) {
  const layoutFields = readLayoutFields(formData);

  return {
    title: readText(formData, "printTitle", 280),
    summary: readText(formData, "printSummary", 2000),
    teachingObjective: readText(formData, "teachingObjective"),
    openingPrayer: readText(formData, "openingPrayer"),
    icebreaker: readText(formData, "icebreaker"),
    audience: readText(formData, "audience", 1000),
    traditions: readText(formData, "traditions", 1000),
    materials: readLines(formData, "materials"),
    discussionQuestions: readLines(formData, "discussionQuestions"),
    activities: readLines(formData, "activities"),
    prayerPrompts: readLines(formData, "prayerPrompts"),
    facilitatorNotes: readText(formData, "facilitatorNotes"),
    layoutFields,
  };
}

function buildPrintedRedirect(id: string, key: string, message: string) {
  return appendMessage(`/dashboard/printed/${id}`, key, message);
}

async function getActionContext(formData: FormData) {
  const id = readText(formData, "id", 80);
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!id || !viewer || !supabase) {
    redirect("/dashboard/printed");
  }

  return { id, viewer, supabase };
}

export async function updatePrintedLogAction(formData: FormData) {
  const { id, viewer, supabase } = await getActionContext(formData);
  const payload = buildPayload(formData);
  const printTitle = payload.title || "Saved handout";

  const { error } = await supabase
    .from("printed_lesson_logs")
    .update({
      print_title: printTitle,
      print_summary: payload.summary,
      print_payload: payload,
      layout_content: payload.layoutFields,
    })
    .eq("id", id)
    .eq("user_id", viewer.userId);

  if (isMissingPrintedLessonLogsError(error)) {
    redirect(
      buildPrintedRedirect(
        id,
        "error",
        "Run the print-log migration before editing saved handouts.",
      ),
    );
  }

  if (error) {
    redirect(buildPrintedRedirect(id, "error", "We could not save that handout."));
  }

  revalidatePath("/dashboard/printed");
  revalidatePath(`/dashboard/printed/${id}`);
  redirect(buildPrintedRedirect(id, "saved", "Saved handout updated."));
}

export async function duplicatePrintedLogAction(formData: FormData) {
  const { id, viewer, supabase } = await getActionContext(formData);
  const payload = buildPayload(formData);
  const printTitle = payload.title || "Saved handout";

  const { data: existing, error: existingError } = await supabase
    .from("printed_lesson_logs")
    .select(
      "lesson_plan_id, lesson_slug_snapshot, lesson_title_snapshot, layout_template_id",
    )
    .eq("id", id)
    .eq("user_id", viewer.userId)
    .maybeSingle();

  if (isMissingPrintedLessonLogsError(existingError) || !existing) {
    redirect("/dashboard/printed");
  }

  const typedExisting = existing as {
    lesson_plan_id: string | null;
    lesson_slug_snapshot: string | null;
    lesson_title_snapshot: string;
    layout_template_id: string | null;
  };

  const { data: inserted, error } = await supabase
    .from("printed_lesson_logs")
    .insert({
      user_id: viewer.userId,
      lesson_plan_id: typedExisting.lesson_plan_id,
      lesson_slug_snapshot: typedExisting.lesson_slug_snapshot,
      lesson_title_snapshot: typedExisting.lesson_title_snapshot,
      print_title: `${printTitle} copy`,
      print_summary: payload.summary,
      print_payload: payload,
      layout_template_id: typedExisting.layout_template_id,
      layout_content: payload.layoutFields,
    })
    .select("id")
    .single();

  if (isMissingPrintedLessonLogsError(error)) {
    redirect(
      buildPrintedRedirect(
        id,
        "error",
        "Run the print-log migration before saving handout copies.",
      ),
    );
  }

  if (error || !inserted) {
    redirect(buildPrintedRedirect(id, "error", "We could not save that copy."));
  }

  const newId = (inserted as { id: string }).id;

  revalidatePath("/dashboard/printed");
  redirect(buildPrintedRedirect(newId, "saved", "Saved as a new private handout."));
}

export async function archivePrintedLogAction(formData: FormData) {
  const { id, viewer, supabase } = await getActionContext(formData);

  const { error } = await supabase
    .from("printed_lesson_logs")
    .update({
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", viewer.userId);

  if (isMissingPrintedLessonLogsError(error)) {
    redirect(
      buildPrintedRedirect(
        id,
        "error",
        "Run the print-log archive migration before archiving saved handouts.",
      ),
    );
  }

  if (error) {
    redirect(buildPrintedRedirect(id, "error", "We could not archive that handout."));
  }

  revalidatePath("/dashboard/printed");
  redirect("/dashboard/printed?saved=Handout archived.");
}

export async function deletePrintedLogAction(formData: FormData) {
  const { id, viewer, supabase } = await getActionContext(formData);

  const { error } = await supabase
    .from("printed_lesson_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", viewer.userId);

  if (isMissingPrintedLessonLogsError(error)) {
    redirect("/dashboard/printed");
  }

  if (error) {
    redirect(buildPrintedRedirect(id, "error", "We could not delete that handout."));
  }

  revalidatePath("/dashboard/printed");
  redirect("/dashboard/printed?saved=Handout deleted.");
}
