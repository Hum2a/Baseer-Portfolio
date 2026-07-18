import { Link, NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";

const nav = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/case-studies", label: "Case studies" },
  { to: "/admin/testimonials", label: "Testimonials" },
  { to: "/admin/skills", label: "Skills" },
  { to: "/admin/timeline", label: "Timeline" },
  { to: "/admin/settings", label: "Settings" },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-fog">
      <header className="page-pad border-b border-mist py-5">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <Link to="/admin" className="font-display text-xl font-semibold no-underline">
              Admin
            </Link>
            <Link
              to="/"
              className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/60 no-underline"
            >
              View site
            </Link>
          </div>
        </div>
        <nav
          aria-label="Admin"
          className="mx-auto max-w-5xl mt-4 flex flex-wrap gap-x-4 gap-y-2"
        >
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  "font-mono text-xs uppercase tracking-[0.12em] no-underline",
                  isActive ? "text-steel" : "text-graphite/60 hover:text-steel",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page-pad py-10 mx-auto w-full max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
