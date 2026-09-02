import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  duplicateLessonAction,
  submitLessonReportAction,
  toggleFavoriteAction,
} from "./actions";
import { LayoutContentView } from "@/components/layout-content-view";
import { PrintButton } from "@/components/print-button";
import { ScripturePill } from "@/components/scripture-pill";
import { ScriptureTooltipEnhancer } from "@/components/scripture-tooltip-enhancer";
import { getLessonPlanLayoutTemplate } from "@/lib/layout-templates";
import {
  buildCanonicalUrl,
  formatDate,
  getCurrentViewer,
  getPublishedLessonAttributionById,
  getViewerLessonReportAccess,
  isLessonPlanSavedForViewer,
  getLessonPlanBySlug,
} from "@/lib/lesson-plans";
import { serializeJsonLd } from "@/lib/json-ld";
import type { ReportReason } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const reportReasonLabels: Array<{ value: ReportReason; label: string }> = [
  { value: "inaccurate", label: "Something here seems inaccurate" },
  { value: "inappropriate", label: "The tone or content feels inappropriate" },
  { value: "copyright", label: "This may use material without permission" },
  { value: "spam", label: "This looks like spam or low-value content" },
  { value: "other", label: "Something else needs a careful look" },
];

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const plan = await getLessonPlanBySlug(slug);

  if (!plan) {
    return {
      title: "Lesson not found",
    };
  }

  return {
    title: plan.title,
    description: plan.summary,
    alternates: {
      canonical: buildCanonicalUrl(slug),
    },
    openGraph: {
      title: plan.title,
      description: plan.summary,
      url: buildCanonicalUrl(slug),
      type: "article",
    },
  };
}

export default async function LessonPlanDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const [plan, viewer, resolvedSearchParams] = await Promise.all([
    getLessonPlanBySlug(slug),
    getCurrentViewer(),
    searchParams,
  ]);

  if (!plan) {
    notFound();
  }

  const [isSaved, reportAccess] = await Promise.all([
    isLessonPlanSavedForViewer(plan.id, viewer?.userId),
    getViewerLessonReportAccess(plan.id, viewer?.userId),
  ]);
  const [layoutTemplate, parentLesson] = await Promise.all([
    getLessonPlanLayoutTemplate(plan.layoutTemplateId),
    getPublishedLessonAttributionById(plan.parentLessonId),
  ]);
  const reportMessage = readValue(resolvedSearchParams, "report");
  const reportError = readValue(resolvedSearchParams, "reportError");
  const duplicateError = readValue(resolvedSearchParams, "duplicateError");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    additionalType: "https://schema.org/LearningResource",
    name: plan.title,
    description: plan.summary,
    url: buildCanonicalUrl(slug),
    author: {
      "@type": "Person",
      name: plan.authorHandle ? `@${plan.authorHandle}` : plan.authorName,
    },
    timeRequired: `PT${plan.durationMinutes}M`,
    educationalLevel: plan.audienceTags.join(", "),
    learningResourceType: "Bible study lesson plan",
    about: [...plan.topicTags, ...plan.denominationTags],
    teaches: plan.teachingObjective,
  };

  return (
    <section className="detail-hero">
      <div className="shell stack">
        <div className="surface-card no-print">
          <div className="meta-row">
            <span className="status-pill published">Published</span>
            <span>{formatDate(plan.publishedAt)}</span>
            <span>{plan.durationMinutes} minutes</span>
          </div>
        </div>

        <div className="stack-sm">
          <span className="eyebrow">Printable lesson detail</span>
          <h1 className="detail-title">{plan.title}</h1>
          <p className="detail-summary">{plan.summary}</p>
          {plan.authorHandle ? (
            <Link href={`/plans?q=%40${plan.authorHandle}`} className="detail-author inline-link no-print">
              Made by @{plan.authorHandle}
            </Link>
          ) : null}
          {parentLesson ? (
            <Link
              href={`/plans/${parentLesson.slug}`}
              className="detail-author inline-link no-print"
            >
              Remixed from {parentLesson.title}
            </Link>
          ) : null}
        </div>

        {plan.seriesMemberships.length > 0 ? (
          <div className="surface-card no-print stack-sm">
            <span className="eyebrow">Part of a Study Series</span>
            <div className="stack-sm">
              {plan.seriesMemberships.map((membership) =>
                membership.seriesSlug ? (
                  <Link
                    key={`${membership.seriesId}-${membership.position}`}
                    href={`/series/${membership.seriesSlug}`}
                    className="inline-link"
                  >
                    Part {membership.position} of {membership.seriesTitle}
                  </Link>
                ) : (
                  <span
                    key={`${membership.seriesId}-${membership.position}`}
                    className="meta-text"
                  >
                    Part {membership.position} of {membership.seriesTitle}
                  </span>
                ),
              )}
            </div>
            <p className="body-copy">
              This lesson still stands on its own, but it can also be taught as
              one part of a larger multi-session path.
            </p>
          </div>
        ) : null}

        <div className="detail-grid">
          <div className="detail-main">
            <script
              nonce={nonce}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: serializeJsonLd(jsonLd),
              }}
            />

            <div className="detail-section">
              <h2>Scripture focus</h2>
              <div className="detail-scriptures scripture-focus-list">
                {plan.scriptures.map((scripture) => (
                  <ScripturePill key={scripture.id} scripture={scripture} />
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h2>Teaching objective</h2>
              <p className="body-copy">{plan.teachingObjective}</p>
            </div>

            {plan.openingPrayer ? (
              <div className="detail-section">
                <h2>Opening prayer</h2>
                <p className="body-copy">{plan.openingPrayer}</p>
              </div>
            ) : null}

            {plan.icebreaker ? (
              <div className="detail-section">
                <h2>Icebreaker</h2>
                <p className="body-copy">{plan.icebreaker}</p>
              </div>
            ) : null}

            <div className="detail-section">
              <h2>Discussion questions</h2>
              <ol className="numbered-list">
                {plan.discussionQuestions.map((question, index) => (
                  <li key={`${index}-${question}`} className="list-copy">
                    {question}
                  </li>
                ))}
              </ol>
            </div>

            <div className="detail-section">
              <h2>Activities and next steps</h2>
              <ul className="bullet-list">
                {plan.activities.map((activity, index) => (
                  <li key={`${index}-${activity}`} className="list-copy">
                    {activity}
                  </li>
                ))}
              </ul>
            </div>

            <div className="detail-section">
              <h2>Prayer prompts</h2>
              <ul className="bullet-list">
                {plan.prayerPrompts.map((prompt) => (
                  <li key={prompt} className="list-copy">
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            {plan.facilitatorNotes ? (
              <div className="detail-section">
                <h2>Facilitator notes</h2>
                <p className="body-copy">{plan.facilitatorNotes}</p>
              </div>
            ) : null}

            {layoutTemplate ? (
              <LayoutContentView
                template={layoutTemplate}
                content={plan.layoutContent ?? {}}
              />
            ) : null}
          </div>

          <aside className="detail-sidebar-card surface-card">
            <div className="stack-sm no-print">
              <span className="chip-accent">Ready for the room</span>
              <form action={toggleFavoriteAction} className="stack-sm">
                <input type="hidden" name="lessonPlanId" value={plan.id} />
                <input type="hidden" name="returnPath" value={`/plans/${slug}`} />
                <button type="submit" className="button-secondary auth-button">
                  {viewer
                    ? isSaved
                      ? "Remove from favorites"
                      : "Save to favorites"
                    : "Sign in to save to favorites"}
                </button>
              </form>
              <PrintButton
                plan={plan}
                layoutTemplate={layoutTemplate}
                canSavePrintLog={Boolean(viewer)}
              />
              <form action={duplicateLessonAction} className="stack-sm">
                <input type="hidden" name="lessonPlanId" value={plan.id} />
                <input type="hidden" name="returnPath" value={`/plans/${slug}`} />
                <button type="submit" className="button-secondary auth-button">
                  {viewer ? "Duplicate as draft" : "Sign in to duplicate"}
                </button>
              </form>
              {duplicateError ? (
                <div className="helper-banner" role="alert">
                  {duplicateError}
                </div>
              ) : null}
            </div>

            <div className="stack-sm no-print">
              <h2 className="section-title">Report lesson</h2>
              <p className="body-copy">
                If something here needs a closer look, you can send a short,
                respectful note for review.
              </p>

              {reportMessage ? <div className="helper-banner">{reportMessage}</div> : null}
              {reportError ? (
                <div className="helper-banner" role="alert">
                  {reportError}
                </div>
              ) : null}

              {viewer ? (
                !reportAccess.canSubmit ? (
                  <div className="subtle-panel">
                    {reportAccess.helperMessage ??
                      "You cannot submit another report for this lesson right now."}
                  </div>
                ) : (
                  <>
                    {reportAccess.helperMessage ? (
                      <div className="subtle-panel">{reportAccess.helperMessage}</div>
                    ) : null}

                    <form action={submitLessonReportAction} className="stack-sm">
                      <input type="hidden" name="lessonPlanId" value={plan.id} />
                      <input type="hidden" name="returnPath" value={`/plans/${slug}`} />

                      <div className="field">
                        <label htmlFor="reason">Reason</label>
                        <select
                          id="reason"
                          name="reason"
                          className="select"
                          defaultValue="inaccurate"
                        >
                          {reportReasonLabels.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label htmlFor="details">Optional note</label>
                        <textarea
                          id="details"
                          name="details"
                          className="textarea"
                          placeholder="Share only what will help a moderator understand the concern."
                        />
                      </div>

                      <button type="submit" className="button-secondary auth-button">
                        {reportAccess.ctaLabel}
                      </button>
                    </form>
                  </>
                )
              ) : (
                <form action={submitLessonReportAction} className="stack-sm">
                  <input type="hidden" name="lessonPlanId" value={plan.id} />
                  <input type="hidden" name="returnPath" value={`/plans/${slug}`} />
                  <button type="submit" className="button-secondary auth-button">
                    Sign in to report lesson
                  </button>
                </form>
              )}
            </div>

            <div className="stack-sm">
              <h2 className="section-title">Session details</h2>
              <div className="tag-list">
                {[...new Set([...plan.topicTags, ...plan.customTags])].map((tag) => (
                  <span key={tag} className="chip-muted">
                    {tag}
                  </span>
                ))}
              </div>

              {plan.customTags.length > 0 ? (
                <div className="stack-sm">
                  <strong>Custom tags</strong>
                  <p className="body-copy">{plan.customTags.join(", ")}</p>
                </div>
              ) : null}

              <div className="stack-sm">
                <strong>Audience</strong>
                <p className="body-copy">{plan.audienceTags.join(", ")}</p>
              </div>

              <div className="stack-sm">
                <strong>Traditions</strong>
                <p className="body-copy">{plan.denominationTags.join(", ")}</p>
              </div>

              <div className="stack-sm">
                <strong>Materials</strong>
                <ul className="bullet-list">
                  {plan.materials.map((material) => (
                    <li key={material} className="list-copy">
                      {material}
                    </li>
                  ))}
                </ul>
              </div>

              {plan.handoutUrls.length > 0 ? (
                <div className="stack-sm">
                  <strong>Handouts</strong>
                  <ul className="bullet-list">
                    {plan.handoutUrls.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-link"
                        >
                          Download supporting handout
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <ScriptureTooltipEnhancer nonce={nonce} />
      </div>
    </section>
  );
}
