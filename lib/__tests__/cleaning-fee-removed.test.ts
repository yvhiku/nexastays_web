import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(__dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (
      name === "node_modules" ||
      name === ".next" ||
      name === ".next-dev" ||
      name === "docs"
    ) {
      continue;
    }
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx|json)$/.test(name)) out.push(p);
  }
  return out;
}

test("Test 6 — no active web product code references cleaning fees", () => {
  const files = walk(root);
  const hits: string[] = [];
  const pattern = /cleaning_fee|cleaningFee|fieldCleaningFee|Cleaning fee|Frais de ménage|رسوم التنظيف/i;
  for (const file of files) {
    if (file.includes(`${join("lib", "__tests__")}`)) continue;
    const text = readFileSync(file, "utf8");
    if (pattern.test(text)) hits.push(file.replace(root + "\\", "").replace(root + "/", ""));
  }
  assert.deepEqual(hits, [], `Unexpected cleaning-fee references:\n${hits.join("\n")}`);
});
