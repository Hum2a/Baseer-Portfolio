import { Hono } from "hono";
import type { AppVariables, Env } from "./env";
import { createAuthSession } from "./lib/auth";
import { caseStudiesRoutes } from "./routes/case-studies";
import { testimonialsRoutes } from "./routes/testimonials";
import { skillsRoutes } from "./routes/skills";
import { timelineRoutes } from "./routes/timeline";
import { settingsRoutes } from "./routes/settings";
import { mediaRoutes } from "./routes/media";
import { analyticsRoutes } from "./routes/analytics";
import { pagesRoutes } from "./routes/pages";
import { sectorsRoutes } from "./routes/sectors";
import { documentsRoutes } from "./routes/documents";
import { designSystemRoutes } from "./routes/design-system";
import { mediaLibraryRoutes } from "./routes/media-library";
import { formsRoutes } from "./routes/forms";
import { integrationsRoutes } from "./routes/integrations";
import { aiRoutes } from "./routes/ai";
import { experimentsRoutes } from "./routes/experiments";
import { usersRoutes } from "./routes/users";

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.onError((err, c) => {
    console.error(err);
    if (err instanceof Error && err.name === "ZodError") {
      return c.json({ error: "Validation failed", details: err.message }, 400);
    }
    const raw = err instanceof Error ? err.message : "Server error";
    // Drizzle wraps Postgres failures as "Failed query: …" — don't surface SQL to the UI.
    const message = raw.startsWith("Failed query:")
      ? "Database request failed"
      : raw;
    return c.json({ error: message }, 500);
  });

  app.get("/api/health", (c) => c.json({ ok: true }));

  app.on(["POST", "GET"], "/api/auth/*", async (c) => {
    const { auth, pool } = createAuthSession(c.env);
    try {
      return await auth.handler(c.req.raw);
    } catch (err) {
      console.error("auth handler error", err);
      return c.json(
        {
          error: "Auth failed",
          message: err instanceof Error ? err.message : "Server error",
        },
        500,
      );
    } finally {
      await pool.end().catch(() => undefined);
    }
  });

  app.route("/api/case-studies", caseStudiesRoutes);
  app.route("/api/testimonials", testimonialsRoutes);
  app.route("/api/skills", skillsRoutes);
  app.route("/api/timeline", timelineRoutes);
  app.route("/api/settings", settingsRoutes);
  app.route("/api/media", mediaRoutes);
  app.route("/api/analytics", analyticsRoutes);
  app.route("/api/pages", pagesRoutes);
  app.route("/api/sectors", sectorsRoutes);
  app.route("/api/documents", documentsRoutes);
  app.route("/api/design-system", designSystemRoutes);
  app.route("/api/media-library", mediaLibraryRoutes);
  app.route("/api/forms", formsRoutes);
  app.route("/api/integrations", integrationsRoutes);
  app.route("/api/ai", aiRoutes);
  app.route("/api/experiments", experimentsRoutes);
  app.route("/api/users", usersRoutes);

  return app;
}

export type App = ReturnType<typeof createApp>;
export {
  resolveSeoMeta,
  buildSitemapXml,
  injectMetaIntoHtml,
  META_CACHE_TTL_SECONDS,
} from "./routes/meta-injection";
