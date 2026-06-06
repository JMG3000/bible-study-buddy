import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintCurrentPageButton } from "@/components/print-current-page-button";
import {
  formatDate,
  getPrintedLessonLogById,
} from "@/lib/lesson-plans";
import { getLessonPlanLayoutTemplate } from "@/lib/layout-templates";
import type { LayoutTemplate } from "@/lib/types";
import {
  archivePrintedLogAction,
  deletePrintedLogAction,
  duplicatePrintedLogAction,
  updatePrintedLogAction,
} from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getPrintedLessonLogById(id);

  if (!entry) {
    notFound();
  }

  return {
    title: `Print Log: ${entry.printTitle}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readList(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => String(entry)).filter(Boolean)
    : [];
}

function toMultiline(value: unknown) {
  return readList(value).join("\n");
}

function readLayoutFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function humanizeFieldKey(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildLayoutFieldLabels(template: LayoutTemplate | null) {
  const labels = new Map<string, string>();

  for (const section of template?.sections ?? []) {
    for (const widget of section.widgets) {
      labels.set(widget.fieldKey, widget.label || humanizeFieldKey(widget.fieldKey));
    }
  }

  return labels;
}

function formatFieldValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entryValue) => String(entryValue)).join("\n");
  }

  return readString(value);
}

function PreviewList({
  items,
  title,
  ordered = false,
}: {
  items: string[];
  title: string;
  ordered?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  const ListTag = ordered ? "ol" : "ul";

  return (
    <section className="saved-handout-section stack-xs">
      <h2 className="section-title">{title}</h2>
      <ListTag className={ordered ? "numbered-list" : "bullet-list"}>
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="list-copy">
            {item}
          </li>
        ))}
      </ListTag>
    </section>
  );
}

function readValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function PrintedLessonLogDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const entry = await getPrintedLessonLogById(id);

  if (!entry) {
    notFound();
  }

  const layoutTemplate = await getLessonPlanLayoutTemplate(entry.layoutTemplateId);
  const layoutFieldLabels = buildLayoutFieldLabels(layoutTemplate);
  const payload = entry.printPayload;
  const layoutFields = readLayoutFields(payload.layoutFields);
  const layoutFieldEntries = Object.entries(layoutFields).map(([fieldKey, value]) => ({
    fieldKey,
    label: layoutFieldLabels.get(fieldKey) ?? humanizeFieldKey(fieldKey),
    value: formatFieldValue(value),
  }));
  const savedMessage = readValue(resolvedSearchParams, "saved");
  const errorMessage = readValue(resolvedSearchParams, "error");
  const sourceHref = entry.lessonSlug ? `/plans/${entry.lessonSlug}` : null;
  const materials = readList(payload.materials);
  const discussionQuestions = readList(payload.discussionQuestions);
  const activities = readList(payload.activities);
  const prayerPrompts = readList(payload.prayerPrompts);

  return (
    <section className="section">
      <div className="shell stack">
        <div className="section-head no-print">
          <div className="stack-sm">
            <span className="eyebrow">Private handout</span>
            <h1 className="page-title">{entry.printTitle}</h1>
            <p className="lead">
              Edit this saved handout without changing the public lesson.
            </p>
          </div>

          <div className="inline-actions">
            <PrintCurrentPageButton />
            <Link href="/dashboard/printed" className="button-secondary">
              Back to print log
            </Link>
            {sourceHref ? (
              <Link href={sourceHref} className="button-tertiary">
                Open source lesson
              </Link>
            ) : null}
          </div>
        </div>

        {savedMessage ? (
          <div className="helper-banner no-print" role="status">
            {savedMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="helper-banner no-print" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <article className="surface-card saved-handout-preview stack">
          <div className="stack-sm">
            <span className="eyebrow">Private saved handout</span>
            <h1 className="page-title">{entry.printTitle}</h1>
            {entry.printSummary ? (
              <p className="lead">{entry.printSummary}</p>
            ) : null}
            <p className="body-copy">Source lesson: {entry.lessonTitle}</p>
          </div>

          {readString(payload.teachingObjective) ? (
            <section className="saved-handout-section stack-xs">
              <h2 className="section-title">Teaching objective</h2>
              <p className="body-copy">{readString(payload.teachingObjective)}</p>
            </section>
          ) : null}

          {readString(payload.openingPrayer) ? (
            <section className="saved-handout-section stack-xs">
              <h2 className="section-title">Opening prayer</h2>
              <p className="body-copy">{readString(payload.openingPrayer)}</p>
            </section>
          ) : null}

          {readString(payload.icebreaker) ? (
            <section className="saved-handout-section stack-xs">
              <h2 className="section-title">Icebreaker</h2>
              <p className="body-copy">{readString(payload.icebreaker)}</p>
            </section>
          ) : null}

          <PreviewList title="Materials" items={materials} />
          <PreviewList title="Discussion questions" items={discussionQuestions} ordered />
          <PreviewList title="Activities and next steps" items={activities} />
          <PreviewList title="Prayer prompts" items={prayerPrompts} />

          {layoutFieldEntries.length > 0 ? (
            <section className="saved-handout-section stack-sm">
              <h2 className="section-title">
                {layoutTemplate?.title ?? "Custom layout notes"}
              </h2>
              {layoutFieldEntries.map((field) =>
                field.value ? (
                  <div className="subtle-panel stack-xs" key={field.fieldKey}>
                    <strong>{field.label}</strong>
                    <p className="body-copy">{field.value}</p>
                  </div>
                ) : null,
              )}
            </section>
          ) : null}

          {readString(payload.facilitatorNotes) ? (
            <section className="saved-handout-section stack-xs">
              <h2 className="section-title">Facilitator notes</h2>
              <p className="body-copy">{readString(payload.facilitatorNotes)}</p>
            </section>
          ) : null}
        </article>

        <form className="editor-grid no-print" action={updatePrintedLogAction}>
          <input type="hidden" name="id" value={entry.id} />

          <section className="editor-card stack">
            <div className="meta-row">
              <span className="chip-accent">Private</span>
              <span>Saved {formatDate(entry.createdAt)}</span>
              <span>Updated {formatDate(entry.updatedAt)}</span>
            </div>

            <div className="field">
              <label htmlFor="printTitle">Handout title</label>
              <input
                id="printTitle"
                name="printTitle"
                className="input"
                defaultValue={entry.printTitle}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="printSummary">Summary</label>
              <textarea
                id="printSummary"
                name="printSummary"
                className="textarea"
                defaultValue={entry.printSummary}
              />
            </div>

            <div className="subtle-panel stack-xs">
              <strong>Source lesson</strong>
              <p className="body-copy">{entry.lessonTitle}</p>
            </div>
          </section>

          <section className="editor-card stack">
            <h2 className="section-title">Lesson body</h2>

            <div className="field">
              <label htmlFor="teachingObjective">Teaching objective</label>
              <textarea
                id="teachingObjective"
                name="teachingObjective"
                className="textarea"
                defaultValue={readString(payload.teachingObjective)}
              />
            </div>

            <div className="field">
              <label htmlFor="openingPrayer">Opening prayer</label>
              <textarea
                id="openingPrayer"
                name="openingPrayer"
                className="textarea"
                defaultValue={readString(payload.openingPrayer)}
              />
            </div>

            <div className="field">
              <label htmlFor="icebreaker">Icebreaker</label>
              <textarea
                id="icebreaker"
                name="icebreaker"
                className="textarea"
                defaultValue={readString(payload.icebreaker)}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="audience">Audience</label>
                <input
                  id="audience"
                  name="audience"
                  className="input"
                  defaultValue={readString(payload.audience)}
                />
              </div>
              <div className="field">
                <label htmlFor="traditions">Traditions</label>
                <input
                  id="traditions"
                  name="traditions"
                  className="input"
                  defaultValue={readString(payload.traditions)}
                />
              </div>
            </div>
          </section>

          <section className="editor-card stack">
            <h2 className="section-title">Handout lists</h2>

            <div className="field">
              <label htmlFor="materials">Materials</label>
              <textarea
                id="materials"
                name="materials"
                className="textarea"
                placeholder="One item per line"
                defaultValue={toMultiline(payload.materials)}
              />
            </div>

            <div className="field">
              <label htmlFor="discussionQuestions">Discussion questions</label>
              <textarea
                id="discussionQuestions"
                name="discussionQuestions"
                className="textarea"
                placeholder="One item per line"
                defaultValue={toMultiline(payload.discussionQuestions)}
              />
            </div>

            <div className="field">
              <label htmlFor="activities">Activities</label>
              <textarea
                id="activities"
                name="activities"
                className="textarea"
                placeholder="One item per line"
                defaultValue={toMultiline(payload.activities)}
              />
            </div>

            <div className="field">
              <label htmlFor="prayerPrompts">Prayer prompts</label>
              <textarea
                id="prayerPrompts"
                name="prayerPrompts"
                className="textarea"
                placeholder="One item per line"
                defaultValue={toMultiline(payload.prayerPrompts)}
              />
            </div>

            <div className="field">
              <label htmlFor="facilitatorNotes">Facilitator notes</label>
              <textarea
                id="facilitatorNotes"
                name="facilitatorNotes"
                className="textarea"
                defaultValue={readString(payload.facilitatorNotes)}
              />
            </div>
          </section>

          {layoutFieldEntries.length > 0 ? (
            <section className="editor-card stack">
              <h2 className="section-title">Layout fields</h2>
              {layoutFieldEntries.map((field) => (
                <div className="field" key={field.fieldKey}>
                  <label htmlFor={`layoutField-${field.fieldKey}`}>
                    {field.label}
                  </label>
                  <textarea
                    id={`layoutField-${field.fieldKey}`}
                    name={`layoutField:${field.fieldKey}`}
                    className="textarea"
                    defaultValue={field.value}
                  />
                </div>
              ))}
            </section>
          ) : null}

          <section className="editor-card stack no-print">
            <h2 className="section-title">Save options</h2>
            <p className="body-copy">
              Overwrite this private handout, or save your edits as a separate
              copy for reuse later.
            </p>
            <div className="inline-actions">
              <button type="submit" className="button">
                Save changes
              </button>
              <button
                type="submit"
                formAction={duplicatePrintedLogAction}
                className="button-secondary"
              >
                Save as new copy
              </button>
              <button
                type="submit"
                formAction={archivePrintedLogAction}
                className="button-tertiary"
              >
                Archive handout
              </button>
              <button
                type="submit"
                formAction={deletePrintedLogAction}
                className="button-tertiary"
              >
                Delete handout
              </button>
            </div>
          </section>
        </form>
      </div>
    </section>
  );
}
