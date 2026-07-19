import { Link } from "react-router-dom";
import { Reveal } from "./motion";
import { useSiteSettingsOrFallback } from "../lib/site-settings";

export function SiteFooter() {
  const settings = useSiteSettingsOrFallback();
  const links = (settings.footerLinks ?? []).filter((l) => l.visible !== false);

  return (
    <footer className="page-pad mt-auto pb-10 pt-16">
      <Reveal className="mx-auto max-w-6xl border-t border-mist pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/60">
          {settings.footerBlurb ||
            `${settings.siteName || "Baseer"} · Marketing portfolio`}
        </p>
        <div className="flex flex-wrap gap-5 font-mono text-xs uppercase tracking-[0.12em]">
          {links.map((link) =>
            link.href.startsWith("http") || link.href.endsWith(".xml") ? (
              <a
                key={link.id}
                href={link.href}
                className="link-underline text-graphite/70 hover:text-steel"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.id}
                to={link.href}
                className="link-underline text-graphite/70 hover:text-steel"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      </Reveal>
    </footer>
  );
}
