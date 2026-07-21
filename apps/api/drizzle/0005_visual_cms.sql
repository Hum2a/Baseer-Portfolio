-- Visual CMS: documents, revisions, design system, media, forms, experiments, roles

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'owner';

CREATE TABLE IF NOT EXISTS "design_system" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade UNIQUE,
  "tokens" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "design_system" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "design_system"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "design_system"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "design_system"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "design_system"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON "design_system" TO authenticated;

CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "kind" text NOT NULL DEFAULT 'page',
  "locale" text NOT NULL DEFAULT 'en',
  "status" text NOT NULL DEFAULT 'draft',
  "draft_revision_id" uuid,
  "published_revision_id" uuid,
  "published_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "documents_owner_slug_locale_unique" UNIQUE ("owner_id", "slug", "locale")
);
CREATE INDEX IF NOT EXISTS "documents_slug_locale_idx" ON "documents" ("slug", "locale");
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "documents"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "documents"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "documents"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "documents"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON "documents" TO authenticated;

CREATE TABLE IF NOT EXISTS "document_revisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "document_id" uuid NOT NULL REFERENCES "documents"("id") ON DELETE cascade,
  "tree" jsonb NOT NULL,
  "label" text NOT NULL DEFAULT '',
  "created_by" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "document_revisions_document_id_idx" ON "document_revisions" ("document_id");
ALTER TABLE "document_revisions" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "document_revisions"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "document_revisions"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "document_revisions"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "document_revisions"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON "document_revisions" TO authenticated;

CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "key" text NOT NULL,
  "filename" text NOT NULL DEFAULT '',
  "mime" text NOT NULL DEFAULT '',
  "bytes" integer NOT NULL DEFAULT 0,
  "width" integer,
  "height" integer,
  "alt" text NOT NULL DEFAULT '',
  "focal_x" double precision NOT NULL DEFAULT 0.5,
  "focal_y" double precision NOT NULL DEFAULT 0.5,
  "folder" text NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "media_assets"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "media_assets"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "media_assets"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "media_assets"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON "media_assets" TO authenticated;

CREATE TABLE IF NOT EXISTS "forms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "definition" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "forms" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "forms"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "forms"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "forms"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "forms"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON "forms" TO authenticated;

CREATE TABLE IF NOT EXISTS "form_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "form_id" uuid NOT NULL REFERENCES "forms"("id") ON DELETE cascade,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "site_integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade UNIQUE,
  "head_html" text NOT NULL DEFAULT '',
  "ai_keys" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "site_integrations" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "site_integrations"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "site_integrations"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "site_integrations"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "site_integrations"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON "site_integrations" TO authenticated;

CREATE TABLE IF NOT EXISTS "ab_experiments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "variants" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "traffic_split" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "active" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ab_experiments_owner_slug_unique" UNIQUE ("owner_id", "slug")
);
ALTER TABLE "ab_experiments" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-select" ON "ab_experiments"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-insert" ON "ab_experiments"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-update" ON "ab_experiments"
    AS PERMISSIVE FOR UPDATE TO "authenticated"
    USING ((select auth.user_id() = owner_id))
    WITH CHECK ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "crud-authenticated-policy-delete" ON "ab_experiments"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING ((select auth.user_id() = owner_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ab_experiments" TO authenticated;
