import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PlanCard } from "@/components/plan-card";
import { updateHandleAction } from "@/app/dashboard/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentViewer, getDashboardPlans } from "@/lib/lesson-plans";
import { signOutAction } from "@/app/login/actions";

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
  const supabaseReady = isSupabaseConfigured();
  const created = readValue(resolvedParams, "created") === "1";
  const handleSaved = readValue(resolvedParams, "handle") === "saved";
  const handleError = readValue(resolvedParams, "handleError");

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
            <Link href="/" className="button-tertiary">
              Home
            </Link>
            <Link href="/plans" className="button-tertiary">
              Browse plans
            </Link>
            <Link href="/create" className="button">
              New draft
            </Link>
            {viewer ? (
              <form action={signOutAction}>
                <button type="submit" className="button-secondary">
                  Sign out
                </button>
              </form>
            ) : null}
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

        {handleSaved ? (
          <div className="helper-banner">
            Your public creator handle was updated successfully.
          </div>
        ) : null}

        {handleError ? (
          <div className="helper-banner" role="alert">
            {handleError}
          </div>
        ) : null}

        {viewer ? (
          <>
            <section className="surface-card stack-sm">
              <div className="stack-sm">
                <h2 className="section-title">Public creator handle</h2>
                <p className="body-copy">
                  Your handle appears on public lesson pages and lets people search
                  for the lessons you create.
                </p>
              </div>

              <form action={updateHandleAction} className="stack-sm">
                <div className="field">
                  <label htmlFor="handle">Handle</label>
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
                    />
                  </div>
                </div>

                <div className="inline-actions">
                  <button type="submit" className="button-secondary">
                    Save handle
                  </button>
                </div>
              </form>
            </section>

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
