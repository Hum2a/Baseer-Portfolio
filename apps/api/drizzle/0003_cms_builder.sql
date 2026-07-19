-- Site shell / theme defaults
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "site_name" text NOT NULL DEFAULT 'Baseer';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "tagline" text NOT NULL DEFAULT '';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "default_theme_id" text NOT NULL DEFAULT 'light';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "allow_visitor_themes" boolean NOT NULL DEFAULT true;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "nav_links" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "footer_blurb" text NOT NULL DEFAULT '';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "footer_links" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "seo_title_suffix" text NOT NULL DEFAULT 'Baseer';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "default_meta_description" text NOT NULL DEFAULT '';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "favicon_key" text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "og_image_key" text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "about_bio" text NOT NULL DEFAULT '';

-- Case study section visibility
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "show_challenge" boolean NOT NULL DEFAULT true;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "show_strategy" boolean NOT NULL DEFAULT true;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "show_execution" boolean NOT NULL DEFAULT true;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "show_results" boolean NOT NULL DEFAULT true;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "show_gallery" boolean NOT NULL DEFAULT true;

-- CMS sector metadata (case_studies.sector enum remains source of truth for FK-ish slug)
CREATE TABLE IF NOT EXISTS "sectors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "slug" "sector" NOT NULL,
  "label" text NOT NULL,
  "intro" text NOT NULL DEFAULT '',
  "hero_image_key" text,
  "display_order" integer NOT NULL DEFAULT 0,
  "published" boolean NOT NULL DEFAULT true,
  CONSTRAINT "sectors_owner_slug_unique" UNIQUE ("owner_id", "slug")
);

ALTER TABLE "sectors" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "sectors"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "sectors"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "sectors"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "sectors"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON "sectors" TO authenticated;

CREATE TABLE IF NOT EXISTS "pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "key" text NOT NULL,
  "title" text,
  "published" boolean NOT NULL DEFAULT true,
  CONSTRAINT "pages_owner_key_unique" UNIQUE ("owner_id", "key")
);

ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "pages"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "pages"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "pages"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "pages"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON "pages" TO authenticated;

CREATE TABLE IF NOT EXISTS "page_blocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "page_id" uuid NOT NULL REFERENCES "pages"("id") ON DELETE cascade,
  "type" text NOT NULL,
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "display_order" integer NOT NULL DEFAULT 0,
  "enabled" boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS "page_blocks_page_id_idx" ON "page_blocks" ("page_id");

ALTER TABLE "page_blocks" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "page_blocks"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "page_blocks"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "page_blocks"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "page_blocks"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON "page_blocks" TO authenticated;
