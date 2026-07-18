import { describe, expect, it } from "vitest";
import { computeCareerMetrics } from "./career-metrics";
import type { CaseStudy, TimelineEntry } from "./types";

const study = (overrides: Partial<CaseStudy>): CaseStudy => ({
  id: "00000000-0000-4000-8000-000000000001",
  ownerId: "u1",
  sector: "automotive",
  title: "Launch",
  slug: "launch",
  dek: "Dek",
  heroImageKey: null,
  challenge: "",
  strategy: "",
  execution: "",
  results: "",
  specMetrics: [],
  published: true,
  displayOrder: 0,
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("computeCareerMetrics", () => {
  it("counts campaigns and sectors", () => {
    const metrics = computeCareerMetrics([
      study({ sector: "automotive" }),
      study({
        id: "00000000-0000-4000-8000-000000000002",
        sector: "charity",
        slug: "b",
      }),
    ]);
    expect(metrics).toEqual([
      { label: "CAMPAIGNS", value: "2" },
      { label: "SECTORS", value: "2" },
      { label: "YEARS", value: "5" },
    ]);
  });

  it("uses timeline year ranges when present", () => {
    const timeline: TimelineEntry[] = [
      {
        id: "t1",
        ownerId: "u1",
        yearRange: "2015–2018",
        title: "Role",
        organisation: "Org",
        description: "",
        sector: null,
        displayOrder: 0,
      },
    ];
    const metrics = computeCareerMetrics([study({ updatedAt: "2020-01-01" })], timeline);
    expect(metrics.find((m) => m.label === "YEARS")?.value).toBe("6");
  });
});
