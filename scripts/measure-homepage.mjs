/**
 * Production homepage metrics helper.
 * Usage: ENFORCE_HTTPS=false npm run start -- -p 3011 && node scripts/measure-homepage.mjs
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = Number(process.env.PORT || 3011);
const LOCALE = process.env.LOCALE || "en";

function fetch(pathname) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "127.0.0.1", port: PORT, path: pathname }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }),
      );
    }).on("error", reject);
  });
}

function fetchGzip(pathname) {
  return new Promise((resolve, reject) => {
    http.get(
      { hostname: "127.0.0.1", port: PORT, path: pathname, headers: { "Accept-Encoding": "gzip" } },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).length));
      },
    ).on("error", reject);
  });
}

async function measureTtfb(pathname, runs = 5) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    await fetch(pathname);
    samples.push(performance.now() - t0);
  }
  return samples;
}

async function main() {
  const pathname = `/${LOCALE}`;
  const page = await fetch(pathname);
  if (page.status !== 200) {
    console.error(`Expected 200 for ${pathname}, got ${page.status}`);
    process.exit(1);
  }

  const html = page.body.toString("utf8");
  const scriptPaths = [...new Set(html.match(/\/_next\/static\/[^"']+\.js/g) || [])];
  let gzipJs = 0;
  for (const p of scriptPaths) {
    gzipJs += await fetchGzip(p);
  }

  const ttfbSamples = await measureTtfb(pathname);
  const avgTtfb = ttfbSamples.reduce((a, b) => a + b, 0) / ttfbSamples.length;
  const minTtfb = Math.min(...ttfbSamples);

  const out = {
    htmlBytes: page.body.length,
    scriptCount: scriptPaths.length,
    jsGzipKb: Math.round(gzipJs / 1024),
    ttfbMs: { min: Math.round(minTtfb), avg: Math.round(avgTtfb), samples: ttfbSamples.map((v) => Math.round(v)) },
    cacheControl: page.headers["cache-control"] ?? null,
    targets: {
      ttfbMs: 150,
      jsGzipKb: 180,
      htmlKb: 200,
    },
  };

  console.log(JSON.stringify(out, null, 2));

  const tmp = path.join(os.tmpdir(), "nexa-homepage-metrics.json");
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2));
  console.error(`Wrote ${tmp}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
