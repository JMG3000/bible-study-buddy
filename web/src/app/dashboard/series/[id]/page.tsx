import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  canManageUsersRole,
  getCurrentViewer,
  getStudySeriesById,
} from "@/lib/lesson-plans";
import { publishStudySeriesAction } from "../actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const series = await getStudySeriesById(id);

  return {
    title: series ? `Edit ${series.title}` : "Study series not found",
  };
}

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function DashboardStudySeriesPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [viewer, series] = await Promise.all([
    getCurrentViewer(),
    getStudySeriesById(id),
  ]);
  const created = readValue(resolvedSearchParams, "created") === "1";
  const publishedSlug = readValue(resolvedSearchParams, "published");
  const error = readValue(resolvedSearchParams, "error");

  if (!series) {
    notFound();
  }

  if (!viewer || (!canManageUsersRole(viewer.role) && viewer.userId !== series.authorId)) {
    notFound();
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Series review</span>
            <h1 className="page-title">{series.title}</h1>
            <p className="lead">
              Review the sequence, make sure every lesson is ready, and publish
              the full study path when the playlist is complete.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>

        {created ? (
          <div className="helper-banner">
            Study series draft created successfully. You can review the
            sequence here and publish it when all included lessons are ready.
          </div>
        ) : null}

        {publishedSlug ? (
          <div className="helper-banner">
            Study series published successfully. You can now open the public
            series page and share the ordered lesson path.
          </div>
        ) : null}

        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        <div className="editor-grid">
          <section className="editor-card stack">
            <div className="meta-row">
              <span className={`status-pill ${series.status}`}>{series.status}</span>
              <span>{series.lessonCount} parts</span>
              {series.authorHandle ? <span>@{series.authorHandle}</span> : null}
            </div>

            <div className="field">
              <label htmlFor="series-title">Series title</label>
              <input
                id="series-title"
                className="input"
                defaultValue={series.title}
                readOnly
              />
            </div>

            <div className="field">
              <label htmlFor="series-summary">Series summary</label>
              <textarea
                id="series-summary"
                className="textarea"
                defaultValue={series.summary}
                readOnly
              />
            </div>

            <div className="inline-actions">
              {series.status !== "published" ? (
                <form action={publishStudySeriesAction}>
                  <input type="hidden" name="id" value={series.id} />
                  <button type="submit" className="button">
                    Publish study series
                  </button>
                </form>
              ) : null}

              {series.slug ? (
                <Link href={`/series/${series.slug}`} className="button-tertiary">
                  View public series
                </Link>
              ) : null}
            </div>
          </section>

          <section className="editor-card stack">
            <h2 className="section-title">Series sequence</h2>

            <div className="stack">
              {series.lessons.map((entry) => (
                <article key={entry.lessonPlanId} className="series-sequence-card">
                  <div className="meta-row">
                    <span className="chip-accent">Part {entry.position}</span>
                    <span>{entry.plan.status}</span>
                    <span>{entry.plan.durationMinutes} min</span>
                  </div>

                  <div className="stack-xs">
                    <strong>{entry.plan.title}</strong>
                    <span className="body-copy">{entry.plan.summary}</span>
                  </div>

                  <div className="inline-actions">
                    <Link
                      href={`/dashboard/plans/${entry.plan.id}`}
                      className="button-tertiary"
                    >
                      Open lesson
                    </Link>
                    {entry.plan.slug ? (
                      <Link
                        href={`/plans/${entry.plan.slug}`}
                        className="button-tertiary"
                      >
                        Public lesson
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
