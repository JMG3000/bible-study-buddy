import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PlanCard } from "@/components/plan-card";
import { isSupabaseConfigured } from "@/lib/env";
import {
  getCurrentViewer,
  getDashboardPlans,
  getDashboardStudySeries,
} from "@/lib/lesson-plans";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description:
    "Draft and published lesson plans for the current creator account scaffold.",
};

export const dynamic = "force-dynamic";

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [viewer, plans, resolvedParams] = await Promise.all([
    getCurrentViewer(),
    getDashboardPlans(),
    searchParams,
  ]);
  const series = viewer ? await getDashboardStudySeries() : [];
  const supabaseReady = isSupabaseConfigured();
  const created = readValue(resolvedParams, "created") === "1";

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Creator workspace</span>
            <h1 className="page-title">Dashboard</h1>
            <p className="lead">
              Your draft, published, and unpublished lesson plans load from
              Supabase once authentication is connected.
            </p>
            {viewer ? (
              <p className="body-copy">
                Signed in as {viewer.displayName} with the handle @{viewer.handle}.
              </p>
            ) : null}
          </div>

          <div className="inline-actions">
            <Link href="/create" className="button">
              New draft
            </Link>
            <Link href="/dashboard/series/create" className="button-secondary">
              New series
            </Link>
          </div>
        </div>

        {!supabaseReady ? (
          <div className="helper-banner">
            Configure Supabase first, then connect auth to make this dashboard
            live.
          </div>
        ) : null}

        {created ? (
          <div className="helper-banner">
            Draft created successfully. You can now find it in your dashboard list.
          </div>
        ) : null}

        {viewer ? (
          <>
            <section className="surface-card stack-sm">
              <div className="stack-sm">
                <h2 className="section-title">Profile settings live separately</h2>
                <p className="body-copy">
                  Your public username and screen name now live in profile
                  settings, not on the dashboard. That keeps lesson management
                  separate from identity changes.
                </p>
              </div>

              <div className="inline-actions">
                <Link href="/settings/profile" className="button-secondary">
                  Open profile settings
                </Link>
              </div>
            </section>

            {viewer.role === "admin" ? (
              <section className="surface-card stack-sm">
                <div className="stack-sm">
                  <h2 className="section-title">Admin tools</h2>
                  <p className="body-copy">
                    Manage reported lessons and adjust account roles without
                    leaving the app.
                  </p>
                </div>

                <div className="inline-actions">
                  <Link href="/admin/reports" className="button-secondary">
                    Open moderation queue
                  </Link>
                  <Link href="/admin/users" className="button-secondary">
                    Manage users
                  </Link>
                </div>
              </section>
            ) : null}

            <section className="stack">
              <div className="section-head">
                <div className="stack-sm">
                  <span className="eyebrow">Study series</span>
                  <h2 className="section-title">Ordered lesson playlists</h2>
                </div>
                <Link href="/dashboard/series/create" className="button-tertiary">
                  Create a series
                </Link>
              </div>

              {series.length > 0 ? (
                <div className="three-column">
                  {series.map((entry) => (
                    <article key={entry.id} className="surface-card stack-sm">
                      <div className="meta-row">
                        <span className={`status-pill ${entry.status}`}>{entry.status}</span>
                        <span>{entry.lessonCount} parts</span>
                      </div>

                      <div className="stack-sm">
                        <h3 className="card-title">{entry.title}</h3>
                        <p className="body-copy">{entry.summary}</p>
                      </div>

                      <div className="inline-actions">
                        <Link
                          href={`/dashboard/series/${entry.id}`}
                          className="button-tertiary"
                        >
                          Open series
                        </Link>
                        {entry.slug ? (
                          <Link href={`/series/${entry.slug}`} className="button-tertiary">
                            View public series
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No study series yet"
                  description="Create a series when you want to group standalone lessons into a clear multi-part path."
                />
              )}
            </section>

            <section className="stack">
              <div className="section-head">
                <div className="stack-sm">
                  <span className="eyebrow">Standalone lessons</span>
                  <h2 className="section-title">Your lesson library</h2>
                </div>
                <Link href="/create" className="button-tertiary">
                  Create a lesson
                </Link>
              </div>

              {plans.length > 0 ? (
                <div className="card-grid">
                  {plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No lesson plans for this account yet"
                  description="Create your first draft after signing in to start building your lesson library."
                />
              )}
            </section>
          </>
        ) : (
          <EmptyState
            title="Sign in to open your dashboard"
            description="This route now reads from Supabase and only shows plans that belong to the current authenticated creator."
          />
        )}
      </div>
    </section>
  );
}
