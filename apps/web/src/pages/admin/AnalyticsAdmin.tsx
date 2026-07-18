import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";
import type { AnalyticsSummary } from "../../lib/analytics-types";

const ranges = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
] as const;

function BarSeries({ series }: { series: { date: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-0.5 h-28 sm:h-36"
        role="img"
        aria-label="Views by day"
      >
        {series.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count}`}
            className="flex-1 min-w-0 bg-steel/75 hover:bg-steel motion-safe:transition-colors"
            style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-graphite/45">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function RankedList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; count: number }[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 font-body text-sm text-graphite/55">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-mist">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex justify-between gap-4 py-3 font-mono text-sm"
            >
              <span className="truncate">{row.label}</span>
              <span className="text-steel tabular-nums shrink-0">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminAnalyticsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("7d");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void apiFetch<AnalyticsSummary>(`/analytics/admin/summary?range=${range}`)
      .then(setSummary)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Analytics
          </h1>
          <p className="mt-3 font-body text-graphite/70">
            First-party page views — no third-party trackers.
          </p>
        </div>
        <div className="flex gap-1 border border-mist p-1" role="group" aria-label="Range">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={
                range === r.id
                  ? "bg-steel text-fog px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em]"
                  : "px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-graphite/55 hover:text-steel"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !summary ? (
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-graphite/50">
          Loading…
        </p>
      ) : null}

      {summary ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-mist border border-mist">
            {[
              { label: "Page views", value: summary.pageViews },
              { label: "Sessions", value: summary.uniqueSessions },
              { label: "Case study views", value: summary.caseStudyViews },
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

          <section>
            <h2 className="font-display text-xl font-medium mb-4">Views by day</h2>
            <BarSeries series={summary.viewsByDay} />
          </section>

          <div className="grid gap-12 lg:grid-cols-3">
            <RankedList
              title="Top paths"
              empty="No path data yet."
              rows={summary.topPaths.map((r) => ({
                label: r.path,
                count: r.count,
              }))}
            />
            <RankedList
              title="Top case studies"
              empty="No case study views yet."
              rows={summary.topCaseStudies.map((r) => ({
                label: r.slug,
                count: r.count,
              }))}
            />
            <RankedList
              title="Top referrers"
              empty="No referrers recorded."
              rows={summary.topReferrers.map((r) => ({
                label: r.referrer,
                count: r.count,
              }))}
            />
          </div>
        </>
      ) : null}

      {error ? <p className="font-mono text-sm text-amber">{error}</p> : null}
    </div>
  );
}
