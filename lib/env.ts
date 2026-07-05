/**
 * API base URLs for split Nexa backends (Identity + Stays).
 * Legacy NEXT_PUBLIC_API_BASE_URL is used as fallback for both when split vars are unset.
 */

const DEFAULT_IDENTITY = "http://127.0.0.1:3001/api/v1";
const DEFAULT_STAYS = "http://127.0.0.1:3002/api/v1";

function legacyBase(): string | undefined {
  return process.env.NEXT_PUBLIC_API_BASE_URL;
}

/** Nexa Identity — auth, users, KYC, consents */
export function getIdentityApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_IDENTITY_API_BASE_URL ||
    legacyBase() ||
    DEFAULT_IDENTITY
  );
}

/** Nexa Stays — listings, bookings, hosts, payments */
export function getStaysApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STAYS_API_BASE_URL ||
    legacyBase() ||
    DEFAULT_STAYS
  );
}

/** @deprecated Prefer getIdentityApiBaseUrl or getStaysApiBaseUrl */
export function getApiBaseUrl(): string {
  return getIdentityApiBaseUrl();
}

/** Demo OTP for phone/email verification until real delivery is enabled. */
export function getDemoOtpCode(): string {
  return process.env.NEXT_PUBLIC_DEMO_OTP_CODE || "123456";
}
