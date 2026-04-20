import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PlanCard } from "@/components/plan-card";
import { getCurrentViewer, getSavedPlans } from "@/lib/lesson-plans";
import { removeSavedPlanAction } from "./actions";

export const metadata: Metadata = {
  title: "Saved Lessons",
  description: "Private saved lesson list for the current user.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function SavedPlansPage() {
  const [viewer, savedPlans] = await Promise.all([
    getCurrentViewer(),
    getSavedPlans(),
  ]);

  return (
    <section className="section">
      <div className="shell stack">
        <div className="stack-sm">
          <span className="eyebrow">Private library</span>
          <h1 className="page-title">Saved plans</h1>
          <p className="lead">
            Keep the lessons you want to revisit close at hand.
          </p>
        </div>

        {viewer ? (
          savedPlans.length > 0 ? (
            <div className="card-grid">
              {savedPlans.map((plan) => (
                <div key={plan.id} className="stack-sm">
                  <PlanCard plan={plan} />
                  <form action={removeSavedPlanAction}>
                    <input type="hidden" name="lessonPlanId" value={plan.id} />
                    <input
                      type="hidden"
                      name="lessonPath"
                      value={plan.slug ? `/plans/${plan.slug}` : "/dashboard/saved"}
                    />
                    <button type="submit" className="button-secondary auth-button">
                      Remove from favorites
                    </button>
                  </form>
                </div>
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
            description="Saved plans are private to your account and only appear after you sign in."
          />
        )}
      </div>
    </section>
  );
}
