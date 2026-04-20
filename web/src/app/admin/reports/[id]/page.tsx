import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  completeReviewAction,
  openReviewThreadAction,
  postReviewThreadMessageAction,
} from "@/app/review-actions";
import {
  canReviewReportsRole,
  getCurrentViewer,
  getReviewReportById,
} from "@/lib/lesson-plans";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await getReviewReportById(id);

  return {
    title: report ? `Review ${report.lessonPlanTitle}` : "Review report",
  };
}

export default async function AdminReportDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [viewer, report] = await Promise.all([
    getCurrentViewer(),
    getReviewReportById(id),
  ]);
  const updated = readValue(resolvedSearchParams, "updated");
  const error = readValue(resolvedSearchParams, "error");

  if (!viewer) {
    redirect("/login");
  }

  if (!canReviewReportsRole(viewer.role) || !report) {
    notFound();
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Report review</span>
            <h1 className="page-title">{report.lessonPlanTitle}</h1>
            <p className="lead">
              Review the report, open a temporary creator conversation if it is
              valid, and finish the review when the decision is complete.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/admin/reports" className="button-secondary">
              Back to queue
            </Link>
          </div>
        </div>

        {updated ? <div className="helper-banner">{updated}</div> : null}
        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        <div className="detail-grid">
          <section className="detail-main stack">
            <article className="surface-card stack-sm">
              <div className="meta-row">
                <span className="chip-accent">{report.status}</span>
                <span>{report.reason}</span>
                <span>{new Date(report.createdAt).toLocaleDateString("en-US")}</span>
              </div>

              <div className="stack-sm">
                <h2 className="section-title">Report summary</h2>
                <p className="body-copy">
                  Reported by {report.reporterName}
                  {report.reporterHandle ? ` (@${report.reporterHandle})` : ""}.
                </p>
                <p className="body-copy">
                  Lesson creator: {report.lessonAuthorName}
                  {report.lessonAuthorHandle ? ` (@${report.lessonAuthorHandle})` : ""}.
                </p>
                <p className="body-copy">{report.details || "No extra details were provided."}</p>
              </div>

              <div className="inline-actions">
                {report.lessonPlanSlug ? (
                  <Link href={`/plans/${report.lessonPlanSlug}`} className="button-secondary">
                    View public lesson
                  </Link>
                ) : null}

                {!report.threadOpen ? (
                  <form action={openReviewThreadAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input
                      type="hidden"
                      name="returnPath"
                      value={`/admin/reports/${report.id}`}
                    />
                    <button type="submit" className="button">
                      Open creator thread
                    </button>
                  </form>
                ) : null}
              </div>
            </article>

            {report.threadOpen ? (
              <article className="surface-card stack-sm">
                <div className="stack-xs">
                  <span className="eyebrow">Active thread</span>
                  <h2 className="section-title">Creator conversation</h2>
                  <p className="body-copy">
                    This thread stays live only while the review is active. When
                    you finish the review, the thread is removed and the report
                    stays archived.
                  </p>
                </div>

                <div className="review-thread">
                  {report.messages.length > 0 ? (
                    report.messages.map((message) => (
                      <article key={message.id} className="review-message-card">
                        <div className="meta-row">
                          <span>{message.authorName}</span>
                          {message.authorHandle ? (
                            <span>@{message.authorHandle}</span>
                          ) : null}
                          <span>
                            {new Date(message.createdAt).toLocaleString("en-US")}
                          </span>
                        </div>
                        <p className="body-copy">{message.body}</p>
                      </article>
                    ))
                  ) : (
                    <p className="body-copy">
                      The thread is open. Send the first note to the lesson creator.
                    </p>
                  )}
                </div>

                <form action={postReviewThreadMessageAction} className="field">
                  <input type="hidden" name="reportId" value={report.id} />
                  <input
                    type="hidden"
                    name="returnPath"
                    value={`/admin/reports/${report.id}`}
                  />
                  <label htmlFor="review-message">Message to creator</label>
                  <textarea
                    id="review-message"
                    name="body"
                    className="textarea"
                    placeholder="Share the concern respectfully and ask for clarification or edits."
                  />
                  <button type="submit" className="button-secondary">
                    Send message
                  </button>
                </form>
              </article>
            ) : null}
          </section>

          <aside className="detail-sidebar-card surface-card stack-sm">
            <div className="stack-xs">
              <span className="eyebrow">Finish review</span>
              <h2 className="section-title">Archive this report</h2>
              <p className="body-copy">
                Add a final note, then resolve or dismiss the review. Finishing a
                review removes the temporary message thread.
              </p>
            </div>

            <form action={completeReviewAction} className="field">
              <input type="hidden" name="reportId" value={report.id} />
              <input
                type="hidden"
                name="returnPath"
                value={`/admin/reports/${report.id}`}
              />
              <label htmlFor="resolution-note">Final note</label>
              <textarea
                id="resolution-note"
                name="resolutionNote"
                className="textarea"
                defaultValue={report.resolutionNote}
                placeholder="Summarize the decision and any follow-up."
              />
              <div className="stack-sm">
                <button
                  type="submit"
                  name="outcome"
                  value="resolved"
                  className="button"
                >
                  Finish as valid report
                </button>
                <button
                  type="submit"
                  name="outcome"
                  value="dismissed"
                  className="button-secondary"
                >
                  Dismiss report
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </section>
  );
}
