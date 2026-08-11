/**
 * SEC-008 — registration binder must not persist in web storage.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  clearLegacyOtpSessionStorage,
  clearOtpSessionToken,
  getOtpSessionToken,
  LEGACY_OTP_SESSION_STORAGE_KEY,
  setOtpSessionToken,
} from "../otp-session-store.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("otp-session-store is memory-only (set/get/clear)", () => {
  clearOtpSessionToken();
  assert.equal(getOtpSessionToken(), null);
  setOtpSessionToken(" binder.jwt ");
  assert.equal(getOtpSessionToken(), "binder.jwt");
  clearOtpSessionToken();
  assert.equal(getOtpSessionToken(), null);
});

test("AuthContext must not write OTP binder to sessionStorage", () => {
  const auth = readFileSync(join(root, "contexts/AuthContext.tsx"), "utf8");
  assert.doesNotMatch(auth, /sessionStorage\.setItem/);
  assert.match(auth, /setOtpSessionToken/);
  assert.match(auth, /clearLegacyOtpSessionStorage/);
  assert.match(auth, /clearOtpSessionToken/);
  // Refresh-first: hydrateAuthSession before restoring any in-memory OTP.
  assert.match(
    auth,
    /clearLegacyOtpSessionStorage\(\);[\s\S]*hydrateAuthSession\(\)/,
  );
});

test("legacy sessionStorage key constant is the historic SEC-008 key", () => {
  assert.equal(LEGACY_OTP_SESSION_STORAGE_KEY, "nexa_otp_session_token");
  // Node has no sessionStorage — clearLegacy should no-op safely.
  clearLegacyOtpSessionStorage();
});

test("JWT paths clear OTP binder store", () => {
  const auth = readFileSync(join(root, "contexts/AuthContext.tsx"), "utf8");
  assert.match(auth, /setAuthJwt[\s\S]*clearOtpSessionToken/);
  assert.match(auth, /logout[\s\S]*clearOtpSessionToken/);
});
