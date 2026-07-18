#!/usr/bin/env node
/**
 * Push Worker secrets to Cloudflare from a local env file.
 *
 * Usage:
 *   npm run secrets:sync:staging
 *   npm run secrets:sync:production
 *   npm run secrets:show:staging
 *   npm run secrets:show:production
 *
 * Source file (first match wins):
 *   .env.staging / .env.production
 *   apps/web/.dev.vars
 *   .env
 *
 * Requires CLOUDFLARE_API_TOKEN (+ optional CLOUDFLARE_ACCOUNT_ID) in the
 * environment or in `.env` / `.env.cloudflare`.
 */
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Secrets uploaded via `wrangler secret bulk` (not plain [vars]). */
const WORKER_SECRET_KEYS = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

const REQUIRED_KEYS = ["DATABASE_URL", "BETTER_AUTH_SECRET"];

const VALID = ["staging", "production"];
const showMode = process.argv.includes("--show");
const environment = process.argv.find((arg) => VALID.includes(arg));

if (!environment) {
  console.error(
    `secrets-sync: first argument must be one of ${VALID.join(" | ")}\n` +
      "  npm run secrets:sync:staging\n" +
      "  npm run secrets:sync:production",
  );
  process.exit(1);
}

function parseEnvFile(path) {
  const vars = {};
  if (!existsSync(path)) return vars;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function isPlaceholderDb(value) {
  if (!value) return true;
  return (
    value.includes("user:pass@localhost") ||
    value.includes("postgres://user:pass")
  );
}

function isUnusableSecret(key, value) {
  if (!value) return true;
  if (key === "DATABASE_URL") return isPlaceholderDb(value);
  if (key === "BETTER_AUTH_SECRET") {
    return (
      value.includes("replace-with") ||
      value.length < 16
    );
  }
  return false;
}

function loadCloudflareCreds() {
  const merged = {
    ...parseEnvFile(join(root, ".env")),
    ...parseEnvFile(join(root, ".env.cloudflare")),
  };
  if (merged.CLOUDFLARE_API_TOKEN && !process.env.CLOUDFLARE_API_TOKEN) {
    process.env.CLOUDFLARE_API_TOKEN = merged.CLOUDFLARE_API_TOKEN;
  }
  if (merged.CLOUDFLARE_ACCOUNT_ID && !process.env.CLOUDFLARE_ACCOUNT_ID) {
    process.env.CLOUDFLARE_ACCOUNT_ID = merged.CLOUDFLARE_ACCOUNT_ID;
  }
}

function resolveSourceFile() {
  const candidates = [
    join(root, `.env.${environment}`),
    join(root, "apps/web/.dev.vars"),
    join(root, ".env"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

loadCloudflareCreds();

const sourcePath = resolveSourceFile();
if (!sourcePath) {
  console.error(
    `secrets-sync: no env file found. Create .env.${environment} (or .env) with DATABASE_URL.`,
  );
  process.exit(1);
}

const source = parseEnvFile(sourcePath);
const toSync = {};
for (const key of WORKER_SECRET_KEYS) {
  const value = source[key];
  if (value) toSync[key] = value;
}

const relSource = sourcePath.replace(root + "\\", "").replace(root + "/", "");

if (showMode) {
  console.log(`Worker secrets for ${environment} (from ${relSource}):\n`);
  for (const key of WORKER_SECRET_KEYS) {
    const value = source[key];
    const required = REQUIRED_KEYS.includes(key);
    let status = "MISSING";
    if (value && !isUnusableSecret(key, value)) status = "set    ";
    else if (value && isUnusableSecret(key, value)) status = "PLACEHOLDER";
    else if (!required) status = "optional";
    console.log(`${status.padEnd(12)} ${key}${required ? " *" : ""}`);
  }
  console.log("\n* required");
  console.log(
    `\nPlain [vars] in wrangler.toml (not synced as secrets): APP_URL, OWNER_ID, ADMIN_EMAIL`,
  );
  process.exit(0);
}

const missing = REQUIRED_KEYS.filter(
  (key) => !toSync[key] || isUnusableSecret(key, toSync[key]),
);
if (missing.length) {
  console.error(
    `secrets-sync: missing or placeholder required value(s) in ${relSource}: ${missing.join(", ")}\n` +
      `Inspect with: npm run secrets:show:${environment === "staging" ? "staging" : "production"}`,
  );
  process.exit(1);
}

if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.error(
    "secrets-sync: CLOUDFLARE_API_TOKEN not set.\n" +
      "Add it to `.env` or `.env.cloudflare`, or export it in your shell.",
  );
  process.exit(1);
}

const bulkLines = Object.entries(toSync).map(([key, value]) => `${key}=${value}`);
const tempDir = mkdtempSync(join(tmpdir(), "baseer-portfolio-secrets-"));
const bulkFile = join(tempDir, "worker-secrets.env");
writeFileSync(bulkFile, `${bulkLines.join("\n")}\n`);

const wranglerConfig = join(root, "apps/web/wrangler.toml");
const keys = Object.keys(toSync).join(", ");

console.log(
  `secrets-sync: uploading ${keys}\n` +
    `  source: ${relSource}\n` +
    `  worker: --env ${environment}\n`,
);

try {
  // Prefer OAuth if CLOUDFLARE_API_TOKEN keeps failing auth (code 10000).
  // Unset a bad token for this process when SECRETS_SYNC_USE_OAUTH=1.
  const env = { ...process.env };
  if (process.env.SECRETS_SYNC_USE_OAUTH === "1") {
    delete env.CLOUDFLARE_API_TOKEN;
    console.log("secrets-sync: SECRETS_SYNC_USE_OAUTH=1 — using wrangler login session\n");
  }

  execSync(
    `npx wrangler secret bulk "${bulkFile}" --config "${wranglerConfig}" --env ${environment}`,
    {
      stdio: "inherit",
      cwd: root,
      env,
      shell: true,
    },
  );
  console.log(`\nsecrets-sync: ${environment} Worker secrets updated.`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
