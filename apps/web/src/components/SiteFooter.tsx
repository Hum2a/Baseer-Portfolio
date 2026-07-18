import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="page-pad mt-auto pb-10 pt-16">
      <div className="mx-auto max-w-6xl border-t border-mist pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/60">
          Baseer · Marketing portfolio
        </p>
        <div className="flex gap-5 font-mono text-xs uppercase tracking-[0.12em]">
          <Link to="/contact" className="no-underline text-graphite/70 hover:text-steel">
            Contact
          </Link>
          <a href="/sitemap.xml" className="no-underline text-graphite/70 hover:text-steel">
            Sitemap
          </a>
        </div>
      </div>
    </footer>
  );
}
