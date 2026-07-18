import { Hono } from "hono";
import { gte } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "../db/client";
import { analyticsEvents } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";
import {
  coarseDevice,
  rangeStart,
  summarizeAnalyticsEvents,
} from "../lib/analytics-summary";

const beaconSchema = z.object({
  path: z.string().min(1).max(512),
  referrer: z.string().max(1024).optional().nullable(),
  sessionId: z.string().min(8).max(128),
  eventType: z.enum(["page_view", "case_study_view"]).optional().default("page_view"),
  caseStudySlug: z.string().max(200).optional().nullable(),
});

export const analyticsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

analyticsRoutes.post("/beacon", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const parsed = beaconSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid beacon" }, 400);
  }

  const { path, referrer, sessionId, eventType, caseStudySlug } = parsed.data;
  if (!path.startsWith("/") || path.includes("://")) {
    return c.json({ error: "Invalid path" }, 400);
  }

  const country = c.req.header("CF-IPCountry") ?? null;
  const device = coarseDevice(c.req.header("User-Agent"));

  const { db, pool } = createDb(c.env);
  try {
    await db.insert(analyticsEvents).values({
      path,
      referrer: referrer?.trim() || null,
      country: country === "XX" ? null : country,
      device,
      eventType,
      caseStudySlug: caseStudySlug?.trim() || null,
      sessionId,
    });
    return c.json({ ok: true }, 201);
  } finally {
    await pool.end();
  }
});

analyticsRoutes.use("/admin/*", requireAdmin);

analyticsRoutes.get("/admin/summary", async (c) => {
  const rangeParam = c.req.query("range") ?? "7d";
  const range =
    rangeParam === "30d" || rangeParam === "90d" || rangeParam === "7d"
      ? rangeParam
      : "7d";

  const { db, pool } = createDb(c.env);
  try {
    const start = rangeStart(range);
    const rows = await db
      .select()
      .from(analyticsEvents)
      .where(gte(analyticsEvents.occurredAt, start));

    const summary = summarizeAnalyticsEvents(
      rows.map((r) => ({
        occurredAt: r.occurredAt,
        path: r.path,
        referrer: r.referrer,
        country: r.country,
        device: r.device,
        eventType: r.eventType,
        caseStudySlug: r.caseStudySlug,
        sessionId: r.sessionId,
      })),
      range,
    );
    return c.json(summary);
  } finally {
    await pool.end();
  }
});
