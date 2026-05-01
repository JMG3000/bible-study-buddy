import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bibleBooks } from "@/lib/bible-books";
import { getCurrentViewer } from "@/lib/lesson-plans";
import { getLessonCreationLayoutTemplates } from "@/lib/layout-templates";
import {
  audienceOptions,
  denominationOptions,
  topicOptions,
} from "@/lib/site";
import type {
  LayoutTemplate,
  LayoutTemplateWidget,
  LayoutTemplateWidgetKind,
} from "@/lib/types";
import { createLessonDraftAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Create a Lesson",
  description:
    "Start a new Bible study lesson draft and shape it over time.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const fallbackLayout: LayoutTemplate = {
  id: "",
  slug: null,
  authorId: null,
  authorName: "Bible Study Buddy",
  authorHandle: null,
  title: "Standard Lesson Layout",
  summary: "A balanced lesson structure for creating a new Bible study draft.",
  status: "published",
  isSystem: true,
  sourceTemplateId: null,
  sectionCount: 4,
  widgetCount: 14,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  sections: [
    {
      id: "fallback-core",
      position: 1,
      key: "core_details",
      name: "Core lesson details",
      description: "Keep these anchor fields in place for every draft.",
      isStatic: true,
      widgetCount: 5,
      widgets: [
        makeWidget("lesson_title", "text", "Lesson title", true),
        makeWidget("summary", "textarea", "Summary"),
        makeWidget("teaching_objective", "textarea", "Teaching objective"),
        makeWidget("duration_minutes", "number", "Duration"),
        makeWidget("facilitator_notes", "textarea", "Facilitator notes"),
      ],
    },
    {
      id: "fallback-scripture",
      position: 2,
      key: "scripture_response",
      name: "Scripture and response",
      description: "Add a passage, questions, and next steps.",
      isStatic: true,
      widgetCount: 3,
      widgets: [
        makeWidget("scripture_refs", "scripture_selector", "Scripture selector"),
        makeWidget("discussion_questions", "question_list", "Discussion questions"),
        makeWidget("activities", "activity_list", "Activities and next steps"),
      ],
    },
    {
      id: "fallback-classification",
      position: 3,
      key: "classification",
      name: "Classification",
      description: "Tags keep lessons organized and easier to browse later.",
      isStatic: true,
      widgetCount: 4,
      widgets: [
        makeWidget("topic_tags", "tag_group", "Topic tags"),
        makeWidget("audience_tags", "tag_group", "Audience tags"),
        makeWidget("denomination_tags", "tag_group", "Denomination tags"),
        makeWidget("custom_tags", "text_list", "Custom tags"),
      ],
    },
    {
      id: "fallback-prep",
      position: 4,
      key: "session_prep",
      name: "Session prep",
      description: "Capture what you want ready when it is time to lead.",
      isStatic: true,
      widgetCount: 3,
      widgets: [
        makeWidget("opening_prayer", "textarea", "Opening prayer"),
        makeWidget("materials", "text_list", "Materials"),
        makeWidget("prayer_prompts", "text_list", "Prayer prompts"),
      ],
    },
  ],
};

function makeWidget(
  fieldKey: string,
  kind: LayoutTemplateWidgetKind,
  label: string,
  isRequired = false,
): LayoutTemplateWidget {
  return {
    id: `fallback-${fieldKey}`,
    sectionId: "",
    position: 1,
    kind,
    fieldKey,
    label,
    description: "",
    placeholder: "",
    isRequired,
    isRemovable: false,
    supportsMultiple: false,
    options: [],
    settings: {},
  };
}

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

function renderTagChoices(name: string, options: string[]) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <label key={option} className="choice-pill">
          <input type="checkbox" name={name} value={option} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function renderScriptureSelector() {
  return (
    <div className="stack-sm">
      <div className="field-row">
        <div className="field">
          <label htmlFor="book">Book</label>
          <select id="book" name="book" className="select" defaultValue="">
            <option value="">Select later</option>
            {bibleBooks.map((book) => (
              <option key={book.slug} value={book.slug}>
                {book.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="chapterStart">Chapter start</label>
          <input id="chapterStart" name="chapterStart" type="number" min="1" className="input" />
        </div>
        <div className="field">
          <label htmlFor="verseStart">Verse start</label>
          <input id="verseStart" name="verseStart" type="number" min="1" className="input" />
        </div>
        <div className="field">
          <label htmlFor="chapterEnd">Chapter end</label>
          <input id="chapterEnd" name="chapterEnd" type="number" min="1" className="input" />
        </div>
        <div className="field">
          <label htmlFor="verseEnd">Verse end</label>
          <input id="verseEnd" name="verseEnd" type="number" min="1" className="input" />
        </div>
      </div>

      <div className="subtle-panel">
        Scripture references are saved as structured chapter-and-verse ranges so the lesson stays searchable and accurate later.
      </div>
    </div>
  );
}

function renderCustomWidget(widget: LayoutTemplateWidget) {
  const name = `layoutContent:${widget.fieldKey}`;
  const id = `layout-content-${widget.id}`;

  if (widget.kind === "checkbox_list") {
    return (
      <div className="choice-grid">
        {(widget.options.length > 0 ? widget.options : ["Option one", "Option two"]).map(
          (option) => (
            <label key={option} className="choice-pill">
              <input type="checkbox" name={name} value={option} />
              <span>{option}</span>
            </label>
          ),
        )}
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
      placeholder={widget.placeholder}
      required={widget.isRequired}
    />
  );
}

function renderWidget(widget: LayoutTemplateWidget) {
  switch (widget.fieldKey) {
    case "lesson_title":
      return (
        <input
          id="title"
          name="title"
          className="input"
          placeholder="Walking in Community"
          required
        />
      );
    case "summary":
      return <textarea id="summary" name="summary" className="textarea" />;
    case "teaching_objective":
      return (
        <textarea
          id="teachingObjective"
          name="teachingObjective"
          className="textarea"
        />
      );
    case "duration_minutes":
      return (
        <input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min="5"
          max="480"
          className="input"
          defaultValue="45"
        />
      );
    case "opening_prayer":
      return <textarea id="openingPrayer" name="openingPrayer" className="textarea" />;
    case "icebreaker":
      return <textarea id="icebreaker" name="icebreaker" className="textarea" />;
    case "facilitator_notes":
      return (
        <textarea
          id="facilitatorNotes"
          name="facilitatorNotes"
          className="textarea"
        />
      );
    case "scripture_refs":
      return renderScriptureSelector();
    case "discussion_questions":
      return (
        <textarea
          id="discussionQuestions"
          name="discussionQuestions"
          className="textarea"
          placeholder="One item per line"
        />
      );
    case "activities":
      return (
        <textarea
          id="activities"
          name="activities"
          className="textarea"
          placeholder="One item per line"
        />
      );
    case "materials":
      return (
        <textarea
          id="materials"
          name="materials"
          className="textarea"
          placeholder="One item per line"
        />
      );
    case "prayer_prompts":
      return (
        <textarea
          id="prayerPrompts"
          name="prayerPrompts"
          className="textarea"
          placeholder="One item per line"
        />
      );
    case "topic_tags":
      return renderTagChoices("topicTags", topicOptions);
    case "audience_tags":
      return renderTagChoices("audienceTags", audienceOptions);
    case "denomination_tags":
      return renderTagChoices("denominationTags", denominationOptions);
    case "custom_tags":
      return (
        <textarea
          id="customTags"
          name="customTags"
          className="textarea"
          placeholder="One custom tag per line"
        />
      );
    default:
      return renderCustomWidget(widget);
  }
}

function getWidgetInputId(widget: LayoutTemplateWidget) {
  const knownIds: Record<string, string> = {
    lesson_title: "title",
    teaching_objective: "teachingObjective",
    duration_minutes: "durationMinutes",
    opening_prayer: "openingPrayer",
    facilitator_notes: "facilitatorNotes",
    scripture_refs: "book",
    discussion_questions: "discussionQuestions",
    prayer_prompts: "prayerPrompts",
    topic_tags: "",
    audience_tags: "",
    denomination_tags: "",
    custom_tags: "customTags",
  };

  return knownIds[widget.fieldKey] ?? widget.fieldKey;
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [viewer, resolvedParams] = await Promise.all([
    getCurrentViewer(),
    searchParams,
  ]);
  const error = readValue(resolvedParams, "error");
  const selectedLayoutId = readValue(resolvedParams, "layout");

  if (!viewer) {
    redirect("/login");
  }

  const layouts = await getLessonCreationLayoutTemplates(viewer.userId);
  const selectedLayout =
    layouts.find((layout) => layout.id === selectedLayoutId) ??
    layouts[0] ??
    fallbackLayout;

  return (
    <section className="section">
      <div className="shell stack">
        <div className="stack-sm">
          <span className="eyebrow">Authoring surface</span>
          <h1 className="page-title">Structured lesson editor</h1>
          <p className="lead">
            Start lean, save early, and fill in the rest as the lesson takes shape.
          </p>
        </div>

        <div className="subtle-panel">
          Signed in as <strong>{viewer.displayName}</strong>. Drafts save to your
          account and appear in the dashboard right after you save.
        </div>

        {error ? (
          <div className="helper-banner" role="alert">
            {error}
          </div>
        ) : null}

        <section className="surface-card stack-sm">
          <div className="section-head">
            <div className="stack-sm">
              <h2 className="section-title">Choose a layout</h2>
              <p className="body-copy">{selectedLayout.summary}</p>
            </div>

            <Link href="/dashboard/layouts" className="button-secondary">
              Open layout library
            </Link>
          </div>

          <div className="tag-list">
            {layouts.length > 0 ? (
              layouts.map((layout) => (
                <Link
                  key={layout.id}
                  href={`/create?layout=${layout.id}`}
                  className={layout.id === selectedLayout.id ? "button" : "button-secondary"}
                >
                  {layout.title}
                </Link>
              ))
            ) : (
              <span className="chip-muted">{fallbackLayout.title}</span>
            )}
          </div>
        </section>

        <form action={createLessonDraftAction} className="editor-grid">
          <input
            type="hidden"
            name="layoutTemplateId"
            value={selectedLayout.id}
          />

          {selectedLayout.sections.map((section) => (
            <section key={section.id} className="editor-card stack">
              <div className="stack-xs">
                <h2 className="section-title">{section.name}</h2>
                {section.description ? (
                  <p className="body-copy">{section.description}</p>
                ) : null}
              </div>

              {section.widgets.map((widget) => (
                <div key={widget.id} className="field">
                  {getWidgetInputId(widget) ? (
                    <label htmlFor={getWidgetInputId(widget)}>{widget.label}</label>
                  ) : (
                    <label>{widget.label}</label>
                  )}
                  {renderWidget(widget)}
                </div>
              ))}
            </section>
          ))}

          <section className="editor-card stack">
            <div className="subtle-panel">
              Keep up to five drafts at a time so your lesson list stays easy to manage.
            </div>

            <div className="inline-actions">
              <button type="submit" className="button">
                Save draft
              </button>
              <Link href="/dashboard" className="button-secondary">
                Back to dashboard
              </Link>
            </div>
          </section>
        </form>
      </div>
    </section>
  );
}
