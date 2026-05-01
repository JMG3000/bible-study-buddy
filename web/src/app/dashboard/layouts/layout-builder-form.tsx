"use client";

import { useMemo, useState } from "react";
import type {
  LayoutTemplate,
  LayoutTemplateSection,
  LayoutTemplateWidget,
  LayoutTemplateWidgetKind,
} from "@/lib/types";
import { saveLayoutTemplateDraftAction } from "./actions";

type EditableWidget = Omit<LayoutTemplateWidget, "id" | "sectionId" | "position"> & {
  clientId: string;
};

type EditableSection = Omit<
  LayoutTemplateSection,
  "id" | "position" | "widgetCount" | "widgets"
> & {
  clientId: string;
  widgets: EditableWidget[];
};

const WIDGET_KIND_OPTIONS: Array<{
  value: LayoutTemplateWidgetKind;
  label: string;
}> = [
  { value: "text", label: "Text box" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "scripture_selector", label: "Scripture selector" },
  { value: "question_list", label: "Question list" },
  { value: "activity_list", label: "Activity list" },
  { value: "checkbox_list", label: "Checkbox list" },
  { value: "tag_group", label: "Tag group" },
  { value: "text_list", label: "Text list" },
];

function toClientId(prefix: string) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
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

function toEditableSections(template: LayoutTemplate): EditableSection[] {
  return template.sections.map((section) => ({
    clientId: section.id,
    key: section.key,
    name: section.name,
    description: section.description,
    isStatic: section.isStatic,
    widgets: section.widgets.map((widget) => ({
      clientId: widget.id,
      kind: widget.kind,
      fieldKey: widget.fieldKey,
      label: widget.label,
      description: widget.description,
      placeholder: widget.placeholder,
      isRequired: widget.isRequired,
      isRemovable: widget.isRemovable,
      supportsMultiple: widget.supportsMultiple,
      options: widget.options,
      settings: widget.settings,
    })),
  }));
}

function createSection(): EditableSection {
  const clientId = toClientId("section");

  return {
    clientId,
    key: normalizeKey(clientId, "custom_section"),
    name: "New section",
    description: "",
    isStatic: false,
    widgets: [createWidget()],
  };
}

function createWidget(): EditableWidget {
  const clientId = toClientId("widget");

  return {
    clientId,
    kind: "textarea",
    fieldKey: normalizeKey(clientId, "custom_field"),
    label: "New field",
    description: "",
    placeholder: "",
    isRequired: false,
    isRemovable: true,
    supportsMultiple: false,
    options: [],
    settings: {},
  };
}

export function LayoutBuilderForm({ template }: { template: LayoutTemplate }) {
  const [title, setTitle] = useState(template.title);
  const [summary, setSummary] = useState(template.summary);
  const [sections, setSections] = useState(() => toEditableSections(template));

  const payload = useMemo(
    () =>
      JSON.stringify({
        title,
        summary,
        sections,
      }),
    [sections, summary, title],
  );

  function updateSection(
    clientId: string,
    updater: (section: EditableSection) => EditableSection,
  ) {
    setSections((current) =>
      current.map((section) =>
        section.clientId === clientId ? updater(section) : section,
      ),
    );
  }

  function updateWidget(
    sectionClientId: string,
    widgetClientId: string,
    updater: (widget: EditableWidget) => EditableWidget,
  ) {
    updateSection(sectionClientId, (section) => ({
      ...section,
      widgets: section.widgets.map((widget) =>
        widget.clientId === widgetClientId ? updater(widget) : widget,
      ),
    }));
  }

  return (
    <form action={saveLayoutTemplateDraftAction} className="editor-grid">
      <input type="hidden" name="templateId" value={template.id} />
      <input type="hidden" name="payload" value={payload} />

      <section className="editor-card stack">
        <div className="field">
          <label htmlFor="layout-title">Layout title</label>
          <input
            id="layout-title"
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="layout-summary">Layout summary</label>
          <textarea
            id="layout-summary"
            className="textarea"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </div>

        <div className="inline-actions">
          <button type="submit" className="button">
            Save layout draft
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setSections((current) => [...current, createSection()])}
          >
            + Section
          </button>
        </div>
      </section>

      <section className="editor-card stack">
        <div className="stack-sm">
          <h2 className="section-title">Sections and fields</h2>
          <p className="body-copy">
            Shape the reusable parts of this lesson layout.
          </p>
        </div>

        <div className="stack">
          {sections.map((section, sectionIndex) => (
            <article key={section.clientId} className="subtle-panel stack-sm">
              <div className="section-head compact-section-head">
                <div className="meta-row">
                  <span className="chip-accent">Section {sectionIndex + 1}</span>
                  {section.isStatic ? <span className="chip-muted">static</span> : null}
                </div>

                <div className="inline-actions">
                  <button
                    type="button"
                    className="button-tertiary"
                    onClick={() =>
                      updateSection(section.clientId, (current) => ({
                        ...current,
                        widgets: [...current.widgets, createWidget()],
                      }))
                    }
                  >
                    + Field
                  </button>
                  {!section.isStatic ? (
                    <button
                      type="button"
                      className="button-tertiary"
                      onClick={() =>
                        setSections((current) =>
                          current.filter((entry) => entry.clientId !== section.clientId),
                        )
                      }
                    >
                      - Section
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="two-column">
                <div className="field">
                  <label htmlFor={`section-name-${section.clientId}`}>Section name</label>
                  <input
                    id={`section-name-${section.clientId}`}
                    className="input"
                    value={section.name}
                    onChange={(event) =>
                      updateSection(section.clientId, (current) => ({
                        ...current,
                        name: event.target.value,
                        key: normalizeKey(event.target.value, current.key),
                      }))
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor={`section-key-${section.clientId}`}>Section key</label>
                  <input
                    id={`section-key-${section.clientId}`}
                    className="input"
                    value={section.key}
                    onChange={(event) =>
                      updateSection(section.clientId, (current) => ({
                        ...current,
                        key: normalizeKey(event.target.value, current.key),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor={`section-description-${section.clientId}`}>
                  Section description
                </label>
                <input
                  id={`section-description-${section.clientId}`}
                  className="input"
                  value={section.description}
                  onChange={(event) =>
                    updateSection(section.clientId, (current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="stack-sm">
                {section.widgets.map((widget, widgetIndex) => (
                  <div key={widget.clientId} className="series-sequence-card">
                    <div className="section-head compact-section-head">
                      <span className="chip-muted">Field {widgetIndex + 1}</span>
                      {widget.isRemovable ? (
                        <button
                          type="button"
                          className="button-tertiary"
                          onClick={() =>
                            updateSection(section.clientId, (current) => ({
                              ...current,
                              widgets: current.widgets.filter(
                                (entry) => entry.clientId !== widget.clientId,
                              ),
                            }))
                          }
                        >
                          - Field
                        </button>
                      ) : null}
                    </div>

                    <div className="two-column">
                      <div className="field">
                        <label htmlFor={`widget-label-${widget.clientId}`}>Label</label>
                        <input
                          id={`widget-label-${widget.clientId}`}
                          className="input"
                          value={widget.label}
                          onChange={(event) =>
                            updateWidget(section.clientId, widget.clientId, (current) => ({
                              ...current,
                              label: event.target.value,
                              fieldKey: normalizeKey(event.target.value, current.fieldKey),
                            }))
                          }
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`widget-kind-${widget.clientId}`}>Widget</label>
                        <select
                          id={`widget-kind-${widget.clientId}`}
                          className="input"
                          value={widget.kind}
                          onChange={(event) =>
                            updateWidget(section.clientId, widget.clientId, (current) => ({
                              ...current,
                              kind: event.target.value as LayoutTemplateWidgetKind,
                            }))
                          }
                        >
                          {WIDGET_KIND_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="two-column">
                      <div className="field">
                        <label htmlFor={`widget-key-${widget.clientId}`}>Field key</label>
                        <input
                          id={`widget-key-${widget.clientId}`}
                          className="input"
                          value={widget.fieldKey}
                          onChange={(event) =>
                            updateWidget(section.clientId, widget.clientId, (current) => ({
                              ...current,
                              fieldKey: normalizeKey(event.target.value, current.fieldKey),
                            }))
                          }
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`widget-placeholder-${widget.clientId}`}>
                          Placeholder
                        </label>
                        <input
                          id={`widget-placeholder-${widget.clientId}`}
                          className="input"
                          value={widget.placeholder}
                          onChange={(event) =>
                            updateWidget(section.clientId, widget.clientId, (current) => ({
                              ...current,
                              placeholder: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor={`widget-description-${widget.clientId}`}>
                        Description
                      </label>
                      <input
                        id={`widget-description-${widget.clientId}`}
                        className="input"
                        value={widget.description}
                        onChange={(event) =>
                          updateWidget(section.clientId, widget.clientId, (current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="chip-row">
                      <label className="choice-pill">
                        <input
                          type="checkbox"
                          checked={widget.isRequired}
                          onChange={(event) =>
                            updateWidget(section.clientId, widget.clientId, (current) => ({
                              ...current,
                              isRequired: event.target.checked,
                            }))
                          }
                        />
                        Required
                      </label>
                      <label className="choice-pill">
                        <input
                          type="checkbox"
                          checked={widget.supportsMultiple}
                          onChange={(event) =>
                            updateWidget(section.clientId, widget.clientId, (current) => ({
                              ...current,
                              supportsMultiple: event.target.checked,
                            }))
                          }
                        />
                        Multiple entries
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </form>
  );
}
