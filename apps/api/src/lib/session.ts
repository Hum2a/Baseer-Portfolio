import type { Context, Next } from "hono";
import { createAuthSession } from "./auth";
import type { AppVariables, Env } from "../env";

/** Require Better Auth session; optionally allowlist ADMIN_EMAIL. */
export async function requireAdmin(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const { auth, pool } = createAuthSession(c.env);
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allowlist = c.env.ADMIN_EMAIL?.toLowerCase().trim();
    if (allowlist && session.user.email.toLowerCase() !== allowlist) {
      return c.json({ error: "Forbidden" }, 403);
    }

    c.set("userId", session.user.id);
    c.set("userEmail", session.user.email);
    await next();
  } finally {
    await pool.end().catch(() => undefined);
  }
}
