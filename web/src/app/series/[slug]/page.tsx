import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  buildCanonicalUrl,
  buildStudySeriesCanonicalUrl,
  formatDate,
  getPublishedStudySeriesBySlug,
} from "@/lib/lesson-plans";
import { serializeJsonLd } from "@/lib/json-ld";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getPublishedStudySeriesBySlug(slug);

  if (!series) {
    return {
      title: "Study series not found",
    };
  }

  return {
    title: `${series.title} Series`,
    description: series.summary,
    alternates: {
      canonical: buildStudySeriesCanonicalUrl(slug),
    },
    openGraph: {
      title: `${series.title} Series`,
      description: series.summary,
      url: buildStudySeriesCanonicalUrl(slug),
      type: "article",
    },
  };
}

export default async function StudySeriesPage({ params }: PageProps) {
  const { slug } = await params;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const series = await getPublishedStudySeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: series.title,
    description: series.summary,
    url: buildStudySeriesCanonicalUrl(slug),
    numberOfItems: series.lessonCount,
    itemListElement: series.lessons.map((lesson) => ({
      "@type": "ListItem",
      position: lesson.position,
      url: lesson.plan.slug ? buildCanonicalUrl(lesson.plan.slug) : undefined,
      name: lesson.plan.title,
    })),
  };

  return (
    <section className="section">
      <div className="shell stack">
        <div className="surface-card stack">
          <div className="meta-row">
            <span className="status-pill published">Study Series</span>
            <span>{series.lessonCount} parts</span>
            <span>{formatDate(series.publishedAt)}</span>
          </div>

          <div className="stack-sm">
            <span className="eyebrow">Ordered lesson path</span>
            <h1 className="page-title">{series.title}</h1>
            <p className="lead">{series.summary}</p>
            {series.authorHandle ? (
              <p className="body-copy">
                Curated by{" "}
                <Link href={`/plans?q=%40${series.authorHandle}`} className="inline-link">
                  @{series.authorHandle}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="subtle-panel">
            Each lesson in this series still stands on its own, so people can
            discover, print, and teach any part independently.
          </div>
        </div>

        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(jsonLd),
          }}
        />

        <div className="stack">
          {series.lessons.map((entry) => (
            <article key={entry.lessonPlanId} className="surface-card stack-sm">
              <div className="meta-row">
                <span className="chip-accent">Part {entry.position}</span>
                <span>{entry.plan.durationMinutes} minutes</span>
                <span>{entry.plan.audienceTags.join(", ")}</span>
              </div>

              <div className="stack-sm">
                <h2 className="section-title">{entry.plan.title}</h2>
                <p className="body-copy">{entry.plan.summary}</p>
              </div>

              <div className="tag-list">
                {[...new Set([...entry.plan.topicTags, ...entry.plan.customTags])]
                  .slice(0, 5)
                  .map((tag) => (
                    <span key={tag} className="chip-muted">
                      {tag}
                    </span>
                  ))}
              </div>

              <div className="inline-actions">
                {entry.plan.slug ? (
                  <Link href={`/plans/${entry.plan.slug}`} className="button-tertiary">
                    Open lesson
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
