import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentViewer } from "@/lib/lesson-plans";
import { updateProfileSettingsAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Profile Settings",
  description:
    "Manage your public username and screen name for Bible Study Buddy: Free.",
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

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [viewer, resolvedParams] = await Promise.all([
    getCurrentViewer(),
    searchParams,
  ]);
  const updated = readValue(resolvedParams, "updated") === "1";
  const error = readValue(resolvedParams, "error");

  if (!viewer) {
    redirect("/login");
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Profile settings</span>
            <h1 className="page-title">Creator identity</h1>
            <p className="lead">
              Keep one stable public username for search and one screen name for
              your workspace. This page is the only place creators can change
              either value.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>

        {updated ? (
          <div className="helper-banner">
            Your profile settings were updated successfully.
          </div>
        ) : null}

        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        <section className="surface-card stack-sm">
          <div className="stack-sm">
            <h2 className="section-title">Public username and screen name</h2>
            <p className="body-copy">
              Your public username is unique and appears on published lesson
              pages so people can search for your work. Your screen name is
              shown in your private workspace.
            </p>
          </div>

          <form action={updateProfileSettingsAction} className="stack-sm">
            <div className="field">
              <label htmlFor="displayName">Screen name</label>
              <input
                id="displayName"
                name="displayName"
                className="input"
                defaultValue={viewer.displayName}
                maxLength={80}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="handle">Public username</label>
              <div className="handle-input-group">
                <span className="handle-prefix">@</span>
                <input
                  id="handle"
                  name="handle"
                  className="input"
                  defaultValue={viewer.handle}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  maxLength={30}
                  required
                />
              </div>
            </div>

            <div className="subtle-panel">
              Public usernames can use lowercase letters, numbers, and hyphens.
              They stay unique across the whole site.
            </div>

            <div className="inline-actions">
              <button type="submit" className="button">
                Save profile settings
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}
