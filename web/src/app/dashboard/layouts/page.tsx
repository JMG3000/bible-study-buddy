import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { formatDate, getCurrentViewer } from "@/lib/lesson-plans";
import { getLayoutTemplateLibrary } from "@/lib/layout-templates";
import type { LayoutTemplate } from "@/lib/types";

export const metadata: Metadata = {
  title: "Layout Library",
  description: "Browse shared lesson layouts and the draft templates tied to your account.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

function LayoutTemplateCard({
  template,
  emphasis,
}: {
  template: LayoutTemplate;
  emphasis: "published" | "draft";
}) {
  return (
    <article className="surface-card stack-sm">
      <div className="meta-row">
        <span
          className={`status-pill ${emphasis === "draft" ? "draft" : "published"}`}
        >
          {template.isSystem ? "built-in" : template.status}
        </span>
        <span>{template.sectionCount} sections</span>
        <span>{template.widgetCount} fields</span>
      </div>

      <div className="stack-sm">
        <h3 className="card-title">{template.title}</h3>
        <p className="body-copy">{template.summary}</p>
        <p className="meta-text">
          {template.isSystem
            ? "Shared by Bible Study Buddy"
            : template.authorHandle
              ? `Created by @${template.authorHandle}`
              : `Created by ${template.authorName}`}
        </p>
      </div>

      <div className="tag-list">
        {template.sections.map((section) => (
          <span key={section.id} className="chip-muted">
            {section.name}
          </span>
        ))}
      </div>

      <div className="subtle-panel stack-sm">
        {template.sections.map((section) => (
          <div key={section.id} className="meta-row">
            <span className="meta-text">{section.name}</span>
            <span>{section.widgetCount} fields</span>
          </div>
        ))}
      </div>

      <p className="meta-text">Updated {formatDate(template.updatedAt)}</p>
    </article>
  );
}

export default async function LayoutLibraryPage() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return (
      <section className="section">
        <div className="shell">
          <EmptyState
            title="Sign in to open the layout library"
            description="Open the shared layout library and the draft templates connected to your account."
          />
        </div>
      </section>
    );
  }

  const { publishedTemplates, draftTemplates } = await getLayoutTemplateLibrary(
    viewer.userId,
  );

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head">
          <div className="stack-sm">
            <span className="eyebrow">Layout templates</span>
            <h1 className="page-title">Layout Library</h1>
            <p className="lead">
              Browse the shared layout library and the draft template shapes tied to
              your account.
            </p>
          </div>

          <div className="inline-actions">
            <Link href="/dashboard" className="button-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>

        <section className="stack">
          <div className="section-head">
            <div className="stack-sm">
              <span className="eyebrow">Shared library</span>
              <h2 className="section-title">Published layouts</h2>
            </div>
          </div>

          {publishedTemplates.length > 0 ? (
            <div className="three-column">
              {publishedTemplates.map((template) => (
                <LayoutTemplateCard
                  key={template.id}
                  template={template}
                  emphasis="published"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No published layouts yet"
              description="Published layouts will appear here once the shared library is populated."
            />
          )}
        </section>

        <section className="stack">
          <div className="section-head">
            <div className="stack-sm">
              <span className="eyebrow">Your drafts</span>
              <h2 className="section-title">Draft template shapes</h2>
            </div>
          </div>

          {draftTemplates.length > 0 ? (
            <div className="three-column">
              {draftTemplates.map((template) => (
                <LayoutTemplateCard
                  key={template.id}
                  template={template}
                  emphasis="draft"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No draft layouts for this account yet"
              description="Your saved draft layouts will appear here as you start shaping new lesson formats."
            />
          )}
        </section>
      </div>
    </section>
  );
}
