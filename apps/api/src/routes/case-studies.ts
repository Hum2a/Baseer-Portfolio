import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import {
  caseStudyInputSchema,
  galleryImageInputSchema,
  reorderSchema,
  sectorSchema,
} from "@baseer-portfolio/shared";
import { createDb, withOwnerRls } from "../db/client";
import { caseStudies, galleryImages } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const caseStudiesRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

caseStudiesRoutes.get("/public", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const sectorParam = c.req.query("sector");
    const sector = sectorParam ? sectorSchema.parse(sectorParam) : undefined;
    const rows = await db
      .select()
      .from(caseStudies)
      .where(
        sector
          ? and(eq(caseStudies.published, true), eq(caseStudies.sector, sector))
          : eq(caseStudies.published, true),
      )
      .orderBy(asc(caseStudies.displayOrder));
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.get("/public/:slug", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const slug = c.req.param("slug");
    const [row] = await db
      .select()
      .from(caseStudies)
      .where(and(eq(caseStudies.slug, slug), eq(caseStudies.published, true)))
      .limit(1);
    if (!row) return c.json({ error: "Not found" }, 404);
    const gallery = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.caseStudyId, row.id))
      .orderBy(asc(galleryImages.displayOrder));
    return c.json({ ...row, gallery });
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.use("/admin/*", requireAdmin);

caseStudiesRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) =>
      tx.select().from(caseStudies).orderBy(asc(caseStudies.displayOrder)),
    );
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.put("/admin/reorder", async (c) => {
  const { ids } = reorderSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(caseStudies)
          .set({ displayOrder: i, updatedAt: new Date() })
          .where(eq(caseStudies.id, ids[i]!));
      }
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.get("/admin/:id", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const id = c.req.param("id");
    const row = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [cs] = await tx
        .select()
        .from(caseStudies)
        .where(eq(caseStudies.id, id))
        .limit(1);
      if (!cs) return null;
      const gallery = await tx
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.caseStudyId, id))
        .orderBy(asc(galleryImages.displayOrder));
      return { ...cs, gallery };
    });
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.post("/admin", async (c) => {
  const body = caseStudyInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(caseStudies)
        .values({
          ownerId: c.get("userId"),
          sector: body.sector,
          title: body.title,
          slug: body.slug,
          dek: body.dek,
          heroImageKey: body.heroImageKey ?? null,
          challenge: body.challenge,
          strategy: body.strategy,
          execution: body.execution,
          results: body.results,
          specMetrics: body.specMetrics,
          published: body.published,
          displayOrder: body.displayOrder ?? 0,
          updatedAt: new Date(),
        })
        .returning();
      return row;
    });
    return c.json(created, 201);
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.put("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const body = caseStudyInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const updated = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .update(caseStudies)
        .set({
          sector: body.sector,
          title: body.title,
          slug: body.slug,
          dek: body.dek,
          heroImageKey: body.heroImageKey ?? null,
          challenge: body.challenge,
          strategy: body.strategy,
          execution: body.execution,
          results: body.results,
          specMetrics: body.specMetrics,
          published: body.published,
          displayOrder: body.displayOrder ?? 0,
          updatedAt: new Date(),
        })
        .where(eq(caseStudies.id, id))
        .returning();
      return row;
    });
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.delete("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      await tx.delete(caseStudies).where(eq(caseStudies.id, id));
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.post("/admin/:id/gallery", async (c) => {
  const id = c.req.param("id");
  const body = galleryImageInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(galleryImages)
        .values({
          ownerId: c.get("userId"),
          caseStudyId: id,
          imageKey: body.imageKey,
          caption: body.caption ?? "",
          displayOrder: body.displayOrder ?? 0,
        })
        .returning();
      return row;
    });
    return c.json(created, 201);
  } finally {
    await pool.end();
  }
});

caseStudiesRoutes.delete("/admin/:id/gallery/:imageId", async (c) => {
  const imageId = c.req.param("imageId");
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      await tx.delete(galleryImages).where(eq(galleryImages.id, imageId));
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});
