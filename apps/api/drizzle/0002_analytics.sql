CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "path" text NOT NULL,
  "referrer" text,
  "country" text,
  "device" text,
  "event_type" text NOT NULL DEFAULT 'page_view',
  "case_study_slug" text,
  "session_id" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "analytics_events_occurred_at_idx"
  ON "analytics_events" ("occurred_at");
CREATE INDEX IF NOT EXISTS "analytics_events_path_idx"
  ON "analytics_events" ("path");
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_idx"
  ON "analytics_events" ("session_id");
CREATE INDEX IF NOT EXISTS "analytics_events_case_study_slug_idx"
  ON "analytics_events" ("case_study_slug");
