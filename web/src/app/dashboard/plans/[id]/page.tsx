import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutContentEditor } from "@/components/layout-content-editor";
import { LayoutContentView } from "@/components/layout-content-view";
import { bibleBooks, getBookByCode } from "@/lib/bible-books";
import {
  canManageUsersRole,
  getCurrentViewer,
  getLessonPlanById,
} from "@/lib/lesson-plans";
import { getLessonPlanLayoutTemplate } from "@/lib/layout-templates";
import {
  audienceOptions,
  denominationOptions,
  topicOptions,
} from "@/lib/site";
import type { ScriptureRef } from "@/lib/types";
import { publishLessonAction, updateLessonPlanAction } from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

function linesValue(values: string[]) {
  return values.join("\n");
}

function renderTagChoices(
  name: string,
  options: string[],
  selectedValues: string[],
) {
  const selected = new Set(selectedValues);

  return (
    <div className="choice-grid">
      {options.map((option) => (
        <label key={option} className="choice-pill">
          <input
            type="checkbox"
            name={name}
            value={option}
            defaultChecked={selected.has(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function renderScriptureSelector(scripture: ScriptureRef | undefined) {
  const book = scripture ? getBookByCode(scripture.bookCode) : null;

  return (
    <div className="field-row">
      <div className="field">
        <label htmlFor="book">Book</label>
        <select
          id="book"
          name="book"
          className="select"
          defaultValue={book?.slug ?? ""}
        >
          <option value="">No scripture selected</option>
          {bibleBooks.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.displayName}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="chapterStart">Chapter start</label>
        <input
          id="chapterStart"
          name="chapterStart"
          type="number"
          min="1"
          className="input"
          defaultValue={scripture?.chapterStart ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="verseStart">Verse start</label>
        <input
          id="verseStart"
          name="verseStart"
          type="number"
          min="1"
          className="input"
          defaultValue={scripture?.verseStart ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="chapterEnd">Chapter end</label>
        <input
          id="chapterEnd"
          name="chapterEnd"
          type="number"
          min="1"
          className="input"
          defaultValue={scripture?.chapterEnd ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="verseEnd">Verse end</label>
        <input
          id="verseEnd"
          name="verseEnd"
          type="number"
          min="1"
          className="input"
          defaultValue={scripture?.verseEnd ?? ""}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const plan = await getLessonPlanById(id);

  return {
    title: plan ? `Edit ${plan.title}` : "Lesson not found",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DashboardPlanPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [viewer, plan] = await Promise.all([
    getCurrentViewer(),
    getLessonPlanById(id),
  ]);
  const published = resolvedSearchParams.published;
  const error = resolvedSearchParams.error;
  const saved = resolvedSearchParams.saved;

  if (!plan) {
    notFound();
  }

  if (!viewer || (!canManageUsersRole(viewer.role) && viewer.userId !== plan.authorId)) {
    notFound();
  }

  const publishedSlug = Array.isArray(published) ? published[0] : published;
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const savedMessage = Array.isArray(saved) ? saved[0] : saved;
  const publicHref = plan.slug ? `/plans/${plan.slug}` : null;
  const layoutTemplate = await getLessonPlanLayoutTemplate(plan.layoutTemplateId);
  const isOwner = viewer.userId === plan.authorId;

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Creator review</span>
            <h1 className="page-title">{plan.title}</h1>
            <p className="lead">
              Review your lesson, publish it to the public catalog, and keep one
              clear path back to the rest of the site.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>

        {publishedSlug ? (
          <div className="helper-banner">
            Lesson published successfully. You can now open the public lesson
            page or return to the catalog.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="helper-banner" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {savedMessage ? (
          <div className="helper-banner" role="status">
            {savedMessage}
          </div>
        ) : null}

        {isOwner ? (
          <form action={updateLessonPlanAction} className="editor-grid">
            <input type="hidden" name="id" value={plan.id} />

            <section className="editor-card stack">
              <div className="meta-row">
                <span className={`status-pill ${plan.status}`}>{plan.status}</span>
                <span>{plan.durationMinutes} minutes</span>
                <span>{plan.authorName}</span>
              </div>

              <div className="field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  className="input"
                  defaultValue={plan.title}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="summary">Summary</label>
                <textarea
                  id="summary"
                  name="summary"
                  className="textarea"
                  defaultValue={plan.summary}
                />
              </div>

              <div className="field">
                <label htmlFor="teachingObjective">Teaching objective</label>
                <textarea
                  id="teachingObjective"
                  name="teachingObjective"
                  className="textarea"
                  defaultValue={plan.teachingObjective}
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="durationMinutes">Duration</label>
                  <input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    min="5"
                    max="480"
                    className="input"
                    defaultValue={plan.durationMinutes}
                  />
                </div>
                <div className="field">
                  <label htmlFor="openingPrayer">Opening prayer</label>
                  <input
                    id="openingPrayer"
                    name="openingPrayer"
                    className="input"
                    defaultValue={plan.openingPrayer ?? ""}
                  />
                </div>
              </div>
            </section>

            <section className="editor-card stack">
              <h2 className="section-title">Session prep</h2>
              <div className="field">
                <label htmlFor="icebreaker">Icebreaker</label>
                <textarea
                  id="icebreaker"
                  name="icebreaker"
                  className="textarea"
                  defaultValue={plan.icebreaker ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="facilitatorNotes">Facilitator notes</label>
                <textarea
                  id="facilitatorNotes"
                  name="facilitatorNotes"
                  className="textarea"
                  defaultValue={plan.facilitatorNotes ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="materials">Materials</label>
                <textarea
                  id="materials"
                  name="materials"
                  className="textarea"
                  placeholder="One item per line"
                  defaultValue={linesValue(plan.materials)}
                />
              </div>
            </section>

            <section className="editor-card stack">
              <h2 className="section-title">Scripture response</h2>
              {renderScriptureSelector(plan.scriptures[0])}
              <div className="field">
                <label htmlFor="discussionQuestions">Discussion questions</label>
                <textarea
                  id="discussionQuestions"
                  name="discussionQuestions"
                  className="textarea"
                  placeholder="One item per line"
                  defaultValue={linesValue(plan.discussionQuestions)}
                />
              </div>
              <div className="field">
                <label htmlFor="activities">Activities and next steps</label>
                <textarea
                  id="activities"
                  name="activities"
                  className="textarea"
                  placeholder="One item per line"
                  defaultValue={linesValue(plan.activities)}
                />
              </div>
              <div className="field">
                <label htmlFor="prayerPrompts">Prayer prompts</label>
                <textarea
                  id="prayerPrompts"
                  name="prayerPrompts"
                  className="textarea"
                  placeholder="One item per line"
                  defaultValue={linesValue(plan.prayerPrompts)}
                />
              </div>
            </section>

            <section className="editor-card stack">
              <h2 className="section-title">Classification</h2>
              <div className="field">
                <label>Topic tags</label>
                {renderTagChoices("topicTags", topicOptions, plan.topicTags)}
              </div>
              <div className="field">
                <label>Audience tags</label>
                {renderTagChoices("audienceTags", audienceOptions, plan.audienceTags)}
              </div>
              <div className="field">
                <label>Denomination tags</label>
                {renderTagChoices(
                  "denominationTags",
                  denominationOptions,
                  plan.denominationTags,
                )}
              </div>
              <div className="field">
                <label htmlFor="customTags">Custom tags</label>
                <textarea
                  id="customTags"
                  name="customTags"
                  className="textarea"
                  placeholder="One custom tag per line"
                  defaultValue={linesValue(plan.customTags)}
                />
              </div>
            </section>

            {layoutTemplate ? (
              <LayoutContentEditor
                template={layoutTemplate}
                content={plan.layoutContent ?? {}}
              />
            ) : null}

            <section className="editor-card stack">
              <h2 className="section-title">Save changes</h2>
              <p className="body-copy">
                Only the creator of this lesson can update its content.
              </p>
              <div className="inline-actions">
                <button type="submit" className="button">
                  Save lesson
                </button>
                {publicHref ? (
                  <Link href={publicHref} className="button-secondary">
                    View public lesson
                  </Link>
                ) : null}
              </div>
            </section>
          </form>
        ) : (
          <div className="editor-grid">
            <section className="editor-card stack">
              <div className="meta-row">
                <span className={`status-pill ${plan.status}`}>{plan.status}</span>
                <span>{plan.durationMinutes} minutes</span>
                <span>{plan.authorName}</span>
              </div>
              <div className="subtle-panel">
                You can review this lesson, but only the creator can edit its content.
              </div>
              <div className="stack-xs">
                <span className="eyebrow">Summary</span>
                <p className="body-copy">{plan.summary || "No summary saved yet."}</p>
              </div>
              <div className="stack-xs">
                <span className="eyebrow">Teaching objective</span>
                <p className="body-copy">
                  {plan.teachingObjective || "No teaching objective saved yet."}
                </p>
              </div>
            </section>

            <section className="editor-card stack">
              <h2 className="section-title">Discussion questions</h2>
              {plan.discussionQuestions.length > 0 ? (
                <ol className="numbered-list">
                  {plan.discussionQuestions.map((question, index) => (
                    <li key={`${index}-${question}`} className="list-copy">
                      {question}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="body-copy">No discussion questions saved yet.</p>
              )}
            </section>

            {layoutTemplate ? (
              <LayoutContentView
                template={layoutTemplate}
                content={plan.layoutContent ?? {}}
              />
            ) : null}
          </div>
        )}

        <div className="editor-grid">
          {isOwner && plan.status !== "published" ? (
            <section className="editor-card stack">
              <h2 className="section-title">Publish this lesson</h2>
              <p className="body-copy">
                Publishing makes this lesson visible in the public catalog.
              </p>
              <form action={publishLessonAction}>
                <input type="hidden" name="id" value={plan.id} />
                <button type="submit" className="button">
                  Publish lesson
                </button>
              </form>
            </section>
          ) : null}

          <section className="editor-card stack">
            <h2 className="section-title">Lesson organization</h2>
            <div className="stack-sm">
              {plan.seriesMemberships.length > 0 ? (
                <div className="stack-sm">
                  <strong>Included in study series</strong>
                  <div className="stack">
                    {plan.seriesMemberships.map((membership) => (
                      <Link
                        key={`${membership.seriesId}-${membership.position}`}
                        href={`/dashboard/series/${membership.seriesId}`}
                        className="inline-link"
                      >
                        Part {membership.position} of {membership.seriesTitle}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="body-copy">
                  This lesson is not currently attached to a study series.
                </p>
              )}
              <div className="tag-list">
                {[...new Set([...plan.topicTags, ...plan.customTags])].map((tag) => (
                  <span key={tag} className="chip-muted">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
