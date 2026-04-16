"use client";

import { useState } from "react";
import type { LessonPlan } from "@/lib/types";

type PrintDraft = {
  title: string;
  summary: string;
  teachingObjective: string;
  openingPrayer: string;
  icebreaker: string;
  audience: string;
  traditions: string;
  materials: string;
  discussionQuestions: string;
  activities: string;
  prayerPrompts: string;
  facilitatorNotes: string;
};

function toMultiline(values: string[]) {
  return values.join("\n");
}

function fromMultiline(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderList(items: string[]) {
  if (items.length === 0) {
    return "<p>None provided.</p>";
  }

  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function buildPrintDraft(plan: LessonPlan): PrintDraft {
  return {
    title: plan.title,
    summary: plan.summary,
    teachingObjective: plan.teachingObjective,
    openingPrayer: plan.openingPrayer ?? "",
    icebreaker: plan.icebreaker ?? "",
    audience: plan.audienceTags.join(", "),
    traditions: plan.denominationTags.join(", "),
    materials: toMultiline(plan.materials),
    discussionQuestions: toMultiline(plan.discussionQuestions),
    activities: toMultiline(plan.activities),
    prayerPrompts: toMultiline(plan.prayerPrompts),
    facilitatorNotes: plan.facilitatorNotes ?? "",
  };
}

function buildPrintableHtml(plan: LessonPlan, draft: PrintDraft) {
  const scriptureMarkup = plan.scriptures
    .map((scripture) => `<span class="scripture-pill">${escapeHtml(scripture.displayLabel)}</span>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(draft.title)} | Bible Study Buddy: Free</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; color: #1f1711; margin: 2rem; line-height: 1.5; }
      h1, h2 { color: #24180d; margin-bottom: 0.6rem; }
      h1 { font-size: 2rem; margin-top: 0; }
      h2 { font-size: 1.2rem; margin-top: 1.4rem; }
      .summary { color: #4d3b2f; margin-bottom: 1rem; max-width: 68ch; }
      .meta { display: grid; gap: 0.75rem; padding: 1rem 1.2rem; border: 1px solid #d8cfc3; border-radius: 1rem; margin-bottom: 1.4rem; }
      .label { font-weight: 700; display: block; margin-bottom: 0.3rem; }
      .scriptures { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .scripture-pill { border: 1px solid #d8cfc3; border-radius: 999px; padding: 0.3rem 0.7rem; font-size: 0.95rem; }
      ul { padding-left: 1.2rem; }
      li + li { margin-top: 0.35rem; }
      @media print { body { margin: 0.75in; } }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(draft.title)}</h1>
    <p class="summary">${escapeHtml(draft.summary)}</p>
    <section class="meta">
      <div><span class="label">Scripture focus</span><div class="scriptures">${scriptureMarkup}</div></div>
      <div><span class="label">Audience</span><p>${escapeHtml(draft.audience || "Open to all audiences")}</p></div>
      <div><span class="label">Traditions</span><p>${escapeHtml(draft.traditions || "Broad Christian audience")}</p></div>
      <div><span class="label">Materials</span>${renderList(fromMultiline(draft.materials))}</div>
    </section>
    <section><h2>Teaching objective</h2><p>${escapeHtml(draft.teachingObjective)}</p></section>
    ${draft.openingPrayer ? `<section><h2>Opening prayer</h2><p>${escapeHtml(draft.openingPrayer)}</p></section>` : ""}
    ${draft.icebreaker ? `<section><h2>Icebreaker</h2><p>${escapeHtml(draft.icebreaker)}</p></section>` : ""}
    <section><h2>Discussion questions</h2>${renderList(fromMultiline(draft.discussionQuestions))}</section>
    <section><h2>Activities and next steps</h2>${renderList(fromMultiline(draft.activities))}</section>
    <section><h2>Prayer prompts</h2>${renderList(fromMultiline(draft.prayerPrompts))}</section>
    ${draft.facilitatorNotes ? `<section><h2>Facilitator notes</h2><p>${escapeHtml(draft.facilitatorNotes)}</p></section>` : ""}
  </body>
</html>`;
}

export function PrintButton({ plan }: { plan: LessonPlan }) {
  const [dialogState, setDialogState] = useState<"closed" | "menu" | "edit">("closed");
  const [draft, setDraft] = useState<PrintDraft>(() => buildPrintDraft(plan));

  function closeDialog() {
    setDialogState("closed");
    setDraft(buildPrintDraft(plan));
  }

  function printAsIs() {
    setDialogState("closed");
    window.print();
  }

  function printEditedCopy() {
    const printableWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!printableWindow) {
      return;
    }

    printableWindow.document.open();
    printableWindow.document.write(buildPrintableHtml(plan, draft));
    printableWindow.document.close();
    printableWindow.focus();
    printableWindow.print();
    printableWindow.close();
    closeDialog();
  }

  return (
    <>
      <button
        type="button"
        className="button-secondary"
        onClick={() => setDialogState("menu")}
      >
        Print handout
      </button>

      {dialogState !== "closed" ? (
        <div className="print-prep-backdrop no-print" role="presentation">
          <div className="print-prep-modal surface-card" role="dialog" aria-modal="true">
            {dialogState === "menu" ? (
              <>
                <div className="stack-sm">
                  <h2 className="section-title">Prepare your handout</h2>
                  <p className="body-copy">
                    Print this lesson as-is, or make a temporary edited handout
                    first. Any edits here stay local to this print session and are
                    never saved back to the lesson.
                  </p>
                </div>

                <div className="inline-actions">
                  <button type="button" className="button" onClick={printAsIs}>
                    Print
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setDialogState("edit")}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button-tertiary"
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="stack">
                <div className="stack-sm">
                  <h2 className="section-title">Make edits before print</h2>
                  <p className="body-copy">
                    These changes only apply to the printable handout you are about
                    to create.
                  </p>
                </div>

                <div className="print-prep-grid">
                  <div className="field">
                    <label htmlFor="print-title">Title</label>
                    <input
                      id="print-title"
                      className="input"
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-summary">Summary</label>
                    <textarea
                      id="print-summary"
                      className="textarea"
                      value={draft.summary}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, summary: event.target.value }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-objective">Teaching objective</label>
                    <textarea
                      id="print-objective"
                      className="textarea"
                      value={draft.teachingObjective}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          teachingObjective: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-opening-prayer">Opening prayer</label>
                    <textarea
                      id="print-opening-prayer"
                      className="textarea"
                      value={draft.openingPrayer}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          openingPrayer: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-icebreaker">Icebreaker</label>
                    <textarea
                      id="print-icebreaker"
                      className="textarea"
                      value={draft.icebreaker}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, icebreaker: event.target.value }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-audience">Audience</label>
                    <input
                      id="print-audience"
                      className="input"
                      value={draft.audience}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, audience: event.target.value }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-traditions">Traditions</label>
                    <input
                      id="print-traditions"
                      className="input"
                      value={draft.traditions}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, traditions: event.target.value }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-materials">Materials</label>
                    <textarea
                      id="print-materials"
                      className="textarea"
                      value={draft.materials}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, materials: event.target.value }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-questions">Discussion questions</label>
                    <textarea
                      id="print-questions"
                      className="textarea"
                      value={draft.discussionQuestions}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          discussionQuestions: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-activities">Activities and next steps</label>
                    <textarea
                      id="print-activities"
                      className="textarea"
                      value={draft.activities}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, activities: event.target.value }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-prayer-prompts">Prayer prompts</label>
                    <textarea
                      id="print-prayer-prompts"
                      className="textarea"
                      value={draft.prayerPrompts}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          prayerPrompts: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="print-facilitator-notes">Facilitator notes</label>
                    <textarea
                      id="print-facilitator-notes"
                      className="textarea"
                      value={draft.facilitatorNotes}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          facilitatorNotes: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="inline-actions">
                  <button type="button" className="button" onClick={printEditedCopy}>
                    Print
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setDialogState("menu")}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="button-tertiary"
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
