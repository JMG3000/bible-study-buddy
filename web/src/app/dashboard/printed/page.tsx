import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import {
  formatDate,
  getCurrentViewer,
  getPrintedLessonLogs,
} from "@/lib/lesson-plans";

export const metadata: Metadata = {
  title: "Print Log",
  description: "Private saved handouts for the current user.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readList(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => String(entry)).filter(Boolean)
    : [];
}

function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function PrintedLessonLogsPage({ searchParams }: PageProps) {
  const [viewer, printLogs, resolvedSearchParams] = await Promise.all([
    getCurrentViewer(),
    getPrintedLessonLogs(),
    searchParams,
  ]);
  const savedMessage = readParam(resolvedSearchParams, "saved");

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Private handouts</span>
            <h1 className="page-title">Print log</h1>
            <p className="lead">
              Keep the edited handouts you prepared for printing, without changing
              the public lesson.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>

        {savedMessage ? (
          <div className="helper-banner" role="status">
            {savedMessage}
          </div>
        ) : null}

        {viewer ? (
          printLogs.length > 0 ? (
            <div className="stack">
              {printLogs.map((entry) => {
                const payload = entry.printPayload;
                const questions = readList(payload.discussionQuestions);
                const activities = readList(payload.activities);
                const sourceHref = entry.lessonSlug
                  ? `/plans/${entry.lessonSlug}`
                  : null;

                return (
                  <article key={entry.id} className="surface-card stack-sm">
                    <div className="meta-row">
                      <span className="chip-accent">Saved handout</span>
                      <span>Saved {formatDate(entry.createdAt)}</span>
                      <span>Updated {formatDate(entry.updatedAt)}</span>
                    </div>

                    <div className="stack-xs">
                      <h2 className="section-title">{entry.printTitle}</h2>
                      <p className="body-copy">
                        Source lesson: {entry.lessonTitle}
                      </p>
                      {entry.printSummary ? (
                        <p className="body-copy">{entry.printSummary}</p>
                      ) : null}
                    </div>

                    <div className="subtle-panel stack-xs">
                      <strong>Teaching objective</strong>
                      <p className="body-copy">
                        {readString(payload.teachingObjective) ||
                          "No teaching objective saved for this handout."}
                      </p>
                    </div>

                    {questions.length > 0 ? (
                      <div className="stack-xs">
                        <strong>Discussion questions</strong>
                        <ol className="numbered-list">
                          {questions.slice(0, 3).map((question, index) => (
                            <li key={`${index}-${question}`} className="list-copy">
                              {question}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}

                    {activities.length > 0 ? (
                      <div className="stack-xs">
                        <strong>Activities</strong>
                        <ul className="bullet-list">
                          {activities.slice(0, 3).map((activity, index) => (
                            <li key={`${index}-${activity}`} className="list-copy">
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="inline-actions">
                      <Link
                        href={`/dashboard/printed/${entry.id}`}
                        className="button-secondary"
                      >
                        Open saved handout
                      </Link>
                      {sourceHref ? (
                        <Link href={sourceHref} className="button-tertiary">
                          Open source lesson
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No print logs yet"
              description="Open a published lesson, choose Print handout, make edits, then save that private handout here."
            />
          )
        ) : (
          <EmptyState
            title="Sign in to see your print log"
            description="Printed handout history is private and only appears after sign-in."
          />
        )}
      </div>
    </section>
  );
}
