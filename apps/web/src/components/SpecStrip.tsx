import clsx from "clsx";
import type { SpecMetric } from "@baseer-portfolio/shared";
import { Stagger, StaggerItem } from "./motion";

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
      <Stagger
        as="div"
        stagger={0.05}
        className="flex flex-wrap items-baseline gap-x-2 gap-y-1 whitespace-nowrap min-w-0 md:whitespace-normal"
      >
        {metrics.map((metric, index) => (
          <StaggerItem
            key={`${metric.label}-${index}`}
            as="span"
            className="inline-flex items-baseline gap-x-2"
            y={6}
          >
            {index > 0 ? (
              <span className="text-mist select-none" aria-hidden="true">
                ·
              </span>
            ) : null}
            <span>
              <span className="text-amber uppercase tracking-[0.08em]">{metric.label}</span>{" "}
              <span className="text-graphite">{metric.value}</span>
            </span>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
