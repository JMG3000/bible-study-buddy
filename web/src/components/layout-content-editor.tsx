import type { LayoutTemplate, LayoutTemplateWidget } from "@/lib/types";

const coreFieldKeys = new Set([
  "lesson_title",
  "summary",
  "teaching_objective",
  "duration_minutes",
  "opening_prayer",
  "icebreaker",
  "facilitator_notes",
  "scripture_refs",
  "discussion_questions",
  "activities",
  "topic_tags",
  "audience_tags",
  "denomination_tags",
  "custom_tags",
  "materials",
  "prayer_prompts",
]);

function textValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry)).filter(Boolean).join("\n");
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function selectedValues(value: unknown) {
  if (Array.isArray(value)) {
    return new Set(value.map((entry) => String(entry)));
  }

  if (typeof value === "string" && value) {
    return new Set([value]);
  }

  return new Set<string>();
}

function renderWidget(
  widget: LayoutTemplateWidget,
  content: Record<string, unknown>,
) {
  const name = `layoutContent:${widget.fieldKey}`;
  const id = `layout-content-${widget.id}`;
  const currentValue = content[widget.fieldKey];

  if (widget.kind === "checkbox_list") {
    const checkedValues = selectedValues(currentValue);
    const options = widget.options.length > 0 ? widget.options : [];

    if (options.length === 0) {
      return (
        <textarea
          id={id}
          name={name}
          className="textarea"
          defaultValue={textValue(currentValue)}
          placeholder={widget.placeholder || "One item per line"}
          required={widget.isRequired}
        />
      );
    }

    return (
      <div className="choice-grid">
        {options.map((option) => (
          <label key={option} className="choice-pill">
            <input
              type="checkbox"
              name={name}
              value={option}
              defaultChecked={checkedValues.has(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (
    widget.kind === "textarea" ||
    widget.kind === "question_list" ||
    widget.kind === "activity_list" ||
    widget.kind === "text_list"
  ) {
    return (
      <textarea
        id={id}
        name={name}
        className="textarea"
        defaultValue={textValue(currentValue)}
        placeholder={widget.placeholder || "Add details here"}
        required={widget.isRequired}
      />
    );
  }

  return (
    <input
      id={id}
      name={name}
      type={widget.kind === "number" ? "number" : "text"}
      className="input"
      defaultValue={textValue(currentValue)}
      placeholder={widget.placeholder}
      required={widget.isRequired}
    />
  );
}

export function LayoutContentEditor({
  template,
  content,
}: {
  template: LayoutTemplate;
  content: Record<string, unknown>;
}) {
  const sections = template.sections
    .map((section) => ({
      ...section,
      widgets: section.widgets.filter(
        (widget) => !coreFieldKeys.has(widget.fieldKey),
      ),
    }))
    .filter((section) => section.widgets.length > 0);

  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="editor-card stack">
      <div className="stack-xs">
        <h2 className="section-title">Layout-specific fields</h2>
        <p className="body-copy">
          These fields belong to the layout used when this draft was created.
        </p>
      </div>

      <div className="stack">
      {sections.map((section) => (
          <article key={section.id} className="subtle-panel stack-sm">
            <h3 className="card-title">{section.name}</h3>
            {section.description ? (
              <p className="body-copy">{section.description}</p>
            ) : null}
            <div className="stack-sm">
              {section.widgets.map((widget) => (
                <div key={widget.id} className="field">
                  {widget.kind === "checkbox_list" && widget.options.length > 0 ? (
                    <label>{widget.label}</label>
                  ) : (
                    <label htmlFor={`layout-content-${widget.id}`}>
                      {widget.label}
                    </label>
                  )}
                  {renderWidget(widget, content)}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
