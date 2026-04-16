import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { ScripturePill } from "@/components/scripture-pill";
import { ScriptureTooltipEnhancer } from "@/components/scripture-tooltip-enhancer";
import {
  buildCanonicalUrl,
  formatDate,
  getLessonPlanBySlug,
} from "@/lib/lesson-plans";
import { serializeJsonLd } from "@/lib/json-ld";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const plan = await getLessonPlanBySlug(slug);

  if (!plan) {
    return {
      title: "Lesson not found",
    };
  }

  return {
    title: plan.title,
    description: plan.summary,
    alternates: {
      canonical: buildCanonicalUrl(slug),
    },
    openGraph: {
      title: plan.title,
      description: plan.summary,
      url: buildCanonicalUrl(slug),
      type: "article",
    },
  };
}

export default async function LessonPlanDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const plan = await getLessonPlanBySlug(slug);

  if (!plan) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    additionalType: "https://schema.org/LearningResource",
    name: plan.title,
    description: plan.summary,
    url: buildCanonicalUrl(slug),
    author: {
      "@type": "Person",
      name: plan.authorHandle ? `@${plan.authorHandle}` : plan.authorName,
    },
    timeRequired: `PT${plan.durationMinutes}M`,
    educationalLevel: plan.audienceTags.join(", "),
    learningResourceType: "Bible study lesson plan",
    about: [...plan.topicTags, ...plan.denominationTags],
    teaches: plan.teachingObjective,
  };

  return (
    <section className="detail-hero">
      <div className="shell stack">
        <div className="surface-card no-print">
          <div className="meta-row">
            <span className="status-pill published">Published</span>
            <span>{formatDate(plan.publishedAt)}</span>
            <span>{plan.durationMinutes} minutes</span>
          </div>
        </div>

        <div className="stack-sm">
          <span className="eyebrow">Printable lesson detail</span>
          <h1 className="detail-title">{plan.title}</h1>
          <p className="detail-summary">{plan.summary}</p>
          {plan.authorHandle ? (
            <Link href={`/plans?q=%40${plan.authorHandle}`} className="detail-author inline-link no-print">
              Made by @{plan.authorHandle}
            </Link>
          ) : null}
        </div>

        <div className="detail-grid">
          <div className="detail-main">
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: serializeJsonLd(jsonLd),
              }}
            />

            <div className="detail-section">
              <h2>Scripture focus</h2>
              <div className="detail-scriptures" style={{ marginTop: "0.85rem" }}>
                {plan.scriptures.map((scripture) => (
                  <ScripturePill key={scripture.id} scripture={scripture} />
                ))}
              </div>
              <p className="body-copy" style={{ marginTop: "1rem" }}>
                This detail page is ready for progressive-enhancement scripture
                tooltips. If no external provider is configured, the references
                still work as plain outbound Bible links.
              </p>
            </div>

            <div className="detail-section">
              <h2>Teaching objective</h2>
              <p className="body-copy">{plan.teachingObjective}</p>
            </div>

            {plan.openingPrayer ? (
              <div className="detail-section">
                <h2>Opening prayer</h2>
                <p className="body-copy">{plan.openingPrayer}</p>
              </div>
            ) : null}

            {plan.icebreaker ? (
              <div className="detail-section">
                <h2>Icebreaker</h2>
                <p className="body-copy">{plan.icebreaker}</p>
              </div>
            ) : null}

            <div className="detail-section">
              <h2>Discussion questions</h2>
              <ol className="numbered-list">
                {plan.discussionQuestions.map((question) => (
                  <li key={question} className="list-copy">
                    {question}
                  </li>
                ))}
              </ol>
            </div>

            <div className="detail-section">
              <h2>Activities and next steps</h2>
              <ul className="bullet-list">
                {plan.activities.map((activity) => (
                  <li key={activity} className="list-copy">
                    {activity}
                  </li>
                ))}
              </ul>
            </div>

            <div className="detail-section">
              <h2>Prayer prompts</h2>
              <ul className="bullet-list">
                {plan.prayerPrompts.map((prompt) => (
                  <li key={prompt} className="list-copy">
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>

            {plan.facilitatorNotes ? (
              <div className="detail-section">
                <h2>Facilitator notes</h2>
                <p className="body-copy">{plan.facilitatorNotes}</p>
              </div>
            ) : null}
          </div>

          <aside className="detail-sidebar-card surface-card">
            <div className="stack-sm no-print">
              <span className="chip-accent">Ready for the room</span>
              <PrintButton plan={plan} />
            </div>

            <div className="stack-sm">
              <h2 className="section-title">Session details</h2>
              <div className="tag-list">
                {[...new Set([...plan.topicTags, ...plan.customTags])].map((tag) => (
                  <span key={tag} className="chip-muted">
                    {tag}
                  </span>
                ))}
              </div>

              {plan.customTags.length > 0 ? (
                <div className="stack-sm">
                  <strong>Custom tags</strong>
                  <p className="body-copy">{plan.customTags.join(", ")}</p>
                </div>
              ) : null}

              <div className="stack-sm">
                <strong>Audience</strong>
                <p className="body-copy">{plan.audienceTags.join(", ")}</p>
              </div>

              <div className="stack-sm">
                <strong>Traditions</strong>
                <p className="body-copy">{plan.denominationTags.join(", ")}</p>
              </div>

              <div className="stack-sm">
                <strong>Materials</strong>
                <ul className="bullet-list">
                  {plan.materials.map((material) => (
                    <li key={material} className="list-copy">
                      {material}
                    </li>
                  ))}
                </ul>
              </div>

              {plan.handoutUrls.length > 0 ? (
                <div className="stack-sm">
                  <strong>Handouts</strong>
                  <ul className="bullet-list">
                    {plan.handoutUrls.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-link"
                        >
                          Download supporting handout
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <ScriptureTooltipEnhancer />
      </div>
    </section>
  );
}
