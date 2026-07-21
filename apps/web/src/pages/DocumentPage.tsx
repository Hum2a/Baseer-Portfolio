import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import type { DocumentTree } from "@baseer-portfolio/shared";
import { apiFetch } from "../lib/api-client";
import { useSiteSettingsOrFallback } from "../lib/site-settings";
import type {
  CaseStudy,
  SectorRecord,
  Skill,
  Testimonial,
  TimelineEntry,
} from "../lib/types";
import { DocumentRenderer } from "../render/DocumentRenderer";
import { DocumentTitle } from "../components/DocumentTitle";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

type ResolvePayload = {
  document: { id: string; slug: string; title: string };
  revision: { id: string; tree: DocumentTree };
  header: { tree: DocumentTree } | null;
  footer: { tree: DocumentTree } | null;
};

function pathToSlug(pathname: string): string {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  return clean === "" ? "home" : clean;
}

export function DocumentPage({
  slugOverride,
  titleFallback,
}: {
  slugOverride?: string;
  titleFallback?: string;
}) {
  const location = useLocation();
  const [params] = useSearchParams();
  const settings = useSiteSettingsOrFallback();
  const slug = slugOverride ?? pathToSlug(location.pathname);
  const preview = params.get("preview");
  const locale = params.get("locale") ?? "en";

  const [payload, setPayload] = useState<ResolvePayload | null>(null);
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sectors, setSectors] = useState<SectorRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [resolved, cs, tm, tl, sk, sec] = await Promise.all([
          preview
            ? apiFetch<{
                document: ResolvePayload["document"];
                revision: ResolvePayload["revision"];
              }>(
                `/documents/public?slug=${encodeURIComponent(slug)}&preview=${encodeURIComponent(preview)}&locale=${encodeURIComponent(locale)}`,
              ).then(async (p) => {
                const chrome = await apiFetch<ResolvePayload>(
                  `/documents/public-resolve?path=${encodeURIComponent(location.pathname)}&locale=${encodeURIComponent(locale)}`,
                ).catch(() => null);
                return {
                  document: p.document,
                  revision: p.revision,
                  header: chrome?.header ?? null,
                  footer: chrome?.footer ?? null,
                } satisfies ResolvePayload;
              })
            : apiFetch<ResolvePayload>(
                `/documents/public-resolve?path=${encodeURIComponent(location.pathname)}&locale=${encodeURIComponent(locale)}`,
              ),
          apiFetch<CaseStudy[]>("/case-studies/public"),
          apiFetch<Testimonial[]>("/testimonials/public"),
          apiFetch<TimelineEntry[]>("/timeline/public"),
          apiFetch<Skill[]>("/skills/public"),
          apiFetch<SectorRecord[]>("/sectors/public"),
        ]);
        if (cancelled) return;
        setPayload(resolved);
        setStudies(cs);
        setTestimonials(tm);
        setTimeline(tl);
        setSkills(sk);
        setSectors(sec);
        setLegacy(false);
      } catch {
        if (!cancelled) {
          // Fallback: documents not seeded yet
          setLegacy(true);
          setError(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, slug, preview, locale]);

  const data = useMemo(
    () => ({
      settings,
      studies,
      testimonials,
      timeline,
      skills,
      sectors,
      breakpoint: "desktop" as const,
    }),
    [settings, studies, testimonials, timeline, skills, sectors],
  );

  if (legacy) {
    return (
      <section className="page-pad section-y mx-auto max-w-6xl">
        <DocumentTitle title={titleFallback ?? slug} />
        <p className="font-body text-lg text-graphite/70">
          Open Studio to publish this page. Documents have not been seeded yet —
          visit <code className="font-mono text-sm">/admin/studio</code> once.
        </p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="page-pad section-y mx-auto max-w-6xl font-mono text-sm text-graphite/60">
        {error ?? "Loading…"}
      </section>
    );
  }

  const title =
    payload.revision.tree.seo?.title ||
    payload.document.title ||
    titleFallback ||
    slug;

  return (
    <>
      <DocumentTitle title={title} />
      {payload.header ? (
        <header className="border-b border-mist">
          <DocumentRenderer tree={payload.header.tree} data={data} />
        </header>
      ) : (
        <SiteHeader />
      )}
      <DocumentRenderer tree={payload.revision.tree} data={data} />
      {payload.footer ? (
        <footer className="border-t border-mist mt-auto">
          <DocumentRenderer tree={payload.footer.tree} data={data} />
        </footer>
      ) : (
        <SiteFooter />
      )}
    </>
  );
}
