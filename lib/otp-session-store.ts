/**
 * SEC-008: ephemeral in-memory Identity registration binder (identity_session JWT).
 * Never persist to sessionStorage/localStorage/cookies/URL.
 * Survives soft client navigations within the same JS heap; lost on hard reload
 * (user must re-verify OTP — intentional).
 */

let otpSessionToken: string | null = null;

export function setOtpSessionToken(token: string | null): void {
  const trimmed = token?.trim() ?? "";
  otpSessionToken = trimmed.length > 0 ? trimmed : null;
}

export function getOtpSessionToken(): string | null {
  return otpSessionToken;
}

export function clearOtpSessionToken(): void {
  otpSessionToken = null;
}

/** Legacy key from pre-SEC-008-hardening builds — wipe on hydrate/logout. */
export const LEGACY_OTP_SESSION_STORAGE_KEY = "nexa_otp_session_token";

export function clearLegacyOtpSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(LEGACY_OTP_SESSION_STORAGE_KEY);
  } catch {
    // private mode / blocked storage
  }
}
