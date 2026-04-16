import Link from "next/link";
import { signOutAction } from "@/app/login/actions";
import { getCurrentViewer } from "@/lib/lesson-plans";

export async function SiteHeader() {
  const viewer = await getCurrentViewer();
  const navLinks = viewer
    ? [
        { href: "/plans", label: "Browse Plans" },
        { href: "/create", label: "Create" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/settings/profile", label: "Profile" },
        ...(viewer.role === "admin"
          ? [{ href: "/admin/reports", label: "Moderation" }]
          : []),
      ]
    : [
        { href: "/plans", label: "Browse Plans" },
        { href: "/create", label: "Create" },
        { href: "/login", label: "Sign In" },
      ];

  return (
    <header className="site-header no-print">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            B
          </span>
          <span className="brand-copy">
            <strong>Bible Study Buddy: Free</strong>
            <span>Structured lessons for small groups and classrooms</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          <Link href="/create" className="button-secondary">
            Start a Lesson
          </Link>

          {viewer ? (
            <form action={signOutAction}>
              <button type="submit" className="button-tertiary">
                Sign out
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
