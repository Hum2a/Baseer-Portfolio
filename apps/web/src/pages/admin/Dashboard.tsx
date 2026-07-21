import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";
import type { CaseStudy } from "../../lib/types";
import type { AnalyticsSummary } from "../../lib/analytics-types";

const links = [
  { to: "/admin/studio", label: "Studio", hint: "Visual page editor" },
  { to: "/admin/site", label: "Site", hint: "Brand, theme, SEO, contact" },
  { to: "/admin/navigation", label: "Navigation", hint: "Header and footer links" },
  { to: "/admin/pages", label: "Pages (legacy)", hint: "Old section builder" },
  { to: "/admin/sectors", label: "Sectors", hint: "Sector labels and intros" },
  { to: "/admin/case-studies", label: "Case studies", hint: "Create and reorder work" },
  { to: "/admin/testimonials", label: "Testimonials", hint: "Quotes and attribution" },
  { to: "/admin/skills", label: "Skills", hint: "Capability matrix" },
  { to: "/admin/timeline", label: "Timeline", hint: "Career entries" },
  { to: "/admin/analytics", label: "Analytics", hint: "Usage and top paths" },
];

function MiniBars({ series }: { series: { date: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div
      className="flex items-end gap-1 h-16"
      role="img"
      aria-label="Page views by day"
    >
      {series.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count}`}
          className="flex-1 min-w-0 bg-steel/80 motion-safe:transition-[height] duration-300"
          style={{ height: `${Math.max(8, (d.count / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [published, setPublished] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [s, cases] = await Promise.all([
          apiFetch<AnalyticsSummary>("/analytics/admin/summary?range=7d"),
          apiFetch<CaseStudy[]>("/case-studies/admin"),
        ]);
        setSummary(s);
        setPublished(cases.filter((c) => c.published).length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    })();
  }, []);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-3 font-body text-graphite/70">
          Portfolio content and last-7-day traffic at a glance.
        </p>
      </div>

      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-mist border border-mist">
          {[
            { label: "Views", value: summary?.pageViews ?? "—" },
            { label: "Sessions", value: summary?.uniqueSessions ?? "—" },
            { label: "Published", value: published ?? "—" },
            { label: "Case views", value: summary?.caseStudyViews ?? "—" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-fog px-4 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-steel">
                {kpi.label}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
        {summary ? (
          <div className="mt-6 border-t border-mist pt-6">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
                Views · 7 days
              </p>
              <Link
                to="/admin/analytics"
                className="font-mono text-xs uppercase tracking-[0.12em] text-steel no-underline"
              >
                Full analytics
              </Link>
            </div>
            <MiniBars series={summary.viewsByDay} />
          </div>
        ) : null}
      </section>

      {summary && summary.topPaths.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-medium">Top paths</h2>
          <ul className="mt-4 divide-y divide-mist">
            {summary.topPaths.slice(0, 5).map((row) => (
              <li
                key={row.path}
                className="flex justify-between gap-4 py-3 font-mono text-sm"
              >
                <span className="truncate text-graphite/80">{row.path}</span>
                <span className="text-steel tabular-nums shrink-0">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-xl font-medium">Quick links</h2>
        <ul className="mt-4 divide-y divide-mist">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 py-4 no-underline hover:text-steel"
              >
                <span className="font-display text-lg font-medium">{link.label}</span>
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
                  {link.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}
    </div>
  );
}
