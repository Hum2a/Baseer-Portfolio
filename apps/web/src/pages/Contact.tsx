import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import type { SiteSettings } from "../lib/types";
import { DocumentTitle } from "../components/DocumentTitle";

export function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const s = await apiFetch<SiteSettings>("/settings/public");
        if (!cancelled) setSettings(s);
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

  const socials = settings?.socialLinks ?? {};
  const links = [
    { label: "LinkedIn", href: socials.linkedin },
    { label: "Twitter", href: socials.twitter },
    { label: "Instagram", href: socials.instagram },
    { label: "Website", href: socials.website },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  return (
    <section className="page-pad section-y mx-auto max-w-3xl">
      <DocumentTitle title="Contact — Baseer" />
      <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
        Contact
      </h1>
      <p className="mt-5 font-body text-lg text-graphite/80 measure">
        For briefs, collaborations, or a conversation about the next campaign.
      </p>

      {settings?.contactEmail ? (
        <a
          href={`mailto:${settings.contactEmail}`}
          className="mt-10 inline-block font-display text-2xl md:text-3xl text-steel no-underline hover:underline"
        >
          {settings.contactEmail}
        </a>
      ) : (
        <p className="mt-10 font-body text-graphite/60">Email coming soon.</p>
      )}

      {links.length > 0 ? (
        <ul className="mt-12 space-y-3">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase tracking-[0.14em] text-graphite/70 hover:text-steel"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="mt-10 font-mono text-sm text-amber">{error}</p> : null}
    </section>
  );
}
