export type UserRole = "creator" | "admin";
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

export interface LessonPlan {
  id: string;
  slug: string | null;
  authorId: string;
  authorName: string;
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
  openingPrayer?: string;
  icebreaker?: string;
  facilitatorNotes?: string;
  materials: string[];
  activities: string[];
  discussionQuestions: string[];
  prayerPrompts: string[];
  handoutUrls: string[];
  scriptures: ScriptureRef[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
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

export interface LessonPlanFilters {
  q?: string;
  topic?: string;
  audience?: string;
  denomination?: string;
  book?: string;
  duration?: string;
  sort?: "newest" | "relevance";
}
