import type { SupabaseClient } from "@supabase/supabase-js";

type DuplicateLessonClient = SupabaseClient;

interface SourceLessonRow {
  id: string;
  title: string;
  summary: string;
  teaching_objective: string;
  duration_minutes: number;
  topic_tags: string[] | null;
  audience_tags: string[] | null;
  denomination_tags: string[] | null;
  custom_tags: string[] | null;
  layout_template_id: string | null;
  layout_content: Record<string, unknown> | null;
  opening_prayer: string | null;
  icebreaker: string | null;
  facilitator_notes: string | null;
  materials: string[] | null;
  activities: string[] | null;
  discussion_questions: string[] | null;
  prayer_prompts: string[] | null;
  handout_urls: string[] | null;
}

interface SourceScriptureRow {
  sequence: number;
  book_code: number;
  chapter_start: number;
  verse_start: number;
  chapter_end: number;
  verse_end: number;
  display_label: string;
}

export class DuplicateLessonError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "DuplicateLessonError";
  }
}

function toDuplicateError(error: { code?: string; message?: string } | null) {
  if (
    error?.code === "23514" ||
    error?.message?.toLowerCase().includes("draft limit") === true
  ) {
    return new DuplicateLessonError(
      "Keep five drafts or fewer at a time. Publish or delete one before duplicating another lesson.",
      409,
    );
  }

  if (
    error?.code === "PGRST204" ||
    error?.message?.includes("parent_lesson_id") === true
  ) {
    return new DuplicateLessonError(
      "Run the lesson remix migration before duplicating lessons.",
      503,
    );
  }

  return new DuplicateLessonError(
    error?.message ?? "We could not duplicate that lesson yet.",
    500,
  );
}

export async function duplicateLessonToDraft({
  supabase,
  sourceLessonId,
  userId,
}: {
  supabase: DuplicateLessonClient;
  sourceLessonId: string;
  userId: string;
}) {
  const { data: source, error: sourceError } = await supabase
    .from("lesson_plans")
    .select(
      [
        "id",
        "title",
        "summary",
        "teaching_objective",
        "duration_minutes",
        "topic_tags",
        "audience_tags",
        "denomination_tags",
        "custom_tags",
        "layout_template_id",
        "layout_content",
        "opening_prayer",
        "icebreaker",
        "facilitator_notes",
        "materials",
        "activities",
        "discussion_questions",
        "prayer_prompts",
        "handout_urls",
      ].join(", "),
    )
    .eq("id", sourceLessonId)
    .maybeSingle();

  if (sourceError) {
    throw toDuplicateError(sourceError);
  }

  if (!source) {
    throw new DuplicateLessonError("We could not find that lesson.", 404);
  }

  const typedSource = source as unknown as SourceLessonRow;
  const { data: inserted, error: insertError } = await supabase
    .from("lesson_plans")
    .insert({
      author_id: userId,
      parent_lesson_id: typedSource.id,
      status: "draft",
      title: `${typedSource.title} copy`,
      summary: typedSource.summary,
      teaching_objective: typedSource.teaching_objective,
      duration_minutes: typedSource.duration_minutes,
      topic_tags: typedSource.topic_tags ?? [],
      audience_tags: typedSource.audience_tags ?? [],
      denomination_tags: typedSource.denomination_tags ?? [],
      custom_tags: typedSource.custom_tags ?? [],
      layout_template_id: typedSource.layout_template_id,
      layout_content: typedSource.layout_content ?? {},
      opening_prayer: typedSource.opening_prayer,
      icebreaker: typedSource.icebreaker,
      facilitator_notes: typedSource.facilitator_notes,
      materials: typedSource.materials ?? [],
      activities: typedSource.activities ?? [],
      discussion_questions: typedSource.discussion_questions ?? [],
      prayer_prompts: typedSource.prayer_prompts ?? [],
      handout_urls: typedSource.handout_urls ?? [],
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw toDuplicateError(insertError);
  }

  const newLessonId = (inserted as { id: string }).id;
  const { data: scriptureRows, error: scriptureReadError } = await supabase
    .from("scripture_refs")
    .select(
      "sequence, book_code, chapter_start, verse_start, chapter_end, verse_end, display_label",
    )
    .eq("lesson_plan_id", typedSource.id)
    .order("sequence", { ascending: true });

  if (scriptureReadError) {
    await supabase.from("lesson_plans").delete().eq("id", newLessonId);
    throw toDuplicateError(scriptureReadError);
  }

  const copiedScriptures = ((scriptureRows as SourceScriptureRow[] | null) ?? []).map(
    (scripture) => ({
      lesson_plan_id: newLessonId,
      sequence: scripture.sequence,
      book_code: scripture.book_code,
      chapter_start: scripture.chapter_start,
      verse_start: scripture.verse_start,
      chapter_end: scripture.chapter_end,
      verse_end: scripture.verse_end,
      display_label: scripture.display_label,
    }),
  );

  if (copiedScriptures.length > 0) {
    const { error: scriptureInsertError } = await supabase
      .from("scripture_refs")
      .insert(copiedScriptures);

    if (scriptureInsertError) {
      await supabase.from("lesson_plans").delete().eq("id", newLessonId);
      throw toDuplicateError(scriptureInsertError);
    }
  }

  return { id: newLessonId };
}
