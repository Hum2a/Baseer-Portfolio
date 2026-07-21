/**
 * Clone all documents from one locale to another (draft copies).
 * Usage: npx tsx src/db/clone-locale.ts --from=en --to=fr
 */
import { and, eq } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { loadEnv } from "./load-env";
import * as schema from "./schema";

loadEnv();

function arg(name: string, fallback: string) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const from = arg("from", "en");
  const to = arg("to", "fr");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const db = drizzle(pool, { schema });
  try {
    const source = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.locale, from));

    let created = 0;
    for (const doc of source) {
      const [exists] = await db
        .select()
        .from(schema.documents)
        .where(
          and(
            eq(schema.documents.slug, doc.slug),
            eq(schema.documents.locale, to),
          ),
        )
        .limit(1);
      if (exists) continue;

      const revId = doc.draftRevisionId ?? doc.publishedRevisionId;
      if (!revId) continue;
      const [rev] = await db
        .select()
        .from(schema.documentRevisions)
        .where(eq(schema.documentRevisions.id, revId))
        .limit(1);
      if (!rev) continue;

      const [clone] = await db
        .insert(schema.documents)
        .values({
          ownerId: doc.ownerId,
          slug: doc.slug,
          title: `${doc.title} (${to})`,
          kind: doc.kind,
          locale: to,
          status: "draft",
        })
        .returning();
      const [newRev] = await db
        .insert(schema.documentRevisions)
        .values({
          ownerId: doc.ownerId,
          documentId: clone!.id,
          tree: rev.tree,
          label: `Cloned from ${from}`,
          createdBy: doc.ownerId,
        })
        .returning();
      await db
        .update(schema.documents)
        .set({ draftRevisionId: newRev!.id })
        .where(eq(schema.documents.id, clone!.id));
      created += 1;
    }
    console.log(`Cloned ${created} documents from ${from} → ${to}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
