import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PlanCard } from "@/components/plan-card";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentViewer, getDashboardPlans } from "@/lib/lesson-plans";

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description:
    "Draft and published lesson plans for the current creator account scaffold.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [viewer, plans] = await Promise.all([
    getCurrentViewer(),
    getDashboardPlans(),
  ]);
  const supabaseReady = isSupabaseConfigured();

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
          </div>

          <Link href="/create" className="button">
            New draft
          </Link>
        </div>

        {!supabaseReady ? (
          <div className="helper-banner">
            Configure Supabase first, then connect auth to make this dashboard
            live.
          </div>
        ) : null}

        {viewer ? (
          plans.length > 0 ? (
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
          )
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
