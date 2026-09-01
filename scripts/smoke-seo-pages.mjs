/**
 * Smoke-check public SEO URLs (status + not plain 500 body).
 * Usage: node scripts/smoke-seo-pages.mjs [baseUrl]
 */
const base = (process.argv[2] ?? "https://nexastays.ma").replace(/\/$/, "");

const paths = [
  "/en/stays/casablanca",
  "/en/stays/casablanca/apartments",
  "/en/stays/casablanca/anfa",
  "/en/stays/apartments",
  "/en/guides",
  "/en/guides/casablanca-travel-guide",
  "/fr/stays/marrakech",
];

let failed = 0;
for (const path of paths) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const plainError = body.trim() === "Internal Server Error";
    const ok = res.ok && !plainError;
    console.log(`${ok ? "OK" : "FAIL"} ${res.status} ${path}`);
    if (!ok) {
      failed += 1;
      if (plainError) console.log("  → plain Internal Server Error (SSR crash)");
      else console.log(`  → ${body.slice(0, 120).replace(/\s+/g, " ")}`);
    }
  } catch (err) {
    failed += 1;
    console.log(`FAIL ${path} ${err instanceof Error ? err.message : err}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} SEO smoke check(s) failed. Rebuild web: rm -rf .next && npm run build`);
  process.exit(1);
}

console.log("\nAll SEO smoke checks passed.");
