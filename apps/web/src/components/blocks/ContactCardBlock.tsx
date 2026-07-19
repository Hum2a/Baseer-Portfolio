import type { SiteSettings } from "../../lib/types";
import { InteractiveAnchor, Reveal, Stagger, StaggerItem } from "../motion";

export function ContactCardBlock({
  config,
  settings,
}: {
  config: Record<string, unknown>;
  settings: SiteSettings;
}) {
  const showEmail = config.showEmail !== false;
  const showSocials = config.showSocials !== false;
  const intro = typeof config.intro === "string" ? config.intro : "";
  const socials = settings.socialLinks ?? {};
  const links = [
    { label: "LinkedIn", href: socials.linkedin },
    { label: "Twitter", href: socials.twitter },
    { label: "Instagram", href: socials.instagram },
    { label: "Website", href: socials.website },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  return (
    <section className="page-pad pb-20">
      <div className="mx-auto max-w-3xl">
        {intro ? (
          <Reveal as="p" className="font-body text-lg text-graphite/80 measure mb-8">
            {intro}
          </Reveal>
        ) : null}
        {showEmail ? (
          settings.contactEmail ? (
            <Reveal className="mt-2" y={10}>
              <InteractiveAnchor
                href={`mailto:${settings.contactEmail}`}
                variant="text"
                className="font-display text-2xl md:text-3xl text-steel"
              >
                {settings.contactEmail}
              </InteractiveAnchor>
            </Reveal>
          ) : (
            <p className="font-body text-graphite/60">Email coming soon.</p>
          )
        ) : null}
        {showSocials && links.length > 0 ? (
          <Stagger as="ul" stagger={0.06} className="mt-12 space-y-3">
            {links.map((link) => (
              <StaggerItem key={link.label} as="li" y={6}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline font-mono text-xs uppercase tracking-[0.14em] text-graphite/70 hover:text-steel transition-theme"
                >
                  {link.label}
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        ) : null}
      </div>
    </section>
  );
}
