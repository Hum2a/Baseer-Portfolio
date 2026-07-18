import { and, asc, eq } from "drizzle-orm";
import type { Env } from "../env";
import { createDb } from "../db/client";
import { caseStudies, siteSettings } from "../db/schema";

export type SeoMeta = {
  title: string;
  description: string;
  imageKey: string | null;
  canonicalPath: string;
};

const DEFAULT_TITLE = "Baseer — Marketing Portfolio";
const DEFAULT_DESCRIPTION =
  "Campaigns and launches across automotive, charity, and education.";

export async function resolveSeoMeta(
  env: Env,
  pathname: string,
): Promise<SeoMeta> {
  const path = pathname.replace(/\/$/, "") || "/";
  const { db, pool } = createDb(env);

  try {
    const [settings] = await db.select().from(siteSettings).limit(1);

    if (path === "/") {
      return {
        title: settings?.introHeadline
          ? `${settings.introHeadline} — Baseer`
          : DEFAULT_TITLE,
        description: settings?.introSubhead ?? DEFAULT_DESCRIPTION,
        imageKey: null,
        canonicalPath: "/",
      };
    }

    if (path === "/about") {
      return {
        title: "About — Baseer",
        description: "Career timeline, skills, and CV.",
        imageKey: null,
        canonicalPath: "/about",
      };
    }

    if (path === "/contact") {
      return {
        title: "Contact — Baseer",
        description: settings?.contactEmail
          ? `Get in touch at ${settings.contactEmail}`
          : "Get in touch.",
        imageKey: null,
        canonicalPath: "/contact",
      };
    }

    if (path === "/automotive" || path === "/charity" || path === "/education") {
      const sector = path.slice(1);
      const label = sector.charAt(0).toUpperCase() + sector.slice(1);
      return {
        title: `${label} — Baseer`,
        description: `Case studies in ${sector}.`,
        imageKey: null,
        canonicalPath: path,
      };
    }

    const workMatch = path.match(/^\/work\/([a-z0-9-]+)$/);
    if (workMatch) {
      const slug = workMatch[1]!;
      const [row] = await db
        .select()
        .from(caseStudies)
        .where(and(eq(caseStudies.slug, slug), eq(caseStudies.published, true)))
        .limit(1);
      if (row) {
        return {
          title: `${row.title} — Baseer`,
          description: row.dek,
          imageKey: row.heroImageKey,
          canonicalPath: `/work/${row.slug}`,
        };
      }
    }

    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      imageKey: null,
      canonicalPath: path,
    };
  } finally {
    await pool.end();
  }
}

export async function buildSitemapXml(env: Env): Promise<string> {
  const { db, pool } = createDb(env);
  const origin = env.APP_URL.replace(/\/$/, "");
  try {
    const rows = await db
      .select({ slug: caseStudies.slug, updatedAt: caseStudies.updatedAt })
      .from(caseStudies)
      .where(eq(caseStudies.published, true))
      .orderBy(asc(caseStudies.displayOrder));

    const staticPaths = ["/", "/about", "/contact", "/automotive", "/charity", "/education"];
    const urls = [
      ...staticPaths.map(
        (p) => `
  <url>
    <loc>${origin}${p === "/" ? "" : p}</loc>
    <changefreq>weekly</changefreq>
  </url>`,
      ),
      ...rows.map(
        (r) => `
  <url>
    <loc>${origin}/work/${r.slug}</loc>
    <lastmod>${r.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
  </url>`,
      ),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;
  } finally {
    await pool.end();
  }
}

export function injectMetaIntoHtml(
  html: string,
  meta: SeoMeta,
  origin: string,
): string {
  const imageUrl = meta.imageKey
    ? `${origin}/api/media/file?key=${encodeURIComponent(meta.imageKey)}`
    : `${origin}/og-default.png`;
  const canonical = `${origin}${meta.canonicalPath === "/" ? "" : meta.canonicalPath}`;

  return html
    .replaceAll("__META_TITLE__", escapeHtml(meta.title))
    .replaceAll("__META_DESCRIPTION__", escapeHtml(meta.description))
    .replaceAll("__META_OG_IMAGE__", escapeHtml(imageUrl))
    .replaceAll("__META_CANONICAL__", escapeHtml(canonical));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const META_CACHE_TTL_SECONDS = 300;
