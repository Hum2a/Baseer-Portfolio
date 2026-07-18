export type AnalyticsEventRow = {
  occurredAt: Date | string;
  path: string;
  referrer: string | null;
  country: string | null;
  device: string | null;
  eventType: string;
  caseStudySlug: string | null;
  sessionId: string;
};

export type AnalyticsSummary = {
  range: string;
  pageViews: number;
  uniqueSessions: number;
  caseStudyViews: number;
  topPaths: { path: string; count: number }[];
  topCaseStudies: { slug: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
};

function dayKey(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

function topN(
  counts: Map<string, number>,
  limit: number,
): { key: string; count: number }[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

/** Pure aggregation for admin analytics (unit-tested). */
export function summarizeAnalyticsEvents(
  rows: AnalyticsEventRow[],
  range: string,
  now = new Date(),
): AnalyticsSummary {
  const sessions = new Set<string>();
  const pathCounts = new Map<string, number>();
  const caseCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();

  let pageViews = 0;
  let caseStudyViews = 0;

  for (const row of rows) {
    sessions.add(row.sessionId);
    const day = dayKey(row.occurredAt);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    pageViews += 1;
    pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);

    if (row.eventType === "case_study_view" || row.caseStudySlug) {
      caseStudyViews += 1;
      if (row.caseStudySlug) {
        caseCounts.set(
          row.caseStudySlug,
          (caseCounts.get(row.caseStudySlug) ?? 0) + 1,
        );
      }
    }

    const ref = (row.referrer ?? "").trim();
    if (ref) {
      try {
        const host = new URL(ref).hostname || ref;
        referrerCounts.set(host, (referrerCounts.get(host) ?? 0) + 1);
      } catch {
        referrerCounts.set(ref, (referrerCounts.get(ref) ?? 0) + 1);
      }
    }
  }

  const days = rangeDays(range);
  const viewsByDay: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    viewsByDay.push({ date: key, count: dayCounts.get(key) ?? 0 });
  }

  return {
    range,
    pageViews,
    uniqueSessions: sessions.size,
    caseStudyViews,
    topPaths: topN(pathCounts, 10).map(({ key, count }) => ({
      path: key,
      count,
    })),
    topCaseStudies: topN(caseCounts, 10).map(({ key, count }) => ({
      slug: key,
      count,
    })),
    topReferrers: topN(referrerCounts, 10).map(({ key, count }) => ({
      referrer: key,
      count,
    })),
    viewsByDay,
  };
}

export function rangeDays(range: string): number {
  if (range === "90d") return 90;
  if (range === "30d") return 30;
  return 7;
}

export function rangeStart(range: string, now = new Date()): Date {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - rangeDays(range));
  return start;
}

export function coarseDevice(ua: string | null | undefined): string {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/bot|crawl|spider|slurp|facebookexternalhit/i.test(ua)) return "bot";
  if (/ipad|tablet|kindle/i.test(lower)) return "tablet";
  if (/mobi|iphone|android(?!.*tablet)/i.test(lower)) return "mobile";
  return "desktop";
}
