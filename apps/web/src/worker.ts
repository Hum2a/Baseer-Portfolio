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
      const xml = await buildSitemapXml(env);
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": `public, max-age=${META_CACHE_TTL_SECONDS}`,
        },
      });
    }

    if (isHtmlNavigation(request, url.pathname)) {
      const cache = (caches as unknown as { default: Cache }).default;
      const cacheKey = new Request(url.toString(), request);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const assetRes = await env.ASSETS.fetch(
        new Request(new URL("/index.html", url.origin), request),
      );
      const html = await assetRes.text();
      const meta = await resolveSeoMeta(env, url.pathname);
      const origin = env.APP_URL.replace(/\/$/, "");
      const injected = injectMetaIntoHtml(html, meta, origin);

      const response = new Response(injected, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": `public, max-age=${META_CACHE_TTL_SECONDS}`,
        },
      });

      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    return env.ASSETS.fetch(request);
  },
};
