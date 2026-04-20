import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentViewer, getOpenReports } from "@/lib/lesson-plans";

export const metadata: Metadata = {
  title: "Moderation Reports",
  description:
    "Admin moderation queue scaffold for reviewing lesson-plan reports.",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [viewer, items] = await Promise.all([
    getCurrentViewer(),
    getOpenReports(),
  ]);
  const supabaseReady = isSupabaseConfigured();
  const isAdmin = viewer?.role === "admin";

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Admin surface</span>
            <h1 className="page-title">Moderation queue</h1>
            <p className="lead">
              Reports do not auto-hide content. Admins review, annotate, and
              decide whether a lesson plan should remain published or move to an
              unpublished state.
            </p>
          </div>

          {isAdmin ? (
            <div className="inline-actions">
              <Link href="/admin/users" className="button-secondary">
                Manage users
              </Link>
            </div>
          ) : null}
        </div>

        {!supabaseReady ? (
          <div className="helper-banner">
            Configure Supabase and sign in as an admin to load the live report
            queue.
          </div>
        ) : null}

        {isAdmin ? (
          items.length > 0 ? (
            <div className="stack">
              {items.map((report) => (
                <article key={report.id} className="report-card">
                  <div className="meta-row">
                    <span className="chip-accent">{report.status}</span>
                    <span>{report.reason}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString("en-US")}</span>
                  </div>
                  <h2 className="section-title">{report.lessonPlanTitle}</h2>
                  <p className="body-copy">{report.details}</p>
                  <div className="meta-row">
                    <span>Reported by {report.reporterName}</span>
                    <span>Next action: review and annotate</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No open moderation reports"
              description="This queue will populate when authenticated users report published lesson plans."
            />
          )
        ) : (
          <EmptyState
            title="Admin access required"
            description="The moderation queue now reads directly from Supabase and only loads for authenticated admin users."
          />
        )}
      </div>
    </section>
  );
}
