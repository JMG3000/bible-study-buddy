import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PlanCard } from "@/components/plan-card";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentViewer, getSavedPlans } from "@/lib/lesson-plans";

export const metadata: Metadata = {
  title: "Saved Lessons",
  description: "Private saved lesson list for the current user scaffold.",
};

export const dynamic = "force-dynamic";

export default async function SavedPlansPage() {
  const [viewer, savedPlans] = await Promise.all([
    getCurrentViewer(),
    getSavedPlans(),
  ]);
  const supabaseReady = isSupabaseConfigured();

  return (
    <section className="section">
      <div className="shell stack">
        <div className="stack-sm">
          <span className="eyebrow">Private library</span>
          <h1 className="page-title">Saved plans</h1>
          <p className="lead">
            Favorites are modeled as a private user-to-plan relationship in the
            schema and now load from Supabase for the current authenticated
            account.
          </p>
        </div>

        {!supabaseReady ? (
          <div className="helper-banner">
            Configure Supabase and sign in to see private saved lessons here.
          </div>
        ) : null}

        {viewer ? (
          savedPlans.length > 0 ? (
            <div className="card-grid">
              {savedPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No saved lessons yet"
              description="Favorite a published lesson and it will show up here for quick access."
            />
          )
        ) : (
          <EmptyState
            title="Sign in to see saved lessons"
            description="Saved plans are private per user, so this view only loads for the current authenticated account."
          />
        )}
      </div>
    </section>
  );
}
