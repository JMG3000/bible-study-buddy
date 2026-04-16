import Link from "next/link";
import { formatDate } from "@/lib/lesson-plans";
import type { LessonPlan } from "@/lib/types";
import { ScripturePill } from "./scripture-pill";

export function PlanCard({ plan }: { plan: LessonPlan }) {
  const href =
    plan.status === "published" && plan.slug
      ? `/plans/${plan.slug}`
      : `/dashboard/plans/${plan.id}`;
  const visibleTags = [...new Set([...plan.topicTags, ...plan.customTags])].slice(0, 5);

  return (
    <article className="surface-card">
      <div className="meta-row">
        <span className={`status-pill ${plan.status}`}>{plan.status}</span>
        <span>{plan.durationMinutes} min</span>
        <span>Updated {formatDate(plan.updatedAt)}</span>
      </div>

      <div className="stack-sm">
        <h3 className="plan-card-title">{plan.title}</h3>
        <p className="plan-card-summary">{plan.summary}</p>
      </div>

      <div className="tag-list">
        {visibleTags.map((tag) => (
          <span key={tag} className="chip-muted">
            {tag}
          </span>
        ))}
      </div>

      <div className="chip-row">
        {plan.scriptures.map((scripture) => (
          <ScripturePill key={scripture.id} scripture={scripture} />
        ))}
      </div>

      <div className="plan-card-footer">
        {plan.status === "published" && plan.authorHandle ? (
          <Link href={`/plans?q=%40${plan.authorHandle}`} className="meta-text inline-link">
            Made by @{plan.authorHandle}
          </Link>
        ) : (
          <span className="meta-text">By {plan.authorName}</span>
        )}
        <Link href={href} className="button-tertiary">
          {plan.status === "published" ? "View lesson" : "Open editor"}
        </Link>
      </div>
    </article>
  );
}
