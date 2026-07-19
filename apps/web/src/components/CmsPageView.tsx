import { useEffect, useState } from "react";
import type { PageKey } from "@baseer-portfolio/shared";
import { apiFetch } from "../lib/api-client";
import { useSiteSettingsOrFallback } from "../lib/site-settings";
import type {
  CaseStudy,
  CmsPage,
  SectorRecord,
  Skill,
  Testimonial,
  TimelineEntry,
} from "../lib/types";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { DocumentTitle } from "./DocumentTitle";

export function CmsPageView({
  pageKey,
  titleFallback,
}: {
  pageKey: PageKey;
  titleFallback: string;
}) {
  const settings = useSiteSettingsOrFallback();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sectors, setSectors] = useState<SectorRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [p, cs, tm, tl, sk, sec] = await Promise.all([
          apiFetch<CmsPage>(`/pages/public/${encodeURIComponent(pageKey)}`),
          apiFetch<CaseStudy[]>("/case-studies/public"),
          apiFetch<Testimonial[]>("/testimonials/public"),
          apiFetch<TimelineEntry[]>("/timeline/public"),
          apiFetch<Skill[]>("/skills/public"),
          apiFetch<SectorRecord[]>("/sectors/public"),
        ]);
        if (cancelled) return;
        setPage(p);
        setStudies(cs);
        setTestimonials(tm);
        setTimeline(tl);
        setSkills(sk);
        setSectors(sec);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  const title = page?.title || titleFallback;

  return (
    <>
      <DocumentTitle title={title} />
      {page ? (
        <BlockRenderer
          page={page}
          data={{
            settings,
            studies,
            testimonials,
            timeline,
            skills,
            sectors,
            pageKey,
          }}
        />
      ) : !error ? (
        <section className="page-pad section-y mx-auto max-w-6xl font-mono text-sm text-graphite/60">
          Loading…
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
