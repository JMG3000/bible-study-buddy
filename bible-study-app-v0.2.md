# Bible Study Lesson Plan App v1 Blueprint

## Summary
- Build a responsive `Next.js` web app for anonymous browsing and authenticated lesson-plan creation.
- Use `Supabase` for Postgres, Auth, Storage, RLS, and Database Webhooks; deploy on `Vercel`.
- Treat scripture references as structured, canonical OSIS data from day one; do not allow free-text scripture entry.
- Keep public pages fast and SEO-friendly with event-driven revalidation instead of timed cache expiry.
- Limit v1 community scope to favorites/saves and reporting; exclude comments, ratings, and private group collaboration.

## Implementation Changes
### Data model and interfaces
- Create `lesson_plans` with `id`, `slug`, `author_id`, `status`, `title`, `summary`, `teaching_objective`, `duration_minutes`, structured teaching sections, and curated tag arrays for topic, audience, and denomination.
- Create `scripture_refs` as a child table with one row per passage: `lesson_plan_id`, `sequence`, `osis_id`, `book_code`, `chapter_start`, `verse_start`, `chapter_end`, `verse_end`, `sort_start`, `sort_end`, and generated `display_label`.
- Make OSIS the canonical internal reference format; support USFM only via future import/export adapters, not dual storage in v1.
- Use structured authoring controls for scripture: book selector plus chapter/verse inputs. The UI generates OSIS ids and display labels automatically.
- Keep public routes at `/`, `/plans`, and `/plans/[slug]`; keep authenticated authoring at `/create`, `/dashboard/plans/[id]`, `/dashboard/saved`, and moderation at `/admin/reports`.

### Search, performance, and cache
- Add `lesson_plans.search_tsv` as a generated stored `tsvector` column using PostgreSQL full-text search with `english` configuration and a `GIN` index.
- Limit FTS to lesson-plan content fields and curated tag text; do not use FTS for scripture matching.
- Index scripture lookup separately on `scripture_refs` using `book_code`, `sort_start`, and `sort_end` so reference overlap queries stay relational and fast.
- Do not calculate live facet counts on every search request in v1. Show filters without counts, or source homepage/category counts from a refreshable summary table updated only on publish-state changes.
- Replace timed ISR with a signed Next.js revalidation endpoint triggered by Supabase Database Webhooks on publish, unpublish, slug change, and moderation status change. Revalidate `/`, `/plans`, and the affected `/plans/[slug]`.

### UX and content delivery
- Allow anyone to browse and print published plans; require sign-in to create, save, publish, and report.
- Add client-side scripture tooltips through a third-party embed library so verse text can appear on hover/click without storing licensed Bible text locally.
- Treat the tooltip as progressive enhancement: if the script fails, render plain normalized references with external links and keep the page usable.
- Add print-specific CSS on lesson detail pages to remove navigation, expand structured sections, preserve readable page breaks, and produce clean offline handouts for classroom use.
- Keep lesson detail pages SEO-first and cacheable, with structured metadata and stable shareable slugs.

### Delivery order
1. Auth, schema, RLS, and structured scripture-reference components.
2. Draft/publish lesson-plan CRUD with validation and slug generation.
3. Public catalog, FTS search, scripture filters, and lesson detail pages.
4. Webhook-driven revalidation for public cache accuracy.
5. Favorites, reporting, admin moderation, print styles, and scripture tooltip enhancement.

## Test Plan
- Validate scripture authoring: OSIS ids are generated correctly, malformed ranges are rejected, and multiple passages per lesson plan are supported.
- Verify search correctness and performance: FTS returns ranked published plans, scripture filters match book/chapter/verse overlap, and indexes are used for hot queries.
- Verify cache behavior: publish, unpublish, and moderation events trigger revalidation promptly and stale public pages are not served after webhook completion.
- Verify permissions: drafts never appear publicly, creators can edit only their own content, and admins can review and unpublish reported plans.
- Verify UX polish: print preview strips UI chrome and preserves lesson readability, while scripture tooltips load progressively and fail gracefully.

## Assumptions and Defaults
- Canonical scripture storage is OSIS; USFM compatibility is deferred to adapter boundaries.
- V1 is English-only and uses PostgreSQL `english` text-search configuration.
- Each scripture reference row supports a single-book range; multi-book lessons are represented by multiple reference rows.
- The app does not license or persist Bible text locally in v1.
- Live facet counts are intentionally excluded from search-result queries to protect database performance.
