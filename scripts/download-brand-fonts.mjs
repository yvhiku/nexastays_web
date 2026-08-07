/**
 * Download brand fonts (Playfair Display, DM Sans, Noto Sans Arabic) for local hosting.
 * Run: node scripts/download-brand-fonts.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const outDir = join(root, "app", "fonts");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const families = [
  {
    name: "playfair-display",
    query: "family=Playfair+Display:wght@400;500;600;700&display=swap",
  },
  {
    name: "dm-sans",
    query: "family=DM+Sans:wght@300;400;500;600&display=swap",
  },
  {
    name: "noto-sans-arabic",
    query: "family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap",
  },
];

function slugFromUrl(url) {
  const file = basename(new URL(url).pathname);
  return file.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function fetchCss(query) {
  const url = `https://fonts.googleapis.com/css2?${query}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`CSS fetch failed (${res.status}): ${url}`);
  return res.text();
}

function extractWoff2Urls(css) {
  return [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return dest;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const manifest = {};

  for (const family of families) {
    const css = await fetchCss(family.query);
    const urls = [...new Set(extractWoff2Urls(css))];
    if (urls.length === 0) throw new Error(`No woff2 URLs for ${family.name}`);

    manifest[family.name] = [];
    for (const url of urls) {
      const filename = `${family.name}-${slugFromUrl(url)}`;
      const dest = join(outDir, filename);
      await downloadFile(url, dest);
      manifest[family.name].push(filename);
      console.log(`Saved ${filename}`);
    }
  }

  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log("Done — fonts saved to app/fonts/");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
