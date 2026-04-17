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
              Bible Study Buddy: Free helps believers prepare thoughtful Bible
              study gatherings, share lessons with confidence, and keep every
              session rooted in Scripture.
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
                <strong>Share with confidence</strong>
                <span>Draft lessons now and publish them for others next</span>
              </div>
            </div>
          </div>

          <aside className="feature-panel">
            <div className="stack">
              <span className="chip-accent">What you can do today</span>
              <h2 className="section-title">
                A simple place to prepare, review, and share Bible studies.
              </h2>
              <div className="stack-sm">
                <p className="body-copy">
                  Browse public lessons, print what you need for the room, and
                  start building your own lesson library one draft at a time.
                </p>
                <div className="subtle-panel">
                  <div className="stack-sm">
                    <strong>Included right now</strong>
                    <div className="tag-list">
                      <span className="chip">Structured drafting</span>
                      <span className="chip">Printable lessons</span>
                      <span className="chip">Shareable public pages</span>
                      <span className="chip">Study series playlists</span>
                      <span className="chip">Creator dashboard</span>
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
              <span className="eyebrow">What is coming next</span>
              <h2 className="section-title">The next steps for the product journey</h2>
            </div>
          </div>

          <div className="three-column">
            <div className="surface-card">
              <span className="chip-muted">1. Study Series</span>
              <h3 className="card-title">Guide people through multi-part journeys</h3>
              <p className="body-copy">
                Let creators bundle standalone lessons into a clear sequence
                without sacrificing individual lesson discovery or usefulness.
              </p>
            </div>
            <div className="surface-card">
              <span className="chip-muted">2. Favorites</span>
              <h3 className="card-title">Let people save the studies they love</h3>
              <p className="body-copy">
                Add a personal saved list so members can return to meaningful
                lessons and build a library for future gatherings.
              </p>
            </div>
            <div className="surface-card">
              <span className="chip-muted">3. Reporting</span>
              <h3 className="card-title">Create a clear path for care and moderation</h3>
              <p className="body-copy">
                Add reporting tools so the public catalog stays helpful, safe,
                and focused on serving people well.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
