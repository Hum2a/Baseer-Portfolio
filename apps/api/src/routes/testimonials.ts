import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { reorderSchema, testimonialInputSchema } from "@baseer-portfolio/shared";
import { createDb, withOwnerRls } from "../db/client";
import { testimonials } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { withOwner } from "../lib/owner";

export const testimonialsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

testimonialsRoutes.get("/public", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await db
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.displayOrder));
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

testimonialsRoutes.use("/admin/*", withOwner);

testimonialsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) =>
      tx.select().from(testimonials).orderBy(asc(testimonials.displayOrder)),
    );
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

testimonialsRoutes.put("/admin/reorder", async (c) => {
  const { ids } = reorderSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(testimonials)
          .set({ displayOrder: i })
          .where(eq(testimonials.id, ids[i]!));
      }
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});

testimonialsRoutes.post("/admin", async (c) => {
  const body = testimonialInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(testimonials)
        .values({
          ownerId: c.get("userId"),
          authorName: body.authorName,
          authorRole: body.authorRole,
          company: body.company,
          quote: body.quote,
          caseStudyId: body.caseStudyId ?? null,
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

testimonialsRoutes.put("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const body = testimonialInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const updated = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .update(testimonials)
        .set({
          authorName: body.authorName,
          authorRole: body.authorRole,
          company: body.company,
          quote: body.quote,
          caseStudyId: body.caseStudyId ?? null,
          displayOrder: body.displayOrder ?? 0,
        })
        .where(eq(testimonials.id, id))
        .returning();
      return row;
    });
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  } finally {
    await pool.end();
  }
});

testimonialsRoutes.delete("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      await tx.delete(testimonials).where(eq(testimonials.id, id));
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});
