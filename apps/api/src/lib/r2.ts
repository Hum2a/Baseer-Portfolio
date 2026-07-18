import type { Env } from "../env";

const DEFAULT_TTL_SECONDS = 8 * 60;

export type PresignOptions = {
  key: string;
  method: "GET" | "PUT";
  contentType?: string;
  expiresInSeconds?: number;
};

export async function createPresignedUrl(
  env: Env,
  options: PresignOptions,
): Promise<{ url: string; expiresIn: number }> {
  const expiresIn = options.expiresInSeconds ?? DEFAULT_TTL_SECONDS;

  if (
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME
  ) {
    const url = await signR2Url({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET_NAME,
      key: options.key,
      method: options.method,
      contentType: options.contentType,
      expiresIn,
    });
    return { url, expiresIn };
  }

  const base = env.APP_URL.replace(/\/$/, "");
  const kind = options.method === "PUT" ? "upload" : "download";
  const url = `${base}/api/media/proxy/${kind}?key=${encodeURIComponent(options.key)}`;
  return { url, expiresIn };
}

export function buildObjectKey(ownerId: string, purpose: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${ownerId}/${purpose}/${crypto.randomUUID()}-${safe}`;
}

async function signR2Url(args: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  method: "GET" | "PUT";
  contentType?: string;
  expiresIn: number;
}): Promise<string> {
  const host = `${args.accountId}.r2.cloudflarestorage.com`;
  const encodedKey = args.key
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = datetime.slice(0, 8);
  const credential = `${args.accessKeyId}/${date}/auto/s3/aws4_request`;
  const signedHeaders =
    args.method === "PUT" && args.contentType ? "content-type;host" : "host";

  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": datetime,
    "X-Amz-Expires": String(args.expiresIn),
    "X-Amz-SignedHeaders": signedHeaders,
  });

  const canonicalHeaders =
    args.method === "PUT" && args.contentType
      ? `content-type:${args.contentType}\nhost:${host}\n`
      : `host:${host}\n`;

  const canonicalRequest = [
    args.method,
    `/${args.bucket}/${encodedKey}`,
    query.toString(),
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    datetime,
    `${date}/auto/s3/aws4_request`,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(args.secretAccessKey, date, "auto", "s3");
  const signature = await hmacHex(signingKey, stringToSign);
  query.set("X-Amz-Signature", signature);

  return `https://${host}/${args.bucket}/${encodedKey}?${query.toString()}`;
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  // Copy into a fresh Uint8Array so BufferSource is ArrayBuffer-backed (DOM + Workers).
  const keyData = key instanceof Uint8Array ? new Uint8Array(key) : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const sig = await hmac(key, data);
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSignatureKey(
  secret: string,
  date: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${secret}`), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}
