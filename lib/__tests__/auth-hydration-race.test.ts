import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authContext = readFileSync("contexts/AuthContext.tsx", "utf8");

test("startup hydrate does not clear a session established during OTP login", () => {
  assert.match(authContext, /hydrateGenRef/);
  assert.match(
    authContext,
    /result\.cleared && !getMemoryAccessToken\(\)/,
    "stale hydrate must not wipe in-memory JWT from fresh login",
  );
});

test("setAuthJwt retries refresh before dropping OTP-issued access token", () => {
  assert.match(authContext, /fetchCurrentUserWithJwt\(accessToken\)/);
  assert.match(
    authContext,
    /status === 401[\s\S]*refreshTokenApi\(\)/,
    "401 on /users/me should attempt cookie refresh before logout",
  );
});
