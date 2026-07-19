import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { apiFetch, mediaFileUrl } from "../lib/api-client";
import type { CaseStudyDetail, Testimonial } from "../lib/types";
import { SpecStrip } from "../components/SpecStrip";
import { MarkdownBody } from "../components/MarkdownBody";
import { DocumentTitle } from "../components/DocumentTitle";
import { TestimonialBlock } from "../components/TestimonialBlock";
import { InteractiveLink, Reveal, Stagger, StaggerItem } from "../components/motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function WorkDetailPage() {
  const reduce = useReducedMotion();
  const { slug } = useParams<{ slug: string }>();
  const [study, setStudy] = useState<CaseStudyDetail | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    void (async () => {
      try {
        const [row, allTestimonials] = await Promise.all([
          apiFetch<CaseStudyDetail>(
            `/case-studies/public/${encodeURIComponent(slug)}`,
          ),
          apiFetch<Testimonial[]>("/testimonials/public"),
        ]);
        if (cancelled) return;
        setStudy(row);
        setTestimonials(
          allTestimonials.filter((t) => t.caseStudyId === row.id),
        );
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
        <Reveal as="p" immediate className="font-body text-lg">
          {error}
        </Reveal>
        <div className="mt-6">
          <InteractiveLink to="/" variant="ghost">
            Back home
          </InteractiveLink>
        </div>
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
  const sections = [
    {
      title: "Challenge",
      body: study.challenge,
      show: study.showChallenge !== false,
    },
    {
      title: "Strategy",
      body: study.strategy,
      show: study.showStrategy !== false,
    },
    {
      title: "Execution",
      body: study.execution,
      show: study.showExecution !== false,
    },
    {
      title: "Results",
      body: study.results,
      show: study.showResults !== false,
    },
  ];

  return (
    <article>
      <DocumentTitle title={study.title} />
      <header className="relative">
        {hero ? (
          <div className="w-full max-h-[70vh] overflow-hidden bg-mist/40">
            <motion.img
              src={hero}
              alt=""
              className="w-full h-full max-h-[70vh] object-cover"
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease }}
            />
          </div>
        ) : null}
        <div className="page-pad pt-10 md:pt-14 pb-8 mx-auto max-w-6xl">
          <Reveal
            immediate
            as="p"
            className="font-mono text-xs uppercase tracking-[0.14em] text-steel mb-3"
            y={8}
          >
            <Link to={`/${study.sector}`} className="link-underline capitalize">
              {study.sector}
            </Link>
          </Reveal>
          <Reveal
            immediate
            as="h1"
            delay={0.08}
            className="font-display text-4xl md:text-5xl font-semibold tracking-tight"
            y={14}
          >
            {study.title}
          </Reveal>
          <Reveal
            immediate
            as="p"
            delay={0.16}
            className="mt-5 font-body text-xl text-graphite/80 measure"
          >
            {study.dek}
          </Reveal>
          {study.specMetrics.length > 0 ? (
            <Reveal immediate delay={0.22} className="mt-8" y={8}>
              <SpecStrip metrics={study.specMetrics} />
            </Reveal>
          ) : null}
        </div>
      </header>

      <div className="page-pad pb-20 mx-auto max-w-6xl space-y-14">
        {sections.map((section) =>
          section.show && section.body.trim() ? (
            <Reveal as="section" key={section.title} y={12}>
              <h2 className="font-display text-2xl font-medium tracking-tight mb-4">
                {section.title}
              </h2>
              <MarkdownBody content={section.body} />
            </Reveal>
          ) : null,
        )}

        {study.showGallery !== false && study.gallery.length > 0 ? (
          <section>
            <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-6">
              Gallery
            </Reveal>
            <Stagger as="ul" stagger={0.08} className="grid gap-6 md:grid-cols-2">
              {study.gallery.map((image) => {
                const src = mediaFileUrl(image.imageKey);
                if (!src) return null;
                return (
                  <StaggerItem key={image.id} as="li" y={12}>
                    <motion.img
                      src={src}
                      alt={image.caption || ""}
                      className="w-full object-cover"
                      whileHover={reduce ? undefined : { scale: 1.015 }}
                      transition={{ duration: 0.45, ease }}
                    />
                    {image.caption ? (
                      <p className="mt-2 font-mono text-xs text-graphite/60">{image.caption}</p>
                    ) : null}
                  </StaggerItem>
                );
              })}
            </Stagger>
          </section>
        ) : null}

        {testimonials.length > 0 ? (
          <section className="space-y-10">
            <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight">
              Testimonials
            </Reveal>
            {testimonials.map((t) => (
              <TestimonialBlock key={t.id} testimonial={t} />
            ))}
          </section>
        ) : null}
      </div>
    </article>
  );
}
