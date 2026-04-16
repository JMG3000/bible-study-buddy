import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentViewer } from "@/lib/lesson-plans";
import { sanitizeNextPath } from "@/lib/urls";
import { signInWithOAuthAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in with OAuth to create and manage Bible study lesson drafts.",
};

export const dynamic = "force-dynamic";

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [viewer, resolvedParams] = await Promise.all([
    getCurrentViewer(),
    searchParams,
  ]);
  const nextPath = sanitizeNextPath(readValue(resolvedParams, "next"), "/dashboard");
  const error = readValue(resolvedParams, "error");

  if (viewer) {
    redirect(nextPath);
  }

  return (
    <section className="section">
      <div className="shell auth-shell">
        <div className="auth-card stack">
          <div className="stack-sm">
            <span className="eyebrow">Secure creator access</span>
            <h1 className="page-title">Sign in to create lesson drafts</h1>
            <p className="lead">
              Use your configured OAuth provider to unlock the structured editor,
              private dashboard, and creator-only routes.
            </p>
          </div>

          {error ? (
            <div className="helper-banner" role="alert">
              {error}
            </div>
          ) : null}

          <div className="stack-sm">
            <form action={signInWithOAuthAction}>
              <input type="hidden" name="provider" value="google" />
              <input type="hidden" name="next" value={nextPath} />
              <button type="submit" className="button auth-button">
                Continue with Google
              </button>
            </form>

            <form action={signInWithOAuthAction}>
              <input type="hidden" name="provider" value="github" />
              <input type="hidden" name="next" value={nextPath} />
              <button type="submit" className="button-secondary auth-button">
                Continue with GitHub
              </button>
            </form>
          </div>

          <div className="subtle-panel">
            After sign-in, you will return to{" "}
            <span className="code-inline">{nextPath}</span>. If a provider button
            fails, enable that provider in Supabase Auth first.
          </div>
        </div>
      </div>
    </section>
  );
}
