import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canAutoSubmitHostApplication,
  clearHostApplyDraft,
  HOST_APPLY_DRAFT_KEY,
  identityFieldsFromUser,
  isKycVerifiedStatus,
  loadHostApplyDraft,
  mapKycStatusToFinal,
  resolveHostApplyIdentityMode,
  resolveHostApplySession,
  saveHostApplyDraft,
  shouldSeedKycProfile,
} from "../host-apply-flow";

const read = (path: string) => readFileSync(path, "utf8");
const hostPage = read("app/[locale]/host/page.tsx");

// ---------------------------------------------------------------------------
// Step 3: OTP result → Nexa session (account is created by Identity on verify)
// ---------------------------------------------------------------------------

test("OTP with a JWT becomes a jwt session for the host wizard", () => {
  assert.deepEqual(
    resolveHostApplySession({
      verified: true,
      access_token: "access",
      refresh_token: "refresh",
    }),
    { kind: "jwt", accessToken: "access", refreshToken: "refresh" },
  );
});

test("OTP with only a binder becomes an otp_session (legacy identity_session too)", () => {
  assert.deepEqual(
    resolveHostApplySession({ verified: true, otp_session_token: "otp" }),
    { kind: "otp_session", token: "otp" },
  );
  assert.deepEqual(
    resolveHostApplySession({ verified: true, identity_session_token: "ids" }),
    { kind: "otp_session", token: "ids" },
  );
});

test("OTP without any credential yields no session", () => {
  assert.deepEqual(resolveHostApplySession({ verified: true }), { kind: "none" });
});

test("host step 3 persists the OTP session into AuthContext like /login", () => {
  assert.match(
    hostPage,
    /const handleStep3Continue = async \(\) => \{[\s\S]*resolveHostApplySession\(result\)[\s\S]*setAuthJwt\(session\.accessToken, session\.refreshToken, result\.onboarding\)[\s\S]*setAuthOtpSession\(session\.token, result\.onboarding\)/,
  );
  assert.match(hostPage, /resolveOtpPostVerifyState\(result\) === "INCOMPLETE_RESPONSE"/);
});

// ---------------------------------------------------------------------------
// KYC seeding must never revoke an existing verified identity
// ---------------------------------------------------------------------------

test("seed KYC profile only when Identity still requires onboarding", () => {
  assert.equal(
    shouldSeedKycProfile({
      verified: true,
      onboarding: { required: true, status: "NOT_STARTED", next: "REGISTRATION" },
    }),
    true,
  );
  assert.equal(
    shouldSeedKycProfile({
      verified: true,
      onboarding: { required: false, status: "APPROVED", next: null },
    }),
    false,
  );
});

test("without an onboarding object, fall back to nexa_profile.kyc_status", () => {
  assert.equal(
    shouldSeedKycProfile({ verified: true, nexa_profile: { kyc_status: "VERIFIED" } }),
    false,
  );
  assert.equal(shouldSeedKycProfile({ verified: true }), true);
});

test("host step 3 gates submitKyc behind shouldSeedKycProfile", () => {
  assert.match(
    hostPage,
    /const seedKyc = shouldSeedKycProfile\(result\);\s*const patchProfile = session\.kind === "jwt";\s*if \(seedKyc \|\| patchProfile\) \{\s*const seeded = await seedIdentityProfile\(getSessionToken, \{ seedKyc, patchProfile \}\)/,
  );
  assert.match(hostPage, /if \(opts\.seedKyc\) \{[\s\S]*await submitKyc\(/);
  assert.match(hostPage, /source: "STAYS"/);
});

// ---------------------------------------------------------------------------
// Step 2: guest / signed-in form vs verified identity reuse
// ---------------------------------------------------------------------------

test("identity mode: guest without a JWT, signed_in when unverified, verified when KYC approved", () => {
  assert.equal(resolveHostApplyIdentityMode({ tokenType: "none", hasToken: false }), "guest");
  assert.equal(
    resolveHostApplyIdentityMode({ tokenType: "otp_session", hasToken: true, kycStatus: "APPROVED" }),
    "guest",
  );
  assert.equal(
    resolveHostApplyIdentityMode({ tokenType: "jwt", hasToken: true, kycStatus: "PENDING" }),
    "signed_in",
  );
  assert.equal(resolveHostApplyIdentityMode({ tokenType: "jwt", hasToken: true }), "signed_in");
  assert.equal(
    resolveHostApplyIdentityMode({ tokenType: "jwt", hasToken: true, kycStatus: "VERIFIED" }),
    "verified",
  );
  assert.equal(
    resolveHostApplyIdentityMode({ tokenType: "jwt", hasToken: true, kycStatus: "approved" }),
    "verified",
  );
});

test("identityFieldsFromUser normalises the AuthContext profile", () => {
  assert.deepEqual(
    identityFieldsFromUser({
      full_name: " Amina Test ",
      phone_number: "+212600000000",
      email: "amina@example.com",
      date_of_birth: "1990-05-04T00:00:00.000Z",
      city: "Marrakech",
    }),
    {
      fullName: "Amina Test",
      phone: "+212600000000",
      email: "amina@example.com",
      dateOfBirth: "1990-05-04",
      city: "Marrakech",
    },
  );
  assert.deepEqual(identityFieldsFromUser(null), {
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    city: "",
  });
});

test("guest / signed-in step 2 collects and validates DOB + city; verified shows the read-only card", () => {
  // Real PII is required before OTP / KYC.
  assert.match(hostPage, /const dobCheck = validateDateOfBirth\(dateOfBirth\.trim\(\)\)/);
  assert.match(hostPage, /if \(!city\.trim\(\)\) \{\s*setStep2Error\(t\("hostApply\.cityRequired"\)\)/);
  assert.match(hostPage, /<DatePicker[\s\S]*id="host-apply-dob"/);
  assert.match(hostPage, /<NexaSelect[\s\S]*id="host-apply-city"[\s\S]*MOROCCO_CITIES\.map/);
  // Verified accounts skip the editable inputs entirely.
  assert.match(
    hostPage,
    /\{identityMode === "verified" \? \(\s*<VerifiedIdentityCard[\s\S]*\) : \(\s*<>[\s\S]*id="host-apply-full-name"/,
  );
  assert.match(
    hostPage,
    /if \(identityMode === "verified"\) \{[\s\S]*setOtpStepSkipped\(true\);[\s\S]*setStep\(4\);\s*return;/,
  );
  // Verified path never re-seeds KYC (that would reset it to PENDING).
  const verifiedBranch = hostPage.slice(
    hostPage.indexOf('if (identityMode === "verified") {'),
    hostPage.indexOf('if (!fullName.trim()) {'),
  );
  assert.doesNotMatch(verifiedBranch, /submitKyc|seedIdentityProfile/);
});

test("identity PII (DOB + city) reaches Identity on OTP and on the signed-in skip-OTP path", () => {
  assert.match(
    hostPage,
    /const pii = \{\s*full_name: fullName\.trim\(\) \|\| undefined,\s*email: email\.trim\(\) \|\| undefined,\s*city: city\.trim\(\) \|\| undefined,\s*date_of_birth: dateOfBirth\.trim\(\) \|\| undefined,\s*\}/,
  );
  assert.match(hostPage, /await updateProfile\(pii, getSessionToken\)/);
  assert.match(
    hostPage,
    /if \(alreadyVerifiedPhone\) \{[\s\S]*await seedIdentityProfile\(\(\) => jwt, \{\s*seedKyc: user\?\.onboarding\?\.required === true,\s*patchProfile: true,/,
  );
  // Submit payload uses the verified profile for verified accounts and includes city.
  assert.match(hostPage, /identityMode === "verified"\s*\? verifiedIdentity/);
  assert.match(hostPage, /full_name: effectiveIdentity\.fullName \|\| undefined/);
  assert.match(hostPage, /city: effectiveIdentity\.city \|\| undefined/);
});

test("signed-in host status loads on JWT even while onboarding is still required", () => {
  assert.match(hostPage, /if \(tokenType !== "jwt" \|\| !token\) \{/);
  assert.match(hostPage, /getHostVerification\(token\)/);
  assert.doesNotMatch(
    hostPage,
    /if \(!isAuthenticated \|\| !token\) \{\s*setStatusChecked\(true\)/,
  );
});

test("host page does not restore email confirm from draft email", () => {
  assert.doesNotMatch(hostPage, /setEmailCode\(\(prev\) => prev \|\| draft\.email\)/);
});

test("create-draft skips the URL-driven re-hydrate that would wipe Guest House", () => {
  const wizard = read("lib/host-listing-wizard/use-listing-wizard.ts");
  assert.match(wizard, /skipNextHydrateRef/);
  assert.match(
    wizard,
    /if \(skipNextHydrateRef\.current && listingId === draftParam\)/,
  );
});

// ---------------------------------------------------------------------------
// Step 4: Sumsub instead of the sign-in wall for unverified applicants
// ---------------------------------------------------------------------------

test("isKycVerifiedStatus accepts APPROVED / VERIFIED only", () => {
  assert.equal(isKycVerifiedStatus("APPROVED"), true);
  assert.equal(isKycVerifiedStatus("verified"), true);
  assert.equal(isKycVerifiedStatus("PENDING"), false);
  assert.equal(isKycVerifiedStatus(undefined), false);
});

test("step 4 no longer requires isAuthenticated and mounts Sumsub for unverified users", () => {
  assert.doesNotMatch(hostPage, /if \(!isAuthenticated \|\| !token\) \{\s*return \(/);
  assert.match(hostPage, /if \(!token \|\| tokenType === "none"\) \{/);
  assert.match(
    hostPage,
    /\{!kycApproved && kycPhase === "verify" && \([\s\S]*<SumsubWebVerification[\s\S]*source="STAYS"/,
  );
});

test("verified identity is reused instead of re-uploading documents", () => {
  assert.match(hostPage, /const kycApproved = isKycVerifiedStatus\(user\?\.kyc_status\)/);
  assert.match(hostPage, /if \(!isKycVerifiedStatus\(user\?\.kyc_status\)\) return;[\s\S]*void submitApplication\(true, token\)/);
});

// ---------------------------------------------------------------------------
// Auto-submit after Sumsub approval; rejections never reach the dashboard
// ---------------------------------------------------------------------------

test("sync status maps to a terminal outcome only when Identity decided", () => {
  assert.equal(mapKycStatusToFinal("APPROVED"), "APPROVED");
  assert.equal(mapKycStatusToFinal("verified"), "VERIFIED");
  assert.equal(mapKycStatusToFinal("REJECTED"), "REJECTED");
  assert.equal(mapKycStatusToFinal("PENDING"), null);
  assert.equal(mapKycStatusToFinal("UNDER_REVIEW"), null);
  assert.equal(mapKycStatusToFinal(undefined), null);
});

test("auto-submit requires approval and no outstanding onboarding", () => {
  assert.equal(canAutoSubmitHostApplication("APPROVED"), true);
  assert.equal(
    canAutoSubmitHostApplication("VERIFIED", { required: false, status: "APPROVED", next: null }),
    true,
  );
  assert.equal(
    canAutoSubmitHostApplication("APPROVED", {
      required: true,
      status: "UNDER_REVIEW",
      next: "REGISTRATION",
    }),
    false,
  );
  assert.equal(canAutoSubmitHostApplication("REJECTED"), false);
});

test("approved KYC exchanges the OTP binder for a JWT and submits with use_existing_kyc", () => {
  assert.match(
    hostPage,
    /const handleKycFinalStatus = async \([\s\S]*if \(status === "REJECTED"\) \{\s*setKycPhase\("rejected"\);\s*return;[\s\S]*tokenType === "otp_session" && token[\s\S]*completeRegistration\(token\)[\s\S]*setAuthJwt\(exchanged\.access_token[\s\S]*await submitApplication\(true, jwt\)/,
  );
  assert.match(hostPage, /use_existing_kyc: useExistingKyc/);
  assert.match(hostPage, /submitted_from: "WEB_BECOME_HOST"/);
});

test("rejected KYC shows a retry path and does not submit", () => {
  const rejectedBranch = hostPage.slice(
    hostPage.indexOf('if (status === "REJECTED") {'),
    hostPage.indexOf("if (!canAutoSubmitHostApplication"),
  );
  assert.doesNotMatch(rejectedBranch, /submitApplication|submitHostVerification/);
  assert.match(hostPage, /kycPhase === "rejected"[\s\S]*onClick=\{onRetryKyc\}/);
});

test("reviewing phase keeps polling Identity after the widget unmounts", () => {
  assert.match(
    hostPage,
    /kycPhase !== "reviewing" \|\| !token\) return;[\s\S]*syncSumsubStatus\(\(\) => tok, "STAYS"\)[\s\S]*mapKycStatusToFinal\(r\.status\)/,
  );
});

// ---------------------------------------------------------------------------
// Draft continuity (tab-scoped sessionStorage)
// ---------------------------------------------------------------------------

function withSessionStorage<T>(fn: () => T): T {
  const store = new Map<string, string>();
  const fakeStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };
  const g = globalThis as unknown as Record<string, unknown>;
  const prevWindow = g.window;
  const prevSession = g.sessionStorage;
  g.window = {};
  g.sessionStorage = fakeStorage;
  try {
    return fn();
  } finally {
    g.window = prevWindow;
    g.sessionStorage = prevSession;
  }
}

test("draft round-trips through sessionStorage and clears after submit", () => {
  withSessionStorage(() => {
    saveHostApplyDraft({
      hostType: "hotel",
      fullName: "Amina Test",
      email: "amina@example.com",
      phone: "+212600000000",
      dateOfBirth: "1990-05-04",
      city: "Marrakech",
      termsAccepted: true,
      step: 4,
    });
    assert.ok(sessionStorage.getItem(HOST_APPLY_DRAFT_KEY));
    assert.deepEqual(loadHostApplyDraft(), {
      hostType: "hotel",
      fullName: "Amina Test",
      email: "amina@example.com",
      phone: "+212600000000",
      dateOfBirth: "1990-05-04",
      city: "Marrakech",
      termsAccepted: true,
      step: 4,
    });
    clearHostApplyDraft();
    assert.equal(loadHostApplyDraft(), null);
  });
});

test("malformed drafts are sanitised instead of crashing the wizard", () => {
  withSessionStorage(() => {
    sessionStorage.setItem(HOST_APPLY_DRAFT_KEY, JSON.stringify({ hostType: "castle", step: 9 }));
    assert.deepEqual(loadHostApplyDraft(), {
      hostType: "apartment",
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      city: "",
      termsAccepted: false,
      step: 2,
    });
    sessionStorage.setItem(HOST_APPLY_DRAFT_KEY, "{not json");
    assert.equal(loadHostApplyDraft(), null);
  });
});

test("loadHostApplyDraft is SSR-safe", () => {
  const g = globalThis as unknown as Record<string, unknown>;
  const prevWindow = g.window;
  delete g.window;
  try {
    assert.equal(loadHostApplyDraft(), null);
  } finally {
    if (prevWindow !== undefined) g.window = prevWindow;
  }
});

test("host page restores the draft and clears it once the application is pending", () => {
  assert.match(hostPage, /const draft = loadHostApplyDraft\(\);/);
  assert.match(hostPage, /setStep\(tokenType === "jwt" && token \? 4 : 3\)/);
  assert.match(hostPage, /setApplicationSubmitted\(true\);[\s\S]*clearHostApplyDraft\(\);/);
});
