import type { Sector, SpecMetric, SocialLinks } from "@baseer-portfolio/shared";

export type CaseStudy = {
  id: string;
  ownerId: string;
  sector: Sector;
  title: string;
  slug: string;
  dek: string;
  heroImageKey: string | null;
  challenge: string;
  strategy: string;
  execution: string;
  results: string;
  specMetrics: SpecMetric[];
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GalleryImage = {
  id: string;
  ownerId: string;
  caseStudyId: string;
  imageKey: string;
  caption: string;
  displayOrder: number;
};

export type CaseStudyDetail = CaseStudy & { gallery: GalleryImage[] };

export type Testimonial = {
  id: string;
  ownerId: string;
  authorName: string;
  authorRole: string;
  company: string;
  quote: string;
  caseStudyId: string | null;
  displayOrder: number;
};

export type Skill = {
  id: string;
  ownerId: string;
  category: string;
  name: string;
  displayOrder: number;
};

export type TimelineEntry = {
  id: string;
  ownerId: string;
  yearRange: string;
  title: string;
  organisation: string;
  description: string;
  sector: Sector | null;
  displayOrder: number;
};

export type SiteSettings = {
  id: string;
  ownerId: string;
  cvFileKey: string | null;
  introHeadline: string;
  introSubhead: string;
  contactEmail: string;
  socialLinks: SocialLinks;
};

export type Reorderable = { id: string };
