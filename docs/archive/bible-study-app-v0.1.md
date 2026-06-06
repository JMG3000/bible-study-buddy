# Bible Study Lesson Plan App

## Summary
Build a greenfield responsive web app for a broad Christian audience to create, share, and browse pre-made Bible study lesson plans. The first release should prioritize:
- Public discovery with anonymous browsing and SEO-friendly lesson pages
- Signed-in authoring with private drafts and one-click publishing
- Structured lesson-plan templates so plans are searchable, comparable, and reusable
- Basic community utility via favorites/saves and abuse reporting
- Lightweight moderation through post-publish reporting and an admin review queue

## Implementation Changes
### Product and UX
- Ship a responsive web app with five primary surfaces: home/discovery, search results, lesson-plan detail, creator dashboard, and admin moderation.
- Use a structured lesson-plan editor with required core fields: title, summary, scripture passage(s), target audience, duration, topic tags, denomination tags, teaching objective, discussion questions, facilitator notes, and publish status.
- Allow optional fields for icebreakers, activities, materials, prayer prompts, and downloadable handout links.
- Support anonymous browsing of published plans; require sign-in to create, edit, publish, favorite, and report.
- Keep v1 community scope limited to favorites/saves and reporting; exclude comments, ratings, messaging, and private group collaboration.

### Technical approach
- Implement with `Next.js` (App Router, TypeScript) for SSR/SEO, `Supabase` for PostgreSQL, auth, storage, and row-level security, and deploy on `Vercel`.
- Model content around `lesson_plans`, `lesson_plan_tags`, `favorites`, `reports`, and `profiles`; use slugs for public URLs and soft-delete/unpublish states for moderation.
- Use keyword search plus faceted filters for scripture, topic, age group, denomination, duration, and format.
- Add an admin-only moderation queue where flagged content can be reviewed, unpublished, or restored.
- Use server actions or route handlers for create/update/publish/favorite/report flows; keep the public catalog cacheable and indexable.

### Delivery order
1. Scaffold auth, DB schema, roles, and routing.
2. Build lesson-plan CRUD with draft/publish workflow.
3. Build public catalog, search, filters, and plan detail pages.
4. Add favorites, reporting, and admin moderation.
5. Add polish: SEO metadata, empty states, validation, analytics, and launch readiness.

## Public APIs, Interfaces, and Types
- Public pages:
  - `/` for featured/recent lesson plans and browse entry points
  - `/plans` for search and filtered browsing
  - `/plans/[slug]` for public lesson-plan detail
  - `/create` and `/dashboard/plans/[id]` for authoring
  - `/dashboard/saved` for favorites
  - `/admin/reports` for moderation
- Core types:
  - `UserRole = creator | admin`
  - `LessonPlanStatus = draft | published | flagged | unpublished`
  - `LessonPlan` with structured fields for metadata, teaching content, taxonomy tags, author, timestamps, and slug
  - `Report` with reason, reporter, target plan, status, and moderator notes
- Search/filter contract:
  - Query params for `q`, `topic`, `scripture`, `audience`, `denomination`, `duration`, and sort order
  - Published-only results for public users; creators can see their own drafts in dashboard views
- Auth rules:
  - Anonymous users can browse published plans only
  - Creators can manage only their own plans and favorites
  - Admins can review reports and change moderation status

## Test Plan
- Auth and permissions:
  - Anonymous user can browse published plans but cannot create/save/report without sign-in
  - Creator cannot edit or moderate another creator’s content
  - Admin can access moderation tools and update flagged content
- Lesson-plan lifecycle:
  - Create draft, validate required fields, publish, unpublish, and edit published plans
  - Slug generation stays unique and stable enough for sharing links
- Discovery:
  - Keyword search returns relevant plans
  - Filters combine correctly across denomination, topic, audience, and duration
  - Public detail pages render SEO metadata and canonical shareable URLs
- Community safety:
  - Favorite/save toggles persist per user
  - Reporting creates reviewable admin records without exposing reporter identity publicly
  - Admin moderation removes flagged content from public browsing when unpublished
- Data safety:
  - Row-level security blocks unauthorized reads/writes
  - Drafts are never exposed in public queries or sitemaps

## Assumptions and Defaults
- Greenfield build with no existing codebase constraints.
- Broad Christian positioning with tags rather than denomination-specific workflows.
- English-first launch, with no multilingual support in v1.
- No payments, subscriptions, live teaching sessions, native mobile apps, or comment threads in v1.
- Media support is limited to basic attachments/links; rich collaborative editing and printable export can be phase-two work.
