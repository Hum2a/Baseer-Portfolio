import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { adminRoleSchema } from "@baseer-portfolio/shared";
import { z } from "zod";
import { createDb } from "../db/client";
import { user } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const usersRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

usersRoutes.use("/admin/*", requireAdmin);

usersRoutes.get("/admin", async (c) => {
  const { db, pool } = createDb(c.env);
  try {
    // Owners can list users; RLS on user table may not exist — use plain select as admin connection (owner).
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
      .from(user);
    return c.json(rows);
  } finally {
    await pool.end();
  }
});

usersRoutes.put("/admin/:id/role", async (c) => {
  const id = c.req.param("id");
  const body = z.object({ role: adminRoleSchema }).parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    // Only current owner may change roles
    const [me] = await db
      .select()
      .from(user)
      .where(eq(user.id, c.get("userId")))
      .limit(1);
    if (!me || (me.role !== "owner" && me.email !== c.env.ADMIN_EMAIL)) {
      return c.json({ error: "Only owners can change roles" }, 403);
    }
    const [updated] = await db
      .update(user)
      .set({ role: body.role, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  } finally {
    await pool.end();
  }
});
