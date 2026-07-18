import { useEffect, useState } from "react";
import { apiFetch, mediaFileUrl } from "../lib/api-client";
import type { SiteSettings, Skill, TimelineEntry } from "../lib/types";
import { Timeline } from "../components/Timeline";
import { SkillsMatrix } from "../components/SkillsMatrix";
import { DocumentTitle } from "../components/DocumentTitle";

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
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
          About
        </h1>
        <p className="mt-5 font-body text-lg text-graphite/80 measure">
          Career path, capabilities, and a downloadable CV.
        </p>
        {cvUrl ? (
          <a
            href={cvUrl}
            className="mt-8 inline-block bg-steel text-fog px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] no-underline hover:bg-graphite"
          >
            Download CV
          </a>
        ) : null}
      </header>

      <div className="grid gap-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight mb-8">Timeline</h2>
          <Timeline entries={timeline} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-medium tracking-tight mb-8">Skills</h2>
          <SkillsMatrix skills={skills} />
        </div>
      </div>

      {error ? <p className="mt-10 font-mono text-sm text-amber">{error}</p> : null}
    </section>
  );
}
