import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { siteSettingsInputSchema } from "@baseer-portfolio/shared";
import { createDb, withOwnerRls } from "../db/client";
import { siteSettings } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { withOwner } from "../lib/owner";

export const settingsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

settingsRoutes.get("/public", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const [row] = await db.select().from(siteSettings).limit(1);
    if (!row) return c.json({ error: "Not configured" }, 404);
    return c.json(row);
  } finally {
    await pool.end();
  }
});

settingsRoutes.use("/admin/*", withOwner);

settingsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const row = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [r] = await tx.select().from(siteSettings).limit(1);
      return r ?? null;
    });
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  } finally {
    await pool.end();
  }
});

settingsRoutes.put("/admin", async (c) => {
  const body = siteSettingsInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const saved = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [existing] = await tx.select().from(siteSettings).limit(1);
      if (existing) {
        const [row] = await tx
          .update(siteSettings)
          .set({
            cvFileKey: body.cvFileKey ?? null,
            introHeadline: body.introHeadline,
            introSubhead: body.introSubhead,
            contactEmail: body.contactEmail,
            socialLinks: body.socialLinks,
          })
          .where(eq(siteSettings.id, existing.id))
          .returning();
        return row;
      }
      const [row] = await tx
        .insert(siteSettings)
        .values({
          ownerId: c.get("userId"),
          cvFileKey: body.cvFileKey ?? null,
          introHeadline: body.introHeadline,
          introSubhead: body.introSubhead,
          contactEmail: body.contactEmail,
          socialLinks: body.socialLinks,
        })
        .returning();
      return row;
    });
    return c.json(saved);
  } finally {
    await pool.end();
  }
});
