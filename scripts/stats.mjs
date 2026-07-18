import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git" || name === ".turbo") {
      continue;
    }
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = walk(".");
const byExt = {};
for (const f of files) {
  const ext = f.includes(".") ? f.slice(f.lastIndexOf(".")) : "(none)";
  byExt[ext] = (byExt[ext] ?? 0) + 1;
}
console.log("File counts by extension:");
for (const [ext, n] of Object.entries(byExt).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${ext.padEnd(12)} ${n}`);
}
console.log(`Total files: ${files.length}`);
