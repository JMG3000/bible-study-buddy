import Link from "next/link";
import { signOutAction } from "@/app/login/actions";
import { canReviewReportsRole, getCurrentViewer } from "@/lib/lesson-plans";

export async function SiteHeader() {
  const viewer = await getCurrentViewer();
  const navLinks = [
    { href: "/plans", label: "Browse" },
    { href: "/dashboard", label: "Dashboard" },
    ...(viewer && canReviewReportsRole(viewer.role)
      ? [{ href: "/admin/reports", label: "Reports" }]
      : []),
  ];

  return (
    <header className="site-header no-print">
      <div className="site-header-inner">
        <details className="site-menu">
          <summary className="site-menu-button" aria-label="Open primary navigation">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </summary>

          <div className="site-menu-panel">
            <nav className="site-nav" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="button-secondary header-utility-button site-nav-link"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="site-actions">
              {viewer ? (
                <form action={signOutAction}>
                  <button type="submit" className="button-secondary header-utility-button">
                    Sign out
                  </button>
                </form>
              ) : (
                <Link href="/login" className="button-secondary header-utility-button">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </details>

        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            B
          </span>
          <span className="brand-copy">
            <strong>Bible Study Buddy: Free</strong>
            <span>Structured lessons for small groups or big rooms</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
