import type { TimelineEntry } from "../../lib/types";
import { Timeline } from "../Timeline";
import { Reveal } from "../motion";

export function TimelineBlockView({
  config,
  timeline,
}: {
  config: Record<string, unknown>;
  timeline: TimelineEntry[];
}) {
  const title =
    typeof config.title === "string" && config.title.trim()
      ? config.title
      : "Timeline";
  if (timeline.length === 0) return null;

  return (
    <section className="page-pad pb-16">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-8">
          {title}
        </Reveal>
        <Timeline entries={timeline} />
      </div>
    </section>
  );
}
