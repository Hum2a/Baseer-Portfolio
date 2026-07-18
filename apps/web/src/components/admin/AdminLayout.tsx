import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { signOut, useSession } from "../../lib/auth-client";

const nav = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/case-studies", label: "Case studies" },
  { to: "/admin/testimonials", label: "Testimonials" },
  { to: "/admin/skills", label: "Skills" },
  { to: "/admin/timeline", label: "Timeline" },
  { to: "/admin/settings", label: "Settings" },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "block px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] no-underline border-l-2 transition-colors",
              isActive
                ? "border-steel text-steel bg-mist/40"
                : "border-transparent text-graphite/55 hover:text-steel hover:border-mist",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function AdminLayout() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-fog flex">
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-mist bg-gradient-to-b from-fog via-fog to-mist/30 sticky top-0 h-screen">
        <div className="px-5 pt-7 pb-6 border-b border-mist">
          <Link to="/admin" className="no-underline">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel">
              Baseer Studio
            </p>
            <p className="mt-1 font-display text-xl font-semibold tracking-tight">
              Admin
            </p>
          </Link>
        </div>
        <nav aria-label="Admin" className="flex-1 py-4 px-2 space-y-0.5">
          <NavItems />
        </nav>
        <div className="px-5 py-5 border-t border-mist space-y-3">
          <p className="font-mono text-[10px] text-graphite/45 truncate">
            {session?.user?.email}
          </p>
          <Link
            to="/"
            className="block font-mono text-xs uppercase tracking-[0.12em] text-graphite/55 no-underline hover:text-steel"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/55 hover:text-amber"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-20 border-b border-mist bg-fog/95 backdrop-blur-sm">
          <div className="page-pad py-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-steel">
                Baseer Studio
              </p>
              <p className="font-display text-lg font-semibold">Admin</p>
            </div>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="admin-mobile-nav"
              onClick={() => setOpen((v) => !v)}
              className="font-mono text-xs uppercase tracking-[0.12em] text-steel border border-mist px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-steel"
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
          {open ? (
            <nav
              id="admin-mobile-nav"
              aria-label="Admin"
              className="border-t border-mist px-2 py-3 space-y-0.5 motion-safe:animate-[fade-up_0.25s_ease-out]"
            >
              <NavItems onNavigate={() => setOpen(false)} />
              <div className="px-3 pt-3 mt-2 border-t border-mist space-y-2">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="block font-mono text-xs uppercase tracking-[0.12em] text-graphite/55 no-underline"
                >
                  View site
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/55"
                >
                  Sign out
                </button>
              </div>
            </nav>
          ) : null}
        </header>

        <main className="page-pad py-8 lg:py-10 mx-auto w-full max-w-5xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
