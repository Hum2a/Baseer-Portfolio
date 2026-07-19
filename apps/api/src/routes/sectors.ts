import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import {
  reorderSchema,
  sectorInputSchema,
  sectorSchema,
  sectors,
} from "@baseer-portfolio/shared";
import { createDb, withOwnerRls, type Database } from "../db/client";
import { sectorsTable } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const sectorsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

const DEFAULT_SECTORS = [
  {
    slug: "automotive" as const,
    label: "Automotive",
    intro: "Launches, retail theatre, and product storytelling.",
    displayOrder: 0,
  },
  {
    slug: "charity" as const,
    label: "Charity",
    intro: "Cause campaigns with measurable public response.",
    displayOrder: 1,
  },
  {
    slug: "education" as const,
    label: "Education",
    intro: "Enrolment, reputation, and student-facing narratives.",
    displayOrder: 2,
  },
];

async function ensureSectors(tx: Database, ownerId: string) {
  const existing = await tx.select().from(sectorsTable);
  if (existing.length > 0) {
    return tx.select().from(sectorsTable).orderBy(asc(sectorsTable.displayOrder));
  }
  await tx.insert(sectorsTable).values(
    DEFAULT_SECTORS.map((s) => ({
      ownerId,
      slug: s.slug,
      label: s.label,
      intro: s.intro,
      displayOrder: s.displayOrder,
      published: true,
    })),
  );
  return tx.select().from(sectorsTable).orderBy(asc(sectorsTable.displayOrder));
}

sectorsRoutes.get("/public", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await db
      .select()
      .from(sectorsTable)
      .where(eq(sectorsTable.published, true))
      .orderBy(asc(sectorsTable.displayOrder));
    if (rows.length > 0) return c.json(rows);
    return c.json(
      DEFAULT_SECTORS.map((s, i) => ({
        id: `default-${s.slug}`,
        ownerId: "",
        slug: s.slug,
        label: s.label,
        intro: s.intro,
        heroImageKey: null,
        displayOrder: i,
        published: true,
      })),
    );
  } finally {
    await pool.end();
  }
});

sectorsRoutes.get("/public/:slug", async (c) => {
  const slug = sectorSchema.parse(c.req.param("slug"));
  const { db, pool } = createDb(c.env);
  try {
    const [row] = await db
      .select()
      .from(sectorsTable)
      .where(and(eq(sectorsTable.slug, slug), eq(sectorsTable.published, true)))
      .limit(1);
    if (row) return c.json(row);
    const fallback = DEFAULT_SECTORS.find((s) => s.slug === slug);
    if (!fallback) return c.json({ error: "Not found" }, 404);
    return c.json({
      id: `default-${slug}`,
      ownerId: "",
      slug,
      label: fallback.label,
      intro: fallback.intro,
      heroImageKey: null,
      displayOrder: fallback.displayOrder,
      published: true,
    });
  } finally {
    await pool.end();
  }
});

sectorsRoutes.use("/admin/*", requireAdmin);

sectorsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) =>
      ensureSectors(tx, c.get("userId")),
    );
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

sectorsRoutes.put("/admin/reorder", async (c) => {
  const { ids } = reorderSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(sectorsTable)
          .set({ displayOrder: i })
          .where(eq(sectorsTable.id, ids[i]!));
      }
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});

sectorsRoutes.put("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const body = sectorInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const updated = await withOwnerRls(db, c.get("userId"), async (tx) => {
      await ensureSectors(tx, c.get("userId"));
      const [row] = await tx
        .update(sectorsTable)
        .set({
          slug: body.slug,
          label: body.label,
          intro: body.intro,
          heroImageKey: body.heroImageKey ?? null,
          displayOrder: body.displayOrder ?? 0,
          published: body.published,
        })
        .where(eq(sectorsTable.id, id))
        .returning();
      return row;
    });
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  } finally {
    await pool.end();
  }
});

sectorsRoutes.post("/admin", async (c) => {
  const body = sectorInputSchema.parse(await c.req.json());
  if (!sectors.includes(body.slug)) {
    return c.json({ error: "Invalid sector slug" }, 400);
  }
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(sectorsTable)
        .values({
          ownerId: c.get("userId"),
          slug: body.slug,
          label: body.label,
          intro: body.intro,
          heroImageKey: body.heroImageKey ?? null,
          displayOrder: body.displayOrder ?? 0,
          published: body.published,
        })
        .returning();
      return row;
    });
    return c.json(created, 201);
  } finally {
    await pool.end();
  }
});
