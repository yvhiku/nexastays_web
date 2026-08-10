/**
 * PROD-SEC-001 — web auth transport model regressions (static).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("access token store exists and forbids localStorage API usage", () => {
  const store = readFileSync(join(root, "lib/access-token-store.ts"), "utf8");
  assert.match(store, /getMemoryAccessToken/);
  assert.doesNotMatch(store, /localStorage\./);
});

test("stays API attaches Bearer from memory and does not use empty auth default", () => {
  const api = readFileSync(join(root, "lib/stays-api.ts"), "utf8");
  assert.match(api, /getMemoryAccessToken/);
  assert.match(api, /Bearer \$\{token\}/);
  assert.match(api, /bearerAuthHeaders/);
  assert.doesNotMatch(
    api,
    /function getAuthHeaders\(\)[^{]*\{\s*return \{\};\s*\}/,
  );
});

test("web logout still uses credentials + cookie transport for refresh revoke", () => {
  const api = readFileSync(join(root, "lib/auth-api.ts"), "utf8");
  assert.match(api, /Authorization = `Bearer \$\{accessToken\}`/);
  assert.match(api, /withCredentials:\s*true/);
  assert.match(api, /\["X-Auth-Transport"\]\s*=\s*"cookie"/);
});
