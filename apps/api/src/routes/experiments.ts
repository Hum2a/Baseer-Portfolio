import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { createDb, withOwnerRls } from "../db/client";
import { abExperiments } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const experimentsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

const experimentSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  variants: z
    .array(
      z.object({
        id: z.string(),
        documentId: z.string().uuid(),
        weight: z.number().min(0).max(100),
      }),
    )
    .default([]),
  trafficSplit: z.record(z.number()).default({}),
  active: z.boolean().default(false),
});

experimentsRoutes.get("/public/:slug", async (c) => {
  const slug = c.req.param("slug");
  const { db, pool } = createDb(c.env);
  try {
    const [row] = await db
      .select()
      .from(abExperiments)
      .where(eq(abExperiments.slug, slug))
      .limit(1);
    if (!row || !row.active) return c.json({ error: "Not found" }, 404);
    const variants = row.variants ?? [];
    const total = variants.reduce((s, v) => s + (v.weight || 0), 0) || 1;
    let r = Math.random() * total;
    let picked = variants[0];
    for (const v of variants) {
      r -= v.weight || 0;
      if (r <= 0) {
        picked = v;
        break;
      }
    }
    return c.json({ experiment: row, variant: picked });
  } finally {
    await pool.end();
  }
});

experimentsRoutes.use("/admin/*", requireAdmin);

experimentsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) =>
      tx.select().from(abExperiments).orderBy(asc(abExperiments.createdAt)),
    );
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

experimentsRoutes.post("/admin", async (c) => {
  const body = experimentSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(abExperiments)
        .values({ ownerId: c.get("userId"), ...body })
        .returning();
      return row;
    });
    return c.json(created, 201);
  } finally {
    await pool.end();
  }
});

experimentsRoutes.put("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const body = experimentSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const updated = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .update(abExperiments)
        .set(body)
        .where(eq(abExperiments.id, id))
        .returning();
      return row;
    });
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  } finally {
    await pool.end();
  }
});
