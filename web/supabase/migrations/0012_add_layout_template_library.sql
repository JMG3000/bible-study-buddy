create or replace function public.layout_templates_search_tsv()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'A');

  return new;
end;
$$;

create table public.layout_templates (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(user_id) on delete set null,
  source_template_id uuid references public.layout_templates(id) on delete set null,
  slug text,
  status public.lesson_plan_status not null default 'draft',
  is_system boolean not null default false,
  title text not null,
  summary text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  search_tsv tsvector not null default ''::tsvector,
  check ((status <> 'published') or slug is not null),
  check (
    (is_system and author_id is null)
    or ((not is_system) and author_id is not null)
  )
);

create table public.layout_template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.layout_templates(id) on delete cascade,
  position smallint not null check (position >= 1 and position <= 24),
  key text not null,
  name text not null,
  description text not null default '',
  is_static boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (template_id, id),
  unique (template_id, position),
  unique (template_id, key)
);

create table public.layout_template_widgets (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  section_id uuid not null,
  position smallint not null check (position >= 1 and position <= 48),
  kind text not null check (
    kind in (
      'text',
      'textarea',
      'number',
      'scripture_selector',
      'question_list',
      'activity_list',
      'checkbox_list',
      'tag_group',
      'text_list'
    )
  ),
  field_key text not null,
  label text not null,
  description text not null default '',
  placeholder text not null default '',
  is_required boolean not null default false,
  is_removable boolean not null default true,
  supports_multiple boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (template_id, section_id)
    references public.layout_template_sections(template_id, id)
    on delete cascade,
  unique (section_id, position),
  unique (template_id, field_key)
);

create unique index layout_templates_slug_uq
  on public.layout_templates (slug)
  where slug is not null;

create index layout_templates_author_updated_idx
  on public.layout_templates (author_id, updated_at desc);

create index layout_templates_status_published_idx
  on public.layout_templates (status, published_at desc);

create index layout_templates_search_tsv_gin
  on public.layout_templates using gin (search_tsv);

create index layout_template_sections_template_idx
  on public.layout_template_sections (template_id, position);

create index layout_template_widgets_template_idx
  on public.layout_template_widgets (template_id, section_id, position);

create trigger layout_templates_set_updated_at
before update on public.layout_templates
for each row execute function public.set_updated_at();

create trigger layout_templates_set_first_published_at
before update on public.layout_templates
for each row execute function public.set_first_published_at();

create trigger layout_templates_lock_slug_after_publish
before update on public.layout_templates
for each row execute function public.lock_slug_after_publish();

create trigger layout_templates_search_tsv_update
before insert or update on public.layout_templates
for each row execute function public.layout_templates_search_tsv();

alter table public.layout_templates enable row level security;
alter table public.layout_template_sections enable row level security;
alter table public.layout_template_widgets enable row level security;

create policy "layout_templates_select_authenticated"
on public.layout_templates
for select
using (
  auth.role() = 'authenticated'
  and (
    status = 'published'
    or auth.uid() = author_id
    or public.is_admin()
  )
);

create policy "layout_templates_insert_owner"
on public.layout_templates
for insert
with check (
  auth.uid() = author_id
  and status = 'draft'
  and not is_system
);

create policy "layout_templates_update_draft_owner_or_admin"
on public.layout_templates
for update
using (
  public.is_admin()
  or (
    auth.uid() = author_id
    and status = 'draft'
    and not is_system
  )
)
with check (
  public.is_admin()
  or (
    auth.uid() = author_id
    and status = 'draft'
    and not is_system
  )
);

create policy "layout_templates_delete_owner_or_admin"
on public.layout_templates
for delete
using (
  public.is_admin()
  or (
    auth.uid() = author_id
    and not is_system
  )
);

create policy "layout_template_sections_select_visible_parent"
on public.layout_template_sections
for select
using (
  exists (
    select 1
    from public.layout_templates t
    where t.id = template_id
      and auth.role() = 'authenticated'
      and (
        t.status = 'published'
        or t.author_id = auth.uid()
        or public.is_admin()
      )
  )
);

create policy "layout_template_sections_mutate_writable_parent"
on public.layout_template_sections
for all
using (
  exists (
    select 1
    from public.layout_templates t
    where t.id = template_id
      and (
        public.is_admin()
        or (
          t.author_id = auth.uid()
          and t.status = 'draft'
          and not t.is_system
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.layout_templates t
    where t.id = template_id
      and (
        public.is_admin()
        or (
          t.author_id = auth.uid()
          and t.status = 'draft'
          and not t.is_system
        )
      )
  )
);

create policy "layout_template_widgets_select_visible_parent"
on public.layout_template_widgets
for select
using (
  exists (
    select 1
    from public.layout_templates t
    where t.id = template_id
      and auth.role() = 'authenticated'
      and (
        t.status = 'published'
        or t.author_id = auth.uid()
        or public.is_admin()
      )
  )
);

create policy "layout_template_widgets_mutate_writable_parent"
on public.layout_template_widgets
for all
using (
  exists (
    select 1
    from public.layout_templates t
    where t.id = template_id
      and (
        public.is_admin()
        or (
          t.author_id = auth.uid()
          and t.status = 'draft'
          and not t.is_system
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.layout_templates t
    where t.id = template_id
      and (
        public.is_admin()
        or (
          t.author_id = auth.uid()
          and t.status = 'draft'
          and not t.is_system
        )
      )
  )
);

insert into public.layout_templates (
  id,
  author_id,
  source_template_id,
  slug,
  status,
  is_system,
  title,
  summary,
  published_at
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    null,
    null,
    'standard-lesson-layout',
    'published',
    true,
    'Standard Lesson Layout',
    'A balanced, all-purpose structure for lessons that move from scripture into reflection, classification, and session preparation.',
    timezone('utc', now())
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    null,
    null,
    'scripture-reflection-layout',
    'published',
    true,
    'Scripture Reflection Layout',
    'A scripture-led format with guided reflection and a lighter prep section for short studies, devotionals, or focused discussions.',
    timezone('utc', now())
  )
on conflict (id) do nothing;

insert into public.layout_template_sections (
  id,
  template_id,
  position,
  key,
  name,
  description,
  is_static
)
values
  (
    '11111111-1111-4111-8111-111111111112',
    '11111111-1111-4111-8111-111111111111',
    1,
    'core_details',
    'Core lesson details',
    'Keep the title, summary, objective, and duration consistent across the lesson.',
    true
  ),
  (
    '11111111-1111-4111-8111-111111111113',
    '11111111-1111-4111-8111-111111111111',
    2,
    'scripture_response',
    'Scripture and response',
    'Move from the passage itself into questions and next steps.',
    true
  ),
  (
    '11111111-1111-4111-8111-111111111114',
    '11111111-1111-4111-8111-111111111111',
    3,
    'classification',
    'Classification',
    'Organize the lesson with clear audience, tradition, and custom tags.',
    true
  ),
  (
    '11111111-1111-4111-8111-111111111115',
    '11111111-1111-4111-8111-111111111111',
    4,
    'session_prep',
    'Session prep',
    'Capture the prayer, notes, materials, and prompts that help the room feel ready.',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222223',
    '22222222-2222-4222-8222-222222222222',
    1,
    'core_details',
    'Core lesson details',
    'Set the lesson frame before opening the passage.',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222224',
    '22222222-2222-4222-8222-222222222222',
    2,
    'scripture_reflection',
    'Scripture and reflection',
    'Center the structure around the passage and personal response.',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222225',
    '22222222-2222-4222-8222-222222222222',
    3,
    'closing_response',
    'Closing response',
    'Keep the ending focused on prayer, action, and reflection.',
    true
  )
on conflict (id) do nothing;

insert into public.layout_template_widgets (
  id,
  template_id,
  section_id,
  position,
  kind,
  field_key,
  label,
  description,
  placeholder,
  is_required,
  is_removable,
  supports_multiple,
  options,
  settings
)
values
  (
    '11111111-1111-4111-8111-111111111121',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111112',
    1,
    'text',
    'lesson_title',
    'Lesson title',
    'The main title for the lesson.',
    'Give the lesson a clear title',
    true,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"title"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111122',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111112',
    2,
    'textarea',
    'summary',
    'Summary',
    'A short overview that introduces the room to the lesson.',
    'Summarize the lesson in a few sentences',
    true,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"summary"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111123',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111112',
    3,
    'textarea',
    'teaching_objective',
    'Teaching objective',
    'Describe the change, understanding, or response the lesson should produce.',
    'Clarify the spiritual or practical goal',
    true,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"teaching_objective"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111124',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111112',
    4,
    'number',
    'duration_minutes',
    'Duration',
    'Keep the expected room time easy to plan around.',
    '45',
    true,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"duration_minutes","unit":"minutes"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111125',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111113',
    1,
    'scripture_selector',
    'scripture_refs',
    'Scripture selector',
    'Capture one or more structured scripture references.',
    '',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"scripture_refs"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111126',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111113',
    2,
    'question_list',
    'discussion_questions',
    'Discussion questions',
    'Add as many questions as the room needs.',
    'One question per line',
    false,
    true,
    true,
    '[]'::jsonb,
    '{"dbField":"discussion_questions"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111127',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111113',
    3,
    'activity_list',
    'activities',
    'Activities and next steps',
    'Keep the practice portion flexible.',
    'One item per line',
    false,
    true,
    true,
    '[]'::jsonb,
    '{"dbField":"activities"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111128',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111114',
    1,
    'tag_group',
    'topic_tags',
    'Topic tags',
    'Help people find the lesson by its main themes.',
    '',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"topic_tags"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111129',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111114',
    2,
    'tag_group',
    'audience_tags',
    'Audience tags',
    'Mark the kinds of groups this lesson fits best.',
    '',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"audience_tags"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-11111111112a',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111114',
    3,
    'tag_group',
    'denomination_tags',
    'Denomination tags',
    'Show the church tradition or context the lesson serves.',
    '',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"denomination_tags"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-11111111112b',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111114',
    4,
    'text_list',
    'custom_tags',
    'Custom tags',
    'Leave room for tags that do not fit the curated lists.',
    'One custom tag per line',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"custom_tags"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-11111111112c',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111115',
    1,
    'textarea',
    'opening_prayer',
    'Opening prayer',
    'A grounded opening can set the tone for the whole room.',
    'Optional opening prayer',
    false,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"opening_prayer"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-11111111112d',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111115',
    2,
    'textarea',
    'facilitator_notes',
    'Facilitator notes',
    'Capture reminders that help the leader hold the room well.',
    'Optional facilitator notes',
    false,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"facilitator_notes"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-11111111112e',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111115',
    3,
    'text_list',
    'materials',
    'Materials',
    'List the items the leader should have ready.',
    'One item per line',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"materials"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-11111111112f',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111115',
    4,
    'text_list',
    'prayer_prompts',
    'Prayer prompts',
    'Keep closing or follow-up prayer cues close at hand.',
    'One item per line',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"prayer_prompts"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222231',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222223',
    1,
    'text',
    'lesson_title',
    'Lesson title',
    'The main title for the lesson.',
    'Give the lesson a clear title',
    true,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"title"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222232',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222223',
    2,
    'textarea',
    'summary',
    'Summary',
    'A short overview that frames the reflection.',
    'Summarize the lesson in a few sentences',
    true,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"summary"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222233',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222223',
    3,
    'textarea',
    'teaching_objective',
    'Teaching objective',
    'Keep the main takeaway clear for the leader and the room.',
    'Clarify the spiritual or practical goal',
    true,
    false,
    false,
    '[]'::jsonb,
    '{"dbField":"teaching_objective"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222234',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222224',
    1,
    'scripture_selector',
    'scripture_refs',
    'Scripture selector',
    'Capture one or more structured scripture references.',
    '',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"scripture_refs"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222235',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222224',
    2,
    'question_list',
    'discussion_questions',
    'Reflection questions',
    'Invite quieter or personal response without overbuilding the lesson.',
    'One question per line',
    false,
    true,
    true,
    '[]'::jsonb,
    '{"dbField":"discussion_questions"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222236',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222225',
    1,
    'textarea',
    'facilitator_notes',
    'Closing reflection',
    'Give the leader a short way to land the lesson gently.',
    'Optional closing reflection',
    false,
    true,
    false,
    '[]'::jsonb,
    '{"dbField":"facilitator_notes"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222237',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222225',
    2,
    'text_list',
    'prayer_prompts',
    'Prayer prompts',
    'Close with prompts that keep the room prayerful and focused.',
    'One item per line',
    false,
    false,
    true,
    '[]'::jsonb,
    '{"dbField":"prayer_prompts"}'::jsonb
  )
on conflict (id) do nothing;
