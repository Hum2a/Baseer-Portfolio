import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { reorderSchema, timelineInputSchema } from "@baseer-portfolio/shared";
import { createDb, withOwnerRls } from "../db/client";
import { timelineEntries } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const timelineRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

timelineRoutes.get("/public", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await db
      .select()
      .from(timelineEntries)
      .orderBy(asc(timelineEntries.displayOrder));
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

timelineRoutes.use("/admin/*", requireAdmin);

timelineRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) =>
      tx.select().from(timelineEntries).orderBy(asc(timelineEntries.displayOrder)),
    );
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

timelineRoutes.put("/admin/reorder", async (c) => {
  const { ids } = reorderSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(timelineEntries)
          .set({ displayOrder: i })
          .where(eq(timelineEntries.id, ids[i]!));
      }
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});

timelineRoutes.post("/admin", async (c) => {
  const body = timelineInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(timelineEntries)
        .values({
          ownerId: c.get("userId"),
          yearRange: body.yearRange,
          title: body.title,
          organisation: body.organisation,
          description: body.description,
          sector: body.sector ?? null,
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

timelineRoutes.put("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const body = timelineInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const updated = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .update(timelineEntries)
        .set({
          yearRange: body.yearRange,
          title: body.title,
          organisation: body.organisation,
          description: body.description,
          sector: body.sector ?? null,
          displayOrder: body.displayOrder ?? 0,
        })
        .where(eq(timelineEntries.id, id))
        .returning();
      return row;
    });
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  } finally {
    await pool.end();
  }
});

timelineRoutes.delete("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      await tx.delete(timelineEntries).where(eq(timelineEntries.id, id));
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});
