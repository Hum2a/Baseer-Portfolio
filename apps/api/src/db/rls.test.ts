import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const migration = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../drizzle/0000_init.sql"),
  "utf8",
);

const contentTables = [
  "case_studies",
  "gallery_images",
  "testimonials",
  "skills",
  "timeline_entries",
  "site_settings",
] as const;

describe("RLS schema", () => {
  it("defines auth.user_id() helper", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION auth.user_id()");
    expect(migration).toContain("request.jwt.claim.sub");
  });

  for (const table of contentTables) {
    it(`enables RLS and owner policies on ${table}`, () => {
      expect(migration).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      expect(migration).toContain(`ON "${table}"`);
      expect(migration).toContain('(select auth.user_id()) = "owner_id"');
    });
  }
});

describe("auth.user_id mapping contract", () => {
  it("maps OWNER_ID → JWT sub claim for RLS", () => {
    expect(migration).toContain("auth.user_id()");
  });
});

const hasDb = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDb)("RLS isolation (live DB)", () => {
  it("owner A cannot read owner B rows", async () => {
    const { Pool } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const { eq } = await import("drizzle-orm");
    const { sql } = await import("drizzle-orm");
    const schema = await import("./schema");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 1 });
    const db = drizzle(pool, { schema });

    const userA = "rls-test-a";
    const userB = "rls-test-b";

    try {
      for (const id of [userA, userB]) {
        await db
          .insert(schema.user)
          .values({
            id,
            name: id,
            email: `${id}@test.local`,
          })
          .onConflictDoNothing();
      }

      await db.delete(schema.caseStudies).where(eq(schema.caseStudies.ownerId, userA));
      await db.delete(schema.caseStudies).where(eq(schema.caseStudies.ownerId, userB));

      const [rowB] = await db
        .insert(schema.caseStudies)
        .values({
          ownerId: userB,
          sector: "automotive",
          title: "Secret Campaign",
          slug: `secret-${Date.now()}`,
          dek: "Hidden",
          published: true,
        })
        .returning();

      expect(rowB).toBeDefined();

      const asA = await db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT set_config('request.jwt.claim.sub', ${userA}, true)`,
        );
        await tx.execute(sql`SAVEPOINT before_set_role`);
        try {
          await tx.execute(sql`SET LOCAL ROLE authenticated`);
          await tx.execute(sql`RELEASE SAVEPOINT before_set_role`);
        } catch {
          await tx.execute(sql`ROLLBACK TO SAVEPOINT before_set_role`);
        }
        return tx
          .select()
          .from(schema.caseStudies)
          .where(eq(schema.caseStudies.id, rowB!.id));
      });

      expect(asA).toHaveLength(0);
    } finally {
      await db.delete(schema.caseStudies).where(eq(schema.caseStudies.ownerId, userB));
      await db.delete(schema.user).where(eq(schema.user.id, userA));
      await db.delete(schema.user).where(eq(schema.user.id, userB));
      await pool.end();
    }
  });
});
