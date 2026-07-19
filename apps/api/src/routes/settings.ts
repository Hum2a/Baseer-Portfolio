import { Hono } from "hono";
import { eq } from "drizzle-orm";
import {
  DEFAULT_FOOTER_LINKS,
  DEFAULT_NAV_LINKS,
  siteSettingsInputSchema,
} from "@baseer-portfolio/shared";
import { createDb, withOwnerRls } from "../db/client";
import { siteSettings } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const settingsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

function settingsPayload(row: typeof siteSettings.$inferSelect) {
  return {
    ...row,
    navLinks: row.navLinks?.length ? row.navLinks : DEFAULT_NAV_LINKS,
    footerLinks: row.footerLinks?.length ? row.footerLinks : DEFAULT_FOOTER_LINKS,
    footerBlurb:
      row.footerBlurb ||
      `${row.siteName || "Baseer"} · Marketing portfolio`,
    tagline: row.tagline || "",
    seoTitleSuffix: row.seoTitleSuffix || row.siteName || "Baseer",
  };
}

settingsRoutes.get("/public", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const [row] = await db.select().from(siteSettings).limit(1);
    if (!row) return c.json({ error: "Not configured" }, 404);
    return c.json(settingsPayload(row));
  } finally {
    await pool.end();
  }
});

settingsRoutes.use("/admin/*", requireAdmin);

settingsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const row = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [r] = await tx.select().from(siteSettings).limit(1);
      return r ?? null;
    });
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(settingsPayload(row));
  } finally {
    await pool.end();
  }
});

settingsRoutes.put("/admin", async (c) => {
  const body = siteSettingsInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const saved = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const values = {
        cvFileKey: body.cvFileKey ?? null,
        introHeadline: body.introHeadline,
        introSubhead: body.introSubhead,
        contactEmail: body.contactEmail,
        socialLinks: body.socialLinks,
        siteName: body.siteName,
        tagline: body.tagline,
        defaultThemeId: body.defaultThemeId,
        allowVisitorThemes: body.allowVisitorThemes,
        navLinks: body.navLinks,
        footerBlurb: body.footerBlurb,
        footerLinks: body.footerLinks,
        seoTitleSuffix: body.seoTitleSuffix,
        defaultMetaDescription: body.defaultMetaDescription,
        faviconKey: body.faviconKey ?? null,
        ogImageKey: body.ogImageKey ?? null,
        aboutBio: body.aboutBio,
      };
      const [existing] = await tx.select().from(siteSettings).limit(1);
      if (existing) {
        const [row] = await tx
          .update(siteSettings)
          .set(values)
          .where(eq(siteSettings.id, existing.id))
          .returning();
        return row;
      }
      const [row] = await tx
        .insert(siteSettings)
        .values({
          ownerId: c.get("userId"),
          ...values,
        })
        .returning();
      return row;
    });
    return c.json(settingsPayload(saved!));
  } finally {
    await pool.end();
  }
});
