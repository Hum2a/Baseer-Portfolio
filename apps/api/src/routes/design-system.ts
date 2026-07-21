import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { designTokensSchema } from "@baseer-portfolio/shared";
import { createDb, withOwnerRls } from "../db/client";
import { designSystem } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const designSystemRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

designSystemRoutes.get("/public", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const [row] = await db.select().from(designSystem).limit(1);
    return c.json(row ?? { tokens: designTokensSchema.parse({}) });
  } finally {
    await pool.end();
  }
});

designSystemRoutes.use("/admin/*", requireAdmin);

designSystemRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const row = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [existing] = await tx.select().from(designSystem).limit(1);
      if (existing) return existing;
      const [created] = await tx
        .insert(designSystem)
        .values({
          ownerId: c.get("userId"),
          tokens: designTokensSchema.parse({}),
        })
        .returning();
      return created;
    });
    return c.json(row);
  } finally {
    await pool.end();
  }
});

designSystemRoutes.put("/admin", async (c) => {
  const body = await c.req.json();
  const tokens = designTokensSchema.parse(body.tokens ?? body);
  const { db, pool } = createDb(c.env);
  try {
    const saved = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [existing] = await tx.select().from(designSystem).limit(1);
      if (existing) {
        const [row] = await tx
          .update(designSystem)
          .set({ tokens, updatedAt: new Date() })
          .where(eq(designSystem.id, existing.id))
          .returning();
        return row;
      }
      const [row] = await tx
        .insert(designSystem)
        .values({ ownerId: c.get("userId"), tokens })
        .returning();
      return row;
    });
    return c.json(saved);
  } finally {
    await pool.end();
  }
});
