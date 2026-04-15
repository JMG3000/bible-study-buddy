export function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <div className="site-footer-inner footer-shell">
        <div className="stack-sm">
          <strong className="card-title">Built for pastors, teachers, and hosts</strong>
          <p className="footer-copy">
            Bible Study Buddy: Free includes the public catalog, creator
            dashboard, admin review surface, Supabase schema, and revalidation
            endpoint from the approved v1 plan.
          </p>
        </div>

        <p className="footer-copy">
          Next steps: connect Supabase env vars, apply the SQL migration, then
          wire auth and server actions for saving drafts, publishing lessons,
          favorites, and reporting.
        </p>
      </div>
    </footer>
  );
}
