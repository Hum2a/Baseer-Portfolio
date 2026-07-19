import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import {
  pageKeySchema,
  pageSaveSchema,
  reorderSchema,
  type PageKey,
} from "@baseer-portfolio/shared";
import { createDb, withOwnerRls, type Database } from "../db/client";
import { pageBlocks, pages } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";
import { DEFAULT_PAGE_BLOCKS, PAGE_TITLES } from "../lib/default-pages";

export const pagesRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

async function ensurePage(tx: Database, ownerId: string, key: PageKey) {
  const [existing] = await tx
    .select()
    .from(pages)
    .where(and(eq(pages.ownerId, ownerId), eq(pages.key, key)))
    .limit(1);
  if (existing) return existing;

  const [page] = await tx
    .insert(pages)
    .values({
      ownerId,
      key,
      title: PAGE_TITLES[key],
      published: true,
    })
    .returning();

  const seeds = DEFAULT_PAGE_BLOCKS[key] ?? [];
  if (seeds.length > 0) {
    await tx.insert(pageBlocks).values(
      seeds.map((block, i) => ({
        ownerId,
        pageId: page!.id,
        type: block.type,
        config: block.config,
        displayOrder: i,
        enabled: block.enabled ?? true,
      })),
    );
  }
  return page!;
}

async function loadPageWithBlocks(tx: Database, pageId: string) {
  const [page] = await tx.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  if (!page) return null;
  const blocks = await tx
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, pageId))
    .orderBy(asc(pageBlocks.displayOrder));
  return { ...page, blocks };
}

pagesRoutes.get("/public/:key", async (c) => {
  const key = pageKeySchema.parse(c.req.param("key"));
  const { db, pool } = createDb(c.env);
  try {
    const [page] = await db.select().from(pages).where(eq(pages.key, key)).limit(1);
    if (!page || !page.published) {
      const blocks = (DEFAULT_PAGE_BLOCKS[key] ?? []).map((b, i) => ({
        id: `default-${key}-${i}`,
        ownerId: "",
        pageId: "",
        type: b.type,
        config: b.config,
        displayOrder: i,
        enabled: b.enabled ?? true,
      }));
      return c.json({
        id: null,
        key,
        title: PAGE_TITLES[key],
        published: true,
        blocks: blocks.filter((b) => b.enabled),
        fallback: true,
      });
    }
    const blocks = await db
      .select()
      .from(pageBlocks)
      .where(and(eq(pageBlocks.pageId, page.id), eq(pageBlocks.enabled, true)))
      .orderBy(asc(pageBlocks.displayOrder));
    return c.json({ ...page, blocks, fallback: false });
  } finally {
    await pool.end();
  }
});

pagesRoutes.use("/admin/*", requireAdmin);

pagesRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const ownerId = c.get("userId");
      for (const key of Object.keys(PAGE_TITLES) as PageKey[]) {
        await ensurePage(tx, ownerId, key);
      }
      return tx.select().from(pages).orderBy(asc(pages.key));
    });
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

pagesRoutes.get("/admin/:key", async (c) => {
  const key = pageKeySchema.parse(c.req.param("key"));
  const { db, pool } = createDb(c.env);
  try {
    const row = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const page = await ensurePage(tx, c.get("userId"), key);
      return loadPageWithBlocks(tx, page.id);
    });
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  } finally {
    await pool.end();
  }
});

pagesRoutes.put("/admin/:key", async (c) => {
  const key = pageKeySchema.parse(c.req.param("key"));
  const body = pageSaveSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const saved = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const ownerId = c.get("userId");
      const page = await ensurePage(tx, ownerId, key);
      await tx
        .update(pages)
        .set({
          title: body.title ?? PAGE_TITLES[key],
          published: body.published,
        })
        .where(eq(pages.id, page.id));

      await tx.delete(pageBlocks).where(eq(pageBlocks.pageId, page.id));

      if (body.blocks.length > 0) {
        await tx.insert(pageBlocks).values(
          body.blocks.map((block, i) => {
            const row = {
              ownerId,
              pageId: page.id,
              type: block.type,
              config: block.config ?? {},
              displayOrder: block.displayOrder ?? i,
              enabled: block.enabled ?? true,
            };
            return block.id ? { ...row, id: block.id } : row;
          }),
        );
      }

      return loadPageWithBlocks(tx, page.id);
    });
    return c.json(saved);
  } finally {
    await pool.end();
  }
});

pagesRoutes.put("/admin/:key/blocks/reorder", async (c) => {
  const key = pageKeySchema.parse(c.req.param("key"));
  const { ids } = reorderSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      const page = await ensurePage(tx, c.get("userId"), key);
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(pageBlocks)
          .set({ displayOrder: i })
          .where(
            and(eq(pageBlocks.id, ids[i]!), eq(pageBlocks.pageId, page.id)),
          );
      }
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});
