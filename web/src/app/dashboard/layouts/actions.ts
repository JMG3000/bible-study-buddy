"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageUsersRole, getCurrentViewer } from "@/lib/lesson-plans";
import { getLayoutTemplateById } from "@/lib/layout-templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LayoutTemplateWidgetKind } from "@/lib/types";
import { appendMessage } from "@/lib/urls";

type BuilderSectionInput = {
  clientId: string;
  key: string;
  name: string;
  description: string;
  isStatic: boolean;
  widgets: BuilderWidgetInput[];
};

type BuilderWidgetInput = {
  clientId: string;
  kind: LayoutTemplateWidgetKind;
  fieldKey: string;
  label: string;
  description: string;
  placeholder: string;
  isRequired: boolean;
  isRemovable: boolean;
  supportsMultiple: boolean;
};

type BuilderPayload = {
  title: string;
  summary: string;
  sections: BuilderSectionInput[];
};

const WIDGET_KINDS = new Set<LayoutTemplateWidgetKind>([
  "text",
  "textarea",
  "number",
  "scripture_selector",
  "question_list",
  "activity_list",
  "checkbox_list",
  "tag_group",
  "text_list",
]);

function buildLayoutRedirect(id: string, key: string, message: string) {
  return appendMessage(`/dashboard/layouts/${id}`, key, message);
}

function normalizeKey(value: string, fallback: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_{2,}/g, "_") || fallback
  );
}

function normalizePayload(rawPayload: string): BuilderPayload {
  const parsed = JSON.parse(rawPayload) as Partial<BuilderPayload>;
  const sections = Array.isArray(parsed.sections) ? parsed.sections : [];

  return {
    title: String(parsed.title ?? "").trim(),
    summary: String(parsed.summary ?? "").trim(),
    sections: sections.slice(0, 24).map((section, sectionIndex) => {
      const rawSection = section as Partial<BuilderSectionInput>;
      const widgets = Array.isArray(rawSection.widgets) ? rawSection.widgets : [];
      const sectionName = String(rawSection.name ?? "").trim();
      const sectionKey = normalizeKey(
        String(rawSection.key ?? sectionName),
        `section_${sectionIndex + 1}`,
      );

      return {
        clientId: String(rawSection.clientId ?? sectionKey),
        key: sectionKey,
        name: sectionName || `Section ${sectionIndex + 1}`,
        description: String(rawSection.description ?? "").trim(),
        isStatic: Boolean(rawSection.isStatic),
        widgets: widgets.slice(0, 48).map((widget, widgetIndex) => {
          const rawWidget = widget as Partial<BuilderWidgetInput>;
          const kind = String(rawWidget.kind ?? "textarea") as LayoutTemplateWidgetKind;
          const label = String(rawWidget.label ?? "").trim();

          return {
            clientId: String(rawWidget.clientId ?? `widget_${sectionIndex + 1}_${widgetIndex + 1}`),
            kind: WIDGET_KINDS.has(kind) ? kind : "textarea",
            fieldKey: normalizeKey(
              String(rawWidget.fieldKey ?? label),
              `field_${sectionIndex + 1}_${widgetIndex + 1}`,
            ),
            label: label || `Field ${widgetIndex + 1}`,
            description: String(rawWidget.description ?? "").trim(),
            placeholder: String(rawWidget.placeholder ?? "").trim(),
            isRequired: Boolean(rawWidget.isRequired),
            isRemovable: Boolean(rawWidget.isRemovable),
            supportsMultiple: Boolean(rawWidget.supportsMultiple),
          };
        }),
      };
    }),
  };
}

function validatePayload(payload: BuilderPayload) {
  if (!payload.title) {
    return "Add a layout title before saving.";
  }

  if (payload.sections.length === 0) {
    return "Add at least one section before saving this layout.";
  }

  const sectionKeys = new Set<string>();
  const fieldKeys = new Set<string>();

  for (const section of payload.sections) {
    if (sectionKeys.has(section.key)) {
      return "Each section needs a unique key.";
    }

    sectionKeys.add(section.key);

    if (section.widgets.length === 0) {
      return `Add at least one field to ${section.name}.`;
    }

    for (const widget of section.widgets) {
      if (fieldKeys.has(widget.fieldKey)) {
        return "Each field needs a unique key across the layout.";
      }

      fieldKeys.add(widget.fieldKey);
    }
  }

  return null;
}

function serializeWidgetSettings(widget: BuilderWidgetInput) {
  return {
    dbField: widget.fieldKey,
  };
}

export async function createBlankLayoutAction() {
  const supabase = await createSupabaseServerClient();
  const viewer = await getCurrentViewer();

  if (!supabase || !viewer) {
    redirect("/login");
  }

  const { data: template, error } = await supabase
    .from("layout_templates")
    .insert({
      author_id: viewer.userId,
      status: "draft",
      is_system: false,
      title: "Untitled Lesson Layout",
      summary: "",
    })
    .select("id")
    .single();

  if (error || !template) {
    redirect(appendMessage("/dashboard/layouts", "error", error?.message ?? "Unable to create a layout draft."));
  }

  const coreSectionId = randomUUID();
  const responseSectionId = randomUUID();

  await supabase.from("layout_template_sections").insert([
    {
      id: coreSectionId,
      template_id: template.id,
      position: 1,
      key: "core_details",
      name: "Core lesson details",
      description: "Title, summary, objective, and planning fields.",
      is_static: true,
    },
    {
      id: responseSectionId,
      template_id: template.id,
      position: 2,
      key: "lesson_response",
      name: "Lesson response",
      description: "Questions, activities, and room response.",
      is_static: false,
    },
  ]);

  await supabase.from("layout_template_widgets").insert([
    {
      template_id: template.id,
      section_id: coreSectionId,
      position: 1,
      kind: "text",
      field_key: "lesson_title",
      label: "Lesson title",
      is_required: true,
      is_removable: false,
      supports_multiple: false,
      settings: { dbField: "title" },
    },
    {
      template_id: template.id,
      section_id: coreSectionId,
      position: 2,
      kind: "textarea",
      field_key: "summary",
      label: "Summary",
      is_required: false,
      is_removable: false,
      supports_multiple: false,
      settings: { dbField: "summary" },
    },
    {
      template_id: template.id,
      section_id: responseSectionId,
      position: 1,
      kind: "question_list",
      field_key: "discussion_questions",
      label: "Discussion questions",
      is_required: false,
      is_removable: true,
      supports_multiple: true,
      settings: { dbField: "discussion_questions" },
    },
  ]);

  revalidatePath("/dashboard/layouts");
  redirect(`/dashboard/layouts/${template.id}?created=1`);
}

export async function cloneLayoutTemplateAction(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const viewer = await getCurrentViewer();

  if (!sourceId) {
    redirect("/dashboard/layouts");
  }

  if (!supabase || !viewer) {
    redirect("/login");
  }

  const source = await getLayoutTemplateById(sourceId);

  if (!source) {
    redirect(appendMessage("/dashboard/layouts", "error", "We could not find that layout."));
  }

  const { data: template, error } = await supabase
    .from("layout_templates")
    .insert({
      author_id: viewer.userId,
      source_template_id: source.id,
      status: "draft",
      is_system: false,
      title: `${source.title} Copy`,
      summary: source.summary,
    })
    .select("id")
    .single();

  if (error || !template) {
    redirect(appendMessage("/dashboard/layouts", "error", error?.message ?? "Unable to clone that layout."));
  }

  const sectionIdMap = new Map<string, string>();

  const sectionRows = source.sections.map((section, index) => {
    const id = randomUUID();
    sectionIdMap.set(section.id, id);

    return {
      id,
      template_id: template.id,
      position: index + 1,
      key: section.key,
      name: section.name,
      description: section.description,
      is_static: section.isStatic,
    };
  });

  if (sectionRows.length > 0) {
    await supabase.from("layout_template_sections").insert(sectionRows);
  }

  const widgetRows = source.sections.flatMap((section) =>
    section.widgets.map((widget, index) => ({
      template_id: template.id,
      section_id: sectionIdMap.get(section.id),
      position: index + 1,
      kind: widget.kind,
      field_key: widget.fieldKey,
      label: widget.label,
      description: widget.description,
      placeholder: widget.placeholder,
      is_required: widget.isRequired,
      is_removable: widget.isRemovable,
      supports_multiple: widget.supportsMultiple,
      options: widget.options,
      settings: widget.settings,
    })),
  );

  if (widgetRows.length > 0) {
    await supabase.from("layout_template_widgets").insert(widgetRows);
  }

  revalidatePath("/dashboard/layouts");
  redirect(`/dashboard/layouts/${template.id}?created=1`);
}

export async function saveLayoutTemplateDraftAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "").trim();
  const rawPayload = String(formData.get("payload") ?? "");
  const supabase = await createSupabaseServerClient();
  const viewer = await getCurrentViewer();

  if (!templateId) {
    redirect("/dashboard/layouts");
  }

  if (!supabase || !viewer) {
    redirect("/login");
  }

  const template = await getLayoutTemplateById(templateId);

  if (
    !template ||
    template.isSystem ||
    template.status !== "draft" ||
    (!canManageUsersRole(viewer.role) && template.authorId !== viewer.userId)
  ) {
    redirect("/dashboard/layouts");
  }

  let payload: BuilderPayload;

  try {
    payload = normalizePayload(rawPayload);
  } catch {
    redirect(buildLayoutRedirect(templateId, "error", "We could not read that layout draft."));
  }

  const validationMessage = validatePayload(payload);

  if (validationMessage) {
    redirect(buildLayoutRedirect(templateId, "error", validationMessage));
  }

  const { error: templateError } = await supabase
    .from("layout_templates")
    .update({
      title: payload.title,
      summary: payload.summary,
    })
    .eq("id", templateId);

  if (templateError) {
    redirect(buildLayoutRedirect(templateId, "error", templateError.message));
  }

  const { error: sectionDeleteError } = await supabase
    .from("layout_template_sections")
    .delete()
    .eq("template_id", templateId);

  if (sectionDeleteError) {
    redirect(buildLayoutRedirect(templateId, "error", sectionDeleteError.message));
  }

  const sectionIdMap = new Map<string, string>();
  const sectionRows = payload.sections.map((section, index) => {
    const id = randomUUID();
    sectionIdMap.set(section.clientId, id);

    return {
      id,
      template_id: templateId,
      position: index + 1,
      key: section.key,
      name: section.name,
      description: section.description,
      is_static: section.isStatic,
    };
  });

  const { error: sectionInsertError } = await supabase
    .from("layout_template_sections")
    .insert(sectionRows);

  if (sectionInsertError) {
    redirect(buildLayoutRedirect(templateId, "error", sectionInsertError.message));
  }

  const widgetRows = payload.sections.flatMap((section) =>
    section.widgets.map((widget, index) => ({
      template_id: templateId,
      section_id: sectionIdMap.get(section.clientId),
      position: index + 1,
      kind: widget.kind,
      field_key: widget.fieldKey,
      label: widget.label,
      description: widget.description,
      placeholder: widget.placeholder,
      is_required: widget.isRequired,
      is_removable: widget.isRemovable,
      supports_multiple: widget.supportsMultiple,
      options: [],
      settings: serializeWidgetSettings(widget),
    })),
  );

  if (widgetRows.length > 0) {
    const { error: widgetInsertError } = await supabase
      .from("layout_template_widgets")
      .insert(widgetRows);

    if (widgetInsertError) {
      redirect(buildLayoutRedirect(templateId, "error", widgetInsertError.message));
    }
  }

  revalidatePath("/dashboard/layouts");
  revalidatePath(`/dashboard/layouts/${templateId}`);
  redirect(buildLayoutRedirect(templateId, "saved", "Layout draft saved."));
}
