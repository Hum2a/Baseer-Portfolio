import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, crudPolicy } from "drizzle-orm/neon";
import type {
  DesignTokens,
  DocumentTree,
  FooterLink,
  NavLink,
  SpecMetric,
  SocialLinks,
} from "@baseer-portfolio/shared";
import { user } from "./auth-schema";

export {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
} from "./auth-schema";

export const sectorEnum = pgEnum("sector", [
  "automotive",
  "charity",
  "education",
]);

export const caseStudies = pgTable(
  "case_studies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sector: sectorEnum("sector").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    dek: text("dek").notNull(),
    heroImageKey: text("hero_image_key"),
    challenge: text("challenge").notNull().default(""),
    strategy: text("strategy").notNull().default(""),
    execution: text("execution").notNull().default(""),
    results: text("results").notNull().default(""),
    specMetrics: jsonb("spec_metrics").$type<SpecMetric[]>().notNull().default([]),
    published: boolean("published").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    showChallenge: boolean("show_challenge").notNull().default(true),
    showStrategy: boolean("show_strategy").notNull().default(true),
    showExecution: boolean("show_execution").notNull().default(true),
    showResults: boolean("show_results").notNull().default(true),
    showGallery: boolean("show_gallery").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const galleryImages = pgTable(
  "gallery_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    imageKey: text("image_key").notNull(),
    caption: text("caption").notNull().default(""),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    authorRole: text("author_role").notNull(),
    company: text("company").notNull(),
    quote: text("quote").notNull(),
    caseStudyId: uuid("case_study_id").references(() => caseStudies.id, {
      onDelete: "set null",
    }),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const timelineEntries = pgTable(
  "timeline_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    yearRange: text("year_range").notNull(),
    title: text("title").notNull(),
    organisation: text("organisation").notNull(),
    description: text("description").notNull().default(""),
    sector: sectorEnum("sector"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    cvFileKey: text("cv_file_key"),
    introHeadline: text("intro_headline").notNull(),
    introSubhead: text("intro_subhead").notNull(),
    contactEmail: text("contact_email").notNull(),
    socialLinks: jsonb("social_links").$type<SocialLinks>().notNull().default({}),
    siteName: text("site_name").notNull().default("Baseer"),
    tagline: text("tagline").notNull().default(""),
    defaultThemeId: text("default_theme_id").notNull().default("light"),
    allowVisitorThemes: boolean("allow_visitor_themes").notNull().default(true),
    navLinks: jsonb("nav_links").$type<NavLink[]>().notNull().default([]),
    footerBlurb: text("footer_blurb").notNull().default(""),
    footerLinks: jsonb("footer_links").$type<FooterLink[]>().notNull().default([]),
    seoTitleSuffix: text("seo_title_suffix").notNull().default("Baseer"),
    defaultMetaDescription: text("default_meta_description").notNull().default(""),
    faviconKey: text("favicon_key"),
    ogImageKey: text("og_image_key"),
    aboutBio: text("about_bio").notNull().default(""),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const sectorsTable = pgTable(
  "sectors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: sectorEnum("slug").notNull(),
    label: text("label").notNull(),
    intro: text("intro").notNull().default(""),
    heroImageKey: text("hero_image_key"),
    displayOrder: integer("display_order").notNull().default(0),
    published: boolean("published").notNull().default(true),
  },
  (table) => [
    unique("sectors_owner_slug_unique").on(table.ownerId, table.slug),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    title: text("title"),
    published: boolean("published").notNull().default(true),
  },
  (table) => [
    unique("pages_owner_key_unique").on(table.ownerId, table.key),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const pageBlocks = pgTable(
  "page_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    displayOrder: integer("display_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const caseStudiesRelations = relations(caseStudies, ({ many }) => ({
  galleryImages: many(galleryImages),
  testimonials: many(testimonials),
}));

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
  caseStudy: one(caseStudies, {
    fields: [galleryImages.caseStudyId],
    references: [caseStudies.id],
  }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  caseStudy: one(caseStudies, {
    fields: [testimonials.caseStudyId],
    references: [caseStudies.id],
  }),
}));

export const pagesRelations = relations(pages, ({ many }) => ({
  blocks: many(pageBlocks),
}));

export const pageBlocksRelations = relations(pageBlocks, ({ one }) => ({
  page: one(pages, {
    fields: [pageBlocks.pageId],
    references: [pages.id],
  }),
}));

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  country: text("country"),
  device: text("device"),
  eventType: text("event_type").notNull().default("page_view"),
  caseStudySlug: text("case_study_slug"),
  sessionId: text("session_id").notNull(),
});

export const designSystem = pgTable(
  "design_system",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    tokens: jsonb("tokens").$type<DesignTokens>().notNull().default({
      colors: {},
      fonts: { display: "Space Grotesk", body: "Source Serif 4", mono: "IBM Plex Mono" },
      radii: {},
      spacing: {},
      customFontKeys: [],
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("page"),
    locale: text("locale").notNull().default("en"),
    status: text("status").notNull().default("draft"),
    draftRevisionId: uuid("draft_revision_id"),
    publishedRevisionId: uuid("published_revision_id"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("documents_owner_slug_locale_unique").on(
      table.ownerId,
      table.slug,
      table.locale,
    ),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const documentRevisions = pgTable(
  "document_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    tree: jsonb("tree").$type<DocumentTree>().notNull(),
    label: text("label").notNull().default(""),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    filename: text("filename").notNull().default(""),
    mime: text("mime").notNull().default(""),
    bytes: integer("bytes").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    focalX: doublePrecision("focal_x").notNull().default(0.5),
    focalY: doublePrecision("focal_y").notNull().default(0.5),
    folder: text("folder").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const forms = pgTable(
  "forms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    definition: jsonb("definition").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteIntegrations = pgTable(
  "site_integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    headHtml: text("head_html").notNull().default(""),
    aiKeys: jsonb("ai_keys").$type<Record<string, string>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const abExperiments = pgTable(
  "ab_experiments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    variants: jsonb("variants").$type<{ id: string; documentId: string; weight: number }[]>().notNull().default([]),
    trafficSplit: jsonb("traffic_split").$type<Record<string, number>>().notNull().default({}),
    active: boolean("active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("ab_experiments_owner_slug_unique").on(table.ownerId, table.slug),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.ownerId),
      modify: authUid(table.ownerId),
    }),
  ],
).enableRLS();

export const documentsRelations = relations(documents, ({ many }) => ({
  revisions: many(documentRevisions),
}));

export const documentRevisionsRelations = relations(documentRevisions, ({ one }) => ({
  document: one(documents, {
    fields: [documentRevisions.documentId],
    references: [documents.id],
  }),
}));
