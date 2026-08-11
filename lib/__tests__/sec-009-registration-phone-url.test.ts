/**
 * SEC-009 regression: registration navigation must never leak full MSISDNs in URLs.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  buildRegistrationPath,
  clearRegistrationPhone,
  getRegistrationPhone,
  phoneFromIdentitySessionJwt,
  registrationNavigationContainsPhoneQuery,
  resolveRegistrationPhone,
  setRegistrationPhone,
} from "../registration-phone-store";

const ROOT = join(__dirname, "../..");

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (
      name === "node_modules" ||
      name === ".next" ||
      name === ".next-dev" ||
      name === "node_modules/.cache" ||
      name === "public" ||
      name === "coverage"
    ) {
      continue;
    }
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkTsFiles(p, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

test("buildRegistrationPath never includes phone=", () => {
  const url = buildRegistrationPath({
    localeRegistrationPath: "/fr/registration",
    redirect: "/fr/",
  });
  assert.equal(url, "/fr/registration?redirect=%2Ffr%2F");
  assert.equal(registrationNavigationContainsPhoneQuery(url), false);
  assert.doesNotMatch(url, /phone=/i);
});

test("registrationNavigationContainsPhoneQuery detects leaks", () => {
  assert.equal(
    registrationNavigationContainsPhoneQuery(
      "/registration?redirect=%2F&phone=%2B212612345678",
    ),
    true,
  );
  assert.equal(
    registrationNavigationContainsPhoneQuery("/registration?redirect=%2F"),
    false,
  );
});

test("in-memory registration phone store set/get/clear", () => {
  clearRegistrationPhone();
  assert.equal(getRegistrationPhone(), null);
  setRegistrationPhone("+212612345678");
  assert.equal(getRegistrationPhone(), "+212612345678");
  clearRegistrationPhone();
  assert.equal(getRegistrationPhone(), null);
});

test("resolveRegistrationPhone falls back to identity_session JWT claim", () => {
  clearRegistrationPhone();
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url",
  );
  const payload = Buffer.from(
    JSON.stringify({
      type: "identity_session",
      phone_number: "+212611111111",
      sub: "opaque",
    }),
  ).toString("base64url");
  const token = `${header}.${payload}.sig`;
  assert.equal(phoneFromIdentitySessionJwt(token), "+212611111111");
  assert.equal(resolveRegistrationPhone(token), "+212611111111");
  setRegistrationPhone("+212622222222");
  assert.equal(resolveRegistrationPhone(token), "+212622222222");
  clearRegistrationPhone();
});

test("login page source must not construct phone= registration URLs", () => {
  const login = readFileSync(
    join(ROOT, "app/[locale]/login/page.tsx"),
    "utf8",
  );
  assert.doesNotMatch(login, /phone=\$\{/);
  assert.doesNotMatch(login, /&phone=/);
  assert.doesNotMatch(login, /\?[^"'`]*phone=/);
  assert.match(login, /setRegistrationPhone/);
  assert.match(login, /buildRegistrationPath/);
  assert.doesNotMatch(login, /localStorage/);
});

test("registration page must not read phone from searchParams", () => {
  const registration = readFileSync(
    join(ROOT, "app/[locale]/registration/page.tsx"),
    "utf8",
  );
  assert.doesNotMatch(registration, /searchParams\.get\(\s*["']phone["']\s*\)/);
  assert.match(registration, /resolveRegistrationPhone/);
  assert.doesNotMatch(registration, /localStorage/);
});

test("AuthContext clears registration phone on JWT/logout paths", () => {
  const auth = readFileSync(join(ROOT, "contexts/AuthContext.tsx"), "utf8");
  assert.match(auth, /clearRegistrationPhone/);
  assert.equal(
    (auth.match(/clearRegistrationPhone\(\)/g) ?? []).length >= 3,
    true,
  );
});

test("AuthContext does not persist OTP binder in sessionStorage (SEC-008)", () => {
  const auth = readFileSync(join(ROOT, "contexts/AuthContext.tsx"), "utf8");
  assert.doesNotMatch(auth, /sessionStorage\.setItem/);
  assert.match(auth, /otp-session-store/);
});

test("nexastays_web repo: no registration navigation with phone= query", () => {
  const files = walkTsFiles(ROOT);
  const offenders: string[] = [];
  for (const file of files) {
    if (file.includes(`${join("lib", "__tests__")}`)) continue;
    if (file.endsWith("registration-phone-store.ts")) continue;
    const src = readFileSync(file, "utf8");
    // Flag constructions that append phone into registration URLs
    if (
      /\/registration[^"'`\n]*phone=/i.test(src) ||
      /phone=\$\{encodeURIComponent\(\s*phone/i.test(src) ||
      /["'`][^"'`]*\/registration[^"'`]*[&?]phone=/i.test(src)
    ) {
      offenders.push(file.replace(ROOT, ""));
    }
  }
  assert.deepEqual(offenders, []);
});
