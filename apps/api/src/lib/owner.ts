import type { Context, Next } from "hono";
import type { AppVariables, Env } from "../env";

/** Attach fixed OWNER_ID — no login. */
export async function withOwner(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const ownerId = c.env.OWNER_ID;
  if (!ownerId) {
    return c.json({ error: "OWNER_ID not configured" }, 500);
  }
  c.set("userId", ownerId);
  await next();
}
