import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { ThemeSwitcher } from "./ThemeSwitcher";

const links = [
  { to: "/automotive", label: "Automotive" },
  { to: "/charity", label: "Charity" },
  { to: "/education", label: "Education" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="page-pad pt-6 pb-4 md:pt-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <NavLink
          to="/"
          className="font-display text-2xl md:text-3xl font-semibold tracking-tight no-underline hover:text-graphite"
        >
          Baseer
        </NavLink>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <nav aria-label="Primary" className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    "font-mono text-xs uppercase tracking-[0.12em] no-underline",
                    isActive ? "text-steel" : "text-graphite/70 hover:text-steel",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <ThemeSwitcher />
        </div>
      </div>
      <div className="mx-auto max-w-6xl mt-5 h-px bg-mist" />
    </header>
  );
}
