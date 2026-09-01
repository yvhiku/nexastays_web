/** Decode JWT expiry (seconds since epoch). Returns null if not a JWT or missing exp. */
export function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when access token is past expiry (30s skew). Unknown format → not treated as expired. */
export function isJwtExpired(token: string, skewMs = 30_000): boolean {
  const expMs = getJwtExpiryMs(token);
  if (expMs == null) return false;
  return Date.now() >= expMs - skewMs;
}

/** Identity registration binder tokens cannot use refresh-cookie recovery. */
export function isIdentitySessionJwt(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { type?: unknown };
    const t = payload.type;
    return t === "otp_session" || t === "identity_session";
  } catch {
    return false;
  }
}
