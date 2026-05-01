import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageUsersRole, getCurrentViewer } from "@/lib/lesson-plans";
import type {
  LayoutTemplate,
  LayoutTemplateSection,
  LayoutTemplateWidget,
  LayoutTemplateWidgetKind,
} from "@/lib/types";

interface LayoutTemplateRow {
  id: string;
  author_id: string | null;
  source_template_id: string | null;
  slug: string | null;
  status: LayoutTemplate["status"];
  is_system: boolean;
  title: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

interface LayoutTemplateSectionRow {
  id: string;
  template_id: string;
  position: number;
  key: string;
  name: string;
  description: string | null;
  is_static: boolean;
}

interface LayoutTemplateWidgetRow {
  id: string;
  template_id: string;
  section_id: string;
  position: number;
  kind: LayoutTemplateWidgetKind;
  field_key: string;
  label: string;
  description: string | null;
  placeholder: string | null;
  is_required: boolean;
  is_removable: boolean;
  supports_multiple: boolean;
  options: string[] | null;
  settings: Record<string, unknown> | null;
}

interface LayoutTemplateAuthorRow {
  user_id: string;
  display_name: string;
  handle: string;
}

const LAYOUT_TEMPLATE_SELECT = `
  id,
  author_id,
  source_template_id,
  slug,
  status,
  is_system,
  title,
  summary,
  created_at,
  updated_at
`;

function isMissingLayoutTemplateRelationError(error: {
  code?: string;
  message?: string;
} | null) {
  return (
    error?.code === "42P01" ||
    error?.message?.includes("layout_templates") ||
    error?.message?.includes("layout_template_sections") ||
    error?.message?.includes("layout_template_widgets")
  );
}

function mapWidget(row: LayoutTemplateWidgetRow): LayoutTemplateWidget {
  return {
    id: row.id,
    sectionId: row.section_id,
    position: row.position,
    kind: row.kind,
    fieldKey: row.field_key,
    label: row.label,
    description: row.description ?? "",
    placeholder: row.placeholder ?? "",
    isRequired: row.is_required,
    isRemovable: row.is_removable,
    supportsMultiple: row.supports_multiple,
    options: row.options ?? [],
    settings: row.settings ?? {},
  };
}

function hydrateLayoutTemplates(
  templateRows: LayoutTemplateRow[],
  sectionRows: LayoutTemplateSectionRow[],
  widgetRows: LayoutTemplateWidgetRow[],
  authorRows: LayoutTemplateAuthorRow[],
) {
  const authorMap = new Map(authorRows.map((row) => [row.user_id, row]));
  const widgetsBySection = new Map<string, LayoutTemplateWidget[]>();

  for (const row of widgetRows) {
    const existing = widgetsBySection.get(row.section_id) ?? [];
    existing.push(mapWidget(row));
    widgetsBySection.set(row.section_id, existing);
  }

  for (const widgets of widgetsBySection.values()) {
    widgets.sort((left, right) => left.position - right.position);
  }

  const sectionsByTemplate = new Map<string, LayoutTemplateSection[]>();

  for (const row of sectionRows) {
    const existing = sectionsByTemplate.get(row.template_id) ?? [];
    const widgets = widgetsBySection.get(row.id) ?? [];

    existing.push({
      id: row.id,
      position: row.position,
      key: row.key,
      name: row.name,
      description: row.description ?? "",
      isStatic: row.is_static,
      widgetCount: widgets.length,
      widgets,
    });

    sectionsByTemplate.set(row.template_id, existing);
  }

  for (const sections of sectionsByTemplate.values()) {
    sections.sort((left, right) => left.position - right.position);
  }

  return templateRows.map((row) => {
    const sections = sectionsByTemplate.get(row.id) ?? [];
    const author = row.author_id ? authorMap.get(row.author_id) : null;

    return {
      id: row.id,
      slug: row.slug,
      authorId: row.author_id,
      authorName: row.is_system ? "Bible Study Buddy" : author?.display_name ?? "Creator",
      authorHandle: row.is_system ? null : author?.handle ?? null,
      title: row.title,
      summary: row.summary,
      status: row.status,
      isSystem: row.is_system,
      sourceTemplateId: row.source_template_id,
      sectionCount: sections.length,
      widgetCount: sections.reduce(
        (runningTotal, section) => runningTotal + section.widgetCount,
        0,
      ),
      sections,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies LayoutTemplate;
  });
}

export async function getLayoutTemplateLibrary(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      publishedTemplates: [] as LayoutTemplate[],
      draftTemplates: [] as LayoutTemplate[],
    };
  }

  const [{ data: publishedData, error: publishedError }, { data: draftData, error: draftError }] =
    await Promise.all([
      supabase
        .from("layout_templates")
        .select(LAYOUT_TEMPLATE_SELECT)
        .eq("status", "published")
        .order("is_system", { ascending: false })
        .order("updated_at", { ascending: false }),
      supabase
        .from("layout_templates")
        .select(LAYOUT_TEMPLATE_SELECT)
        .eq("author_id", userId)
        .eq("status", "draft")
        .order("updated_at", { ascending: false }),
    ]);

  if (
    isMissingLayoutTemplateRelationError(publishedError) ||
    isMissingLayoutTemplateRelationError(draftError)
  ) {
    return {
      publishedTemplates: [] as LayoutTemplate[],
      draftTemplates: [] as LayoutTemplate[],
    };
  }

  const templateRows = [
    ...((publishedData as LayoutTemplateRow[] | null) ?? []),
    ...((draftData as LayoutTemplateRow[] | null) ?? []),
  ].filter(
    (row, index, rows) => rows.findIndex((candidate) => candidate.id === row.id) === index,
  );

  if (templateRows.length === 0) {
    return {
      publishedTemplates: [] as LayoutTemplate[],
      draftTemplates: [] as LayoutTemplate[],
    };
  }

  const templateIds = templateRows.map((row) => row.id);
  const authorIds = templateRows
    .map((row) => row.author_id)
    .filter((authorId): authorId is string => Boolean(authorId));

  const [{ data: sectionData }, { data: widgetData }, { data: authorData }] = await Promise.all([
    supabase
      .from("layout_template_sections")
      .select("id, template_id, position, key, name, description, is_static")
      .in("template_id", templateIds)
      .order("position", { ascending: true }),
    supabase
      .from("layout_template_widgets")
      .select(
        "id, template_id, section_id, position, kind, field_key, label, description, placeholder, is_required, is_removable, supports_multiple, options, settings",
      )
      .in("template_id", templateIds)
      .order("position", { ascending: true }),
    authorIds.length > 0
      ? supabase
          .from("profiles")
          .select("user_id, display_name, handle")
          .in("user_id", authorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const templates = hydrateLayoutTemplates(
    templateRows,
    (sectionData as LayoutTemplateSectionRow[] | null) ?? [],
    (widgetData as LayoutTemplateWidgetRow[] | null) ?? [],
    (authorData as LayoutTemplateAuthorRow[] | null) ?? [],
  );

  return {
    publishedTemplates: templates.filter((template) => template.status === "published"),
    draftTemplates: templates.filter((template) => template.status === "draft"),
  };
}

export async function getLessonCreationLayoutTemplates(userId: string) {
  const { publishedTemplates, draftTemplates } = await getLayoutTemplateLibrary(userId);

  return [...publishedTemplates, ...draftTemplates];
}

export async function getLayoutTemplateById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("layout_templates")
    .select(LAYOUT_TEMPLATE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (isMissingLayoutTemplateRelationError(error) || !data) {
    return null;
  }

  const templateRow = data as LayoutTemplateRow;
  const [{ data: sectionData }, { data: widgetData }, { data: authorData }] =
    await Promise.all([
      supabase
        .from("layout_template_sections")
        .select("id, template_id, position, key, name, description, is_static")
        .eq("template_id", id)
        .order("position", { ascending: true }),
      supabase
        .from("layout_template_widgets")
        .select(
          "id, template_id, section_id, position, kind, field_key, label, description, placeholder, is_required, is_removable, supports_multiple, options, settings",
        )
        .eq("template_id", id)
        .order("position", { ascending: true }),
      templateRow.author_id
        ? supabase
            .from("profiles")
            .select("user_id, display_name, handle")
            .eq("user_id", templateRow.author_id)
        : Promise.resolve({ data: [] }),
    ]);

  const [template] = hydrateLayoutTemplates(
    [templateRow],
    (sectionData as LayoutTemplateSectionRow[] | null) ?? [],
    (widgetData as LayoutTemplateWidgetRow[] | null) ?? [],
    (authorData as LayoutTemplateAuthorRow[] | null) ?? [],
  );

  return template ?? null;
}

export async function getEditableLayoutTemplateById(id: string) {
  const [viewer, template] = await Promise.all([
    getCurrentViewer(),
    getLayoutTemplateById(id),
  ]);

  if (
    !viewer ||
    !template ||
    template.isSystem ||
    template.status !== "draft" ||
    (!canManageUsersRole(viewer.role) && template.authorId !== viewer.userId)
  ) {
    return null;
  }

  return template;
}
