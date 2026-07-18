import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { reorderSchema, skillInputSchema } from "@baseer-portfolio/shared";
import { createDb, withOwnerRls } from "../db/client";
import { skills } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const skillsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

skillsRoutes.get("/public", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await db.select().from(skills).orderBy(asc(skills.displayOrder));
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

skillsRoutes.use("/admin/*", requireAdmin);

skillsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) =>
      tx.select().from(skills).orderBy(asc(skills.displayOrder)),
    );
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

skillsRoutes.put("/admin/reorder", async (c) => {
  const { ids } = reorderSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(skills)
          .set({ displayOrder: i })
          .where(eq(skills.id, ids[i]!));
      }
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});

skillsRoutes.post("/admin", async (c) => {
  const body = skillInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(skills)
        .values({
          ownerId: c.get("userId"),
          category: body.category,
          name: body.name,
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

skillsRoutes.put("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const body = skillInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const updated = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .update(skills)
        .set({
          category: body.category,
          name: body.name,
          displayOrder: body.displayOrder ?? 0,
        })
        .where(eq(skills.id, id))
        .returning();
      return row;
    });
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  } finally {
    await pool.end();
  }
});

skillsRoutes.delete("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      await tx.delete(skills).where(eq(skills.id, id));
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});
