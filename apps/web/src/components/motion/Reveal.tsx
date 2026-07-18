import { motion, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";
import clsx from "clsx";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in seconds */
  delay?: number;
  /** Vertical offset in px (default 12) */
  y?: number;
  as?: ElementType;
  /** Animate on mount instead of whileInView */
  immediate?: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 12,
  as: Tag = "div",
  immediate = false,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  const hidden = { opacity: 0, y };
  const visible = {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease },
  };

  // Polymorphic motion tag — cast keeps TS happy across element types
  const MotionTag = motion.create(Tag as "div");

  if (immediate) {
    return (
      <MotionTag className={clsx(className)} initial={hidden} animate={visible}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={clsx(className)}
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, margin: "0px 0px -8% 0px", amount: 0.2 }}
    >
      {children}
    </MotionTag>
  );
}
