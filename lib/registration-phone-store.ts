/**
 * SEC-009: ephemeral in-memory registration phone (SPA heap only).
 * Never write to URL query/hash or localStorage.
 * Cleared on logout / JWT auth / explicit clear.
 * Hard-refresh fallback: phone_number claim inside existing otp_session JWT (already in sessionStorage for SEC-008).
 */

let registrationPhone: string | null = null;

export function setRegistrationPhone(phone: string | null): void {
  const trimmed = phone?.trim() ?? "";
  registrationPhone = trimmed.length > 0 ? trimmed : null;
}

export function getRegistrationPhone(): string | null {
  return registrationPhone;
}

export function clearRegistrationPhone(): void {
  registrationPhone = null;
}

function decodeJwtPayloadJson(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as unknown;
    if (!payload || typeof payload !== "object") return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Read phone_number from a client-held JWT payload (no signature verify — token already JS-accessible). */
export function phoneFromIdentitySessionJwt(
  token: string | null | undefined,
): string | null {
  if (!token || typeof token !== "string") return null;
  const payload = decodeJwtPayloadJson(token);
  if (!payload) return null;
  const phone =
    typeof payload.phone_number === "string" ? payload.phone_number.trim() : "";
  return phone.length > 0 ? phone : null;
}

/** Prefer in-memory stash; else otp_session JWT claim after tab refresh. */
export function resolveRegistrationPhone(
  otpSessionToken?: string | null,
): string | null {
  return (
    getRegistrationPhone() ?? phoneFromIdentitySessionJwt(otpSessionToken ?? null)
  );
}

/** Static helpers for URL regression tests (SEC-009). */
export function registrationNavigationContainsPhoneQuery(url: string): boolean {
  try {
    const u = new URL(url, "https://nexa.example");
    if (u.searchParams.has("phone")) return true;
    if (/[?&#]phone=/i.test(url)) return true;
    return false;
  } catch {
    return /[?&#]phone=/i.test(url);
  }
}

export function buildRegistrationPath(opts: {
  localeRegistrationPath: string;
  redirect?: string | null;
}): string {
  const base = opts.localeRegistrationPath;
  if (!opts.redirect) return base;
  return `${base}?redirect=${encodeURIComponent(opts.redirect)}`;
}
