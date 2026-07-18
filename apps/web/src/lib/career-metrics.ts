import type { CaseStudy, TimelineEntry } from "./types";
import type { SpecMetric } from "@baseer-portfolio/shared";

function parseYearToken(token: string): number | null {
  const m = token.match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

export function computeCareerMetrics(
  studies: CaseStudy[],
  timeline: TimelineEntry[] = [],
): SpecMetric[] {
  const campaigns = studies.length;
  const sectors = new Set(studies.map((s) => s.sector)).size;

  const years: number[] = [];
  for (const entry of timeline) {
    for (const part of entry.yearRange.split(/[-–—to]+/i)) {
      const y = parseYearToken(part.trim());
      if (y != null) years.push(y);
    }
  }
  for (const study of studies) {
    const created = parseYearToken(study.createdAt);
    const updated = parseYearToken(study.updatedAt);
    if (created != null) years.push(created);
    if (updated != null) years.push(updated);
  }

  let yearsValue = "—";
  if (years.length > 0) {
    const min = Math.min(...years);
    const max = Math.max(...years);
    const span = Math.max(1, max - min + 1);
    yearsValue = String(span);
  }

  return [
    { label: "CAMPAIGNS", value: String(campaigns) },
    { label: "SECTORS", value: String(sectors) },
    { label: "YEARS", value: yearsValue },
  ];
}
