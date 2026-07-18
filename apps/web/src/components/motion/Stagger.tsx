import { motion, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";
import clsx from "clsx";

const ease = [0.22, 1, 0.36, 1] as const;

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay between children (seconds) */
  stagger?: number;
  /** Delay before first child (seconds) */
  delay?: number;
  as?: ElementType;
  immediate?: boolean;
};

export function Stagger({
  children,
  className,
  stagger = 0.06,
  delay = 0,
  as: Tag = "div",
  immediate = false,
}: StaggerProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion.create(Tag as "div");

  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  if (immediate) {
    return (
      <MotionTag
        className={clsx(className)}
        initial="hidden"
        animate="visible"
        variants={variants}
      >
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={clsx(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -6% 0px", amount: 0.15 }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: ElementType;
};

export function StaggerItem({
  children,
  className,
  y = 10,
  as: Tag = "div",
}: StaggerItemProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion.create(Tag as "div");

  return (
    <MotionTag
      className={clsx(className)}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}
