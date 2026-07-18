import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import { ThemeSwitcher } from "./ThemeSwitcher";

const links = [
  { to: "/automotive", label: "Automotive" },
  { to: "/charity", label: "Charity" },
  { to: "/education", label: "Education" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function SiteHeader() {
  const reduce = useReducedMotion();

  return (
    <motion.header
      className="page-pad pt-6 pb-4 md:pt-8"
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
    >
      <div className="mx-auto max-w-6xl flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <NavLink
          to="/"
          className="font-display text-2xl md:text-3xl font-semibold tracking-tight no-underline transition-theme hover:opacity-80"
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
                    "nav-link font-mono text-xs uppercase tracking-[0.12em]",
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
      <motion.div
        className="mx-auto max-w-6xl mt-5 h-px bg-mist origin-left"
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, ease, delay: 0.15 }}
      />
    </motion.header>
  );
}
