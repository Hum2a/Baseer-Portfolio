import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import type { Sector } from "@baseer-portfolio/shared";
import type { CaseStudy } from "../lib/types";
import { mediaFileUrl } from "../lib/api-client";
import { SpecStrip } from "./SpecStrip";
import { Reveal, Stagger, StaggerItem } from "./motion";

const SECTOR_LABELS: Record<Sector, string> = {
  automotive: "Automotive",
  charity: "Charity",
  education: "Education",
};

type SectorIndexProps = {
  sector: Sector;
  studies: CaseStudy[];
};

const ease = [0.22, 1, 0.36, 1] as const;

export function SectorIndex({ sector, studies }: SectorIndexProps) {
  const reduce = useReducedMotion();

  return (
    <section className="page-pad section-y mx-auto max-w-6xl">
      <header className="mb-12 md:mb-16">
        <Reveal
          immediate
          as="p"
          className="font-mono text-xs uppercase tracking-[0.16em] text-steel mb-3"
          y={8}
        >
          Sector
        </Reveal>
        <Reveal
          immediate
          as="h1"
          delay={0.06}
          className="font-display text-4xl md:text-5xl font-semibold tracking-tight"
        >
          {SECTOR_LABELS[sector]}
        </Reveal>
        <motion.div
          className="mt-6 h-px w-24 bg-mist origin-left"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
        />
      </header>

      {studies.length === 0 ? (
        <Reveal as="p" className="font-body text-lg text-graphite/70 measure">
          No published case studies in this sector yet.
        </Reveal>
      ) : (
        <Stagger as="ul" stagger={0.09} className="divide-y divide-mist">
          {studies.map((study) => {
            const hero = mediaFileUrl(study.heroImageKey);
            return (
              <StaggerItem key={study.id} as="li" className="py-10 first:pt-0" y={14}>
                <Link
                  to={`/work/${study.slug}`}
                  className="group grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-end no-underline"
                >
                  <div>
                    <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight transition-theme group-hover:text-steel">
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
                      <motion.img
                        src={hero}
                        alt=""
                        className="h-full w-full object-cover"
                        whileHover={reduce ? undefined : { scale: 1.03 }}
                        transition={{ duration: 0.55, ease }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-mist/50" aria-hidden="true" />
                  )}
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </section>
  );
}
