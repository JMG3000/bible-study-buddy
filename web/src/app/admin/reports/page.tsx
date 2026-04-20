import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { isSupabaseConfigured } from "@/lib/env";
import {
  canManageUsersRole,
  canReviewReportsRole,
  getCurrentViewer,
  getOpenReports,
} from "@/lib/lesson-plans";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Moderation Reports",
  description:
    "Reviewer moderation queue for reviewing lesson-plan reports.",
};

export const dynamic = "force-dynamic";

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [viewer, items, resolvedParams] = await Promise.all([
    getCurrentViewer(),
    getOpenReports(),
    searchParams,
  ]);
  const supabaseReady = isSupabaseConfigured();
  const canManageUsers = viewer ? canManageUsersRole(viewer.role) : false;
  const canReview = viewer ? canReviewReportsRole(viewer.role) : false;
  const updated = readValue(resolvedParams, "updated");
  const error = readValue(resolvedParams, "error");

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Moderation surface</span>
            <h1 className="page-title">Moderation queue</h1>
            <p className="lead">
              Reports do not auto-hide content. Reviewers and admins can review,
              annotate, and open a focused creator conversation when a report is
              valid enough to discuss.
            </p>
          </div>

          {canManageUsers ? (
            <div className="inline-actions">
              <Link href="/admin/users" className="button-secondary">
                Manage users
              </Link>
            </div>
          ) : null}
        </div>

        {!supabaseReady ? (
          <div className="helper-banner">
            Configure Supabase and sign in as a reviewer or admin to load the live report
            queue.
          </div>
        ) : null}

        {updated ? <div className="helper-banner">{updated}</div> : null}
        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        {canReview ? (
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
                    <span>
                      Reported by {report.reporterName}
                      {report.reporterHandle ? ` (@${report.reporterHandle})` : ""}
                    </span>
                    {report.lessonAuthorHandle ? (
                      <span>Creator @{report.lessonAuthorHandle}</span>
                    ) : null}
                    {report.assignedReviewerHandle ? (
                      <span>Assigned @{report.assignedReviewerHandle}</span>
                    ) : null}
                  </div>
                  <div className="inline-actions">
                    <Link href={`/admin/reports/${report.id}`} className="button-secondary">
                      Review report
                    </Link>
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
            title="Reviewer access required"
            description="The moderation queue reads directly from Supabase and only loads for authenticated reviewer or admin accounts."
          />
        )}
      </div>
    </section>
  );
}
