import { Link } from "react-router-dom";
import type { Sector } from "@baseer-portfolio/shared";
import { mediaFileUrl } from "../../lib/api-client";
import type { CaseStudy } from "../../lib/types";
import { SpecStrip } from "../SpecStrip";
import { Reveal, Stagger, StaggerItem } from "../motion";

export function FeaturedWorkBlock({
  config,
  studies,
  pageSector,
}: {
  config: Record<string, unknown>;
  studies: CaseStudy[];
  pageSector: Sector | null;
}) {
  const title =
    typeof config.title === "string" && config.title.trim()
      ? config.title
      : "Selected work";
  const ids = (Array.isArray(config.caseStudyIds) ? config.caseStudyIds : []) as string[];
  const limit =
    typeof config.limit === "number" && config.limit > 0 ? config.limit : 6;

  let list: CaseStudy[];
  if (ids.length > 0) {
    const map = new Map(studies.map((s) => [s.id, s]));
    list = ids.map((id) => map.get(id)).filter(Boolean) as CaseStudy[];
  } else if (pageSector) {
    list = studies.filter((s) => s.sector === pageSector).slice(0, limit);
  } else {
    list = studies.slice(0, limit);
  }

  return (
    <section className="page-pad section-y pt-0">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-8">
          {title}
        </Reveal>
        {list.length === 0 ? (
          <p className="font-body text-lg text-graphite/70 measure">
            No published case studies yet.
          </p>
        ) : (
          <Stagger as="ul" stagger={0.09} className="divide-y divide-mist">
            {list.map((study) => {
              const hero = mediaFileUrl(study.heroImageKey);
              return (
                <StaggerItem key={study.id} as="li" className="py-8" y={12}>
                  <Link to={`/work/${study.slug}`} className="group no-underline block">
                    <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.12em] text-steel mb-2 capitalize">
                          {study.sector}
                        </p>
                        <h3 className="font-display text-2xl font-medium tracking-tight transition-theme group-hover:text-steel">
                          {study.title}
                        </h3>
                        <p className="mt-3 font-body text-graphite/75 measure">{study.dek}</p>
                        {study.specMetrics.length > 0 ? (
                          <div className="mt-5">
                            <SpecStrip metrics={study.specMetrics} />
                          </div>
                        ) : null}
                      </div>
                      {hero ? (
                        <img
                          src={hero}
                          alt=""
                          className="w-full aspect-[16/10] object-cover bg-mist/30"
                        />
                      ) : null}
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </section>
  );
}
