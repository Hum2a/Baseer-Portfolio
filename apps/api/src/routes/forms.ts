import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { formDefinitionSchema } from "@baseer-portfolio/shared";
import { createDb, withOwnerRls } from "../db/client";
import { formSubmissions, forms, siteSettings } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const formsRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

formsRoutes.post("/public/:id/submit", async (c) => {
  const id = c.req.param("id");
  const payload = (await c.req.json()) as Record<string, unknown>;
  const { db, pool } = createDb(c.env);
  try {
    const [form] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
    if (!form) return c.json({ error: "Not found" }, 404);
    await db.insert(formSubmissions).values({ formId: id, payload });

    const definition = form.definition as {
      notifyEmail?: string;
      successMessage?: string;
      name?: string;
    };
    const [settings] = await db.select().from(siteSettings).limit(1);
    const to = definition.notifyEmail || settings?.contactEmail;
    if (to && c.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Baseer Portfolio <onboarding@resend.dev>",
          to: [to],
          subject: `Form: ${definition.name || form.name}`,
          text: JSON.stringify(payload, null, 2),
        }),
      }).catch((err) => console.error("resend failed", err));
    }

    return c.json({
      ok: true,
      message: definition.successMessage ?? "Thanks — we’ll be in touch.",
    });
  } finally {
    await pool.end();
  }
});

formsRoutes.use("/admin/*", requireAdmin);

formsRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) =>
      tx.select().from(forms).orderBy(asc(forms.createdAt)),
    );
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

formsRoutes.post("/admin", async (c) => {
  const body = formDefinitionSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const created = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx
        .insert(forms)
        .values({
          ownerId: c.get("userId"),
          name: body.name,
          definition: body,
        })
        .returning();
      return row;
    });
    return c.json(created, 201);
  } finally {
    await pool.end();
  }
});

formsRoutes.get("/admin/:id/submissions", async (c) => {
  const id = c.req.param("id");
  const { db, pool } = createDb(c.env);
  try {
    const rows = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [form] = await tx.select().from(forms).where(eq(forms.id, id)).limit(1);
      if (!form) return null;
      return tx
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, id))
        .orderBy(asc(formSubmissions.createdAt));
    });
    if (!rows) return c.json({ error: "Not found" }, 404);
    return c.json(rows);
  } finally {
    await pool.end();
  }
});
