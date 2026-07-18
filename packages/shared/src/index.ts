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
  purpose: z.enum(["case-study-image", "gallery-image", "cv"]),
});

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
