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
