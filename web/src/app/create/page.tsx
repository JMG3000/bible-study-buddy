import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bibleBooks } from "@/lib/bible-books";
import { getCurrentViewer } from "@/lib/lesson-plans";
import {
  audienceOptions,
  denominationOptions,
  topicOptions,
} from "@/lib/site";
import { createLessonDraftAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Create a Lesson",
  description:
    "Create a draft Bible study lesson with structured scripture references and creator-only access.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [viewer, resolvedParams] = await Promise.all([
    getCurrentViewer(),
    searchParams,
  ]);
  const error = readValue(resolvedParams, "error");

  if (!viewer) {
    redirect("/login");
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="stack-sm">
          <span className="eyebrow">Authoring surface</span>
          <h1 className="page-title">Structured lesson editor</h1>
          <p className="lead">
            Start lean, save early, and fill in the rest as the lesson takes shape.
          </p>
        </div>

        <div className="subtle-panel">
          Signed in as <strong>{viewer.displayName}</strong>. Drafts save to your
          creator account and appear in the dashboard immediately after submit.
        </div>

        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        <form action={createLessonDraftAction} className="editor-grid">
          <section className="editor-card stack">
            <div className="stack-xs">
              <h2 className="section-title">Core lesson details</h2>
              <p className="body-copy">
                Keep these anchor fields in place for every draft, then return and refine them as needed.
              </p>
            </div>

            <div className="field">
              <label htmlFor="title">Lesson title</label>
              <input
                id="title"
                name="title"
                className="input"
                placeholder="Walking in Community"
              />
            </div>

            <div className="field">
              <label htmlFor="summary">Summary</label>
              <textarea
                id="summary"
                name="summary"
                className="textarea"
                placeholder="A concise overview that will appear in the public catalog and SEO metadata."
              />
            </div>

            <div className="field">
              <label htmlFor="teachingObjective">Teaching objective</label>
              <textarea
                id="teachingObjective"
                name="teachingObjective"
                className="textarea"
                placeholder="Describe the change, understanding, or response this lesson is designed to produce."
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
                  defaultValue="45"
                />
              </div>
              <div className="field">
                <label htmlFor="openingPrayer">Opening prayer</label>
                <input
                  id="openingPrayer"
                  name="openingPrayer"
                  className="input"
                  placeholder="Optional opening prayer"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="facilitatorNotes">Facilitator notes</label>
              <textarea
                id="facilitatorNotes"
                name="facilitatorNotes"
                className="textarea"
                placeholder="Teaching notes, timing cues, or pastoral reminders"
              />
            </div>
          </section>

          <section className="editor-card stack">
            <div className="stack-xs">
              <h2 className="section-title">Scripture and response</h2>
              <p className="body-copy">
                Add a passage now or leave it blank and return once the lesson focus is set.
              </p>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="book">Book</label>
                <select id="book" name="book" className="select" defaultValue="">
                  <option value="">Select later</option>
                  {bibleBooks.map((book) => (
                    <option key={book.slug} value={book.slug}>
                      {book.displayName}
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
                  placeholder="2"
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
                  placeholder="42"
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
                  placeholder="2"
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
                  placeholder="47"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="discussionQuestions">Discussion questions</label>
              <textarea
                id="discussionQuestions"
                name="discussionQuestions"
                className="textarea"
                placeholder="One item per line"
              />
            </div>

            <div className="field">
              <label htmlFor="activities">Activities and next steps</label>
              <textarea
                id="activities"
                name="activities"
                className="textarea"
                placeholder="One item per line"
              />
            </div>
          </section>

          <section className="editor-card stack">
            <div className="stack-xs">
              <h2 className="section-title">Classification</h2>
              <p className="body-copy">
                These tags keep lessons organized and easier to browse later.
              </p>
            </div>

            <div className="field">
              <label>Topic tags</label>
              <div className="choice-grid">
                {topicOptions.map((topic) => (
                  <label key={topic} className="choice-pill">
                    <input type="checkbox" name="topicTags" value={topic} />
                    <span>{topic}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Audience tags</label>
              <div className="choice-grid">
                {audienceOptions.map((audience) => (
                  <label key={audience} className="choice-pill">
                    <input type="checkbox" name="audienceTags" value={audience} />
                    <span>{audience}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Denomination tags</label>
              <div className="choice-grid">
                {denominationOptions.map((denomination) => (
                  <label key={denomination} className="choice-pill">
                    <input
                      type="checkbox"
                      name="denominationTags"
                      value={denomination}
                    />
                    <span>{denomination}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="customTags">Custom tags</label>
              <textarea
                id="customTags"
                name="customTags"
                className="textarea"
                placeholder="One custom tag per line, such as hospitality, college ministry, or prayer night"
              />
            </div>
          </section>

          <section className="editor-card stack">
            <div className="stack-xs">
              <h2 className="section-title">Session prep</h2>
              <p className="body-copy">
                Capture the materials and prompts you want ready when it is time to lead.
              </p>
            </div>

            <div className="field">
              <label htmlFor="icebreaker">Icebreaker</label>
              <textarea
                id="icebreaker"
                name="icebreaker"
                className="textarea"
                placeholder="Optional discussion starter or warm-up prompt"
              />
            </div>

            <div className="field">
              <label htmlFor="materials">Materials</label>
              <textarea
                id="materials"
                name="materials"
                className="textarea"
                placeholder="One item per line"
              />
            </div>

            <div className="field">
              <label htmlFor="prayerPrompts">Prayer prompts</label>
              <textarea
                id="prayerPrompts"
                name="prayerPrompts"
                className="textarea"
                placeholder="One item per line"
              />
            </div>

            <div className="inline-actions">
              <button type="submit" className="button">
                Save draft
              </button>
              <Link href="/dashboard" className="button-secondary">
                Back to dashboard
              </Link>
            </div>
          </section>
        </form>
      </div>
    </section>
  );
}
