"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  HOME_TAG,
  PLAN_LIST_TAG,
  lessonPlanPath,
} from "@/lib/revalidation";
import { getBookBySlug } from "@/lib/bible-books";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { reviewLessonContent } from "@/lib/content-review";
import { appendMessage, slugifyText } from "@/lib/urls";

function buildPlanRedirect(id: string, messageKey: string, message: string) {
  return appendMessage(`/dashboard/plans/${id}`, messageKey, message);
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

function isMissingLayoutColumnsError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.message?.includes("layout_content") === true
  );
}

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
  return [
    ...new Set(
      String(formData.get(key) ?? "")
        .split(/[\r\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function parseLayoutContent(formData: FormData) {
  const content: Record<string, string | string[]> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("layoutContent:")) {
      continue;
    }

    const fieldKey = key.replace("layoutContent:", "").trim();

    if (!fieldKey) {
      continue;
    }

    const allValues = formData
      .getAll(key)
      .map((entry) => String(entry).trim())
      .filter(Boolean);

    if (allValues.length > 1) {
      content[fieldKey] = [...new Set(allValues)];
      continue;
    }

    const singleValue = String(value).trim();

    if (singleValue) {
      content[fieldKey] = singleValue;
    }
  }

  return content;
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

function revalidateLessonSurfaces(id: string, slug: string | null | undefined) {
  revalidateTag(HOME_TAG, { expire: 0 });
  revalidateTag(PLAN_LIST_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/plans/${id}`);

  if (slug) {
    revalidatePath(lessonPlanPath(slug));
  }
}

async function resolveUniqueSlug(
  baseTitle: string,
  lessonPlanId: string,
) {
  const serviceClient = createSupabaseServiceClient();
  const baseSlug = slugifyText(baseTitle);

  if (!serviceClient) {
    return baseSlug;
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data } = await serviceClient
      .from("lesson_plans")
      .select("id")
      .eq("slug", candidate)
      .neq("id", lessonPlanId)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function updateLessonPlanAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Lesson editing is not available right now.",
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plan, error: planError } = await supabase
    .from("lesson_plans")
    .select("id, author_id, slug")
    .eq("id", id)
    .maybeSingle();

  if (planError || !plan) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        planError?.message ?? "We could not find that lesson.",
      ),
    );
  }

  if (plan.author_id !== user.id) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Only the lesson creator can edit this lesson.",
      ),
    );
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const teachingObjective = String(formData.get("teachingObjective") ?? "").trim();
  const openingPrayer = String(formData.get("openingPrayer") ?? "").trim();
  const icebreaker = String(formData.get("icebreaker") ?? "").trim();
  const facilitatorNotes = String(formData.get("facilitatorNotes") ?? "").trim();
  const durationMinutes = parseIntField(formData, "durationMinutes");
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
  const layoutContent = parseLayoutContent(formData);
  const bookSlug = String(formData.get("book") ?? "").trim();
  const book = bookSlug ? getBookBySlug(bookSlug) : null;
  const chapterStart = parseIntField(formData, "chapterStart");
  const verseStart = parseIntField(formData, "verseStart");
  const chapterEnd = parseIntField(formData, "chapterEnd");
  const verseEnd = parseIntField(formData, "verseEnd");
  const hasScriptureInput = Boolean(
    bookSlug ||
      String(formData.get("chapterStart") ?? "").trim() ||
      String(formData.get("verseStart") ?? "").trim() ||
      String(formData.get("chapterEnd") ?? "").trim() ||
      String(formData.get("verseEnd") ?? "").trim(),
  );

  if (!title) {
    redirect(
      buildPlanRedirect(id, "error", "Add a lesson title before saving."),
    );
  }

  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 5 ||
    durationMinutes > 480
  ) {
    redirect(
      buildPlanRedirect(id, "error", "Duration must be between 5 and 480 minutes."),
    );
  }

  if (customTags.length > 10) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Use up to 10 custom tags so lessons stay easy to search.",
      ),
    );
  }

  if (customTags.some((tag) => tag.length > 40)) {
    redirect(
      buildPlanRedirect(id, "error", "Keep each custom tag to 40 characters or fewer."),
    );
  }

  if (hasScriptureInput && !book) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Choose a valid scripture book before saving that reference.",
      ),
    );
  }

  if (
    hasScriptureInput &&
    (!Number.isFinite(chapterStart) ||
      !Number.isFinite(verseStart) ||
      !Number.isFinite(chapterEnd) ||
      !Number.isFinite(verseEnd) ||
      chapterStart < 1 ||
      verseStart < 1 ||
      chapterEnd < 1 ||
      verseEnd < 1 ||
      chapterEnd < chapterStart ||
      (chapterEnd === chapterStart && verseEnd < verseStart))
  ) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Enter a complete scripture range or leave the selector empty for now.",
      ),
    );
  }

  const { error: updateError } = await supabase
    .from("lesson_plans")
    .update({
      title,
      summary,
      teaching_objective: teachingObjective,
      duration_minutes: durationMinutes,
      topic_tags: topicTags,
      audience_tags: audienceTags,
      denomination_tags: denominationTags,
      custom_tags: customTags,
      layout_content: layoutContent,
      opening_prayer: openingPrayer || null,
      icebreaker: icebreaker || null,
      facilitator_notes: facilitatorNotes || null,
      materials,
      activities,
      discussion_questions: discussionQuestions,
      prayer_prompts: prayerPrompts,
    })
    .eq("id", id)
    .eq("author_id", user.id);

  if (updateError) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        isMissingCustomTagsColumnError(updateError) ||
          isMissingLayoutColumnsError(updateError)
          ? "Lesson editing is not available right now."
          : updateError.message ?? "We could not save that lesson yet.",
      ),
    );
  }

  const { error: deleteScriptureError } = await supabase
    .from("scripture_refs")
    .delete()
    .eq("lesson_plan_id", id);

  if (deleteScriptureError) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        deleteScriptureError.message ??
          "The lesson was saved, but the scripture reference could not be updated.",
      ),
    );
  }

  if (hasScriptureInput && book) {
    const { error: scriptureError } = await supabase
      .from("scripture_refs")
      .insert({
        lesson_plan_id: id,
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
      redirect(
        buildPlanRedirect(
          id,
          "error",
          scriptureError.message ??
            "The lesson was saved, but the scripture reference could not be updated.",
        ),
      );
    }
  }

  revalidateLessonSurfaces(id, plan.slug);

  redirect(buildPlanRedirect(id, "saved", "Lesson changes saved."));
}

export async function publishLessonAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Publishing is not available right now.",
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plan, error: planError } = await supabase
    .from("lesson_plans")
    .select(
      "id, author_id, title, summary, teaching_objective, status, slug, opening_prayer, icebreaker, facilitator_notes, discussion_questions, activities, prayer_prompts, custom_tags",
    )
    .eq("id", id)
    .maybeSingle();

  if (planError || !plan) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        isMissingCustomTagsColumnError(planError)
          ? "Publishing is not available right now."
          : planError?.message ?? "We could not find that draft.",
      ),
    );
  }

  if (plan.author_id !== user.id) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Only the lesson owner can publish this draft.",
      ),
    );
  }

  if (!plan.title?.trim() || !plan.summary?.trim() || !plan.teaching_objective?.trim()) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Add a title, summary, and teaching objective before publishing.",
      ),
    );
  }

  const { count: scriptureCount, error: scriptureError } = await supabase
    .from("scripture_refs")
    .select("id", { count: "exact", head: true })
    .eq("lesson_plan_id", id);

  if (scriptureError || !scriptureCount) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        scriptureError?.message ??
          "Add at least one scripture reference before publishing.",
      ),
    );
  }

  const review = await reviewLessonContent({
    title: plan.title,
    summary: plan.summary,
    teachingObjective: plan.teaching_objective,
    openingPrayer: plan.opening_prayer,
    icebreaker: plan.icebreaker,
    facilitatorNotes: plan.facilitator_notes,
    discussionQuestions: plan.discussion_questions ?? [],
    activities: plan.activities ?? [],
    prayerPrompts: plan.prayer_prompts ?? [],
    customTags: plan.custom_tags ?? [],
  });

  if (!review.approved) {
    await supabase
      .from("lesson_plans")
      .update({ moderation_state: "under_review" })
      .eq("id", id);

    redirect(
      buildPlanRedirect(
        id,
        "error",
        review.reason ??
          "This lesson needs a quick manual review before it can be published.",
      ),
    );
  }

  const slug = await resolveUniqueSlug(plan.title, id);
  const { data: updatedPlan, error: updateError } = await supabase
    .from("lesson_plans")
    .update({
      status: "published",
      moderation_state: "none",
      slug,
    })
    .eq("id", id)
    .select("slug")
    .single();

  if (updateError || !updatedPlan?.slug) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        updateError?.message ?? "We could not publish that draft yet.",
      ),
    );
  }

  revalidateLessonSurfaces(id, updatedPlan.slug);

  redirect(
    appendMessage(`/dashboard/plans/${id}`, "published", updatedPlan.slug),
  );
}
