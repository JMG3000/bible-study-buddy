import Link from "next/link";

const navLinks = [
  { href: "/plans", label: "Browse Plans" },
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin/reports", label: "Moderation" },
  { href: "/login", label: "Sign In" },
];

export function SiteHeader() {
  return (
    <header className="site-header no-print">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Bible Study Buddy: Free home">
          <span className="brand-mark">B</span>
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
        </div>
      </div>
    </header>
  );
}
