/**
 * Fail CI when source files contain mojibake or common encoding corruption bytes.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SCAN_DIRS = ["app", "components", "lib", "scripts"];
const EXT = new Set([".ts", ".tsx", ".json"]);

const BAD_PATTERNS: { label: string; re: RegExp }[] = [
  // Box-drawing / UTF-8 misread as Latin-1 (e.g. middot corruption)
  { label: "mojibake-box-drawing", re: /\u00E2\u0094\u0082|\u00E2\u0095\u0096|\u00E2\u20AC/ },
  { label: "replacement-char", re: /\uFFFD/ },
  // Latin-1 mojibake sequences (curly quotes, etc.)
  { label: "latin1-mojibake", re: /\u00C3[^\u0000-\u007F]|\u00E2\u0080\u0099|\u00E2\u0080\u009C|\u00E2\u20AC/ },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next" || name === ".next-dev") continue;
      walk(path, out);
    } else if (EXT.has(name.slice(name.lastIndexOf(".")))) {
      out.push(path);
    }
  }
  return out;
}

let failed = false;

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const text = readFileSync(file, "utf8");
    for (const { label, re } of BAD_PATTERNS) {
      if (re.test(text)) {
        console.error(`[check:text-encoding] ${label} in ${relative(ROOT, file)}`);
        failed = true;
      }
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("check:text-encoding OK");
