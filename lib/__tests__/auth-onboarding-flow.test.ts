import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveOtpPostVerifyState } from "../auth-flow";

const read = (path: string) => readFileSync(path, "utf8");

test("new or incomplete users go to registration even when Identity issues a JWT", () => {
  assert.equal(
    resolveOtpPostVerifyState({
      verified: true,
      access_token: "access-token",
      otp_session_token: "otp-session",
      onboarding: {
        required: true,
        status: "NOT_STARTED",
        next: "REGISTRATION",
      },
    }),
    "REGISTRATION",
  );
});

test("approved users with a JWT complete normal authentication", () => {
  assert.equal(
    resolveOtpPostVerifyState({
      verified: true,
      access_token: "access-token",
      onboarding: {
        required: false,
        status: "APPROVED",
        next: null,
      },
    }),
    "AUTHENTICATED",
  );
});

test("legacy session-only responses remain registration compatible", () => {
  assert.equal(
    resolveOtpPostVerifyState({
      verified: true,
      identity_session_token: "identity-session",
    }),
    "REGISTRATION",
  );
});

test("a malformed successful response cannot be treated as authenticated", () => {
  assert.equal(
    resolveOtpPostVerifyState({ verified: true }),
    "INCOMPLETE_RESPONSE",
  );
});

test("protected Stays routes redirect canonical incomplete onboarding", () => {
  const protectedRoute = read("components/ProtectedRoute.tsx");
  assert.match(protectedRoute, /onboarding\?\.required/);
  assert.match(
    protectedRoute,
    /resolveLocalizedPath\("\/registration", locale\)/,
  );
});

test("registration exchanges an OTP session only after authoritative approval", () => {
  const registration = read("app/[locale]/registration/page.tsx");
  assert.match(
    registration,
    /status === "APPROVED"[\s\S]*status === "VERIFIED"[\s\S]*canonicalOnboarding\?\.required === false/,
  );
  assert.match(
    registration,
    /r\.onboarding\?\.required === false[\s\S]*completeRegistration\(tok\)/,
  );
});
