import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmptyState } from "@/components/empty-state";
import type { AdminUserSummary, UserRole } from "@/lib/types";
import {
  canManageUsersRole,
  getAdminUserSummaries,
  getCurrentViewer,
  isWebmasterSupremeRole,
} from "@/lib/lesson-plans";
import { runWebmasterControlAction, updateUserRoleAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "User Management",
  description: "Staff controls for managing Bible Study Buddy account roles.",
  robots: {
    index: false,
    follow: false,
  },
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

const ROLE_DISPLAY_LEVEL: Record<UserRole, number> = {
  user: 1,
  creator: 2,
  reviewer: 3,
  admin: 4,
  webmaster_supreme: 4,
};

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

function getVisibleRoleStates(userRole: UserRole) {
  const level = ROLE_DISPLAY_LEVEL[userRole];
  return ROLE_OPTIONS.filter((option) => ROLE_DISPLAY_LEVEL[option.role] <= level);
}

function getManageableRoleOptions(viewerRole: UserRole, targetRole: UserRole) {
  if (isWebmasterSupremeRole(targetRole)) {
    return [] as typeof ROLE_OPTIONS;
  }

  const viewerLevel = ROLE_DISPLAY_LEVEL[viewerRole];
  return ROLE_OPTIONS.filter((option) => ROLE_DISPLAY_LEVEL[option.role] <= viewerLevel);
}

function formatWebmasterActionLabel(actionKind: string, handle: string) {
  switch (actionKind) {
    case "clear_drafts":
      return `Clear drafts for @${handle}?`;
    case "clear_published_lessons":
      return `Clear published lessons for @${handle}?`;
    case "clear_unpublished_lessons":
      return `Clear unpublished lessons for @${handle}?`;
    case "clear_study_series":
      return `Clear study series for @${handle}?`;
    case "clear_reports_created":
      return `Clear reports created by @${handle}?`;
    case "clear_reports_against":
      return `Clear reports against @${handle}?`;
    default:
      return `Clear saved favorites for @${handle}?`;
  }
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
                permission, and can clear specific metrics or content without
                opening the database directly.
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
                    {getVisibleRoleStates(user.role).map((option) => (
                      <button key={option.role} type="button" className="button">
                        {option.label} Now
                      </button>
                    ))}
                  </div>

                  {canManageUsers ? (
                    <div className="admin-role-actions">
                      {getManageableRoleOptions(viewer.role, user.role).map((option) => {
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
                  ) : null}

                  {isWebmasterSupremeRole(user.role) ? (
                    <p className="meta-text">
                      Webmaster Supreme sits above the standard role ladder and is assigned manually.
                    </p>
                  ) : null}

                  {isWebmaster ? (
                    <section className="subtle-panel stack-sm">
                      <div className="stack-xs">
                        <span className="eyebrow">Webmaster Supreme</span>
                        <h3 className="card-title">Recovery controls</h3>
                        <p className="body-copy">
                          Clear only the lessons, reports, or saved items you mean to reset.
                        </p>
                      </div>

                      <div className="admin-role-actions">
                        <form action={runWebmasterControlAction}>
                          <input type="hidden" name="userId" value={user.userId} />
                          <input type="hidden" name="actionKind" value="clear_drafts" />
                          <ConfirmSubmitButton
                            type="submit"
                            className="button-secondary"
                            confirmMessage={formatWebmasterActionLabel("clear_drafts", user.handle)}
                          >
                            Clear drafts
                          </ConfirmSubmitButton>
                        </form>
                        <form action={runWebmasterControlAction}>
                          <input type="hidden" name="userId" value={user.userId} />
                          <input
                            type="hidden"
                            name="actionKind"
                            value="clear_published_lessons"
                          />
                          <ConfirmSubmitButton
                            type="submit"
                            className="button-secondary"
                            confirmMessage={formatWebmasterActionLabel(
                              "clear_published_lessons",
                              user.handle,
                            )}
                          >
                            Clear published
                          </ConfirmSubmitButton>
                        </form>
                        <form action={runWebmasterControlAction}>
                          <input type="hidden" name="userId" value={user.userId} />
                          <input
                            type="hidden"
                            name="actionKind"
                            value="clear_unpublished_lessons"
                          />
                          <ConfirmSubmitButton
                            type="submit"
                            className="button-secondary"
                            confirmMessage={formatWebmasterActionLabel(
                              "clear_unpublished_lessons",
                              user.handle,
                            )}
                          >
                            Clear unpublished
                          </ConfirmSubmitButton>
                        </form>
                        <form action={runWebmasterControlAction}>
                          <input type="hidden" name="userId" value={user.userId} />
                          <input type="hidden" name="actionKind" value="clear_study_series" />
                          <ConfirmSubmitButton
                            type="submit"
                            className="button-secondary"
                            confirmMessage={formatWebmasterActionLabel(
                              "clear_study_series",
                              user.handle,
                            )}
                          >
                            Clear series
                          </ConfirmSubmitButton>
                        </form>
                        <form action={runWebmasterControlAction}>
                          <input type="hidden" name="userId" value={user.userId} />
                          <input
                            type="hidden"
                            name="actionKind"
                            value="clear_reports_created"
                          />
                          <ConfirmSubmitButton
                            type="submit"
                            className="button-secondary"
                            confirmMessage={formatWebmasterActionLabel(
                              "clear_reports_created",
                              user.handle,
                            )}
                          >
                            Clear reports created
                          </ConfirmSubmitButton>
                        </form>
                        <form action={runWebmasterControlAction}>
                          <input type="hidden" name="userId" value={user.userId} />
                          <input
                            type="hidden"
                            name="actionKind"
                            value="clear_reports_against"
                          />
                          <ConfirmSubmitButton
                            type="submit"
                            className="button-secondary"
                            confirmMessage={formatWebmasterActionLabel(
                              "clear_reports_against",
                              user.handle,
                            )}
                          >
                            Clear reports against
                          </ConfirmSubmitButton>
                        </form>
                        <form action={runWebmasterControlAction}>
                          <input type="hidden" name="userId" value={user.userId} />
                          <input
                            type="hidden"
                            name="actionKind"
                            value="clear_saved_favorites"
                          />
                          <ConfirmSubmitButton
                            type="submit"
                            className="button-secondary"
                            confirmMessage={formatWebmasterActionLabel(
                              "clear_saved_favorites",
                              user.handle,
                            )}
                          >
                            Clear favorites
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </section>
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
