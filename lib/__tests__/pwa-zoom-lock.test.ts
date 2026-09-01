import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const zoomLock = readFileSync("lib/pwa-zoom-lock.ts", "utf8");
const shell = readFileSync("components/pwa/PwaAppShellCore.tsx", "utf8");
const globals = readFileSync("app/globals.css", "utf8");

test("PWA zoom lock tightens viewport only in standalone display", () => {
  assert.match(zoomLock, /isStandaloneDisplay/);
  assert.match(zoomLock, /user-scalable=no/);
  assert.match(zoomLock, /gesturestart/);
});

test("PwaAppShell mounts zoom lock for installed app sessions", () => {
  assert.match(shell, /PwaZoomLock/);
});

test("globals apply touch-action manipulation for standalone PWA", () => {
  assert.match(globals, /display-mode:\s*standalone/);
  assert.match(globals, /touch-action:\s*manipulation/);
  assert.match(globals, /data-pwa-zoom-lock/);
});
