import type {
  FooterLink,
  NavLink,
  Sector,
  SpecMetric,
  SocialLinks,
  BlockType,
  PageKey,
} from "@baseer-portfolio/shared";

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
  showChallenge?: boolean;
  showStrategy?: boolean;
  showExecution?: boolean;
  showResults?: boolean;
  showGallery?: boolean;
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
  siteName: string;
  tagline: string;
  defaultThemeId: string;
  allowVisitorThemes: boolean;
  navLinks: NavLink[];
  footerBlurb: string;
  footerLinks: FooterLink[];
  seoTitleSuffix: string;
  defaultMetaDescription: string;
  faviconKey: string | null;
  ogImageKey: string | null;
  aboutBio: string;
};

export type SectorRecord = {
  id: string;
  ownerId: string;
  slug: Sector;
  label: string;
  intro: string;
  heroImageKey: string | null;
  displayOrder: number;
  published: boolean;
};

export type PageBlock = {
  id: string;
  ownerId: string;
  pageId: string;
  type: BlockType | string;
  config: Record<string, unknown>;
  displayOrder: number;
  enabled: boolean;
};

export type CmsPage = {
  id: string | null;
  key: PageKey | string;
  title: string | null;
  published: boolean;
  blocks: PageBlock[];
  fallback?: boolean;
};

export type Reorderable = { id: string };
