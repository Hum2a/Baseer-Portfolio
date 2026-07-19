import { Link } from "react-router-dom";
import { sectors, type Sector } from "@baseer-portfolio/shared";
import type { CaseStudy, SectorRecord } from "../../lib/types";
import { Reveal, Stagger, StaggerItem } from "../motion";

export function SectorGridBlock({
  config,
  studies,
  sectors: sectorRows,
}: {
  config: Record<string, unknown>;
  studies: CaseStudy[];
  sectors: SectorRecord[];
}) {
  const title =
    typeof config.title === "string" && config.title.trim()
      ? config.title
      : "Sectors";
  const slugs = (
    Array.isArray(config.sectorSlugs) ? config.sectorSlugs : [...sectors]
  ) as Sector[];
  const blurbs = (config.blurbOverrides ?? {}) as Partial<Record<Sector, string>>;

  return (
    <section className="page-pad section-y pt-0">
      <div className="mx-auto max-w-6xl">
        <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-10">
          {title}
        </Reveal>
        <Stagger as="ul" stagger={0.1} className="grid gap-10 md:grid-cols-3">
          {slugs.map((slug) => {
            const meta = sectorRows.find((s) => s.slug === slug);
            const count = studies.filter((s) => s.sector === slug).length;
            const label = meta?.label ?? slug.charAt(0).toUpperCase() + slug.slice(1);
            const blurb =
              blurbs[slug] ||
              meta?.intro ||
              "Campaign work across this sector.";
            return (
              <StaggerItem key={slug} as="li" className="border-t border-mist pt-5" y={12}>
                <Link
                  to={`/${slug}`}
                  className="group no-underline block transition-theme"
                >
                  <h3 className="font-display text-xl font-medium transition-theme group-hover:text-steel group-hover:translate-x-0.5">
                    {label}
                  </h3>
                  <p className="mt-3 font-body text-graphite/75 measure">{blurb}</p>
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-amber">
                    {count} case {count === 1 ? "study" : "studies"}
                  </p>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
