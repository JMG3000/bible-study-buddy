import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentViewer } from "@/lib/lesson-plans";
import { createBlankLayoutAction } from "../actions";

export const metadata: Metadata = {
  title: "Create a Layout",
  description: "Start a new lesson layout template draft.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function CreateLayoutPage() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    redirect("/login");
  }

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Layout builder</span>
            <h1 className="page-title">Create a new layout</h1>
            <p className="lead">
              Start with a simple editable structure, then shape the sections and
              fields for the kind of lesson you want to write.
            </p>
          </div>

          <Link href="/dashboard/layouts" className="button-secondary">
            Back to library
          </Link>
        </div>

        <section className="surface-card stack-sm">
          <h2 className="section-title">Blank layout draft</h2>
          <p className="body-copy">
            This creates a private draft layout with core lesson fields and one
            editable response section.
          </p>
          <form action={createBlankLayoutAction}>
            <button type="submit" className="button">
              Create blank layout
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
