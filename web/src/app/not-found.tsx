import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="shell">
        <div className="empty-state">
          <span className="chip-accent">Not found</span>
          <h1 className="page-title">That page is not available.</h1>
          <p className="lead">
            The link may be unpublished, mistyped, or not part of the public
            catalog yet.
          </p>
          <Link href="/plans" className="button">
            Back to the catalog
          </Link>
        </div>
      </div>
    </section>
  );
}
