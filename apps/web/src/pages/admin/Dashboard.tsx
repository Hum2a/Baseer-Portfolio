import { Link } from "react-router-dom";

const links = [
  { to: "/admin/case-studies", label: "Case studies", hint: "Create and reorder work" },
  { to: "/admin/testimonials", label: "Testimonials", hint: "Quotes and attribution" },
  { to: "/admin/skills", label: "Skills", hint: "Capability matrix" },
  { to: "/admin/timeline", label: "Timeline", hint: "Career entries" },
  { to: "/admin/settings", label: "Settings", hint: "Intro, contact, CV" },
];

export function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-3 font-body text-graphite/70">Manage portfolio content.</p>
      <ul className="mt-10 divide-y divide-mist">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 py-5 no-underline hover:text-steel"
            >
              <span className="font-display text-xl font-medium">{link.label}</span>
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
                {link.hint}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
