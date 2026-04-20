import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import type { AdminUserSummary, UserRole } from "@/lib/types";
import {
  canManageUsersRole,
  getAdminUserSummaries,
  getCurrentViewer,
  isWebmasterSupremeRole,
} from "@/lib/lesson-plans";
import { resetUserMetricsAction, updateUserRoleAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "User Management",
  description: "Staff controls for managing Bible Study Buddy account roles.",
};

export const dynamic = "force-dynamic";

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

const ROLE_OPTIONS: Array<{ role: UserRole; label: string }> = [
  { role: "user", label: "User" },
  { role: "creator", label: "Creator" },
  { role: "reviewer", label: "Reviewer" },
  { role: "admin", label: "Admin" },
];

function formatRoleLabel(role: UserRole) {
  switch (role) {
    case "webmaster_supreme":
      return "Webmaster Supreme";
    case "reviewer":
      return "Reviewer";
    case "creator":
      return "Creator";
    case "admin":
      return "Admin";
    default:
      return "User";
  }
}

function countRole(users: AdminUserSummary[], role: UserRole) {
  return users.filter((user) => user.role === role).length;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [viewer, users, resolvedParams] = await Promise.all([
    getCurrentViewer(),
    getAdminUserSummaries(),
    searchParams,
  ]);
  const updated = readValue(resolvedParams, "updated");
  const error = readValue(resolvedParams, "error");

  if (!viewer) {
    redirect("/login");
  }

  const canManageUsers = canManageUsersRole(viewer.role);
  const isWebmaster = isWebmasterSupremeRole(viewer.role);

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Staff surface</span>
            <h1 className="page-title">User management</h1>
            <p className="lead">
              Keep the standard roles simple, then use Webmaster Supreme for the
              rare reset and recovery work that should stay above admin.
            </p>
          </div>

          {canManageUsers ? (
            <div className="inline-actions">
              <Link href="/admin/reports" className="button-secondary">
                Open moderation queue
              </Link>
            </div>
          ) : null}
        </div>

        {updated ? <div className="helper-banner">{updated}</div> : null}
        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        {canManageUsers ? (
          <>
            <section className="three-column">
              <article className="surface-card stack-xs">
                <span className="eyebrow">Webmaster Supreme</span>
                <strong className="card-title">
                  {countRole(users, "webmaster_supreme")}
                </strong>
                <p className="body-copy">
                  Above admin with reset-and-recovery permissions.
                </p>
              </article>
              <article className="surface-card stack-xs">
                <span className="eyebrow">Admins</span>
                <strong className="card-title">{countRole(users, "admin")}</strong>
                <p className="body-copy">Full access to moderation and role changes.</p>
              </article>
              <article className="surface-card stack-xs">
                <span className="eyebrow">Creators</span>
                <strong className="card-title">{countRole(users, "creator")}</strong>
                <p className="body-copy">People actively building or publishing lesson content.</p>
              </article>
              <article className="surface-card stack-xs">
                <span className="eyebrow">Reviewers</span>
                <strong className="card-title">{countRole(users, "reviewer")}</strong>
                <p className="body-copy">
                  Moderation-only access for reviewing reports without user management.
                </p>
              </article>
              <article className="surface-card stack-xs">
                <span className="eyebrow">Users</span>
                <strong className="card-title">{countRole(users, "user")}</strong>
                <p className="body-copy">Signed-in accounts that have not started lesson creation yet.</p>
              </article>
            </section>

            <section className="surface-card stack-sm">
              <h2 className="section-title">How these roles work right now</h2>
              <p className="body-copy">
                Webmaster Supreme sits above admin, carries every standard
                permission, and can reset user metrics and authored content.
                Admins can manage users and moderation. Reviewers can work the
                report queue without touching account roles. Creators are lesson
                authors, while users are signed-in members who have not created
                lesson content yet.
              </p>
            </section>

            <section className="admin-user-grid">
              {users.map((user) => (
                <article key={user.userId} className="surface-card stack-sm">
                  <div className="meta-row">
                    <span className="chip-accent">{formatRoleLabel(user.role)}</span>
                    <span>{user.lessonCount} lessons</span>
                    <span>{user.publishedLessonCount} published</span>
                    {user.isCurrentViewer ? <span>You</span> : null}
                  </div>

                  <div className="stack-xs">
                    <h2 className="section-title">{user.displayName}</h2>
                    <p className="body-copy">@{user.handle}</p>
                  </div>

                  <div className="meta-row">
                    <span>{user.lessonCount} total lessons</span>
                    <span>{user.draftLessonCount} drafts</span>
                    <span>{user.publishedLessonCount} published</span>
                  </div>

                  <div className="meta-row">
                    <span>{user.reportsCreatedCount} reports created</span>
                    <span>{user.reportsAgainstCount} reports against</span>
                    <span>{user.activeReportsAgainstCount} active against</span>
                  </div>

                  <div className="admin-role-actions">
                    {isWebmasterSupremeRole(user.role)
                      ? ROLE_OPTIONS.map((option) => (
                          <button
                            key={option.role}
                            type="button"
                            className="button"
                          >
                            {option.label} Now
                          </button>
                        ))
                      : ROLE_OPTIONS.map((option) => {
                          const isCurrentRole = option.role === user.role;
                          const disableRoleChange =
                            isCurrentRole ||
                            (user.isCurrentViewer && option.role !== "admin");

                          return (
                            <form key={option.role} action={updateUserRoleAction}>
                              <input type="hidden" name="userId" value={user.userId} />
                              <input type="hidden" name="role" value={option.role} />
                              <button
                                type="submit"
                                className={isCurrentRole ? "button" : "button-secondary"}
                                disabled={disableRoleChange}
                              >
                                {isCurrentRole
                                  ? `${option.label} Now`
                                  : `Make ${option.label}`}
                              </button>
                            </form>
                          );
                        })}
                  </div>

                  {isWebmaster ? (
                    <div className="admin-role-actions">
                      <form action={resetUserMetricsAction}>
                        <input type="hidden" name="userId" value={user.userId} />
                        <button type="submit" className="button-secondary">
                          Reset metrics and clear content
                        </button>
                      </form>
                    </div>
                  ) : null}

                  {user.isCurrentViewer ? (
                    <p className="meta-text">
                      {isWebmasterSupremeRole(user.role)
                        ? "This account is Webmaster Supreme. It is not assignable from the UI."
                        : "Your own account stays in its current staff lane here so you do not accidentally remove your access."}
                    </p>
                  ) : isWebmasterSupremeRole(user.role) ? (
                    <p className="meta-text">
                      Webmaster Supreme is a manual-only role and cannot be assigned from this page.
                    </p>
                  ) : null}
                </article>
              ))}
            </section>
          </>
        ) : (
          <EmptyState
            title="Staff access required"
            description="Only admin or Webmaster Supreme accounts can open the user management page."
          />
        )}
      </div>
    </section>
  );
}
