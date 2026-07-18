import { Hono } from "hono";
import type { AppVariables, Env } from "./env";
import { caseStudiesRoutes } from "./routes/case-studies";
import { testimonialsRoutes } from "./routes/testimonials";
import { skillsRoutes } from "./routes/skills";
import { timelineRoutes } from "./routes/timeline";
import { settingsRoutes } from "./routes/settings";
import { mediaRoutes } from "./routes/media";

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.onError((err, c) => {
    console.error(err);
    if (err instanceof Error && err.name === "ZodError") {
      return c.json({ error: "Validation failed", details: err.message }, 400);
    }
    return c.json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  });

  app.get("/api/health", (c) => c.json({ ok: true }));

  app.route("/api/case-studies", caseStudiesRoutes);
  app.route("/api/testimonials", testimonialsRoutes);
  app.route("/api/skills", skillsRoutes);
  app.route("/api/timeline", timelineRoutes);
  app.route("/api/settings", settingsRoutes);
  app.route("/api/media", mediaRoutes);

  return app;
}

export type App = ReturnType<typeof createApp>;
export {
  resolveSeoMeta,
  buildSitemapXml,
  injectMetaIntoHtml,
  META_CACHE_TTL_SECONDS,
} from "./routes/meta-injection";
