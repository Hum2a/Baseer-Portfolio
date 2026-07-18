import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, crudPolicy } from "drizzle-orm/neon";
import type { SpecMetric, SocialLinks } from "@baseer-portfolio/shared";
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
