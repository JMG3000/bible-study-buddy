import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import type { AdminUserSummary, UserRole } from "@/lib/types";
import { getAdminUserSummaries, getCurrentViewer } from "@/lib/lesson-plans";
import { updateUserRoleAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "User Management",
  description: "Admin controls for managing Bible Study Buddy account roles.",
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
  { role: "admin", label: "Admin" },
];

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

  const isAdmin = viewer.role === "admin";

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Admin surface</span>
            <h1 className="page-title">User management</h1>
            <p className="lead">
              Start with three roles: admin, creator, and user. Admins can
              adjust roles here without opening SQL or Supabase.
            </p>
          </div>

          {isAdmin ? (
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

        {isAdmin ? (
          <>
            <section className="three-column">
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
                <span className="eyebrow">Users</span>
                <strong className="card-title">{countRole(users, "user")}</strong>
                <p className="body-copy">Signed-in accounts that have not started lesson creation yet.</p>
              </article>
            </section>

            <section className="surface-card stack-sm">
              <h2 className="section-title">How these roles work right now</h2>
              <p className="body-copy">
                Admin is the only role with extra permissions today. Creator and
                user share the same product access for now, but creator is the
                working label for lesson authors as this system grows.
              </p>
            </section>

            <section className="admin-user-grid">
              {users.map((user) => (
                <article key={user.userId} className="surface-card stack-sm">
                  <div className="meta-row">
                    <span className="chip-accent">{user.role}</span>
                    <span>{user.lessonCount} lessons</span>
                    <span>{user.publishedLessonCount} published</span>
                    {user.isCurrentViewer ? <span>You</span> : null}
                  </div>

                  <div className="stack-xs">
                    <h2 className="section-title">{user.displayName}</h2>
                    <p className="body-copy">@{user.handle}</p>
                  </div>

                  <div className="admin-role-actions">
                    {ROLE_OPTIONS.map((option) => {
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
                            {isCurrentRole ? `${option.label} now` : `Make ${option.label}`}
                          </button>
                        </form>
                      );
                    })}
                  </div>

                  {user.isCurrentViewer ? (
                    <p className="meta-text">
                      Your own account stays admin from this page so you do not
                      accidentally remove your access.
                    </p>
                  ) : null}
                </article>
              ))}
            </section>
          </>
        ) : (
          <EmptyState
            title="Admin access required"
            description="Only admin accounts can open the user management page."
          />
        )}
      </div>
    </section>
  );
}
