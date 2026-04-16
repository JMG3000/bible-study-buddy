import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentViewer, getLessonPlanById } from "@/lib/lesson-plans";
import { publishLessonAction } from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const plan = await getLessonPlanById(id);

  return {
    title: plan ? `Edit ${plan.title}` : "Lesson not found",
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

  if (!plan) {
    notFound();
  }

  if (!viewer || (viewer.role !== "admin" && viewer.userId !== plan.authorId)) {
    notFound();
  }

  const publishedSlug = Array.isArray(published) ? published[0] : published;
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const publicHref = plan.slug ? `/plans/${plan.slug}` : null;

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
            <Link href="/" className="button-tertiary">
              Home
            </Link>
            <Link href="/plans" className="button-tertiary">
              Browse plans
            </Link>
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>

        {!isSupabaseConfigured() ? (
          <div className="helper-banner">
            Configure Supabase to activate the live lesson editor.
          </div>
        ) : null}

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

        <div className="editor-grid">
          <section className="editor-card stack">
            <div className="meta-row">
              <span className={`status-pill ${plan.status}`}>{plan.status}</span>
              <span>{plan.durationMinutes} minutes</span>
              <span>{plan.authorName}</span>
            </div>

            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" className="input" defaultValue={plan.title} readOnly />
            </div>

            <div className="field">
              <label htmlFor="summary">Summary</label>
              <textarea
                id="summary"
                className="textarea"
                defaultValue={plan.summary}
                readOnly
              />
            </div>

            <div className="field">
              <label htmlFor="objective">Teaching objective</label>
              <textarea
                id="objective"
                className="textarea"
                defaultValue={plan.teachingObjective}
                readOnly
              />
            </div>

            <div className="inline-actions">
              {plan.status !== "published" ? (
                <form action={publishLessonAction}>
                  <input type="hidden" name="id" value={plan.id} />
                  <button type="submit" className="button">
                    Publish lesson
                  </button>
                </form>
              ) : null}

              {publicHref ? (
                <Link href={publicHref} className="button-secondary">
                  View public lesson
                </Link>
              ) : null}
            </div>
          </section>

          <section className="editor-card stack">
            <h2 className="section-title">Discussion questions</h2>
            <ol className="numbered-list">
              {plan.discussionQuestions.map((question) => (
                <li key={question} className="list-copy">
                  {question}
                </li>
              ))}
            </ol>
          </section>

          <section className="editor-card stack">
            <h2 className="section-title">Next step for this draft</h2>
            <div className="stack-sm">
              <p className="body-copy">
                This review step now checks for basic inappropriate language
                before publication. In-place editing, favorites, and reporting
                remain the next product layers after this publish flow settles.
              </p>
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
