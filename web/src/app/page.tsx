import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PlanCard } from "@/components/plan-card";
import { getFeaturedPlans, getPublishedPlans } from "@/lib/lesson-plans";

export default async function HomePage() {
  const [featured, newest] = await Promise.all([
    getFeaturedPlans(),
    getPublishedPlans({ sort: "newest" }),
  ]);
  const publishedCount = newest.length;

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
              description="Published lessons will appear here as creators begin sharing them."
            />
          )}
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div className="stack-sm">
              <span className="eyebrow">Library highlights</span>
              <h2 className="section-title">Helpful tools already built into the library</h2>
            </div>
          </div>

          <div className="three-column">
            <div className="surface-card">
              <span className="chip-muted">1. Study Series</span>
              <h3 className="card-title">Guide people through multi-part journeys</h3>
              <p className="body-copy">
                Group standalone lessons into a clear sequence without losing
                the freedom to use each lesson on its own.
              </p>
            </div>
            <div className="surface-card">
              <span className="chip-muted">2. Favorites</span>
              <h3 className="card-title">Let people save the studies they love</h3>
              <p className="body-copy">
                Keep meaningful lessons close by and build a personal list for
                future gatherings.
              </p>
            </div>
            <div className="surface-card">
              <span className="chip-muted">3. Reporting</span>
              <h3 className="card-title">Create a clear path for care and moderation</h3>
              <p className="body-copy">
                Respectful reporting helps the public catalog stay helpful,
                welcoming, and trustworthy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
