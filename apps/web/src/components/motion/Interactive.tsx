import { motion, useReducedMotion } from "motion/react";
import { Link, type LinkProps } from "react-router-dom";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import clsx from "clsx";

type InteractiveLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  /** primary filled CTA vs ghost outline vs text underline */
  variant?: "primary" | "ghost" | "text";
};

const ease = [0.22, 1, 0.36, 1] as const;

export function InteractiveLink({
  children,
  className,
  variant = "text",
  ...props
}: InteractiveLinkProps) {
  const reduce = useReducedMotion();

  const base =
    variant === "primary"
      ? "inline-flex items-center bg-steel text-fog px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] no-underline"
      : variant === "ghost"
        ? "inline-flex items-center border border-mist px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] no-underline"
        : "link-underline no-underline";

  if (reduce) {
    return (
      <Link
        className={clsx(
          base,
          variant === "primary" && "hover:bg-graphite",
          variant === "ghost" && "hover:border-steel",
          className,
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <motion.div className="inline-flex" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.18, ease }}>
      <Link
        className={clsx(
          base,
          "transition-colors duration-[var(--motion-fast)]",
          variant === "primary" && "hover:bg-graphite",
          variant === "ghost" && "hover:border-steel hover:text-steel",
          className,
        )}
        {...props}
      >
        {children}
      </Link>
    </motion.div>
  );
}

type InteractiveAnchorProps = ComponentPropsWithoutRef<"a"> & {
  variant?: "primary" | "ghost" | "text";
};

export function InteractiveAnchor({
  children,
  className,
  variant = "text",
  ...props
}: InteractiveAnchorProps) {
  const reduce = useReducedMotion();

  const base =
    variant === "primary"
      ? "inline-flex items-center bg-steel text-fog px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] no-underline"
      : variant === "ghost"
        ? "inline-flex items-center border border-mist px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] no-underline"
        : "link-underline no-underline";

  if (reduce) {
    return (
      <a
        className={clsx(
          base,
          variant === "primary" && "hover:bg-graphite",
          variant === "ghost" && "hover:border-steel",
          className,
        )}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <motion.div className="inline-flex" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.18, ease }}>
      <a
        className={clsx(
          base,
          "transition-colors duration-[var(--motion-fast)]",
          variant === "primary" && "hover:bg-graphite",
          variant === "ghost" && "hover:border-steel hover:text-steel",
          className,
        )}
        {...props}
      >
        {children}
      </a>
    </motion.div>
  );
}
