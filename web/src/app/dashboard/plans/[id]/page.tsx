import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentViewer, getLessonPlanById } from "@/lib/lesson-plans";

type PageProps = {
  params: Promise<{ id: string }>;
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

export default async function DashboardPlanPage({ params }: PageProps) {
  const { id } = await params;
  const [viewer, plan] = await Promise.all([
    getCurrentViewer(),
    getLessonPlanById(id),
  ]);

  if (!plan) {
    notFound();
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="stack-sm">
          <span className="eyebrow">Editor detail</span>
          <h1 className="page-title">{plan.title}</h1>
          <p className="lead">
            This route now loads its lesson data from Supabase and is intended
            for authenticated owner-only editing.
          </p>
        </div>

        {!isSupabaseConfigured() ? (
          <div className="helper-banner">
            Configure Supabase to activate the live lesson editor.
          </div>
        ) : null}

        {!viewer ? (
          <div className="helper-banner">
            Sign in to edit this lesson with owner-scoped permissions.
          </div>
        ) : null}

        <div className="editor-grid">
          <section className="editor-card">
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
          </section>

          <section className="editor-card">
            <h2 className="section-title">Discussion questions</h2>
            <ol className="numbered-list">
              {plan.discussionQuestions.map((question) => (
                <li key={question} className="list-copy">
                  {question}
                </li>
              ))}
            </ol>
          </section>

          <section className="editor-card">
            <h2 className="section-title">Operational notes</h2>
            <div className="stack-sm">
              <p className="body-copy">
                The next step is wiring server actions so this editor can save
                drafts, publish, and update lesson content against the live
                Supabase schema.
              </p>
              <div className="tag-list">
                {plan.topicTags.map((tag) => (
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
