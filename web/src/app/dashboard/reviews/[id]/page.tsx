import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { postReviewThreadMessageAction } from "@/app/review-actions";
import { getCreatorReviewReportById, getCurrentViewer } from "@/lib/lesson-plans";

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
  const review = await getCreatorReviewReportById(id);

  return {
    title: review ? `Review ${review.lessonPlanTitle}` : "Creator review",
  };
}

export default async function CreatorReviewThreadPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [viewer, review] = await Promise.all([
    getCurrentViewer(),
    getCreatorReviewReportById(id),
  ]);
  const updated = readValue(resolvedSearchParams, "updated");
  const error = readValue(resolvedSearchParams, "error");

  if (!viewer) {
    redirect("/login");
  }

  if (!review) {
    notFound();
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Active review</span>
            <h1 className="page-title">{review.lessonPlanTitle}</h1>
            <p className="lead">
              This temporary conversation is attached to the active review for
              your lesson. Once the reviewer finishes, the thread disappears and
              the review stays archived.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
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
                <span className="chip-accent">{review.status}</span>
                <span>{review.reason}</span>
                {review.assignedReviewerHandle ? (
                  <span>Reviewer @{review.assignedReviewerHandle}</span>
                ) : null}
              </div>

              <div className="stack-sm">
                <h2 className="section-title">Why this lesson was flagged</h2>
                <p className="body-copy">
                  Reporter: {review.reporterName}
                  {review.reporterHandle ? ` (@${review.reporterHandle})` : ""}
                </p>
                <p className="body-copy">{review.details || "No extra details were provided."}</p>
              </div>
            </article>

            <article className="surface-card stack-sm">
              <h2 className="section-title">Review thread</h2>
              <div className="review-thread">
                {review.messages.map((message) => (
                  <article key={message.id} className="review-message-card">
                    <div className="meta-row">
                      <span>{message.authorName}</span>
                      {message.authorHandle ? <span>@{message.authorHandle}</span> : null}
                      <span>{new Date(message.createdAt).toLocaleString("en-US")}</span>
                    </div>
                    <p className="body-copy">{message.body}</p>
                  </article>
                ))}
              </div>

              <form action={postReviewThreadMessageAction} className="field">
                <input type="hidden" name="reportId" value={review.id} />
                <input
                  type="hidden"
                  name="returnPath"
                  value={`/dashboard/reviews/${review.id}`}
                />
                <label htmlFor="creator-review-message">Reply to reviewer</label>
                <textarea
                  id="creator-review-message"
                  name="body"
                  className="textarea"
                  placeholder="Share clarification, context, or the changes you plan to make."
                />
                <button type="submit" className="button-secondary">
                  Send reply
                </button>
              </form>
            </article>
          </section>

          <aside className="detail-sidebar-card surface-card stack-sm">
            <div className="stack-xs">
              <span className="eyebrow">Helpful note</span>
              <h2 className="section-title">What happens next</h2>
              <p className="body-copy">
                The reviewer can resolve or dismiss the report after this
                conversation. When that happens, this thread is removed.
              </p>
            </div>

            {review.lessonPlanSlug ? (
              <Link href={`/plans/${review.lessonPlanSlug}`} className="button-secondary">
                View public lesson
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
