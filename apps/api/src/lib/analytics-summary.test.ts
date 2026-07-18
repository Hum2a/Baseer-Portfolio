import { describe, expect, it } from "vitest";
import {
  coarseDevice,
  rangeDays,
  summarizeAnalyticsEvents,
} from "./analytics-summary";

describe("summarizeAnalyticsEvents", () => {
  const now = new Date("2026-07-18T12:00:00.000Z");

  it("aggregates totals, tops, and daily series", () => {
    const summary = summarizeAnalyticsEvents(
      [
        {
          occurredAt: "2026-07-17T10:00:00.000Z",
          path: "/",
          referrer: "https://www.google.com/search",
          country: "GB",
          device: "desktop",
          eventType: "page_view",
          caseStudySlug: null,
          sessionId: "s1",
        },
        {
          occurredAt: "2026-07-17T11:00:00.000Z",
          path: "/work/ev-launch",
          referrer: null,
          country: "GB",
          device: "mobile",
          eventType: "case_study_view",
          caseStudySlug: "ev-launch",
          sessionId: "s1",
        },
        {
          occurredAt: "2026-07-18T09:00:00.000Z",
          path: "/about",
          referrer: "https://linkedin.com/in/x",
          country: "US",
          device: "desktop",
          eventType: "page_view",
          caseStudySlug: null,
          sessionId: "s2",
        },
      ],
      "7d",
      now,
    );

    expect(summary.pageViews).toBe(3);
    expect(summary.uniqueSessions).toBe(2);
    expect(summary.caseStudyViews).toBe(1);
    expect(summary.topPaths[0]).toEqual({ path: "/", count: 1 });
    expect(summary.topCaseStudies).toEqual([{ slug: "ev-launch", count: 1 }]);
    expect(summary.topReferrers.map((r) => r.referrer).sort()).toEqual([
      "linkedin.com",
      "www.google.com",
    ]);
    expect(summary.viewsByDay).toHaveLength(7);
    expect(summary.viewsByDay.find((d) => d.date === "2026-07-17")?.count).toBe(2);
    expect(summary.viewsByDay.find((d) => d.date === "2026-07-18")?.count).toBe(1);
  });

  it("maps range days", () => {
    expect(rangeDays("7d")).toBe(7);
    expect(rangeDays("30d")).toBe(30);
    expect(rangeDays("90d")).toBe(90);
  });
});

describe("coarseDevice", () => {
  it("classifies user agents", () => {
    expect(coarseDevice("Mozilla/5.0 (iPhone; CPU iPhone OS)")).toBe("mobile");
    expect(coarseDevice("Mozilla/5.0 (Windows NT 10.0)")).toBe("desktop");
    expect(coarseDevice("Googlebot/2.1")).toBe("bot");
    expect(coarseDevice(null)).toBe("unknown");
  });
});
