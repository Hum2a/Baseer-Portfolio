import type { SpecMetric } from "@baseer-portfolio/shared";
import { computeCareerMetrics } from "../../lib/career-metrics";
import type { CaseStudy, TimelineEntry } from "../../lib/types";
import { SpecStrip } from "../SpecStrip";
import { Reveal } from "../motion";

export function SpecStripBlockView({
  config,
  studies,
  timeline,
}: {
  config: Record<string, unknown>;
  studies: CaseStudy[];
  timeline: TimelineEntry[];
}) {
  const source = config.source === "custom" ? "custom" : "career";
  const custom = (Array.isArray(config.metrics) ? config.metrics : []) as SpecMetric[];
  const metrics = source === "custom" ? custom : computeCareerMetrics(studies, timeline);
  if (metrics.length === 0) return null;

  return (
    <section className="page-pad pb-16">
      <Reveal className="mx-auto max-w-6xl border-y border-mist py-6" y={10}>
        <SpecStrip metrics={metrics} />
      </Reveal>
    </section>
  );
}
