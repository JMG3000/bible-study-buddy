import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PlanCard } from "@/components/plan-card";
import { isSupabaseConfigured } from "@/lib/env";
import { getFeaturedPlans, getPublishedPlans } from "@/lib/lesson-plans";

export default async function HomePage() {
  const [featured, newest] = await Promise.all([
    getFeaturedPlans(),
    getPublishedPlans({ sort: "newest" }),
  ]);
  const publishedCount = newest.length;
  const supabaseReady = isSupabaseConfigured();

  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Teaching toolkit for Christian hosts</span>
            <h1 className="display-title">
              Create, share, and print Bible study lessons that are ready for the room.
            </h1>
            <p className="lede">
              Bible Study Buddy: Free gives small-group leaders a structured
              lesson library with scripture-aware search, stable public pages,
              and a dashboard for drafting or publishing polished sessions.
            </p>

            <div className="inline-actions" style={{ marginTop: "1.6rem" }}>
              <Link href="/plans" className="button">
                Browse lesson plans
              </Link>
              <Link href="/create" className="button-secondary">
                Open the structured editor
              </Link>
            </div>

            <div className="stats-grid">
              <div className="stat-pill">
                <strong>{publishedCount}</strong>
                <span>Published lessons currently available</span>
              </div>
              <div className="stat-pill">
                <strong>Scripture-first</strong>
                <span>Normalized references and printable layouts</span>
              </div>
              <div className="stat-pill">
                <strong>Next + Supabase</strong>
                <span>Production-ready route and schema foundation</span>
              </div>
            </div>
          </div>

          <aside className="feature-panel">
            <div className="stack">
              <span className="chip-accent">What is implemented now</span>
              <h2 className="section-title">
                The scaffold already mirrors the approved architecture.
              </h2>
              <div className="stack-sm">
                <p className="body-copy">
                  Public catalog routes, print-ready detail pages, admin review
                  surfaces, Supabase SQL, and webhook revalidation are now
                  paired with a live Supabase read layer.
                </p>
                <div className="subtle-panel">
                  <div className="stack-sm">
                    <strong>Included in this baseline</strong>
                    <div className="tag-list">
                      <span className="chip">Structured authoring</span>
                      <span className="chip">JSON-LD ready</span>
                      <span className="chip">RLS migration</span>
                      <span className="chip">Cache webhooks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          {!supabaseReady ? (
            <div className="helper-banner">
              Add your Supabase environment variables in
              <span className="code-inline"> .env.local </span>
              to load live published lessons into the public catalog.
            </div>
          ) : null}

          <div className="section-head">
            <div className="stack-sm">
              <span className="eyebrow">Latest published lessons</span>
              <h2 className="section-title">Public plans that are ready to share</h2>
            </div>
            <Link href="/plans" className="button-tertiary">
              See the full catalog
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="card-grid">
              {featured.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No published lessons yet"
              description="Once lesson plans are published in Supabase, they will appear here automatically."
            />
          )}
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div className="stack-sm">
              <span className="eyebrow">Launch sequence</span>
              <h2 className="section-title">What the team can do next from here</h2>
            </div>
          </div>

          <div className="three-column">
            <div className="surface-card">
              <span className="chip-muted">1. Database</span>
              <h3 className="card-title">Apply the Supabase migration</h3>
              <p className="body-copy">
                The SQL migration defines the lesson, scripture, favorites, and
                moderation tables plus row-level security helpers.
              </p>
            </div>
            <div className="surface-card">
              <span className="chip-muted">2. Auth</span>
              <h3 className="card-title">Gate creator and admin routes</h3>
              <p className="body-copy">
                The app now reads from Supabase, so the next high-value step is
                protecting dashboard, saved, and moderation views with auth.
              </p>
            </div>
            <div className="surface-card">
              <span className="chip-muted">3. Mutations</span>
              <h3 className="card-title">Add save, publish, favorite, and report flows</h3>
              <p className="body-copy">
                The read model, schema, and cache invalidation path are in
                place; the remaining product work is wiring the write actions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
