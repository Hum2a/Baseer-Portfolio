import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { createDb, withOwnerRls } from "../db/client";
import { mediaAssets } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const mediaLibraryRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

const assetInput = z.object({
  key: z.string().min(1),
  filename: z.string().default(""),
  mime: z.string().default(""),
  bytes: z.number().int().nonnegative().default(0),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  alt: z.string().max(300).default(""),
  focalX: z.number().min(0).max(1).default(0.5),
  focalY: z.number().min(0).max(1).default(0.5),
  folder: z.string().max(120).default(""),
});

mediaLibraryRoutes.use("/admin/*", requireAdmin);

mediaLibraryRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) =>
      tx.select().from(mediaAssets).orderBy(asc(mediaAssets.createdAt)),
    );
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

mediaLibraryRoutes.post("/admin", async (c) => {
  const body = assetInput.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(mediaAssets)
        .values({
          ownerId: c.get("userId"),
          ...body,
          width: body.width ?? null,
          height: body.height ?? null,
        })
        .returning();
      return row;
    });
    return c.json(created, 201);
  } finally {
    await pool.end();
  }
});

mediaLibraryRoutes.put("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const body = assetInput.partial().parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const updated = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .update(mediaAssets)
        .set(body)
        .where(eq(mediaAssets.id, id))
        .returning();
      return row;
    });
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  } finally {
    await pool.end();
  }
});

mediaLibraryRoutes.delete("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      await tx.delete(mediaAssets).where(eq(mediaAssets.id, id));
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});
