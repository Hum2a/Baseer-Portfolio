import { Hono } from "hono";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  createEmptyPageTree,
  createHomeDocumentTree,
  documentInputSchema,
  publishDocumentSchema,
  type DocumentTree,
} from "@baseer-portfolio/shared";
import { createDb, withOwnerRls, type Database } from "../db/client";
import { documentRevisions, documents, siteSettings } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";
import { z } from "zod";

export const documentsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

function pathToSlug(pathname: string): string {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  return clean === "" ? "home" : clean;
}

async function ensureSeedDocuments(tx: Database, ownerId: string) {
  const existing = await tx.select().from(documents).limit(1);
  if (existing.length > 0) return;

  const seeds: { slug: string; title: string; tree: DocumentTree; kind: string }[] =
    [
      { slug: "home", title: "Home", tree: createHomeDocumentTree(), kind: "page" },
      {
        slug: "about",
        title: "About",
        tree: createEmptyPageTree("About"),
        kind: "page",
      },
      {
        slug: "contact",
        title: "Contact",
        tree: createEmptyPageTree("Contact"),
        kind: "page",
      },
      {
        slug: "automotive",
        title: "Automotive",
        tree: createEmptyPageTree("Automotive"),
        kind: "page",
      },
      {
        slug: "charity",
        title: "Charity",
        tree: createEmptyPageTree("Charity"),
        kind: "page",
      },
      {
        slug: "education",
        title: "Education",
        tree: createEmptyPageTree("Education"),
        kind: "page",
      },
      {
        slug: "__header",
        title: "Header",
        tree: {
          root: {
            id: "header_root",
            type: "stack",
            name: "Header",
            layout: {
              mode: "flow",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              padding: "1.5rem",
              maxWidth: "72rem",
              margin: "0 auto",
              width: "100%",
            },
            children: [
              {
                id: "header_brand",
                type: "button",
                props: { label: "{{siteName}}", href: "/", variant: "text" },
              },
              {
                id: "header_nav",
                type: "component",
                props: { component: "nav_links" },
              },
            ],
          },
        },
        kind: "header",
      },
      {
        slug: "__footer",
        title: "Footer",
        tree: {
          root: {
            id: "footer_root",
            type: "stack",
            name: "Footer",
            layout: {
              mode: "flow",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              padding: "2rem 1.5rem",
              maxWidth: "72rem",
              margin: "0 auto",
              width: "100%",
            },
            children: [
              {
                id: "footer_blurb",
                type: "text",
                props: { tag: "p", text: "{{footerBlurb}}", binding: "footerBlurb" },
                styles: { fontSize: "0.75rem", opacity: 0.6 },
              },
              {
                id: "footer_links",
                type: "component",
                props: { component: "footer_links" },
              },
            ],
          },
        },
        kind: "footer",
      },
    ];

  // Enrich about/contact with components
  seeds[1]!.tree.root.children = [
    {
      id: "about_heading",
      type: "text",
      props: { tag: "h1", text: "About" },
      styles: { fontSize: "2.5rem", fontWeight: "600" },
    },
    {
      id: "about_bio",
      type: "text",
      props: { tag: "div", text: "{{aboutBio}}", binding: "aboutBio", markdown: true },
    },
    { id: "about_cv", type: "component", props: { component: "cv_button" } },
    { id: "about_timeline", type: "component", props: { component: "timeline" } },
    { id: "about_skills", type: "component", props: { component: "skills" } },
  ];
  seeds[2]!.tree.root.children = [
    {
      id: "contact_heading",
      type: "text",
      props: { tag: "h1", text: "Contact" },
      styles: { fontSize: "2.5rem", fontWeight: "600" },
    },
    {
      id: "contact_card",
      type: "component",
      props: { component: "contact_card" },
    },
  ];
  for (const sector of ["automotive", "charity", "education"] as const) {
    const seed = seeds.find((s) => s.slug === sector)!;
    seed.tree.root.children = [
      {
        id: `${sector}_h`,
        type: "text",
        props: {
          tag: "h1",
          text: sector.charAt(0).toUpperCase() + sector.slice(1),
        },
        styles: { fontSize: "2.5rem", fontWeight: "600" },
      },
      {
        id: `${sector}_list`,
        type: "component",
        props: { component: "case_study_list", sector },
      },
    ];
  }

  for (const seed of seeds) {
    const [doc] = await tx
      .insert(documents)
      .values({
        ownerId,
        slug: seed.slug,
        title: seed.title,
        kind: seed.kind,
        locale: "en",
        status: "published",
        publishedAt: new Date(),
      })
      .returning();
    const [rev] = await tx
      .insert(documentRevisions)
      .values({
        ownerId,
        documentId: doc!.id,
        tree: seed.tree,
        label: "Initial migrate",
        createdBy: ownerId,
      })
      .returning();
    await tx
      .update(documents)
      .set({
        draftRevisionId: rev!.id,
        publishedRevisionId: rev!.id,
        status: "published",
      })
      .where(eq(documents.id, doc!.id));
  }
}

documentsRoutes.get("/public", async (c) => {
  const slug = c.req.query("slug") ?? "home";
  const locale = c.req.query("locale") ?? "en";
  const previewRevisionId = c.req.query("preview");
  const { db, pool } = createDb(c.env);
  try {
    if (previewRevisionId) {
      const { createAuthSession } = await import("../lib/auth");
      const { auth, pool: authPool } = createAuthSession(c.env);
      try {
        const session = await auth.api.getSession({ headers: c.req.raw.headers });
        if (!session?.user) return c.json({ error: "Unauthorized" }, 401);
      } finally {
        await authPool.end().catch(() => undefined);
      }
      const [rev] = await db
        .select()
        .from(documentRevisions)
        .where(eq(documentRevisions.id, previewRevisionId))
        .limit(1);
      if (!rev) return c.json({ error: "Not found" }, 404);
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, rev.documentId))
        .limit(1);
      return c.json({ document: doc, revision: rev, preview: true });
    }

    const [doc] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.slug, slug),
          eq(documents.locale, locale),
          eq(documents.status, "published"),
        ),
      )
      .limit(1);
    if (!doc?.publishedRevisionId) {
      return c.json({ error: "Not found" }, 404);
    }
    const [rev] = await db
      .select()
      .from(documentRevisions)
      .where(eq(documentRevisions.id, doc.publishedRevisionId))
      .limit(1);
    if (!rev) return c.json({ error: "Not found" }, 404);
    return c.json({ document: doc, revision: rev, preview: false });
  } finally {
    await pool.end();
  }
});

documentsRoutes.get("/public-resolve", async (c) => {
  const path = c.req.query("path") ?? "/";
  const locale = c.req.query("locale") ?? "en";
  const slug = pathToSlug(path);
  const { db, pool } = createDb(c.env);
  try {
    const [doc] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.slug, slug),
          eq(documents.locale, locale),
          eq(documents.status, "published"),
        ),
      )
      .limit(1);
    if (!doc?.publishedRevisionId) return c.json({ error: "Not found" }, 404);
    const [rev] = await db
      .select()
      .from(documentRevisions)
      .where(eq(documentRevisions.id, doc.publishedRevisionId))
      .limit(1);
    const [header] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.slug, "__header"),
          eq(documents.locale, locale),
          eq(documents.status, "published"),
        ),
      )
      .limit(1);
    const [footer] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.slug, "__footer"),
          eq(documents.locale, locale),
          eq(documents.status, "published"),
        ),
      )
      .limit(1);
    let headerRev = null;
    let footerRev = null;
    if (header?.publishedRevisionId) {
      [headerRev] = await db
        .select()
        .from(documentRevisions)
        .where(eq(documentRevisions.id, header.publishedRevisionId))
        .limit(1);
    }
    if (footer?.publishedRevisionId) {
      [footerRev] = await db
        .select()
        .from(documentRevisions)
        .where(eq(documentRevisions.id, footer.publishedRevisionId))
        .limit(1);
    }
    const [settings] = await db.select().from(siteSettings).limit(1);
    return c.json({
      document: doc,
      revision: rev,
      header: headerRev,
      footer: footerRev,
      settings: settings ?? null,
    });
  } finally {
    await pool.end();
  }
});

documentsRoutes.use("/admin/*", requireAdmin);

documentsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) => {
      await ensureSeedDocuments(tx, c.get("userId"));
      return tx.select().from(documents).orderBy(asc(documents.slug));
    });
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

documentsRoutes.get("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const { db, pool } = createDb(c.env);
  try {
    const payload = await withOwnerRls(db, c.get("userId"), async (tx) => {
      await ensureSeedDocuments(tx, c.get("userId"));
      const [doc] = await tx
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);
      if (!doc) return null;
      const revisions = await tx
        .select()
        .from(documentRevisions)
        .where(eq(documentRevisions.documentId, id))
        .orderBy(desc(documentRevisions.createdAt))
        .limit(30);
      const draftId = doc.draftRevisionId ?? revisions[0]?.id;
      const draft = draftId
        ? revisions.find((r) => r.id === draftId) ??
          (
            await tx
              .select()
              .from(documentRevisions)
              .where(eq(documentRevisions.id, draftId))
              .limit(1)
          )[0]
        : null;
      return { document: doc, draft, revisions };
    });
    if (!payload) return c.json({ error: "Not found" }, 404);
    return c.json(payload);
  } finally {
    await pool.end();
  }
});

documentsRoutes.post("/admin", async (c) => {
  const body = documentInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const ownerId = c.get("userId");
      const [doc] = await tx
        .insert(documents)
        .values({
          ownerId,
          slug: body.slug,
          title: body.title,
          kind: body.kind,
          locale: body.locale,
          status: "draft",
        })
        .returning();
      const [rev] = await tx
        .insert(documentRevisions)
        .values({
          ownerId,
          documentId: doc!.id,
          tree: body.tree,
          label: body.label ?? "Create",
          createdBy: ownerId,
        })
        .returning();
      await tx
        .update(documents)
        .set({ draftRevisionId: rev!.id, updatedAt: new Date() })
        .where(eq(documents.id, doc!.id));
      return { document: { ...doc!, draftRevisionId: rev!.id }, revision: rev };
    });
    return c.json(created, 201);
  } finally {
    await pool.end();
  }
});

documentsRoutes.put("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const body = documentInputSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const saved = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const ownerId = c.get("userId");
      const [doc] = await tx
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);
      if (!doc) return null;
      if (
        body.expectedRevisionId &&
        doc.draftRevisionId &&
        body.expectedRevisionId !== doc.draftRevisionId
      ) {
        return { conflict: true as const, document: doc };
      }
      const [rev] = await tx
        .insert(documentRevisions)
        .values({
          ownerId,
          documentId: id,
          tree: body.tree,
          label: body.label ?? "Autosave",
          createdBy: ownerId,
        })
        .returning();
      const [updated] = await tx
        .update(documents)
        .set({
          slug: body.slug,
          title: body.title,
          kind: body.kind,
          locale: body.locale,
          draftRevisionId: rev!.id,
          status: doc.status === "published" ? "published" : "draft",
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning();
      return { conflict: false as const, document: updated, revision: rev };
    });
    if (!saved) return c.json({ error: "Not found" }, 404);
    if ("conflict" in saved && saved.conflict) {
      return c.json({ error: "Conflict", document: saved.document }, 409);
    }
    return c.json(saved);
  } finally {
    await pool.end();
  }
});

documentsRoutes.post("/admin/:id/publish", async (c) => {
  const id = c.req.param("id");
  const body = publishDocumentSchema.parse(await c.req.json().catch(() => ({})));
  const { db, pool } = createDb(c.env);
  try {
    const published = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [doc] = await tx
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);
      if (!doc) return null;
      const revId = body.revisionId ?? doc.draftRevisionId;
      if (!revId) return { error: "No revision" as const };
      const [updated] = await tx
        .update(documents)
        .set({
          publishedRevisionId: revId,
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning();
      return { document: updated };
    });
    if (!published) return c.json({ error: "Not found" }, 404);
    if ("error" in published) return c.json({ error: published.error }, 400);
    return c.json(published);
  } finally {
    await pool.end();
  }
});

documentsRoutes.post("/admin/:id/rollback", async (c) => {
  const id = c.req.param("id");
  const { revisionId } = z
    .object({ revisionId: z.string().uuid() })
    .parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const result = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [rev] = await tx
        .select()
        .from(documentRevisions)
        .where(
          and(
            eq(documentRevisions.id, revisionId),
            eq(documentRevisions.documentId, id),
          ),
        )
        .limit(1);
      if (!rev) return null;
      const [clone] = await tx
        .insert(documentRevisions)
        .values({
          ownerId: c.get("userId"),
          documentId: id,
          tree: rev.tree,
          label: `Rollback to ${revisionId}`,
          createdBy: c.get("userId"),
        })
        .returning();
      const [updated] = await tx
        .update(documents)
        .set({
          draftRevisionId: clone!.id,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, id))
        .returning();
      return { document: updated, revision: clone };
    });
    if (!result) return c.json({ error: "Not found" }, 404);
    return c.json(result);
  } finally {
    await pool.end();
  }
});

documentsRoutes.delete("/admin/:id", async (c) => {
  const id = c.req.param("id");
  const { db, pool } = createDb(c.env);
  try {
    await withOwnerRls(db, c.get("userId"), async (tx) => {
      await tx.delete(documents).where(eq(documents.id, id));
    });
    return c.json({ ok: true });
  } finally {
    await pool.end();
  }
});
