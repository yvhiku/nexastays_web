import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

test("web logout calls Identity /auth/logout with optional Bearer access token", () => {
  const api = read("lib/auth-api.ts");
  const auth = read("contexts/AuthContext.tsx");

  assert.match(api, /export async function logoutBrowserSession/);
  assert.match(api, /client\.post\("\/auth\/logout"/);
  assert.match(api, /Authorization = `Bearer \$\{accessToken\}`/);
  assert.match(api, /withCredentials:\s*true/);
  assert.match(api, /\["X-Auth-Transport"\]\s*=\s*"cookie"/);

  assert.match(auth, /logoutBrowserSession\(access\)/);
  assert.match(
    auth,
    /const access = tokenType === "jwt" \? token : null/,
  );
  assert.match(auth, /broadcastAuth\("logout"\)/);
  assert.doesNotMatch(auth, /localStorage/);
});

test("web logout does not rely on clearing localStorage for refresh revocation", () => {
  const api = read("lib/auth-api.ts");
  assert.doesNotMatch(api, /localStorage\.removeItem/);
  assert.match(api, /\/auth\/logout/);
});
