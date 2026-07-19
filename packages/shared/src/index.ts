import { z } from "zod";

export const sectors = ["automotive", "charity", "education"] as const;
export type Sector = (typeof sectors)[number];
export const sectorSchema = z.enum(sectors);

export const specMetricSchema = z.object({
  label: z.string().min(1).max(40),
  value: z.string().min(1).max(80),
});
export type SpecMetric = z.infer<typeof specMetricSchema>;

export const socialLinksSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});
export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const navLinkSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(300),
  visible: z.boolean().default(true),
});
export type NavLink = z.infer<typeof navLinkSchema>;

export const footerLinkSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(300),
  visible: z.boolean().default(true),
});
export type FooterLink = z.infer<typeof footerLinkSchema>;

export const caseStudyInputSchema = z.object({
  sector: sectorSchema,
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
  dek: z.string().min(1).max(300),
  heroImageKey: z.string().nullable().optional(),
  challenge: z.string().default(""),
  strategy: z.string().default(""),
  execution: z.string().default(""),
  results: z.string().default(""),
  specMetrics: z.array(specMetricSchema).default([]),
  published: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().optional(),
  showChallenge: z.boolean().optional().default(true),
  showStrategy: z.boolean().optional().default(true),
  showExecution: z.boolean().optional().default(true),
  showResults: z.boolean().optional().default(true),
  showGallery: z.boolean().optional().default(true),
});
export type CaseStudyInput = z.infer<typeof caseStudyInputSchema>;

export const galleryImageInputSchema = z.object({
  imageKey: z.string().min(1),
  caption: z.string().max(300).optional().default(""),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const testimonialInputSchema = z.object({
  authorName: z.string().min(1).max(120),
  authorRole: z.string().min(1).max(120),
  company: z.string().min(1).max(160),
  quote: z.string().min(1).max(2000),
  caseStudyId: z.string().uuid().nullable().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const skillInputSchema = z.object({
  category: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const timelineInputSchema = z.object({
  yearRange: z.string().min(1).max(40),
  title: z.string().min(1).max(160),
  organisation: z.string().min(1).max(160),
  description: z.string().max(2000).default(""),
  sector: sectorSchema.nullable().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const siteSettingsInputSchema = z.object({
  cvFileKey: z.string().nullable().optional(),
  introHeadline: z.string().min(1).max(200),
  introSubhead: z.string().min(1).max(500),
  contactEmail: z.string().email(),
  socialLinks: socialLinksSchema.default({}),
  siteName: z.string().min(1).max(80).default("Baseer"),
  tagline: z.string().max(200).default(""),
  defaultThemeId: z.string().min(1).max(64).default("light"),
  allowVisitorThemes: z.boolean().default(true),
  navLinks: z.array(navLinkSchema).default([]),
  footerBlurb: z.string().max(300).default(""),
  footerLinks: z.array(footerLinkSchema).default([]),
  seoTitleSuffix: z.string().max(80).default("Baseer"),
  defaultMetaDescription: z.string().max(300).default(""),
  faviconKey: z.string().nullable().optional(),
  ogImageKey: z.string().nullable().optional(),
  aboutBio: z.string().max(20000).default(""),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;

export const sectorInputSchema = z.object({
  slug: sectorSchema,
  label: z.string().min(1).max(80),
  intro: z.string().max(1000).default(""),
  heroImageKey: z.string().nullable().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  published: z.boolean().default(true),
});
export type SectorInput = z.infer<typeof sectorInputSchema>;

export const pageKeys = [
  "home",
  "about",
  "contact",
  "work",
  "sector:automotive",
  "sector:charity",
  "sector:education",
] as const;
export type PageKey = (typeof pageKeys)[number];
export const pageKeySchema = z.enum(pageKeys);

export const blockTypes = [
  "hero",
  "spec_strip",
  "sector_grid",
  "featured_work",
  "testimonial",
  "timeline",
  "skills",
  "rich_text",
  "cta_band",
  "contact_card",
  "cv_button",
  "gallery_highlight",
] as const;
export type BlockType = (typeof blockTypes)[number];

const ctaSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(300),
  variant: z.enum(["primary", "ghost", "text"]).default("primary"),
});

export const heroBlockConfigSchema = z.object({
  showBrand: z.boolean().default(true),
  brandOverride: z.string().max(80).optional(),
  headlineSource: z.enum(["settings", "custom"]).default("settings"),
  headline: z.string().max(200).optional(),
  subheadSource: z.enum(["settings", "custom"]).default("settings"),
  subhead: z.string().max(500).optional(),
  ctas: z.array(ctaSchema).max(4).default([]),
});

export const specStripBlockConfigSchema = z.object({
  source: z.enum(["career", "custom"]).default("career"),
  metrics: z.array(specMetricSchema).default([]),
});

export const sectorGridBlockConfigSchema = z.object({
  title: z.string().max(120).default("Sectors"),
  sectorSlugs: z.array(sectorSchema).default([...sectors]),
  blurbOverrides: z
    .record(sectorSchema, z.string().max(300))
    .default({} as Record<Sector, string>),
});

export const featuredWorkBlockConfigSchema = z.object({
  title: z.string().max(120).default("Selected work"),
  caseStudyIds: z.array(z.string().uuid()).default([]),
  limit: z.number().int().min(1).max(12).default(3),
});

export const testimonialBlockConfigSchema = z.object({
  mode: z.enum(["first", "ids", "random"]).default("first"),
  testimonialIds: z.array(z.string().uuid()).default([]),
  limit: z.number().int().min(1).max(6).default(1),
});

export const timelineBlockConfigSchema = z.object({
  title: z.string().max(120).default("Timeline"),
});

export const skillsBlockConfigSchema = z.object({
  title: z.string().max(120).default("Skills"),
});

export const richTextBlockConfigSchema = z.object({
  title: z.string().max(120).optional(),
  markdown: z.string().max(20000).default(""),
  source: z.enum(["custom", "about_bio"]).default("custom"),
});

export const ctaBandBlockConfigSchema = z.object({
  headline: z.string().max(200).default(""),
  body: z.string().max(500).default(""),
  ctas: z.array(ctaSchema).max(3).default([]),
});

export const contactCardBlockConfigSchema = z.object({
  showEmail: z.boolean().default(true),
  showSocials: z.boolean().default(true),
  intro: z.string().max(500).default(""),
});

export const cvButtonBlockConfigSchema = z.object({
  label: z.string().max(80).default("Download CV"),
});

export const galleryHighlightBlockConfigSchema = z.object({
  title: z.string().max(120).default("Gallery"),
  imageKeys: z.array(z.string().min(1)).default([]),
});

export const pageBlockConfigSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), config: heroBlockConfigSchema }),
  z.object({ type: z.literal("spec_strip"), config: specStripBlockConfigSchema }),
  z.object({ type: z.literal("sector_grid"), config: sectorGridBlockConfigSchema }),
  z.object({
    type: z.literal("featured_work"),
    config: featuredWorkBlockConfigSchema,
  }),
  z.object({ type: z.literal("testimonial"), config: testimonialBlockConfigSchema }),
  z.object({ type: z.literal("timeline"), config: timelineBlockConfigSchema }),
  z.object({ type: z.literal("skills"), config: skillsBlockConfigSchema }),
  z.object({ type: z.literal("rich_text"), config: richTextBlockConfigSchema }),
  z.object({ type: z.literal("cta_band"), config: ctaBandBlockConfigSchema }),
  z.object({
    type: z.literal("contact_card"),
    config: contactCardBlockConfigSchema,
  }),
  z.object({ type: z.literal("cv_button"), config: cvButtonBlockConfigSchema }),
  z.object({
    type: z.literal("gallery_highlight"),
    config: galleryHighlightBlockConfigSchema,
  }),
]);

export const pageBlockInputSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(blockTypes),
  config: z.record(z.unknown()).default({}),
  enabled: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const pageSaveSchema = z.object({
  title: z.string().max(160).nullable().optional(),
  published: z.boolean().default(true),
  blocks: z.array(pageBlockInputSchema).default([]),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_CV_TYPES = ["application/pdf"] as const;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_CV_BYTES = 10 * 1024 * 1024;

export const presignRequestSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1),
  byteSize: z.number().int().positive(),
  purpose: z.enum(["case-study-image", "gallery-image", "cv", "site-asset"]),
});

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export const DEFAULT_NAV_LINKS: NavLink[] = [
  { id: "nav-automotive", label: "Automotive", href: "/automotive", visible: true },
  { id: "nav-charity", label: "Charity", href: "/charity", visible: true },
  { id: "nav-education", label: "Education", href: "/education", visible: true },
  { id: "nav-about", label: "About", href: "/about", visible: true },
  { id: "nav-contact", label: "Contact", href: "/contact", visible: true },
];

export const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { id: "foot-contact", label: "Contact", href: "/contact", visible: true },
  { id: "foot-sitemap", label: "Sitemap", href: "/sitemap.xml", visible: true },
];
