import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import type { Env } from "../env";
import * as schema from "./schema";

export type Database = NeonDatabase<typeof schema>;

// Keep WebSocket Pool (needed for RLS transactions). Avoid sticky client reuse.
neonConfig.poolQueryViaFetch = false;

function connectionString(env: Env): string {
  if (env.HYPERDRIVE?.connectionString) return env.HYPERDRIVE.connectionString;
  if (env.DATABASE_URL) return env.DATABASE_URL;
  throw new Error("No DATABASE_URL or HYPERDRIVE binding configured");
}

export function createDb(env: Env): { db: Database; pool: Pool } {
  const pool = new Pool({
    connectionString: connectionString(env),
    max: 1,
    maxUses: 1,
  });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

/** Map session user id → auth.user_id() for Neon RLS. */
export async function withOwnerRls<T>(
  db: Database,
  ownerId: string,
  fn: (tx: Database) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    const claims = JSON.stringify({ sub: ownerId, role: "authenticated" });
    await tx.execute(sql`SELECT set_config('request.jwt.claims', ${claims}, true)`);
    await tx.execute(
      sql`SELECT set_config('request.jwt.claim.sub', ${ownerId}, true)`,
    );
    await tx.execute(sql`SET LOCAL ROLE authenticated`).catch(() => undefined);
    return fn(tx as unknown as Database);
  });
}
