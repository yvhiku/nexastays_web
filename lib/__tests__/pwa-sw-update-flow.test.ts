import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const worker = readFileSync("public/nexa-sw.js", "utf8");
const update = readFileSync("lib/pwa-sw-update.ts", "utf8");
const banner = readFileSync("components/pwa/SwUpdateBanner.tsx", "utf8");
const shell = readFileSync("components/pwa/PwaAppShellCore.tsx", "utf8");
const nextConfig = readFileSync("next.config.js", "utf8");

test("nexa-sw exposes a build id and handles SKIP_WAITING", () => {
  assert.match(worker, /SW_BUILD_ID\s*=\s*["'][\w-]+["']/);
  assert.match(worker, /SKIP_WAITING/);
  assert.match(worker, /self\.skipWaiting\(\)/);
});

test("update flow waits for controllerchange before reload", () => {
  assert.match(update, /applyServiceWorkerUpdate/);
  assert.match(update, /controllerchange/);
  assert.match(banner, /applyServiceWorkerUpdate/);
});

test("legacy workbox workers are removed before nexa-sw registration", () => {
  assert.match(update, /unregisterLegacyServiceWorkers/);
  assert.match(shell, /unregisterLegacyServiceWorkers/);
  assert.match(shell, /updateViaCache:\s*"none"/);
});

test("nexa-sw.js is not long-cached by Next headers", () => {
  assert.match(nextConfig, /nexa-sw\.js/);
  assert.match(nextConfig, /no-store/);
});

test("runtime caches include offline shell on update", () => {
  assert.match(update, /nexa-offline/);
});
