import {
  createApp,
  resolveSeoMeta,
  buildSitemapXml,
  injectMetaIntoHtml,
  META_CACHE_TTL_SECONDS,
} from "@baseer-portfolio/api";

export type WorkerEnv = {
  ASSETS: Fetcher;
  MEDIA: R2Bucket;
  APP_URL: string;
  OWNER_ID: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
};

const app = createApp();

const ASSET_EXT =
  /\.(js|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|map|txt|json|webmanifest)$/i;

function isHtmlNavigation(request: Request, pathname: string): boolean {
  if (request.method !== "GET") return false;
  if (ASSET_EXT.test(pathname)) return false;
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("text/html");
}

async function serveIndex(env: WorkerEnv, request: Request): Promise<Response> {
  return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return app.fetch(request, env, ctx);
    }

    if (url.pathname === "/sitemap.xml") {
      try {
        const xml = await buildSitemapXml(env);
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": `public, max-age=${META_CACHE_TTL_SECONDS}`,
          },
        });
      } catch (err) {
        console.error("sitemap failed", err);
        return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      }
    }

    if (isHtmlNavigation(request, url.pathname)) {
      try {
        const cache = (caches as unknown as { default: Cache }).default;
        const cacheKey = new Request(url.toString(), request);
        const cached = await cache.match(cacheKey);
        if (cached) return cached;

        const assetRes = await serveIndex(env, request);
        const html = await assetRes.text();

        let body = html;
        try {
          const meta = await resolveSeoMeta(env, url.pathname);
          const origin = (env.APP_URL || url.origin).replace(/\/$/, "");
          body = injectMetaIntoHtml(html, meta, origin);
        } catch (err) {
          // Missing DATABASE_URL / Neon — still serve the SPA shell.
          console.error("meta injection failed; serving raw index", err);
        }

        const response = new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": `public, max-age=${META_CACHE_TTL_SECONDS}`,
          },
        });

        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      } catch (err) {
        console.error("html navigation failed", err);
        return serveIndex(env, request);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
