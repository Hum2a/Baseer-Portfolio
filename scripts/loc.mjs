import { execSync } from "node:child_process";

try {
  const out = execSync(
    'git ls-files "*.ts" "*.tsx" "*.css" "*.mjs" "*.sql" "*.md" 2>nul || dir /s /b',
    { encoding: "utf8", shell: true },
  );
  const files = out
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((f) => !f.includes("node_modules") && !f.includes("dist"));
  let lines = 0;
  const { readFileSync, existsSync } = await import("node:fs");
  for (const f of files) {
    if (!existsSync(f)) continue;
    if (!/\.(ts|tsx|css|mjs|sql|md)$/.test(f)) continue;
    lines += readFileSync(f, "utf8").split(/\r?\n/).length;
  }
  console.log(`Approx lines of tracked source: ${lines} across ${files.length} paths`);
} catch {
  console.log("loc: unable to compute (is git initialised?)");
}
