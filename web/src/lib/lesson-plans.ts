import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBookByCode, getBookBySlug } from "@/lib/bible-books";
import { env } from "@/lib/env";
import {
  HOME_TAG,
  PLAN_LIST_TAG,
} from "@/lib/revalidation";
import { createSupabaseServerClient, createSupabaseStaticClient } from "@/lib/supabase/server";
import type {
  LessonPlan,
  LessonPlanFilters,
  Report,
  ReportReason,
  ReportStatus,
  UserRole,
} from "@/lib/types";

interface LessonPlanRow {
  id: string;
  author_id: string;
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
  display_name: string;
  handle: string;
  role: UserRole;
}

interface ReportRow {
  id: string;
  lesson_plan_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface ViewerContext {
  userId: string;
  displayName: string;
  handle: string;
  role: UserRole;
}

const LESSON_PLAN_SELECT = `
  id,
  author_id,
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

async function hydrateLessonPlans(
  client: SupabaseClient,
  rows: LessonPlanRow[],
  options: {
    includeAuthorNames?: boolean;
    authorFallback?: string;
  } = {},
) {
  const planIds = rows.map((row) => row.id);
  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const includeAuthorNames = options.includeAuthorNames ?? true;
  const authorFallback = options.authorFallback ?? "Unknown Author";
  const [authors, scriptures] = await Promise.all([
    includeAuthorNames
      ? fetchAuthors(client, authorIds)
      : Promise.resolve(new Map<string, AuthorRow>()),
    fetchScriptures(client, planIds),
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
        authorRole: "creator",
      status: row.status,
      moderationState: row.moderation_state,
      title: row.title,
      summary: row.summary,
      teachingObjective: row.teaching_objective,
      durationMinutes: row.duration_minutes,
      topicTags: row.topic_tags ?? [],
      audienceTags: row.audience_tags ?? [],
      denominationTags: row.denomination_tags ?? [],
      openingPrayer: row.opening_prayer ?? undefined,
      icebreaker: row.icebreaker ?? undefined,
      facilitatorNotes: row.facilitator_notes ?? undefined,
      materials: row.materials ?? [],
      activities: row.activities ?? [],
      discussionQuestions: row.discussion_questions ?? [],
      prayerPrompts: row.prayer_prompts ?? [],
      handoutUrls: row.handout_urls ?? [],
      scriptures: mappedScriptures,
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

  let query = supabase
    .from("lesson_plans")
    .select(LESSON_PLAN_SELECT)
    .eq("status", "published");

  if (filters.q) {
    query = query.textSearch("search_tsv", filters.q, {
      type: "websearch",
      config: "english",
    });
  }

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

  if (filters.book) {
    const book = getBookBySlug(filters.book);

    if (!book) {
      return [];
    }

    const { data: scriptureMatches } = await supabase
      .from("scripture_refs")
      .select("lesson_plan_id")
      .eq("book_code", book.bookCode);

    const planIds = [
      ...new Set(
        ((scriptureMatches as Array<{ lesson_plan_id: string }> | null) ?? []).map(
          (row) => row.lesson_plan_id,
        ),
      ),
    ];

    if (planIds.length === 0) {
      return [];
    }

    query = query.in("id", planIds);
  }

  const { data } = await query.order("published_at", { ascending: false });
  return (data as LessonPlanRow[] | null) ?? [];
}

const getFeaturedPlansCached = unstable_cache(async () => {
  const supabase = createSupabaseStaticClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("lesson_plans")
    .select(LESSON_PLAN_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(2);

  return hydrateLessonPlans(supabase, (data as LessonPlanRow[] | null) ?? [], {
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

    const { data } = await supabase
      .from("lesson_plans")
      .select(LESSON_PLAN_SELECT)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    const row = data as LessonPlanRow | null;

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
    role: typedProfile?.role ?? "creator",
  } satisfies ViewerContext;
}

export async function getLessonPlanById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("lesson_plans")
    .select(LESSON_PLAN_SELECT)
    .eq("id", id)
    .maybeSingle();

  const row = data as LessonPlanRow | null;

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

  let query = supabase
    .from("lesson_plans")
    .select(LESSON_PLAN_SELECT)
    .order("updated_at", { ascending: false });

  if (viewer.role !== "admin") {
    query = query.eq("author_id", viewer.userId);
  }

  const { data } = await query;
  return hydrateLessonPlans(supabase, (data as LessonPlanRow[] | null) ?? []);
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

  const { data } = await supabase
    .from("lesson_plans")
    .select(LESSON_PLAN_SELECT)
    .in("id", lessonPlanIds);

  const plans = await hydrateLessonPlans(
    supabase,
    (data as LessonPlanRow[] | null) ?? [],
  );
  const order = new Map(lessonPlanIds.map((id, index) => [id, index]));

  return plans.sort((left, right) => {
    return (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0);
  });
}

export async function getOpenReports(): Promise<Report[]> {
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || viewer.role !== "admin" || !supabase) {
    return [];
  }

  const { data } = await supabase
    .from("reports")
    .select("id, lesson_plan_id, reporter_id, reason, details, status, created_at")
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: false });

  const rows = (data as ReportRow[] | null) ?? [];

  if (rows.length === 0) {
    return [];
  }

  const lessonPlanIds = [...new Set(rows.map((row) => row.lesson_plan_id))];
  const reporterIds = [...new Set(rows.map((row) => row.reporter_id))];

  const [{ data: lessonTitles }, reporters] = await Promise.all([
    supabase
      .from("lesson_plans")
      .select("id, title")
      .in("id", lessonPlanIds),
    fetchAuthors(supabase, reporterIds),
  ]);

  const titles = new Map<string, string>(
    ((lessonTitles as Array<{ id: string; title: string }> | null) ?? []).map(
      (row) => [row.id, row.title],
    ),
  );

  return rows.map((row) => ({
    id: row.id,
    lessonPlanId: row.lesson_plan_id,
    lessonPlanTitle: titles.get(row.lesson_plan_id) ?? "Unknown lesson",
    reporterName:
      reporters.get(row.reporter_id)?.display_name ?? "Unknown reporter",
    reason: row.reason,
    details: row.details ?? "",
    status: row.status,
    createdAt: row.created_at,
  }));
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
