import { useEffect, useState } from "react";
import { apiFetch, mediaFileUrl } from "../lib/api-client";
import type { SiteSettings, Skill, TimelineEntry } from "../lib/types";
import { Timeline } from "../components/Timeline";
import { SkillsMatrix } from "../components/SkillsMatrix";
import { DocumentTitle } from "../components/DocumentTitle";
import { InteractiveAnchor, Reveal } from "../components/motion";

export function AboutPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [s, tl, sk] = await Promise.all([
          apiFetch<SiteSettings>("/settings/public"),
          apiFetch<TimelineEntry[]>("/timeline/public"),
          apiFetch<Skill[]>("/skills/public"),
        ]);
        if (cancelled) return;
        setSettings(s);
        setTimeline(tl);
        setSkills(sk);
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

  const cvUrl = mediaFileUrl(settings?.cvFileKey);

  return (
    <section className="page-pad section-y mx-auto max-w-6xl">
      <DocumentTitle title="About — Baseer" />
      <header className="mb-14 md:mb-20 max-w-2xl">
        <Reveal
          immediate
          as="h1"
          className="font-display text-4xl md:text-5xl font-semibold tracking-tight"
        >
          About
        </Reveal>
        <Reveal
          immediate
          as="p"
          delay={0.08}
          className="mt-5 font-body text-lg text-graphite/80 measure"
        >
          Career path, capabilities, and a downloadable CV.
        </Reveal>
        {cvUrl ? (
          <Reveal immediate delay={0.16} className="mt-8" y={8}>
            <InteractiveAnchor href={cvUrl} variant="primary">
              Download CV
            </InteractiveAnchor>
          </Reveal>
        ) : null}
      </header>

      <div className="grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-8">
            Timeline
          </Reveal>
          <Timeline entries={timeline} />
        </div>
        <div>
          <Reveal as="h2" className="font-display text-2xl font-medium tracking-tight mb-8">
            Skills
          </Reveal>
          <SkillsMatrix skills={skills} />
        </div>
      </div>

      {error ? <p className="mt-10 font-mono text-sm text-amber">{error}</p> : null}
    </section>
  );
}
