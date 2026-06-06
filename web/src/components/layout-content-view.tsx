import type { LayoutTemplate, LayoutTemplateWidget } from "@/lib/types";

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter(Boolean).join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function hasStoredContent(
  widget: LayoutTemplateWidget,
  content: Record<string, unknown>,
) {
  return Boolean(formatValue(content[widget.fieldKey]));
}

export function LayoutContentView({
  template,
  content,
  description = "These fields came from the layout used for this lesson.",
}: {
  template: LayoutTemplate;
  content: Record<string, unknown>;
  description?: string;
}) {
  const sections = template.sections
    .map((section) => ({
      ...section,
      widgets: section.widgets.filter((widget) => hasStoredContent(widget, content)),
    }))
    .filter((section) => section.widgets.length > 0);

  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="editor-card stack">
      <div className="stack-xs">
        <h2 className="section-title">Layout-specific fields</h2>
        <p className="body-copy">{description}</p>
      </div>

      <div className="stack">
        {sections.map((section) => (
          <article key={section.id} className="subtle-panel stack-sm">
            <h3 className="card-title">{section.name}</h3>
            <div className="stack-sm">
              {section.widgets.map((widget) => (
                <div key={widget.id} className="stack-xs">
                  <span className="eyebrow">{widget.label}</span>
                  <p className="body-copy">{formatValue(content[widget.fieldKey])}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
