CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  );
$$;

DO $$ BEGIN
  CREATE ROLE authenticated;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE anonymous;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."sector" AS ENUM('automotive', 'charity', 'education');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "case_studies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "sector" "sector" NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "dek" text NOT NULL,
  "hero_image_key" text,
  "challenge" text DEFAULT '' NOT NULL,
  "strategy" text DEFAULT '' NOT NULL,
  "execution" text DEFAULT '' NOT NULL,
  "results" text DEFAULT '' NOT NULL,
  "spec_metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "published" boolean DEFAULT false NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "gallery_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "case_study_id" uuid NOT NULL REFERENCES "case_studies"("id") ON DELETE cascade,
  "image_key" text NOT NULL,
  "caption" text DEFAULT '' NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "testimonials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "author_name" text NOT NULL,
  "author_role" text NOT NULL,
  "company" text NOT NULL,
  "quote" text NOT NULL,
  "case_study_id" uuid REFERENCES "case_studies"("id") ON DELETE set null,
  "display_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "category" text NOT NULL,
  "name" text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "timeline_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "year_range" text NOT NULL,
  "title" text NOT NULL,
  "organisation" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "sector" "sector",
  "display_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE cascade,
  "cv_file_key" text,
  "intro_headline" text NOT NULL,
  "intro_subhead" text NOT NULL,
  "contact_email" text NOT NULL,
  "social_links" jsonb DEFAULT '{}'::jsonb NOT NULL
);

ALTER TABLE "case_studies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gallery_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "testimonials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timeline_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_studies_select" ON "case_studies";
DROP POLICY IF EXISTS "case_studies_insert" ON "case_studies";
DROP POLICY IF EXISTS "case_studies_update" ON "case_studies";
DROP POLICY IF EXISTS "case_studies_delete" ON "case_studies";
CREATE POLICY "case_studies_select" ON "case_studies" FOR SELECT TO authenticated
  USING ((select auth.user_id()) = "owner_id");
CREATE POLICY "case_studies_insert" ON "case_studies" FOR INSERT TO authenticated
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "case_studies_update" ON "case_studies" FOR UPDATE TO authenticated
  USING ((select auth.user_id()) = "owner_id")
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "case_studies_delete" ON "case_studies" FOR DELETE TO authenticated
  USING ((select auth.user_id()) = "owner_id");

DROP POLICY IF EXISTS "gallery_images_select" ON "gallery_images";
DROP POLICY IF EXISTS "gallery_images_insert" ON "gallery_images";
DROP POLICY IF EXISTS "gallery_images_update" ON "gallery_images";
DROP POLICY IF EXISTS "gallery_images_delete" ON "gallery_images";
CREATE POLICY "gallery_images_select" ON "gallery_images" FOR SELECT TO authenticated
  USING ((select auth.user_id()) = "owner_id");
CREATE POLICY "gallery_images_insert" ON "gallery_images" FOR INSERT TO authenticated
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "gallery_images_update" ON "gallery_images" FOR UPDATE TO authenticated
  USING ((select auth.user_id()) = "owner_id")
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "gallery_images_delete" ON "gallery_images" FOR DELETE TO authenticated
  USING ((select auth.user_id()) = "owner_id");

DROP POLICY IF EXISTS "testimonials_select" ON "testimonials";
DROP POLICY IF EXISTS "testimonials_insert" ON "testimonials";
DROP POLICY IF EXISTS "testimonials_update" ON "testimonials";
DROP POLICY IF EXISTS "testimonials_delete" ON "testimonials";
CREATE POLICY "testimonials_select" ON "testimonials" FOR SELECT TO authenticated
  USING ((select auth.user_id()) = "owner_id");
CREATE POLICY "testimonials_insert" ON "testimonials" FOR INSERT TO authenticated
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "testimonials_update" ON "testimonials" FOR UPDATE TO authenticated
  USING ((select auth.user_id()) = "owner_id")
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "testimonials_delete" ON "testimonials" FOR DELETE TO authenticated
  USING ((select auth.user_id()) = "owner_id");

DROP POLICY IF EXISTS "skills_select" ON "skills";
DROP POLICY IF EXISTS "skills_insert" ON "skills";
DROP POLICY IF EXISTS "skills_update" ON "skills";
DROP POLICY IF EXISTS "skills_delete" ON "skills";
CREATE POLICY "skills_select" ON "skills" FOR SELECT TO authenticated
  USING ((select auth.user_id()) = "owner_id");
CREATE POLICY "skills_insert" ON "skills" FOR INSERT TO authenticated
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "skills_update" ON "skills" FOR UPDATE TO authenticated
  USING ((select auth.user_id()) = "owner_id")
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "skills_delete" ON "skills" FOR DELETE TO authenticated
  USING ((select auth.user_id()) = "owner_id");

DROP POLICY IF EXISTS "timeline_entries_select" ON "timeline_entries";
DROP POLICY IF EXISTS "timeline_entries_insert" ON "timeline_entries";
DROP POLICY IF EXISTS "timeline_entries_update" ON "timeline_entries";
DROP POLICY IF EXISTS "timeline_entries_delete" ON "timeline_entries";
CREATE POLICY "timeline_entries_select" ON "timeline_entries" FOR SELECT TO authenticated
  USING ((select auth.user_id()) = "owner_id");
CREATE POLICY "timeline_entries_insert" ON "timeline_entries" FOR INSERT TO authenticated
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "timeline_entries_update" ON "timeline_entries" FOR UPDATE TO authenticated
  USING ((select auth.user_id()) = "owner_id")
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "timeline_entries_delete" ON "timeline_entries" FOR DELETE TO authenticated
  USING ((select auth.user_id()) = "owner_id");

DROP POLICY IF EXISTS "site_settings_select" ON "site_settings";
DROP POLICY IF EXISTS "site_settings_insert" ON "site_settings";
DROP POLICY IF EXISTS "site_settings_update" ON "site_settings";
DROP POLICY IF EXISTS "site_settings_delete" ON "site_settings";
CREATE POLICY "site_settings_select" ON "site_settings" FOR SELECT TO authenticated
  USING ((select auth.user_id()) = "owner_id");
CREATE POLICY "site_settings_insert" ON "site_settings" FOR INSERT TO authenticated
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "site_settings_update" ON "site_settings" FOR UPDATE TO authenticated
  USING ((select auth.user_id()) = "owner_id")
  WITH CHECK ((select auth.user_id()) = "owner_id");
CREATE POLICY "site_settings_delete" ON "site_settings" FOR DELETE TO authenticated
  USING ((select auth.user_id()) = "owner_id");

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
