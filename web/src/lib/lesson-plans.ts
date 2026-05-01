import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBookByCode, getBookBySlug } from "@/lib/bible-books";
import { env } from "@/lib/env";
import {
  HOME_TAG,
  PLAN_LIST_TAG,
  SERIES_LIST_TAG,
  studySeriesPath,
} from "@/lib/revalidation";
import { createSupabaseServerClient, createSupabaseStaticClient } from "@/lib/supabase/server";
import type {
  AdminUserSummary,
  LessonReportAccess,
  LessonPlan,
  LessonPlanFilters,
  Report,
  ReportReviewDetail,
  ReportReviewMessage,
  ReportReason,
  ReportStatus,
  StudySeries,
  StudySeriesMembership,
  UserRole,
} from "@/lib/types";

interface LessonPlanRow {
  id: string;
  author_id: string;
  author_handle: string | null;
  layout_template_id?: string | null;
  layout_content?: Record<string, unknown> | null;
  slug: string | null;
  status: LessonPlan["status"];
  moderation_state: LessonPlan["moderationState"];
  title: string;
  summary: string;
  teaching_objective: string;
  duration_minutes: number;
  topic_tags: string[] | null;
  audience_tags: string[] | null;
  denomination_tags: string[] | null;
  custom_tags: string[] | null;
  opening_prayer: string | null;
  icebreaker: string | null;
  facilitator_notes: string | null;
  materials: string[] | null;
  activities: string[] | null;
  discussion_questions: string[] | null;
  prayer_prompts: string[] | null;
  handout_urls: string[] | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ScriptureRow {
  id: string;
  lesson_plan_id: string;
  sequence: number;
  book_code: number;
  chapter_start: number;
  verse_start: number;
  chapter_end: number;
  verse_end: number;
  display_label: string;
}

interface AuthorRow {
  user_id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
}

interface ProfileRow {
  user_id?: string;
  display_name: string;
  handle: string;
  role: UserRole;
  report_cooldown_until?: string | null;
  created_at?: string;
}

interface StudySeriesRow {
  id: string;
  author_id: string;
  author_handle: string | null;
  slug: string | null;
  status: LessonPlan["status"];
  title: string;
  summary: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StudySeriesLessonRow {
  series_id: string;
  lesson_plan_id: string;
  position: number;
}

interface ReportRow {
  id: string;
  lesson_plan_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  assigned_reviewer_id: string | null;
  resolution_note: string | null;
  created_at: string;
}

interface ReportThreadRow {
  id: string;
  report_id: string;
  lesson_plan_id: string;
  creator_id: string;
  reviewer_id: string;
  created_at: string;
  updated_at: string;
}

interface ReportMessageRow {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface ViewerContext {
  userId: string;
  displayName: string;
  handle: string;
  role: UserRole;
}

export function isWebmasterSupremeRole(role: UserRole | null | undefined) {
  return role === "webmaster_supreme";
}

export function canManageUsersRole(role: UserRole | null | undefined) {
  return role === "admin" || role === "webmaster_supreme";
}

export function canReviewReportsRole(role: UserRole | null | undefined) {
  return (
    role === "admin" ||
    role === "reviewer" ||
    role === "webmaster_supreme"
  );
}

function normalizeHandleQuery(value: string) {
  return value
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

const LESSON_PLAN_SELECT = `
  id,
  author_id,
  author_handle,
  layout_template_id,
  layout_content,
  slug,
  status,
  moderation_state,
  title,
  summary,
  teaching_objective,
  duration_minutes,
  topic_tags,
  audience_tags,
  denomination_tags,
  custom_tags,
  opening_prayer,
  icebreaker,
  facilitator_notes,
  materials,
  activities,
  discussion_questions,
  prayer_prompts,
  handout_urls,
  published_at,
  created_at,
  updated_at
`;

const LEGACY_LESSON_PLAN_SELECT = `
  id,
  author_id,
  author_handle,
  layout_template_id,
  layout_content,
  slug,
  status,
  moderation_state,
  title,
  summary,
  teaching_objective,
  duration_minutes,
  topic_tags,
  audience_tags,
  denomination_tags,
  opening_prayer,
  icebreaker,
  facilitator_notes,
  materials,
  activities,
  discussion_questions,
  prayer_prompts,
  handout_urls,
  published_at,
  created_at,
  updated_at
`;

const AUTHOR_HANDLE_LEGACY_LESSON_PLAN_SELECT = `
  id,
  author_id,
  layout_template_id,
  layout_content,
  slug,
  status,
  moderation_state,
  title,
  summary,
  teaching_objective,
  duration_minutes,
  topic_tags,
  audience_tags,
  denomination_tags,
  opening_prayer,
  icebreaker,
  facilitator_notes,
  materials,
  activities,
  discussion_questions,
  prayer_prompts,
  handout_urls,
  published_at,
  created_at,
  updated_at
`;

const STUDY_SERIES_SELECT = `
  id,
  author_id,
  author_handle,
  slug,
  status,
  title,
  summary,
  published_at,
  created_at,
  updated_at
`;

function isMissingAuthorHandleColumnError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.message?.includes("author_handle") === true
  );
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

function isMissingReportReviewFeatureError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("report_review_threads") === true ||
    error.message?.includes("report_review_messages") === true ||
    error.message?.includes("assigned_reviewer_id") === true ||
    error.message?.includes("resolution_note") === true
  );
}

function coerceLessonPlanRows(
  data:
    | LessonPlanRow[]
    | Array<Omit<LessonPlanRow, "author_handle" | "custom_tags">>
    | Array<Omit<LessonPlanRow, "custom_tags">>
    | null,
  options: {
    includesAuthorHandle: boolean;
    includesCustomTags: boolean;
  },
) {
  const rows =
    (data as
      | LessonPlanRow[]
      | Array<Omit<LessonPlanRow, "author_handle" | "custom_tags">>
      | Array<Omit<LessonPlanRow, "custom_tags">>
      | null) ??
    [];

  if (options.includesAuthorHandle && options.includesCustomTags) {
    return rows as LessonPlanRow[];
  }

  return rows.map((row) => ({
    ...row,
    author_handle:
      options.includesAuthorHandle
        ? (row as LessonPlanRow).author_handle
        : null,
    custom_tags: options.includesCustomTags
      ? (row as LessonPlanRow).custom_tags
      : [],
  })) as LessonPlanRow[];
}

async function runLessonPlanQuery(
  buildQuery: (selectClause: string) => PromiseLike<{
    data: unknown;
    error: { code?: string; message?: string } | null;
  }>,
) {
  const current = await buildQuery(LESSON_PLAN_SELECT);

  if (!current.error) {
    return coerceLessonPlanRows(
      current.data as LessonPlanRow[] | Array<Omit<LessonPlanRow, "custom_tags">> | null,
      {
        includesAuthorHandle: true,
        includesCustomTags: true,
      },
    );
  }

  if (isMissingCustomTagsColumnError(current.error)) {
    const customTagsLegacy = await buildQuery(LEGACY_LESSON_PLAN_SELECT);

    if (!customTagsLegacy.error) {
      return coerceLessonPlanRows(
        customTagsLegacy.data as
          | LessonPlanRow[]
          | Array<Omit<LessonPlanRow, "custom_tags">>
          | null,
        {
          includesAuthorHandle: true,
          includesCustomTags: false,
        },
      );
    }

    if (!isMissingAuthorHandleColumnError(customTagsLegacy.error)) {
      return [];
    }
  } else if (!isMissingAuthorHandleColumnError(current.error)) {
    return [];
  }

  const legacy = await buildQuery(AUTHOR_HANDLE_LEGACY_LESSON_PLAN_SELECT);
  return coerceLessonPlanRows(
    legacy.data as
      | LessonPlanRow[]
      | Array<Omit<LessonPlanRow, "author_handle" | "custom_tags">>
      | null,
    {
      includesAuthorHandle: false,
      includesCustomTags: false,
    },
  );
}

async function fetchAuthors(client: SupabaseClient, authorIds: string[]) {
  if (authorIds.length === 0) {
    return new Map<string, AuthorRow>();
  }

  const { data } = await client
    .from("profiles")
    .select("user_id, display_name, handle, avatar_url")
    .in("user_id", authorIds);

  return new Map<string, AuthorRow>(
    ((data as AuthorRow[] | null) ?? []).map((row) => [row.user_id, row]),
  );
}

async function fetchScriptures(client: SupabaseClient, planIds: string[]) {
  if (planIds.length === 0) {
    return new Map<string, ScriptureRow[]>();
  }

  const { data } = await client
    .from("scripture_refs")
    .select(
      "id, lesson_plan_id, sequence, book_code, chapter_start, verse_start, chapter_end, verse_end, display_label",
    )
    .in("lesson_plan_id", planIds)
    .order("sequence", { ascending: true });

  const grouped = new Map<string, ScriptureRow[]>();

  for (const row of (data as ScriptureRow[] | null) ?? []) {
    const current = grouped.get(row.lesson_plan_id) ?? [];
    current.push(row);
    grouped.set(row.lesson_plan_id, current);
  }

  return grouped;
}

async function fetchStudySeriesMemberships(
  client: SupabaseClient,
  planIds: string[],
) {
  if (planIds.length === 0) {
    return new Map<string, StudySeriesMembership[]>();
  }

  const { data: membershipRows, error: membershipError } = await client
    .from("study_series_lessons")
    .select("series_id, lesson_plan_id, position")
    .in("lesson_plan_id", planIds)
    .order("position", { ascending: true });

  if (isMissingStudySeriesRelationError(membershipError)) {
    return new Map<string, StudySeriesMembership[]>();
  }

  const typedMembershipRows = (membershipRows as StudySeriesLessonRow[] | null) ?? [];
  const seriesIds = [...new Set(typedMembershipRows.map((row) => row.series_id))];

  if (seriesIds.length === 0) {
    return new Map<string, StudySeriesMembership[]>();
  }

  const { data: seriesRows, error: seriesError } = await client
    .from("study_series")
    .select("id, slug, title")
    .in("id", seriesIds);

  if (isMissingStudySeriesRelationError(seriesError)) {
    return new Map<string, StudySeriesMembership[]>();
  }

  const seriesMap = new Map<
    string,
    Pick<StudySeries, "id" | "slug" | "title">
  >(
    (((seriesRows as Array<{ id: string; slug: string | null; title: string }> | null) ?? []).map(
      (row) => [row.id, row],
    )),
  );

  const grouped = new Map<string, StudySeriesMembership[]>();

  for (const membership of typedMembershipRows) {
    const series = seriesMap.get(membership.series_id);

    if (!series) {
      continue;
    }

    const current = grouped.get(membership.lesson_plan_id) ?? [];
    current.push({
      seriesId: series.id,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      position: membership.position,
    });
    grouped.set(membership.lesson_plan_id, current);
  }

  return grouped;
}

async function hydrateLessonPlans(
  client: SupabaseClient,
  rows: LessonPlanRow[],
  options: {
    includeAuthorNames?: boolean;
    authorFallback?: string;
    includeSeriesMemberships?: boolean;
  } = {},
) {
  const planIds = rows.map((row) => row.id);
  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const includeAuthorNames = options.includeAuthorNames ?? true;
  const authorFallback = options.authorFallback ?? "Unknown Author";
  const includeSeriesMemberships = options.includeSeriesMemberships ?? true;
  const [authors, scriptures, seriesMemberships] = await Promise.all([
    includeAuthorNames
      ? fetchAuthors(client, authorIds)
      : Promise.resolve(new Map<string, AuthorRow>()),
    fetchScriptures(client, planIds),
    includeSeriesMemberships
      ? fetchStudySeriesMemberships(client, planIds)
      : Promise.resolve(new Map<string, StudySeriesMembership[]>()),
  ]);

  return rows.map((row) => {
    const author = authors.get(row.author_id);
    const mappedScriptures = (scriptures.get(row.id) ?? []).map((scripture) => {
      const book = getBookByCode(scripture.book_code);

      return {
        id: scripture.id,
        sequence: scripture.sequence,
        bookCode: scripture.book_code,
        bookName: book?.displayName ?? scripture.display_label,
        osisCode: book?.osisCode ?? "",
        usfmCode: book?.usfmCode ?? "",
        chapterStart: scripture.chapter_start,
        verseStart: scripture.verse_start,
        chapterEnd: scripture.chapter_end,
        verseEnd: scripture.verse_end,
        displayLabel: scripture.display_label,
      };
    });

    return {
      id: row.id,
      slug: row.slug,
      authorId: row.author_id,
      authorName: author?.display_name ?? authorFallback,
      authorHandle: row.author_handle ?? author?.handle ?? null,
      authorRole: "creator",
      layoutTemplateId: row.layout_template_id ?? null,
      layoutContent: row.layout_content ?? {},
      status: row.status,
      moderationState: row.moderation_state,
      title: row.title,
      summary: row.summary,
      teachingObjective: row.teaching_objective,
      durationMinutes: row.duration_minutes,
      topicTags: row.topic_tags ?? [],
      audienceTags: row.audience_tags ?? [],
      denominationTags: row.denomination_tags ?? [],
      customTags: row.custom_tags ?? [],
      openingPrayer: row.opening_prayer ?? undefined,
      icebreaker: row.icebreaker ?? undefined,
      facilitatorNotes: row.facilitator_notes ?? undefined,
      materials: row.materials ?? [],
      activities: row.activities ?? [],
      discussionQuestions: row.discussion_questions ?? [],
      prayerPrompts: row.prayer_prompts ?? [],
      handoutUrls: row.handout_urls ?? [],
      scriptures: mappedScriptures,
      seriesMemberships: seriesMemberships.get(row.id) ?? [],
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies LessonPlan;
  });
}

async function fetchPublishedPlansRows(filters: LessonPlanFilters = {}) {
  const supabase = createSupabaseStaticClient();

  if (!supabase) {
    return [];
  }

  let matchingBookPlanIds: string[] | null = null;

  if (filters.book) {
    const book = getBookBySlug(filters.book);

    if (!book) {
      return [];
    }

    const { data: scriptureMatches } = await supabase
      .from("scripture_refs")
      .select("lesson_plan_id")
      .eq("book_code", book.bookCode);

    matchingBookPlanIds = [
      ...new Set(
        ((scriptureMatches as Array<{ lesson_plan_id: string }> | null) ?? []).map(
          (row) => row.lesson_plan_id,
        ),
      ),
    ];

    if (matchingBookPlanIds.length === 0) {
      return [];
    }
  }

  const buildBaseQuery = (selectClause: string) => {
    let query = supabase
      .from("lesson_plans")
      .select(selectClause)
      .eq("status", "published");

    if (filters.topic) {
      query = query.contains("topic_tags", [filters.topic]);
    }

    if (filters.audience) {
      query = query.contains("audience_tags", [filters.audience]);
    }

    if (filters.denomination) {
      query = query.contains("denomination_tags", [filters.denomination]);
    }

    if (filters.duration === "short") {
      query = query.lte("duration_minutes", 30);
    } else if (filters.duration === "medium") {
      query = query.gte("duration_minutes", 31).lte("duration_minutes", 60);
    } else if (filters.duration === "long") {
      query = query.gte("duration_minutes", 61);
    }

    if (matchingBookPlanIds) {
      query = query.in("id", matchingBookPlanIds);
    }

    return query;
  };

  if (!filters.q) {
    return runLessonPlanQuery((selectClause) =>
      buildBaseQuery(selectClause).order("published_at", { ascending: false }),
    );
  }

  const textQuery = filters.q;
  const handleQuery = normalizeHandleQuery(textQuery);
  const [textMatches, handleMatches] = await Promise.all([
    runLessonPlanQuery((selectClause) =>
      buildBaseQuery(selectClause)
        .textSearch("search_tsv", textQuery, {
          type: "websearch",
          config: "english",
        })
        .order("published_at", { ascending: false }),
    ),
    handleQuery
      ? runLessonPlanQuery((selectClause) =>
          buildBaseQuery(selectClause)
            .ilike("author_handle", `%${handleQuery}%`)
            .order("published_at", { ascending: false }),
        )
      : Promise.resolve([] as LessonPlanRow[]),
  ]);

  const merged = new Map<string, LessonPlanRow>();

  for (const row of handleMatches) {
    merged.set(row.id, row);
  }

  for (const row of textMatches) {
    if (!merged.has(row.id)) {
      merged.set(row.id, row);
    }
  }

  return [...merged.values()].sort((left, right) => {
    const leftDate = Date.parse(left.published_at ?? left.updated_at);
    const rightDate = Date.parse(right.published_at ?? right.updated_at);
    return rightDate - leftDate;
  });
}

const getFeaturedPlansCached = unstable_cache(async () => {
  const supabase = createSupabaseStaticClient();

  if (!supabase) {
    return [];
  }

  const data = await runLessonPlanQuery((selectClause) =>
    supabase
      .from("lesson_plans")
      .select(selectClause)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2),
  );

  return hydrateLessonPlans(supabase, data, {
    includeAuthorNames: false,
    authorFallback: "Bible Study Buddy contributor",
  });
}, ["featured-plans"], { tags: [HOME_TAG, PLAN_LIST_TAG] });

export async function getFeaturedPlans() {
  return getFeaturedPlansCached();
}

const getPublishedPlansCached = unstable_cache(
  async (filters: LessonPlanFilters = {}) => {
    const supabase = createSupabaseStaticClient();

    if (!supabase) {
      return [];
    }

    const rows = await fetchPublishedPlansRows(filters);
    return hydrateLessonPlans(supabase, rows, {
      includeAuthorNames: false,
      authorFallback: "Bible Study Buddy contributor",
    });
  },
  ["published-plans"],
  { tags: [PLAN_LIST_TAG] },
);

export async function getPublishedPlans(filters: LessonPlanFilters = {}) {
  return getPublishedPlansCached(filters);
}

const getLessonPlanBySlugCached = unstable_cache(
  async (slug: string) => {
    const supabase = createSupabaseStaticClient();

    if (!supabase) {
      return null;
    }

    const rows = await runLessonPlanQuery((selectClause) =>
      supabase
        .from("lesson_plans")
        .select(selectClause)
        .eq("status", "published")
        .eq("slug", slug)
        .limit(1),
    );

    const row = rows[0] ?? null;

    if (!row) {
      return null;
    }

    const [plan] = await hydrateLessonPlans(supabase, [row], {
      includeAuthorNames: false,
      authorFallback: "Bible Study Buddy contributor",
    });
    return plan ?? null;
  },
  ["lesson-plan-by-slug"],
  { tags: [PLAN_LIST_TAG] },
);

export async function getLessonPlanBySlug(slug: string) {
  return getLessonPlanBySlugCached(slug);
}

const getPublishedPlanSlugsCached = unstable_cache(async () => {
  const supabase = createSupabaseStaticClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("lesson_plans")
    .select("slug")
    .eq("status", "published")
    .not("slug", "is", null);

  return ((data as Array<{ slug: string | null }> | null) ?? [])
    .map((row) => row.slug)
    .filter((slug): slug is string => Boolean(slug));
}, ["published-plan-slugs"], { tags: [PLAN_LIST_TAG] });

export async function getPublishedPlanSlugs() {
  return getPublishedPlanSlugsCached();
}

async function hydrateStudySeries(
  client: SupabaseClient,
  rows: StudySeriesRow[],
) {
  if (rows.length === 0) {
    return [] as StudySeries[];
  }

  const seriesIds = rows.map((row) => row.id);
  const { data: lessonRows, error: lessonRowsError } = await client
    .from("study_series_lessons")
    .select("series_id, lesson_plan_id, position")
    .in("series_id", seriesIds)
    .order("position", { ascending: true });

  if (isMissingStudySeriesRelationError(lessonRowsError)) {
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      authorId: row.author_id,
      authorHandle: row.author_handle,
      title: row.title,
      summary: row.summary,
      status: row.status,
      lessonCount: 0,
      lessons: [],
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  const typedLessonRows = (lessonRows as StudySeriesLessonRow[] | null) ?? [];
  const lessonPlanIds = [...new Set(typedLessonRows.map((row) => row.lesson_plan_id))];
  const lessonPlanRows =
    lessonPlanIds.length > 0
      ? await runLessonPlanQuery((selectClause) =>
          client.from("lesson_plans").select(selectClause).in("id", lessonPlanIds),
        )
      : [];
  const plans = await hydrateLessonPlans(client, lessonPlanRows, {
    includeAuthorNames: false,
    authorFallback: "Bible Study Buddy contributor",
    includeSeriesMemberships: false,
  });
  const planMap = new Map(plans.map((plan) => [plan.id, plan]));
  const lessonMap = new Map<string, StudySeries["lessons"]>();
  const lessonCountMap = new Map<string, number>();

  for (const lessonRow of typedLessonRows) {
    lessonCountMap.set(
      lessonRow.series_id,
      (lessonCountMap.get(lessonRow.series_id) ?? 0) + 1,
    );
    const plan = planMap.get(lessonRow.lesson_plan_id);

    if (!plan) {
      continue;
    }

    const current = lessonMap.get(lessonRow.series_id) ?? [];
    current.push({
      lessonPlanId: lessonRow.lesson_plan_id,
      position: lessonRow.position,
      plan,
    });
    lessonMap.set(lessonRow.series_id, current);
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    authorId: row.author_id,
    authorHandle: row.author_handle,
    title: row.title,
    summary: row.summary,
    status: row.status,
    lessonCount: lessonCountMap.get(row.id) ?? 0,
    lessons: lessonMap.get(row.id) ?? [],
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

const getPublishedStudySeriesBySlugCached = unstable_cache(
  async (slug: string) => {
    const supabase = createSupabaseStaticClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("study_series")
      .select(STUDY_SERIES_SELECT)
      .eq("status", "published")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (isMissingStudySeriesRelationError(error) || !data) {
      return null;
    }

    const [series] = await hydrateStudySeries(supabase, [data as StudySeriesRow]);
    return series ?? null;
  },
  ["study-series-by-slug"],
  { tags: [SERIES_LIST_TAG, PLAN_LIST_TAG] },
);

export async function getPublishedStudySeriesBySlug(slug: string) {
  return getPublishedStudySeriesBySlugCached(slug);
}

const getPublishedStudySeriesSlugsCached = unstable_cache(
  async () => {
    const supabase = createSupabaseStaticClient();

    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("study_series")
      .select("slug")
      .eq("status", "published")
      .not("slug", "is", null);

    if (isMissingStudySeriesRelationError(error)) {
      return [];
    }

    return ((data as Array<{ slug: string | null }> | null) ?? [])
      .map((row) => row.slug)
      .filter((slug): slug is string => Boolean(slug));
  },
  ["published-study-series-slugs"],
  { tags: [SERIES_LIST_TAG] },
);

export async function getPublishedStudySeriesSlugs() {
  return getPublishedStudySeriesSlugsCached();
}

export async function getCurrentViewer() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, handle, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedProfile = profile as ProfileRow | null;

  return {
    userId: user.id,
    displayName:
      typedProfile?.display_name ??
      user.user_metadata.display_name ??
      user.email ??
      "Creator",
    handle:
      typedProfile?.handle ??
      String(user.email ?? "friend").split("@")[0] ??
      "friend",
    role: typedProfile?.role ?? "user",
  } satisfies ViewerContext;
}

export async function getLessonPlanById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const rows = await runLessonPlanQuery((selectClause) =>
    supabase.from("lesson_plans").select(selectClause).eq("id", id).limit(1),
  );

  const row = rows[0] ?? null;

  if (!row) {
    return null;
  }

  const [plan] = await hydrateLessonPlans(supabase, [row]);
  return plan ?? null;
}

export async function getDashboardPlans() {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !supabase) {
    return [];
  }

  const data = await runLessonPlanQuery((selectClause) => {
    let query = supabase.from("lesson_plans").select(selectClause);

    if (!canManageUsersRole(viewer.role)) {
      query = query.eq("author_id", viewer.userId);
    }

    return query.order("updated_at", { ascending: false });
  });
  return hydrateLessonPlans(supabase, data);
}

export async function getStudySeriesById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("study_series")
    .select(STUDY_SERIES_SELECT)
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (isMissingStudySeriesRelationError(error) || !data) {
    return null;
  }

  const [series] = await hydrateStudySeries(supabase, [data as StudySeriesRow]);
  return series ?? null;
}

export async function getDashboardStudySeries() {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !supabase) {
    return [];
  }

  let query = supabase
    .from("study_series")
    .select(STUDY_SERIES_SELECT)
    .order("updated_at", { ascending: false });

  if (!canManageUsersRole(viewer.role)) {
    query = query.eq("author_id", viewer.userId);
  }

  const { data, error } = await query;

  if (isMissingStudySeriesRelationError(error)) {
    return [];
  }

  return hydrateStudySeries(supabase, (data as StudySeriesRow[] | null) ?? []);
}

export async function getSavedPlans() {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !supabase) {
    return [];
  }

  const { data: favorites } = await supabase
    .from("favorites")
    .select("lesson_plan_id")
    .eq("user_id", viewer.userId)
    .order("created_at", { ascending: false });

  const lessonPlanIds = ((favorites as Array<{ lesson_plan_id: string }> | null) ?? []).map(
    (row) => row.lesson_plan_id,
  );

  if (lessonPlanIds.length === 0) {
    return [];
  }

  const data = await runLessonPlanQuery((selectClause) =>
    supabase.from("lesson_plans").select(selectClause).in("id", lessonPlanIds),
  );

  const plans = await hydrateLessonPlans(
    supabase,
    data,
  );
  const order = new Map(lessonPlanIds.map((id, index) => [id, index]));

  return plans.sort((left, right) => {
    return (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0);
  });
}

export async function isLessonPlanSavedForViewer(
  lessonPlanId: string,
  viewerId: string | null | undefined,
) {
  const supabase = await createSupabaseServerClient();

  if (!viewerId || !supabase) {
    return false;
  }

  const { data } = await supabase
    .from("favorites")
    .select("lesson_plan_id")
    .eq("user_id", viewerId)
    .eq("lesson_plan_id", lessonPlanId)
    .maybeSingle();

  return Boolean(data);
}

function formatCooldownMessage(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export async function getViewerLessonReportAccess(
  lessonPlanId: string,
  viewerId: string | null | undefined,
): Promise<LessonReportAccess> {
  const supabase = await createSupabaseServerClient();

  if (!viewerId || !supabase) {
    return {
      canSubmit: false,
      status: null,
      ctaLabel: "Submit report",
      helperMessage: null,
      cooldownUntil: null,
    };
  }

  const [{ data: latestReport }, { data: profile }] = await Promise.all([
    supabase
      .from("reports")
      .select("status, created_at")
      .eq("reporter_id", viewerId)
      .eq("lesson_plan_id", lessonPlanId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("report_cooldown_until")
      .eq("user_id", viewerId)
      .maybeSingle(),
  ]);

  const typedProfile = profile as Pick<ProfileRow, "report_cooldown_until"> | null;
  const cooldownUntil = typedProfile?.report_cooldown_until ?? null;

  if (cooldownUntil && Date.parse(cooldownUntil) > Date.now()) {
    return {
      canSubmit: false,
      status: "cooldown",
      ctaLabel: "Reporting paused",
      helperMessage: `Reporting is paused for this account until ${formatCooldownMessage(cooldownUntil)}.`,
      cooldownUntil,
    };
  }

  const typedLatestReport =
    latestReport as Pick<ReportRow, "status" | "created_at"> | null;

  if (!typedLatestReport) {
    return {
      canSubmit: true,
      status: null,
      ctaLabel: "Submit report",
      helperMessage: null,
      cooldownUntil: null,
    };
  }

  if (
    typedLatestReport.status === "open" ||
    typedLatestReport.status === "reviewing"
  ) {
    return {
      canSubmit: false,
      status: typedLatestReport.status,
      ctaLabel: "Report already active",
      helperMessage:
        "You already have an active review request for this lesson. Thank you.",
      cooldownUntil: null,
    };
  }

  if (typedLatestReport.status === "dismissed") {
    return {
      canSubmit: false,
      status: typedLatestReport.status,
      ctaLabel: "Review denied",
      helperMessage:
        "A previous review request for this lesson was denied from this account, so it cannot be submitted again here.",
      cooldownUntil,
    };
  }

  return {
    canSubmit: true,
    status: typedLatestReport.status,
    ctaLabel: "Request another review",
    helperMessage:
      "Your earlier review on this lesson is complete. You can submit another respectful review request if needed.",
    cooldownUntil: null,
  };
}

export async function getOpenReports(): Promise<Report[]> {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !canReviewReportsRole(viewer.role) || !supabase) {
    return [];
  }

  const [{ data, error: reportsError }, { data: threadRows, error: threadError }] =
    await Promise.all([
    supabase
      .from("reports")
      .select(
        "id, lesson_plan_id, reporter_id, reason, details, status, assigned_reviewer_id, resolution_note, created_at",
      )
      .in("status", ["open", "reviewing"])
      .order("created_at", { ascending: false }),
    supabase
      .from("report_review_threads")
      .select("report_id"),
  ]);

  if (reportsError) {
    return [];
  }

  const rows = (data as ReportRow[] | null) ?? [];

  if (rows.length === 0) {
    return [];
  }

  const lessonPlanIds = [...new Set(rows.map((row) => row.lesson_plan_id))];
  const participantIds = [
    ...new Set(
      rows.flatMap((row) =>
        [row.reporter_id, row.assigned_reviewer_id].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ),
  ];

  const [{ data: lessonRows }, participants] = await Promise.all([
    supabase
      .from("lesson_plans")
      .select("id, title, slug, author_id, author_handle")
      .in("id", lessonPlanIds),
    fetchAuthors(supabase, participantIds),
  ]);

  const lessonMap = new Map<
    string,
    {
      title: string;
      slug: string | null;
      authorId: string;
      authorHandle: string | null;
    }
  >(
    (((lessonRows as Array<{
      id: string;
      title: string;
      slug: string | null;
      author_id: string;
      author_handle: string | null;
    }> | null) ?? []).map((row) => [
      row.id,
      {
        title: row.title,
        slug: row.slug,
        authorId: row.author_id,
        authorHandle: row.author_handle,
      },
    ])),
  );
  const openThreadIds = new Set<string>(
    isMissingReportReviewFeatureError(threadError)
      ? []
      : ((threadRows as Array<{ report_id: string }> | null) ?? []).map(
          (row) => row.report_id,
        ),
  );

  return rows.map((row) => {
    const lesson = lessonMap.get(row.lesson_plan_id);

    return {
      id: row.id,
      lessonPlanId: row.lesson_plan_id,
      lessonPlanTitle: lesson?.title ?? "Unknown lesson",
      lessonPlanSlug: lesson?.slug ?? null,
      lessonAuthorId: lesson?.authorId,
      lessonAuthorHandle: lesson?.authorHandle ?? null,
      reporterName:
        participants.get(row.reporter_id)?.display_name ?? "Unknown reporter",
      reporterHandle: participants.get(row.reporter_id)?.handle ?? null,
      reason: row.reason,
      details: row.details ?? "",
      status: row.status,
      assignedReviewerHandle:
        (row.assigned_reviewer_id
          ? participants.get(row.assigned_reviewer_id)?.handle
          : null) ?? null,
      threadOpen: openThreadIds.has(row.id),
      createdAt: row.created_at,
    } satisfies Report;
  });
}

interface AdminProfileRow {
  user_id: string;
  display_name: string;
  handle: string;
  role: UserRole;
  created_at: string;
}

interface AdminLessonRoleRow {
  id: string;
  author_id: string;
  status: LessonPlan["status"];
}

interface AdminReportMetricRow {
  reporter_id: string;
  lesson_plan_id: string;
  status: ReportStatus;
}

const ROLE_SORT_ORDER: Record<UserRole, number> = {
  webmaster_supreme: 0,
  admin: 1,
  reviewer: 2,
  creator: 3,
  user: 4,
};

export async function getAdminUserSummaries(): Promise<AdminUserSummary[]> {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !canManageUsersRole(viewer.role) || !supabase) {
    return [];
  }

  const [{ data: profileRows }, { data: lessonRows }, { data: reportRows }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, handle, role, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("lesson_plans")
        .select("id, author_id, status"),
      supabase
        .from("reports")
        .select("reporter_id, lesson_plan_id, status"),
    ]);

  const lessonCountMap = new Map<
    string,
    {
      lessonCount: number;
      publishedLessonCount: number;
      draftLessonCount: number;
    }
  >();
  const lessonAuthorMap = new Map<string, string>();
  const reportsCreatedCountMap = new Map<string, number>();
  const reportsAgainstCountMap = new Map<
    string,
    { total: number; active: number }
  >();

  for (const lesson of (lessonRows as AdminLessonRoleRow[] | null) ?? []) {
    lessonAuthorMap.set(lesson.id, lesson.author_id);

    const current = lessonCountMap.get(lesson.author_id) ?? {
      lessonCount: 0,
      publishedLessonCount: 0,
      draftLessonCount: 0,
    };

    current.lessonCount += 1;

    if (lesson.status === "published") {
      current.publishedLessonCount += 1;
    }

    if (lesson.status === "draft") {
      current.draftLessonCount += 1;
    }

    lessonCountMap.set(lesson.author_id, current);
  }

  for (const report of (reportRows as AdminReportMetricRow[] | null) ?? []) {
    reportsCreatedCountMap.set(
      report.reporter_id,
      (reportsCreatedCountMap.get(report.reporter_id) ?? 0) + 1,
    );

    const authorId = lessonAuthorMap.get(report.lesson_plan_id);

    if (!authorId) {
      continue;
    }

    const current = reportsAgainstCountMap.get(authorId) ?? {
      total: 0,
      active: 0,
    };

    current.total += 1;

    if (report.status === "open" || report.status === "reviewing") {
      current.active += 1;
    }

    reportsAgainstCountMap.set(authorId, current);
  }

  return ((profileRows as AdminProfileRow[] | null) ?? [])
    .map((profile) => {
      const lessonCounts = lessonCountMap.get(profile.user_id) ?? {
        lessonCount: 0,
        publishedLessonCount: 0,
        draftLessonCount: 0,
      };
      const reviewCounts = reportsAgainstCountMap.get(profile.user_id) ?? {
        total: 0,
        active: 0,
      };

      return {
        userId: profile.user_id,
        displayName: profile.display_name,
        handle: profile.handle,
        role: profile.role,
        lessonCount: lessonCounts.lessonCount,
        publishedLessonCount: lessonCounts.publishedLessonCount,
        draftLessonCount: lessonCounts.draftLessonCount,
        reportsCreatedCount: reportsCreatedCountMap.get(profile.user_id) ?? 0,
        reportsAgainstCount: reviewCounts.total,
        activeReportsAgainstCount: reviewCounts.active,
        createdAt: profile.created_at,
        isCurrentViewer: profile.user_id === viewer.userId,
      } satisfies AdminUserSummary;
    })
    .sort((left, right) => {
      const roleDelta = ROLE_SORT_ORDER[left.role] - ROLE_SORT_ORDER[right.role];

      if (roleDelta !== 0) {
        return roleDelta;
      }

      return left.handle.localeCompare(right.handle);
    });
}

async function fetchReportDetailBase(
  reportId: string,
  supabase: SupabaseClient,
) {
  const [{ data: reportRow, error: reportError }, { data: threadRow, error: threadError }] =
    await Promise.all([
    supabase
      .from("reports")
      .select(
        "id, lesson_plan_id, reporter_id, reason, details, status, assigned_reviewer_id, resolution_note, created_at",
      )
      .eq("id", reportId)
      .maybeSingle(),
    supabase
      .from("report_review_threads")
      .select("id, report_id, lesson_plan_id, creator_id, reviewer_id, created_at, updated_at")
      .eq("report_id", reportId)
      .maybeSingle(),
  ]);

  if (reportError || !reportRow) {
    return null;
  }

  const typedReport = reportRow as ReportRow;
  const typedThread = isMissingReportReviewFeatureError(threadError)
    ? null
    : ((threadRow as ReportThreadRow | null) ?? null);

  const [{ data: lessonRow, error: lessonError }, authorRows, messageResult] =
    await Promise.all([
    supabase
      .from("lesson_plans")
      .select("id, title, slug, author_id, author_handle")
      .eq("id", typedReport.lesson_plan_id)
      .maybeSingle(),
    fetchAuthors(
      supabase,
      [
        typedReport.reporter_id,
        typedThread?.creator_id,
        typedThread?.reviewer_id,
        typedReport.assigned_reviewer_id,
      ].filter((value): value is string => Boolean(value)),
    ),
    typedThread
      ? supabase
          .from("report_review_messages")
          .select("id, thread_id, author_id, body, created_at")
          .eq("thread_id", typedThread.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({
          data: [] as ReportMessageRow[],
          error: null as { code?: string; message?: string } | null,
        }),
  ]);

  const typedLesson = lessonRow as
    | {
        id: string;
        title: string;
        slug: string | null;
        author_id: string;
        author_handle: string | null;
      }
    | null;

  if (lessonError || !typedLesson) {
    return null;
  }

  const { data: lessonAuthorProfile } = authorRows.get(typedLesson.author_id)
    ? { data: null as AuthorRow | null }
    : await supabase
        .from("profiles")
        .select("user_id, display_name, handle, avatar_url")
        .eq("user_id", typedLesson.author_id)
        .maybeSingle();

  const lessonAuthor =
    authorRows.get(typedLesson.author_id) ??
    ((lessonAuthorProfile as AuthorRow | null) ?? null) ??
    undefined;
  const reporter = authorRows.get(typedReport.reporter_id);
  const assignedReviewer = typedReport.assigned_reviewer_id
    ? authorRows.get(typedReport.assigned_reviewer_id)
    : undefined;

  const messages = isMissingReportReviewFeatureError(messageResult.error)
    ? []
    : ((messageResult.data as ReportMessageRow[] | null) ?? []).map(
        (message) =>
          ({
            id: message.id,
            authorId: message.author_id,
            authorName:
              authorRows.get(message.author_id)?.display_name ?? "Unknown user",
            authorHandle: authorRows.get(message.author_id)?.handle ?? null,
            body: message.body,
            createdAt: message.created_at,
          }) satisfies ReportReviewMessage,
      );

  return {
    id: typedReport.id,
    threadId: typedThread?.id ?? null,
    lessonPlanId: typedLesson.id,
    lessonPlanTitle: typedLesson.title,
    lessonPlanSlug: typedLesson.slug,
    lessonAuthorId: typedLesson.author_id,
    lessonAuthorName: lessonAuthor?.display_name ?? "Lesson creator",
    lessonAuthorHandle: typedLesson.author_handle ?? lessonAuthor?.handle ?? null,
    reporterId: typedReport.reporter_id,
    reporterName: reporter?.display_name ?? "Unknown reporter",
    reporterHandle: reporter?.handle ?? null,
    reason: typedReport.reason,
    details: typedReport.details ?? "",
    status: typedReport.status,
    createdAt: typedReport.created_at,
    assignedReviewerId: typedReport.assigned_reviewer_id,
    assignedReviewerHandle: assignedReviewer?.handle ?? null,
    resolutionNote: typedReport.resolution_note ?? "",
    threadOpen: Boolean(typedThread),
    messages,
  } satisfies ReportReviewDetail;
}

export async function getReviewReportById(reportId: string) {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !canReviewReportsRole(viewer.role) || !supabase) {
    return null;
  }

  return fetchReportDetailBase(reportId, supabase);
}

export async function getCreatorReviewReportById(reportId: string) {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !supabase) {
    return null;
  }

  const detail = await fetchReportDetailBase(reportId, supabase);

  if (!detail || detail.lessonAuthorId !== viewer.userId || !detail.threadOpen) {
    return null;
  }

  return detail;
}

export async function getCreatorActiveReviewThreads() {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !supabase) {
    return [] as ReportReviewDetail[];
  }

  const { data: threadRows, error } = await supabase
    .from("report_review_threads")
    .select("report_id")
    .eq("creator_id", viewer.userId)
    .order("updated_at", { ascending: false });

  if (isMissingReportReviewFeatureError(error)) {
    return [] as ReportReviewDetail[];
  }

  const reportIds = ((threadRows as Array<{ report_id: string }> | null) ?? []).map(
    (row) => row.report_id,
  );

  if (reportIds.length === 0) {
    return [];
  }

  const details = await Promise.all(
    reportIds.map((reportId) => fetchReportDetailBase(reportId, supabase)),
  );

  return details.filter((detail): detail is ReportReviewDetail => Boolean(detail));
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function buildCanonicalUrl(slug: string) {
  return `${env.siteUrl}/plans/${slug}`;
}

export function buildStudySeriesCanonicalUrl(slug: string) {
  return `${env.siteUrl}${studySeriesPath(slug)}`;
}
