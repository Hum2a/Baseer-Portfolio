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
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (ASSET_EXT.test(pathname)) return false;
  if (pathname.startsWith("/api")) return false;
  const accept = request.headers.get("Accept") ?? "";
  // Browsers send text/html; also treat navigations with no Accept as HTML.
  return accept.includes("text/html") || accept === "" || accept === "*/*";
}

/** Fetch the SPA shell without forwarding browser Accept (avoids empty body). */
async function loadIndexHtml(env: WorkerEnv, origin: string): Promise<string> {
  const assetRes = await env.ASSETS.fetch(
    new Request(new URL("/index.html", origin), {
      method: "GET",
      headers: { Accept: "application/octet-stream" },
    }),
  );
  const html = await assetRes.text();
  if (!html || !html.includes("<div id=\"root\"")) {
    throw new Error(`index.html missing or empty (status ${assetRes.status})`);
  }
  return html;
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
        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
          { headers: { "Content-Type": "application/xml; charset=utf-8" } },
        );
      }
    }

    if (isHtmlNavigation(request, url.pathname)) {
      try {
        let html = await loadIndexHtml(env, url.origin);

        try {
          const meta = await resolveSeoMeta(env, url.pathname);
          const origin = (env.APP_URL || url.origin).replace(/\/$/, "");
          html = injectMetaIntoHtml(html, meta, origin);
        } catch (err) {
          console.error("meta injection failed; serving raw index", err);
        }

        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=60",
          },
        });
      } catch (err) {
        console.error("html navigation failed", err);
        // Last resort: let the assets binding handle SPA fallback.
        return env.ASSETS.fetch(request);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
