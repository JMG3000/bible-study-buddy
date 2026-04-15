import type { Metadata } from "next";
import { bibleBooks } from "@/lib/bible-books";
import {
  audienceOptions,
  denominationOptions,
  topicOptions,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Create a Lesson",
  description:
    "Structured editor scaffold for drafting Bible study lessons with normalized scripture references.",
};

export default function CreatePage() {
  return (
    <section className="section">
      <div className="shell stack">
        <div className="stack-sm">
          <span className="eyebrow">Authoring surface</span>
          <h1 className="page-title">Structured lesson editor</h1>
          <p className="lead">
            This page is scaffolded to match the production lesson schema. Once
            Supabase auth and server actions are connected, these fields become
            the live draft and publish workflow.
          </p>
        </div>

        <div className="helper-banner">
          The current form is intentionally read-only. The live read layer is in
          place; the next implementation step is wiring authenticated mutations.
        </div>

        <div className="editor-grid">
          <section className="editor-card">
            <div className="field">
              <label htmlFor="title">Lesson title</label>
              <input
                id="title"
                className="input"
                defaultValue="A new Bible study lesson"
                readOnly
              />
            </div>

            <div className="field">
              <label htmlFor="summary">Summary</label>
              <textarea
                id="summary"
                className="textarea"
                defaultValue="A concise overview that will appear in the public catalog and SEO metadata."
                readOnly
              />
            </div>

            <div className="field">
              <label htmlFor="objective">Teaching objective</label>
              <textarea
                id="objective"
                className="textarea"
                defaultValue="Describe the change, understanding, or response this lesson is designed to produce."
                readOnly
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="duration">Duration</label>
                <input id="duration" className="input" defaultValue="45" readOnly />
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <input id="status" className="input" defaultValue="draft" readOnly />
              </div>
            </div>
          </section>

          <section className="editor-card">
            <h2 className="section-title">Scripture selector</h2>
            <div className="field-row">
              <div className="field">
                <label htmlFor="book">Book</label>
                <select id="book" className="select" defaultValue="acts" disabled>
                  {bibleBooks.map((book) => (
                    <option key={book.slug} value={book.slug}>
                      {book.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="chapter-start">Chapter start</label>
                <input id="chapter-start" className="input" defaultValue="2" readOnly />
              </div>
              <div className="field">
                <label htmlFor="verse-start">Verse start</label>
                <input id="verse-start" className="input" defaultValue="42" readOnly />
              </div>
              <div className="field">
                <label htmlFor="chapter-end">Chapter end</label>
                <input id="chapter-end" className="input" defaultValue="2" readOnly />
              </div>
              <div className="field">
                <label htmlFor="verse-end">Verse end</label>
                <input id="verse-end" className="input" defaultValue="47" readOnly />
              </div>
            </div>

            <div className="subtle-panel">
              The production write path will turn these numeric values into
              relational scripture ranges and generated display labels instead
              of storing free-text references.
            </div>
          </section>

          <section className="editor-card">
            <div className="field">
              <label>Topic tags</label>
              <div className="tag-list">
                {topicOptions.map((topic) => (
                  <span key={topic} className="chip-muted">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Audience tags</label>
              <div className="tag-list">
                {audienceOptions.map((audience) => (
                  <span key={audience} className="chip-muted">
                    {audience}
                  </span>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Denomination tags</label>
              <div className="tag-list">
                {denominationOptions.map((denomination) => (
                  <span key={denomination} className="chip-muted">
                    {denomination}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
