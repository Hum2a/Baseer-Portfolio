import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDb, withOwnerRls } from "../db/client";
import { siteIntegrations } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const integrationsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

const putSchema = z.object({
  headHtml: z.string().max(50000).optional(),
  aiKeys: z
    .object({
      openai: z.string().optional(),
      anthropic: z.string().optional(),
      google: z.string().optional(),
    })
    .optional(),
});

integrationsRoutes.get("/public/head", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const [row] = await db.select().from(siteIntegrations).limit(1);
    return c.json({ headHtml: row?.headHtml ?? "" });
  } finally {
    await pool.end();
  }
});

integrationsRoutes.use("/admin/*", requireAdmin);

integrationsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const row = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [existing] = await tx.select().from(siteIntegrations).limit(1);
      if (existing) {
        return {
          ...existing,
          aiKeys: Object.fromEntries(
            Object.entries(existing.aiKeys ?? {}).map(([k, v]) => [
              k,
              v ? "••••saved" : "",
            ]),
          ),
        };
      }
      const [created] = await tx
        .insert(siteIntegrations)
        .values({ ownerId: c.get("userId") })
        .returning();
      return { ...created!, aiKeys: {} };
    });
    return c.json(row);
  } finally {
    await pool.end();
  }
});

integrationsRoutes.put("/admin", async (c) => {
  const body = putSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const saved = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [existing] = await tx.select().from(siteIntegrations).limit(1);
      const nextKeys = { ...(existing?.aiKeys ?? {}) };
      if (body.aiKeys) {
        for (const [k, v] of Object.entries(body.aiKeys)) {
          if (v && !v.startsWith("••••")) nextKeys[k] = v;
        }
      }
      if (existing) {
        const [row] = await tx
          .update(siteIntegrations)
          .set({
            headHtml: body.headHtml ?? existing.headHtml,
            aiKeys: nextKeys,
            updatedAt: new Date(),
          })
          .where(eq(siteIntegrations.id, existing.id))
          .returning();
        return row;
      }
      const [row] = await tx
        .insert(siteIntegrations)
        .values({
          ownerId: c.get("userId"),
          headHtml: body.headHtml ?? "",
          aiKeys: nextKeys,
        })
        .returning();
      return row;
    });
    return c.json({
      ...saved,
      aiKeys: Object.fromEntries(
        Object.entries(saved?.aiKeys ?? {}).map(([k, v]) => [k, v ? "••••saved" : ""]),
      ),
    });
  } finally {
    await pool.end();
  }
});
