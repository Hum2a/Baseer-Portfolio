import { existsSync, readFileSync } from "node:fs";

const checks = [];

function ok(name, pass, detail = "") {
  checks.push({ name, pass, detail });
}

ok("package.json", existsSync("package.json"));
ok("turbo.json", existsSync("turbo.json"));
ok("AGENTS.md", existsSync("AGENTS.md"));
ok(".cursor/rules", existsSync(".cursor/rules/00-project.mdc"));
ok("apps/web", existsSync("apps/web/package.json"));
ok("apps/api", existsSync("apps/api/package.json"));
ok("packages/shared", existsSync("packages/shared/package.json"));
ok(".env.example", existsSync(".env.example"));
ok("apps/web/.dev.vars.example", existsSync("apps/web/.dev.vars.example"));
ok("apps/web/.env.example", existsSync("apps/web/.env.example"));
ok("wrangler", existsSync("apps/web/wrangler.toml"));
ok(".env", existsSync(".env"), existsSync(".env") ? "" : "run npm run setup");
ok(
  "apps/web/.dev.vars",
  existsSync("apps/web/.dev.vars"),
  existsSync("apps/web/.dev.vars") ? "" : "run npm run setup",
);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
ok("npm workspaces", Array.isArray(pkg.workspaces));
ok("no pnpm lock", !existsSync("pnpm-lock.yaml"));
ok("no yarn lock", !existsSync("yarn.lock"));
ok("no Pages deploy scripts", !JSON.stringify(pkg).includes("pages deploy"));

if (existsSync(".env")) {
  const env = readFileSync(".env", "utf8");
  const hasDb = /^DATABASE_URL=.+/m.test(env);
  const placeholder = /DATABASE_URL=.*user:pass@localhost/.test(env);
  // Warn-only: fresh clones keep the placeholder until Neon is wired.
  ok(
    "DATABASE_URL present",
    hasDb,
    placeholder ? "placeholder — set Neon URL before migrate/seed" : "",
  );
  if (placeholder) {
    console.log("[WARN] DATABASE_URL still placeholder — fine for scaffold, not for db:*");
  }
  ok("OWNER_ID", /^OWNER_ID=.+/m.test(env));
}

let failed = 0;
for (const c of checks) {
  const mark = c.pass ? "OK" : "FAIL";
  if (!c.pass) failed += 1;
  console.log(`[${mark}] ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}

if (failed) {
  console.error(`\nDoctor found ${failed} issue(s). Run npm run setup if env files are missing.`);
  process.exit(1);
}
console.log("\nDoctor: all checks passed.");
