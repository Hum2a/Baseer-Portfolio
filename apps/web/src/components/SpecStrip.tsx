import clsx from "clsx";
import type { SpecMetric } from "@baseer-portfolio/shared";

type SpecStripProps = {
  metrics: SpecMetric[];
  className?: string;
};

export function SpecStrip({ metrics, className }: SpecStripProps) {
  if (metrics.length === 0) return null;

  return (
    <div
      className={clsx(
        "font-mono text-sm tracking-wide text-graphite/90 overflow-x-auto",
        className,
      )}
      role="group"
      aria-label="Specifications"
    >
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 whitespace-nowrap min-w-0 md:whitespace-normal">
        {metrics.map((metric, index) => (
          <span key={`${metric.label}-${index}`} className="inline-flex items-baseline gap-x-2">
            {index > 0 ? (
              <span className="text-mist select-none" aria-hidden="true">
                ·
              </span>
            ) : null}
            <span>
              <span className="text-amber uppercase tracking-[0.08em]">{metric.label}</span>{" "}
              <span className="text-graphite">{metric.value}</span>
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}
