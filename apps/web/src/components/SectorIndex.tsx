import { Link } from "react-router-dom";
import type { Sector } from "@baseer-portfolio/shared";
import type { CaseStudy } from "../lib/types";
import { mediaFileUrl } from "../lib/api-client";
import { SpecStrip } from "./SpecStrip";

const SECTOR_LABELS: Record<Sector, string> = {
  automotive: "Automotive",
  charity: "Charity",
  education: "Education",
};

type SectorIndexProps = {
  sector: Sector;
  studies: CaseStudy[];
};

export function SectorIndex({ sector, studies }: SectorIndexProps) {
  return (
    <section className="page-pad section-y mx-auto max-w-6xl">
      <header className="mb-12 md:mb-16">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-steel mb-3">
          Sector
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
          {SECTOR_LABELS[sector]}
        </h1>
        <div className="mt-6 h-px w-24 bg-mist origin-left animate-rule" />
      </header>

      {studies.length === 0 ? (
        <p className="font-body text-lg text-graphite/70 measure">
          No published case studies in this sector yet.
        </p>
      ) : (
        <ul className="divide-y divide-mist">
          {studies.map((study) => {
            const hero = mediaFileUrl(study.heroImageKey);
            return (
              <li key={study.id} className="py-10 first:pt-0">
                <Link
                  to={`/work/${study.slug}`}
                  className="group grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end no-underline"
                >
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight group-hover:text-steel transition-colors">
                      {study.title}
                    </h2>
                    <p className="mt-3 font-body text-base md:text-lg text-graphite/80 measure">
                      {study.dek}
                    </p>
                    {study.specMetrics.length > 0 ? (
                      <SpecStrip metrics={study.specMetrics.slice(0, 3)} className="mt-5" />
                    ) : null}
                  </div>
                  {hero ? (
                    <div className="aspect-[4/3] overflow-hidden bg-mist/40">
                      <img
                        src={hero}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-mist/50" aria-hidden="true" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
