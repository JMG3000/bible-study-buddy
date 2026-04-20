export type UserRole = "user" | "creator" | "admin";
export type LessonPlanStatus = "draft" | "published" | "unpublished";
export type ModerationState = "none" | "under_review" | "actioned";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ReportReason =
  | "inaccurate"
  | "inappropriate"
  | "copyright"
  | "spam"
  | "other";

export interface ScriptureRef {
  id: string;
  sequence: number;
  bookCode: number;
  bookName: string;
  osisCode: string;
  usfmCode: string;
  chapterStart: number;
  verseStart: number;
  chapterEnd: number;
  verseEnd: number;
  displayLabel: string;
}

export interface StudySeriesMembership {
  seriesId: string;
  seriesSlug: string | null;
  seriesTitle: string;
  position: number;
}

export interface LessonPlan {
  id: string;
  slug: string | null;
  authorId: string;
  authorName: string;
  authorHandle: string | null;
  authorRole: UserRole;
  status: LessonPlanStatus;
  moderationState: ModerationState;
  title: string;
  summary: string;
  teachingObjective: string;
  durationMinutes: number;
  topicTags: string[];
  audienceTags: string[];
  denominationTags: string[];
  customTags: string[];
  openingPrayer?: string;
  icebreaker?: string;
  facilitatorNotes?: string;
  materials: string[];
  activities: string[];
  discussionQuestions: string[];
  prayerPrompts: string[];
  handoutUrls: string[];
  scriptures: ScriptureRef[];
  seriesMemberships: StudySeriesMembership[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

export interface StudySeriesLesson {
  lessonPlanId: string;
  position: number;
  plan: LessonPlan;
}

export interface StudySeries {
  id: string;
  slug: string | null;
  authorId: string;
  authorHandle: string | null;
  title: string;
  summary: string;
  status: LessonPlanStatus;
  lessonCount: number;
  lessons: StudySeriesLesson[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  lessonPlanId: string;
  lessonPlanTitle: string;
  reporterName: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
}

export interface AdminUserSummary {
  userId: string;
  displayName: string;
  handle: string;
  role: UserRole;
  lessonCount: number;
  publishedLessonCount: number;
  createdAt: string;
  isCurrentViewer: boolean;
}

export interface LessonPlanFilters {
  q?: string;
  topic?: string;
  audience?: string;
  denomination?: string;
  book?: string;
  duration?: string;
  sort?: "newest" | "relevance";
}
