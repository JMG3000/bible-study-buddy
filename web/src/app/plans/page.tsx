import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PlanCard } from "@/components/plan-card";
import { bibleBooks } from "@/lib/bible-books";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublishedPlans } from "@/lib/lesson-plans";
import {
  audienceOptions,
  denominationOptions,
  durationOptions,
  topicOptions,
} from "@/lib/site";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Browse Lesson Plans",
  description:
    "Search published Bible study lesson plans by topic, audience, denomination, duration, or scripture book.",
};

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedParams = await searchParams;
  const filters = {
    q: readValue(resolvedParams, "q"),
    topic: readValue(resolvedParams, "topic"),
    audience: readValue(resolvedParams, "audience"),
    denomination: readValue(resolvedParams, "denomination"),
    book: readValue(resolvedParams, "book"),
    duration: readValue(resolvedParams, "duration"),
    sort:
      readValue(resolvedParams, "sort") === "relevance" ? "relevance" : "newest",
  } as const;

  const results = await getPublishedPlans(filters);
  const supabaseReady = isSupabaseConfigured();

  return (
    <section className="section">
      <div className="shell stack">
        <div className="stack-sm">
          <span className="eyebrow">Public catalog</span>
          <h1 className="page-title">Browse published lesson plans</h1>
          <p className="lead">
            Filter by topic, audience, denomination, duration, or scripture
            book. These results now come from Supabase using the production
            lesson-plan schema and scripture reference model.
          </p>
        </div>

        {!supabaseReady ? (
          <div className="helper-banner">
            Supabase is not configured yet, so this catalog cannot load live
            data. Add
            <span className="code-inline"> NEXT_PUBLIC_SUPABASE_URL </span>
            and
            <span className="code-inline"> NEXT_PUBLIC_SUPABASE_ANON_KEY </span>
            in
            <span className="code-inline"> .env.local </span>
            to activate it.
          </div>
        ) : null}

        <div className="search-layout">
          <aside className="surface-card filters-card no-print">
            <form className="filter-form" method="get">
              <div className="field">
                <label htmlFor="q">Keyword search</label>
                <input
                  className="input"
                  id="q"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="community, mercy, prayer, @creator..."
                />
              </div>

              <div className="field">
                <label htmlFor="topic">Topic</label>
                <select className="select" id="topic" name="topic" defaultValue={filters.topic}>
                  <option value="">All topics</option>
                  {topicOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="audience">Audience</label>
                <select
                  className="select"
                  id="audience"
                  name="audience"
                  defaultValue={filters.audience}
                >
                  <option value="">All audiences</option>
                  {audienceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="denomination">Denomination</label>
                <select
                  className="select"
                  id="denomination"
                  name="denomination"
                  defaultValue={filters.denomination}
                >
                  <option value="">All traditions</option>
                  {denominationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="book">Scripture book</label>
                <select className="select" id="book" name="book" defaultValue={filters.book}>
                  <option value="">Any book</option>
                  {bibleBooks.map((book) => (
                    <option key={book.slug} value={book.slug}>
                      {book.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="duration">Duration</label>
                <select
                  className="select"
                  id="duration"
                  name="duration"
                  defaultValue={filters.duration}
                >
                  <option value="">Any length</option>
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="sort">Sort</label>
                <select className="select" id="sort" name="sort" defaultValue={filters.sort}>
                  <option value="newest">Newest first</option>
                  <option value="relevance">Relevance</option>
                </select>
              </div>

              <div className="inline-actions">
                <button className="button" type="submit">
                  Apply filters
                </button>
                <Link className="button-secondary" href="/plans">
                  Reset
                </Link>
              </div>
            </form>
          </aside>

          <div className="results-stack">
            <div className="surface-card">
              <div className="meta-row">
                <span className="chip-accent">{results.length} results</span>
                <span>
                  Search by lesson topics, scripture focus, or a creator handle
                  like @biblestudyfriend.
                </span>
              </div>
            </div>

            {results.length > 0 ? (
              <div className="card-grid">
                {results.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No lessons matched those filters"
                description="Try removing one filter or searching by a broader topic such as prayer, community, or discipleship."
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
