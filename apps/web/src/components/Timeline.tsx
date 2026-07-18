import type { TimelineEntry } from "../lib/types";

type TimelineProps = {
  entries: TimelineEntry[];
};

export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="font-body text-graphite/70">Timeline entries will appear here.</p>
    );
  }

  return (
    <ol className="relative border-l border-mist pl-8 space-y-10">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="absolute -left-[2.15rem] top-1.5 h-2.5 w-2.5 rounded-full bg-steel"
            aria-hidden="true"
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
        </li>
      ))}
    </ol>
  );
}
