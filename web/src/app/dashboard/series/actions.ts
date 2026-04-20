"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  PLAN_LIST_TAG,
  SERIES_LIST_TAG,
  studySeriesPath,
} from "@/lib/revalidation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { appendMessage, slugifyText } from "@/lib/urls";

function buildSeriesRedirect(id: string, messageKey: string, message: string) {
  return appendMessage(`/dashboard/series/${id}`, messageKey, message);
}

function buildSeriesCreateRedirect(message: string) {
  return appendMessage("/dashboard/series/create", "error", message);
}

type SeriesDraftSnapshot = {
  title: string;
  summary: string;
  selectedLessons: Array<{
    lessonPlanId: string;
    position: number;
  }>;
};

function encodeSeriesDraftSnapshot(snapshot: SeriesDraftSnapshot) {
  return {
    title: snapshot.title,
    summary: snapshot.summary,
    lessons: snapshot.selectedLessons.map((lesson) => lesson.lessonPlanId).join(","),
    positions: snapshot.selectedLessons
      .map((lesson) => `${lesson.lessonPlanId}:${lesson.position}`)
      .join("|"),
  };
}

function buildSeriesCreateRedirectWithState(
  message: string,
  snapshot: SeriesDraftSnapshot,
) {
  let path = buildSeriesCreateRedirect(message);

  for (const [key, value] of Object.entries(encodeSeriesDraftSnapshot(snapshot))) {
    if (value) {
      path = appendMessage(path, key, value);
    }
  }

  return path;
}

function isMissingStudySeriesRelationError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("study_series") === true
  );
}

function parseSelectedLessons(formData: FormData) {
  const lessonIds = [...new Set(formData.getAll("lessonIds").map((value) => String(value)))];

  return lessonIds.map((lessonPlanId) => {
    const rawPosition = Number.parseInt(
      String(formData.get(`position:${lessonPlanId}`) ?? ""),
      10,
    );

    return {
      lessonPlanId,
      position: rawPosition,
    };
  });
}

function readSeriesDraftSnapshot(formData: FormData): SeriesDraftSnapshot {
  return {
    title: String(formData.get("title") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    selectedLessons: parseSelectedLessons(formData),
  };
}

async function resolveUniqueSeriesSlug(title: string, seriesId: string) {
  const serviceClient = createSupabaseServiceClient();
  const baseSlug = slugifyText(title || "study-series");

  if (!serviceClient) {
    return baseSlug;
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data } = await serviceClient
      .from("study_series")
      .select("id")
      .eq("slug", candidate)
      .neq("id", seriesId)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function createStudySeriesAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildSeriesCreateRedirect("Series creation is not available right now."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const snapshot = readSeriesDraftSnapshot(formData);
  const { title, summary, selectedLessons } = snapshot;

  if (!title || !summary) {
    redirect(
      buildSeriesCreateRedirectWithState(
        "Add a series title and summary before saving.",
        snapshot,
      ),
    );
  }

  if (selectedLessons.length < 2) {
    redirect(
      buildSeriesCreateRedirectWithState(
        "Select at least two lessons to build a study series.",
        snapshot,
      ),
    );
  }

  if (
    selectedLessons.some(
      (lesson) => !Number.isFinite(lesson.position) || lesson.position < 1,
    )
  ) {
    redirect(
      buildSeriesCreateRedirectWithState(
        "Give each selected lesson a valid sequence number.",
        snapshot,
      ),
    );
  }

  const duplicatePositions = new Set<number>();
  const seenPositions = new Set<number>();

  for (const lesson of selectedLessons) {
    if (seenPositions.has(lesson.position)) {
      duplicatePositions.add(lesson.position);
    }

    seenPositions.add(lesson.position);
  }

  if (duplicatePositions.size > 0) {
    redirect(
      buildSeriesCreateRedirectWithState(
        "Each lesson in a series needs its own unique step number.",
        snapshot,
      ),
    );
  }

  const lessonIds = selectedLessons.map((lesson) => lesson.lessonPlanId);
  const { data: ownedLessons, error: lessonError } = await supabase
    .from("lesson_plans")
    .select("id")
    .in("id", lessonIds)
    .eq("author_id", user.id);

  if (lessonError) {
    redirect(buildSeriesCreateRedirectWithState(lessonError.message, snapshot));
  }

  if (((ownedLessons as Array<{ id: string }> | null) ?? []).length !== lessonIds.length) {
    redirect(
      buildSeriesCreateRedirectWithState(
        "A study series can only include lessons that belong to your account.",
        snapshot,
      ),
    );
  }

  const { data: insertedSeries, error: seriesError } = await supabase
    .from("study_series")
    .insert({
      author_id: user.id,
      status: "draft",
      title,
      summary,
    })
    .select("id")
    .single();

  if (seriesError || !insertedSeries) {
    redirect(
      buildSeriesCreateRedirectWithState(
        isMissingStudySeriesRelationError(seriesError)
          ? "Series saving is not available right now."
          : seriesError?.message ?? "Unable to create a study series draft.",
        snapshot,
      ),
    );
  }

  const { error: membershipError } = await supabase.from("study_series_lessons").insert(
    selectedLessons.map((lesson) => ({
      series_id: insertedSeries.id,
      lesson_plan_id: lesson.lessonPlanId,
      position: lesson.position,
    })),
  );

  if (membershipError) {
    await supabase.from("study_series").delete().eq("id", insertedSeries.id);
    redirect(
      buildSeriesCreateRedirectWithState(
        membershipError.message ?? "We created the series shell, but could not attach the lessons.",
        snapshot,
      ),
    );
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/series/${insertedSeries.id}?created=1`);
}

export async function publishStudySeriesAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildSeriesRedirect(id, "error", "Series publishing is not available right now."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: series, error: seriesError } = await supabase
    .from("study_series")
    .select("id, author_id, title, summary")
    .eq("id", id)
    .maybeSingle();

  if (seriesError || !series) {
    redirect(
      buildSeriesRedirect(
        id,
        "error",
        isMissingStudySeriesRelationError(seriesError)
          ? "Series publishing is not available right now."
          : seriesError?.message ?? "We could not find that study series draft.",
      ),
    );
  }

  if (series.author_id !== user.id) {
    redirect(
      buildSeriesRedirect(
        id,
        "error",
        "Only the series owner can publish this study series.",
      ),
    );
  }

  if (!series.title?.trim() || !series.summary?.trim()) {
    redirect(
      buildSeriesRedirect(
        id,
        "error",
        "Add a title and summary before publishing this series.",
      ),
    );
  }

  const { data: linkedLessons, error: linkedLessonsError } = await supabase
    .from("study_series_lessons")
    .select("lesson_plan_id, position")
    .eq("series_id", id)
    .order("position", { ascending: true });

  if (linkedLessonsError) {
    redirect(buildSeriesRedirect(id, "error", linkedLessonsError.message));
  }

  const typedLessons =
    (linkedLessons as Array<{ lesson_plan_id: string; position: number }> | null) ?? [];

  if (typedLessons.length < 2) {
    redirect(
      buildSeriesRedirect(
        id,
        "error",
        "A published study series needs at least two lessons in sequence.",
      ),
    );
  }

  const lessonIds = typedLessons.map((lesson) => lesson.lesson_plan_id);
  const { data: lessonPlans, error: lessonPlansError } = await supabase
    .from("lesson_plans")
    .select("id, title, status, slug")
    .in("id", lessonIds);

  if (lessonPlansError) {
    redirect(buildSeriesRedirect(id, "error", lessonPlansError.message));
  }

  const typedLessonPlans =
    (lessonPlans as Array<{ id: string; title: string; status: string; slug: string | null }> | null) ??
    [];

  const unpublishedLesson = typedLessonPlans.find(
    (lesson) => lesson.status !== "published" || !lesson.slug,
  );

  if (unpublishedLesson) {
    redirect(
      buildSeriesRedirect(
        id,
        "error",
        `Publish "${unpublishedLesson.title}" before publishing this study series.`,
      ),
    );
  }

  const slug = await resolveUniqueSeriesSlug(series.title, id);
  const { data: updatedSeries, error: updateError } = await supabase
    .from("study_series")
    .update({
      status: "published",
      slug,
    })
    .eq("id", id)
    .select("slug")
    .single();

  if (updateError || !updatedSeries?.slug) {
    redirect(
      buildSeriesRedirect(
        id,
        "error",
        updateError?.message ?? "We could not publish that study series yet.",
      ),
    );
  }

  revalidateTag(PLAN_LIST_TAG, { expire: 0 });
  revalidateTag(SERIES_LIST_TAG, { expire: 0 });
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/series/${id}`);
  revalidatePath(studySeriesPath(updatedSeries.slug));

  redirect(appendMessage(`/dashboard/series/${id}`, "published", updatedSeries.slug));
}
