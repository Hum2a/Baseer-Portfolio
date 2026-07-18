import { motion, useReducedMotion } from "motion/react";
import type { TimelineEntry } from "../lib/types";
import { Stagger, StaggerItem } from "./motion";

type TimelineProps = {
  entries: TimelineEntry[];
};

const ease = [0.22, 1, 0.36, 1] as const;

export function Timeline({ entries }: TimelineProps) {
  const reduce = useReducedMotion();

  if (entries.length === 0) {
    return (
      <p className="font-body text-graphite/70">Timeline entries will appear here.</p>
    );
  }

  return (
    <div className="relative">
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-px bg-mist origin-top"
        initial={reduce ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease }}
        aria-hidden
      />
      <Stagger as="ol" stagger={0.08} className="relative pl-8 space-y-10">
        {entries.map((entry) => (
          <StaggerItem key={entry.id} as="li" className="relative">
            <motion.span
              className="absolute -left-[2.15rem] top-1.5 h-2.5 w-2.5 rounded-full bg-steel"
              aria-hidden="true"
              initial={reduce ? false : { scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease, delay: 0.1 }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-amber">
              {entry.yearRange}
            </p>
            <h3 className="mt-2 font-display text-xl font-medium tracking-tight">
              {entry.title}
            </h3>
            <p className="mt-1 font-body text-graphite/80">{entry.organisation}</p>
            {entry.description ? (
              <p className="mt-3 font-body text-base text-graphite/75 measure">
                {entry.description}
              </p>
            ) : null}
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
