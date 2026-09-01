/**
 * CI: fail when FR/AR values equal EN outside the allowlist.
 * Run: node scripts/check-locale-parity.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isAllowlistedKey } from "./locale-allowlist.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../lib/i18n/locales");

function flatten(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flatten(v, p));
    } else {
      out.push([p, v]);
    }
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));
const enFlat = Object.fromEntries(flatten(en));

function checkLocale(locale) {
  const file = path.join(localesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const same = flatten(data).filter(([k, v]) => enFlat[k] === v && !isAllowlistedKey(k));
  return same;
}

const frSame = checkLocale("fr");
const arSame = checkLocale("ar");

if (frSame.length > 0 || arSame.length > 0) {
  console.error("Locale parity check failed — untranslated keys (value === EN):");
  if (frSame.length) {
    console.error(`FR (${frSame.length}):`);
    frSame.forEach(([k, v]) => console.error(`  ${k} = ${JSON.stringify(v)}`));
  }
  if (arSame.length) {
    console.error(`AR (${arSame.length}):`);
    arSame.forEach(([k, v]) => console.error(`  ${k} = ${JSON.stringify(v)}`));
  }
  process.exit(1);
}

console.log("Locale parity OK — no unexpected EN fallbacks in fr.json or ar.json");
