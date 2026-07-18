import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { sectors, type Sector } from "@baseer-portfolio/shared";
import { apiFetch } from "../lib/api-client";
import { computeCareerMetrics } from "../lib/career-metrics";
import type { CaseStudy, SiteSettings, TimelineEntry } from "../lib/types";
import { SpecStrip } from "../components/SpecStrip";
import { TestimonialBlock } from "../components/TestimonialBlock";
import { DocumentTitle } from "../components/DocumentTitle";
import {
  InteractiveLink,
  Reveal,
  Stagger,
  StaggerItem,
} from "../components/motion";
import type { Testimonial } from "../lib/types";

const SECTOR_COPY: Record<Sector, string> = {
  automotive: "Launches, retail theatre, and product storytelling.",
  charity: "Cause campaigns with measurable public response.",
  education: "Enrolment, reputation, and student-facing narratives.",
};

const ease = [0.22, 1, 0.36, 1] as const;

export function HomePage() {
  const reduce = useReducedMotion();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [s, cs, tl, tm] = await Promise.all([
          apiFetch<SiteSettings>("/settings/public"),
          apiFetch<CaseStudy[]>("/case-studies/public"),
          apiFetch<TimelineEntry[]>("/timeline/public"),
          apiFetch<Testimonial[]>("/testimonials/public"),
        ]);
        if (cancelled) return;
        setSettings(s);
        setStudies(cs);
        setTimeline(tl);
        setTestimonials(tm.slice(0, 1));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = computeCareerMetrics(studies, timeline);

  return (
    <>
      <DocumentTitle
        title={
          settings?.introHeadline
            ? `${settings.introHeadline} — Baseer`
            : "Baseer — Marketing Portfolio"
        }
      />
      <section className="page-pad pt-10 md:pt-16 pb-12 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <Reveal
            immediate
            as="p"
            className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[0.95]"
            y={14}
          >
            Baseer
          </Reveal>
          <motion.div
            className="mt-8 h-px w-full max-w-md bg-mist origin-left"
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.12 }}
          />
          <Reveal
            immediate
            as="h1"
            delay={0.18}
            className="mt-8 font-display text-2xl md:text-3xl font-medium tracking-tight text-graphite max-w-2xl"
          >
            {settings?.introHeadline ?? "Marketing that moves people and markets."}
          </Reveal>
          <Reveal
            immediate
            as="p"
            delay={0.26}
            className="mt-5 font-body text-lg md:text-xl text-graphite/80 measure"
          >
            {settings?.introSubhead ??
              "Campaigns and launches across automotive, charity, and education."}
          </Reveal>
          <Reveal immediate delay={0.34} className="mt-10 flex flex-wrap gap-4" y={8}>
            <InteractiveLink to="/automotive" variant="primary">
              View work
            </InteractiveLink>
            <InteractiveLink to="/about" variant="ghost">
              About
            </InteractiveLink>
          </Reveal>
        </div>
      </section>

      <section className="page-pad pb-16">
        <Reveal className="mx-auto max-w-6xl border-y border-mist py-6" y={10}>
          <SpecStrip metrics={metrics} />
        </Reveal>
      </section>

      <section className="page-pad section-y pt-0">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-10">
            Sectors
          </Reveal>
          <Stagger as="ul" stagger={0.1} className="grid gap-10 md:grid-cols-3">
            {sectors.map((sector) => {
              const count = studies.filter((s) => s.sector === sector).length;
              return (
                <StaggerItem key={sector} as="li" className="border-t border-mist pt-5" y={12}>
                  <Link
                    to={`/${sector}`}
                    className="group no-underline block transition-theme"
                  >
                    <h3 className="font-display text-xl font-medium capitalize transition-theme group-hover:text-steel group-hover:translate-x-0.5">
                      {sector}
                    </h3>
                    <p className="mt-3 font-body text-graphite/75 measure">
                      {SECTOR_COPY[sector]}
                    </p>
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

      {testimonials[0] ? (
        <section className="page-pad pb-20">
          <div className="mx-auto max-w-6xl">
            <TestimonialBlock testimonial={testimonials[0]} />
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="page-pad pb-10 font-mono text-sm text-amber mx-auto max-w-6xl">
          {error}
        </p>
      ) : null}
    </>
  );
}
