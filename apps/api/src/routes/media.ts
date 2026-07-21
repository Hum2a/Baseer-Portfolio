import { Hono } from "hono";
import {
  ALLOWED_CV_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_CV_BYTES,
  MAX_IMAGE_BYTES,
  presignRequestSchema,
} from "@baseer-portfolio/shared";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";
import { buildObjectKey, createPresignedUrl } from "../lib/r2";

export const mediaRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

mediaRoutes.use("/presign", requireAdmin);
mediaRoutes.use("/proxy/*", requireAdmin);

mediaRoutes.post("/presign", async (c) => {
  const body = presignRequestSchema.parse(await c.req.json());
  const isCv = body.purpose === "cv";
  const isFont = body.purpose === "font";
  const allowed = isCv
    ? ALLOWED_CV_TYPES
    : isFont
      ? ([
          "font/woff2",
          "font/woff",
          "font/ttf",
          "application/font-woff",
          "application/font-woff2",
          "application/octet-stream",
        ] as const)
      : ALLOWED_IMAGE_TYPES;
  const max = isCv ? MAX_CV_BYTES : isFont ? 5 * 1024 * 1024 : MAX_IMAGE_BYTES;

  if (!(allowed as readonly string[]).includes(body.contentType)) {
    return c.json({ error: "Unsupported content type" }, 400);
  }
  if (body.byteSize > max) {
    return c.json({ error: "File too large" }, 400);
  }

  const key = buildObjectKey(c.get("userId"), body.purpose, body.filename);
  const { url, expiresIn } = await createPresignedUrl(c.env, {
    key,
    method: "PUT",
    contentType: body.contentType,
  });

  return c.json({ key, url, expiresIn });
});

mediaRoutes.put("/proxy/upload", async (c) => {
  const key = c.req.query("key");
  if (!key) return c.json({ error: "key required" }, 400);
  const contentType = c.req.header("content-type") ?? "application/octet-stream";
  const body = await c.req.arrayBuffer();
  await c.env.MEDIA.put(key, body, {
    httpMetadata: { contentType },
  });
  return c.json({ ok: true, key });
});

mediaRoutes.get("/proxy/download", async (c) => {
  const key = c.req.query("key");
  if (!key) return c.json({ error: "key required" }, 400);
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.json({ error: "Not found" }, 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  return new Response(obj.body, { headers });
});

/** Public media serve for published images / CV (keyed paths only). */
mediaRoutes.get("/file", async (c) => {
  const key = c.req.query("key");
  if (!key) return c.json({ error: "key required" }, 400);
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.json({ error: "Not found" }, 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=86400");
  return new Response(obj.body, { headers });
});
