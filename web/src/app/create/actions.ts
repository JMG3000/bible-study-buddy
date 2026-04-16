"use server";

import { redirect } from "next/navigation";
import { getBookBySlug } from "@/lib/bible-books";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appendMessage } from "@/lib/urls";

function parseIntField(formData: FormData, key: string) {
  const value = Number.parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isFinite(value) ? value : Number.NaN;
}

function parseLines(formData: FormData, key: string) {
  return String(formData.get(key) ?? "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseCustomTags(formData: FormData, key: string) {
  return [...new Set(
    String(formData.get(key) ?? "")
      .split(/[\r\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  )];
}

function formatScriptureLabel(
  bookName: string,
  chapterStart: number,
  verseStart: number,
  chapterEnd: number,
  verseEnd: number,
) {
  if (chapterStart === chapterEnd && verseStart === verseEnd) {
    return `${bookName} ${chapterStart}:${verseStart}`;
  }

  if (chapterStart === chapterEnd) {
    return `${bookName} ${chapterStart}:${verseStart}-${verseEnd}`;
  }

  return `${bookName} ${chapterStart}:${verseStart}-${chapterEnd}:${verseEnd}`;
}

function buildCreateRedirect(message: string) {
  return appendMessage("/create", "error", message);
}

function isMissingCustomTagsColumnError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.message?.includes("custom_tags") === true
  );
}

export async function createLessonDraftAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildCreateRedirect("Supabase is not configured in this environment."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const teachingObjective = String(formData.get("teachingObjective") ?? "").trim();
  const openingPrayer = String(formData.get("openingPrayer") ?? "").trim();
  const icebreaker = String(formData.get("icebreaker") ?? "").trim();
  const facilitatorNotes = String(formData.get("facilitatorNotes") ?? "").trim();
  const durationMinutes = parseIntField(formData, "durationMinutes");
  const chapterStart = parseIntField(formData, "chapterStart");
  const verseStart = parseIntField(formData, "verseStart");
  const chapterEnd = parseIntField(formData, "chapterEnd");
  const verseEnd = parseIntField(formData, "verseEnd");
  const topicTags = formData
    .getAll("topicTags")
    .map((value) => String(value))
    .filter(Boolean);
  const audienceTags = formData
    .getAll("audienceTags")
    .map((value) => String(value))
    .filter(Boolean);
  const denominationTags = formData
    .getAll("denominationTags")
    .map((value) => String(value))
    .filter(Boolean);
  const materials = parseLines(formData, "materials");
  const activities = parseLines(formData, "activities");
  const discussionQuestions = parseLines(formData, "discussionQuestions");
  const prayerPrompts = parseLines(formData, "prayerPrompts");
  const customTags = parseCustomTags(formData, "customTags");
  const bookSlug = String(formData.get("book") ?? "");
  const book = getBookBySlug(bookSlug);

  if (!title || !summary || !teachingObjective) {
    redirect(buildCreateRedirect("Title, summary, and teaching objective are required."));
  }

  if (!book) {
    redirect(buildCreateRedirect("Choose a valid scripture book."));
  }

  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 5 ||
    durationMinutes > 480
  ) {
    redirect(buildCreateRedirect("Duration must be between 5 and 480 minutes."));
  }

  if (
    !Number.isFinite(chapterStart) ||
    !Number.isFinite(verseStart) ||
    !Number.isFinite(chapterEnd) ||
    !Number.isFinite(verseEnd) ||
    chapterStart < 1 ||
    verseStart < 1 ||
    chapterEnd < 1 ||
    verseEnd < 1 ||
    chapterEnd < chapterStart ||
    (chapterEnd === chapterStart && verseEnd < verseStart)
  ) {
    redirect(buildCreateRedirect("Enter a valid scripture chapter and verse range."));
  }

  if (customTags.length > 10) {
    redirect(
      buildCreateRedirect("Use up to 10 custom tags so lessons stay easy to search."),
    );
  }

  if (customTags.some((tag) => tag.length > 40)) {
    redirect(
      buildCreateRedirect("Keep each custom tag to 40 characters or fewer."),
    );
  }

  const { data: insertedPlan, error: planError } = await supabase
    .from("lesson_plans")
    .insert({
      author_id: user.id,
      status: "draft",
      title,
      summary,
      teaching_objective: teachingObjective,
      duration_minutes: durationMinutes,
      topic_tags: topicTags,
      audience_tags: audienceTags,
      denomination_tags: denominationTags,
      custom_tags: customTags,
      opening_prayer: openingPrayer || null,
      icebreaker: icebreaker || null,
      facilitator_notes: facilitatorNotes || null,
      materials,
      activities,
      discussion_questions: discussionQuestions,
      prayer_prompts: prayerPrompts,
      handout_urls: [],
    })
    .select("id")
    .single();

  if (planError || !insertedPlan) {
    redirect(
      buildCreateRedirect(
        isMissingCustomTagsColumnError(planError)
          ? "Run the 0006_add_custom_tags.sql migration in Supabase, then save your draft again."
          : planError?.message ?? "Unable to create a new lesson draft.",
      ),
    );
  }

  const { error: scriptureError } = await supabase.from("scripture_refs").insert({
    lesson_plan_id: insertedPlan.id,
    sequence: 1,
    book_code: book.bookCode,
    chapter_start: chapterStart,
    verse_start: verseStart,
    chapter_end: chapterEnd,
    verse_end: verseEnd,
    display_label: formatScriptureLabel(
      book.displayName,
      chapterStart,
      verseStart,
      chapterEnd,
      verseEnd,
    ),
  });

  if (scriptureError) {
    await supabase.from("lesson_plans").delete().eq("id", insertedPlan.id);
    redirect(
      buildCreateRedirect(
        scriptureError.message ??
          "The draft was created, but the scripture reference could not be saved.",
      ),
    );
  }

  redirect("/dashboard?created=1");
}
