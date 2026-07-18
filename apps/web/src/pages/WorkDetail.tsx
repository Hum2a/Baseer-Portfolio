import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch, mediaFileUrl } from "../lib/api-client";
import type { CaseStudyDetail } from "../lib/types";
import { SpecStrip } from "../components/SpecStrip";
import { MarkdownBody } from "../components/MarkdownBody";
import { DocumentTitle } from "../components/DocumentTitle";

export function WorkDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [study, setStudy] = useState<CaseStudyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    void (async () => {
      try {
        const row = await apiFetch<CaseStudyDetail>(
          `/case-studies/public/${encodeURIComponent(slug)}`,
        );
        if (!cancelled) setStudy(row);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Not found");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <section className="page-pad section-y mx-auto max-w-3xl">
        <p className="font-body text-lg">{error}</p>
        <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.12em]">
          Back home
        </Link>
      </section>
    );
  }

  if (!study) {
    return (
      <section className="page-pad section-y mx-auto max-w-3xl font-mono text-sm text-graphite/60">
        Loading…
      </section>
    );
  }

  const hero = mediaFileUrl(study.heroImageKey);

  return (
    <article>
      <DocumentTitle title={`${study.title} — Baseer`} />
      <header className="relative">
        {hero ? (
          <div className="w-full max-h-[70vh] overflow-hidden bg-mist/40">
            <img
              src={hero}
              alt=""
              className="w-full h-full max-h-[70vh] object-cover animate-fade"
            />
          </div>
        ) : null}
        <div className="page-pad pt-10 md:pt-14 pb-8 mx-auto max-w-6xl">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-steel mb-3">
            <Link to={`/${study.sector}`} className="no-underline capitalize">
              {study.sector}
            </Link>
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight animate-rise">
            {study.title}
          </h1>
          <p className="mt-5 font-body text-xl text-graphite/80 measure">{study.dek}</p>
          {study.specMetrics.length > 0 ? (
            <SpecStrip metrics={study.specMetrics} className="mt-8" />
          ) : null}
        </div>
      </header>

      <div className="page-pad pb-20 mx-auto max-w-6xl space-y-14">
        {[
          { title: "Challenge", body: study.challenge },
          { title: "Strategy", body: study.strategy },
          { title: "Execution", body: study.execution },
          { title: "Results", body: study.results },
        ].map((section) =>
          section.body.trim() ? (
            <section key={section.title}>
              <h2 className="font-display text-2xl font-medium tracking-tight mb-4">
                {section.title}
              </h2>
              <MarkdownBody content={section.body} />
            </section>
          ) : null,
        )}

        {study.gallery.length > 0 ? (
          <section>
            <h2 className="font-display text-2xl font-medium tracking-tight mb-6">Gallery</h2>
            <ul className="grid gap-6 md:grid-cols-2">
              {study.gallery.map((image) => {
                const src = mediaFileUrl(image.imageKey);
                if (!src) return null;
                return (
                  <li key={image.id}>
                    <img src={src} alt={image.caption || ""} className="w-full object-cover" />
                    {image.caption ? (
                      <p className="mt-2 font-mono text-xs text-graphite/60">{image.caption}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
