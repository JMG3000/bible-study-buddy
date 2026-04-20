import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { getCurrentViewer, getDashboardPlans } from "@/lib/lesson-plans";
import { createStudySeriesAction } from "../actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Create a Study Series",
  description:
    "Group independent lesson plans into an ordered study series while keeping each lesson fully standalone.",
  robots: {
    index: false,
    follow: false,
  },
};

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

function readSelectedLessons(value: string) {
  return new Set(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function readPositions(value: string) {
  const positions = new Map<string, string>();

  for (const entry of value.split("|")) {
    const [lessonId, position] = entry.split(":");

    if (lessonId && position) {
      positions.set(lessonId, position);
    }
  }

  return positions;
}

export default async function CreateStudySeriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [viewer, plans, resolvedSearchParams] = await Promise.all([
    getCurrentViewer(),
    getDashboardPlans(),
    searchParams,
  ]);
  const error = readValue(resolvedSearchParams, "error");
  const title = readValue(resolvedSearchParams, "title");
  const summary = readValue(resolvedSearchParams, "summary");
  const selectedLessons = readSelectedLessons(readValue(resolvedSearchParams, "lessons"));
  const positions = readPositions(readValue(resolvedSearchParams, "positions"));

  if (!viewer) {
    redirect("/login");
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Study series builder</span>
            <h1 className="page-title">Create an ordered lesson series</h1>
            <p className="lead">
              Build a parent playlist that walks people through a multi-part
              journey while keeping every lesson fully useful on its own.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>

        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        {plans.length < 2 ? (
          <EmptyState
            title="You need at least two lessons to build a series"
            description="Create a couple of standalone lesson drafts first, then come back and group them into a study path."
          />
        ) : (
          <form action={createStudySeriesAction} className="editor-grid">
            <section className="editor-card stack">
              <div className="field">
                <label htmlFor="title">Series title</label>
                <input
                  id="title"
                  name="title"
                  className="input"
                  placeholder="Foundations of Christian Community"
                  defaultValue={title}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="summary">Series summary</label>
                <textarea
                  id="summary"
                  name="summary"
                  className="textarea"
                  placeholder="Describe the overall journey and what learners should gain across the full sequence."
                  defaultValue={summary}
                  required
                />
              </div>

              <div className="subtle-panel">
                Study Series work like playlists: the parent series gives people
                a clear order, but each lesson below still keeps its own public
                page, search visibility, and printable handout.
              </div>
            </section>

            <section className="editor-card stack">
              <div className="stack-sm">
                <h2 className="section-title">Choose and sequence lessons</h2>
                <p className="body-copy">
                  Check the lessons you want, then give each one a unique step
                  number.
                </p>
              </div>

              <div className="stack">
                {plans.map((plan, index) => (
                  <label key={plan.id} className="series-lesson-row">
                    <div className="series-lesson-main">
                      <input
                        type="checkbox"
                        name="lessonIds"
                        value={plan.id}
                        defaultChecked={selectedLessons.has(plan.id)}
                      />
                      <div className="stack-xs">
                        <strong>{plan.title}</strong>
                        <span className="meta-text">
                          {plan.status} · {plan.durationMinutes} min
                        </span>
                        <span className="body-copy">{plan.summary}</span>
                      </div>
                    </div>

                    <div className="field series-position-field">
                      <label htmlFor={`position-${plan.id}`}>Step</label>
                      <input
                        id={`position-${plan.id}`}
                        name={`position:${plan.id}`}
                        type="number"
                        min="1"
                        className="input"
                        defaultValue={positions.get(plan.id) ?? String(index + 1)}
                      />
                    </div>
                  </label>
                ))}
              </div>

              <div className="inline-actions">
                <button type="submit" className="button">
                  Save series draft
                </button>
                <Link href="/dashboard" className="button-tertiary">
                  Cancel
                </Link>
              </div>
            </section>
          </form>
        )}
      </div>
    </section>
  );
}
