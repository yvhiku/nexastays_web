/**
 * API base URLs for split Nexa backends (Identity + Stays).
 * Legacy NEXT_PUBLIC_API_BASE_URL is used as fallback for both when split vars are unset.
 *
 * Only non-secret public URLs belong in NEXT_PUBLIC_* vars.
 * Never put API keys, DB passwords, JWT secrets, Sumsub secrets, or OTP codes here.
 */

/** Prefer localhost so local cookies stay same-site with http://localhost:3005. */
const DEFAULT_IDENTITY = "http://localhost:3001/api/v1";
const DEFAULT_STAYS = "http://localhost:3002/api/v1";
const DEFAULT_SITE = "http://localhost:3005";

function legacyBase(): string | undefined {
  return process.env.NEXT_PUBLIC_API_BASE_URL;
}

function isLoopbackHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h === "127.0.0.1" || h === "::1";
}

/**
 * NODE_ENV=production builds must not silently fall back to loopback API hosts.
 * Local development keeps localhost defaults.
 */
export function resolvePublicServiceUrl(
  configured: string | undefined,
  fallback: string,
  label: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  const value = (configured || "").trim();
  if (nodeEnv === "production") {
    if (!value) {
      throw new Error(
        `${label} is required when NODE_ENV=production (no localhost fallback).`,
      );
    }
    try {
      if (isLoopbackHostname(new URL(value).hostname)) {
        throw new Error(
          `${label} must not target localhost / 127.0.0.1 / ::1 when NODE_ENV=production.`,
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes(label)) throw err;
      throw new Error(`${label} must be a valid URL.`);
    }
    return value.replace(/\/$/, "");
  }
  return (value || fallback).replace(/\/$/, "");
}

let cookieSiteMismatchWarned = false;

/**
 * In the browser, warn when page hostname disagrees with API host
 * (localhost vs 127.0.0.1) — that breaks HttpOnly refresh on reload.
 */
function warnIfCookieSiteMismatch(apiBaseUrl: string): void {
  if (typeof window === "undefined" || cookieSiteMismatchWarned) return;
  try {
    const pageHost = window.location.hostname;
    const apiHost = new URL(apiBaseUrl).hostname;
    if (
      (pageHost === "localhost" && apiHost === "127.0.0.1") ||
      (pageHost === "127.0.0.1" && apiHost === "localhost")
    ) {
      cookieSiteMismatchWarned = true;
      console.warn(
        `[nexa-auth] Page is ${pageHost} but API is ${apiHost}. ` +
          `Use the same hostname in NEXT_PUBLIC_IDENTITY_API_BASE_URL / STAYS — ` +
          `otherwise refresh cookies are cross-site and F5 logs you out.`,
      );
    }
  } catch {
    /* ignore */
  }
}

/** Nexa Identity — auth, users, KYC, consents */
export function getIdentityApiBaseUrl(): string {
  const url = resolvePublicServiceUrl(
    process.env.NEXT_PUBLIC_IDENTITY_API_BASE_URL || legacyBase(),
    DEFAULT_IDENTITY,
    "NEXT_PUBLIC_IDENTITY_API_BASE_URL",
  );
  warnIfCookieSiteMismatch(url);
  return url;
}

/** Nexa Stays — listings, bookings, hosts, payments */
export function getStaysApiBaseUrl(): string {
  return resolvePublicServiceUrl(
    process.env.NEXT_PUBLIC_STAYS_API_BASE_URL || legacyBase(),
    DEFAULT_STAYS,
    "NEXT_PUBLIC_STAYS_API_BASE_URL",
  );
}

/** Public website origin used for canonical URLs, sitemap, and social cards. */
export function getPublicSiteUrl(): string {
  return resolvePublicServiceUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    DEFAULT_SITE,
    "NEXT_PUBLIC_SITE_URL",
  );
}

/**
 * Build an absolute public URL from an internal site-relative path only.
 * Rejects absolute, protocol-relative, and scheme-bearing inputs.
 */
export function toPublicAbsoluteUrl(path: string): string {
  const raw = (path ?? "").trim();
  if (raw === "" || raw === "/") {
    return getPublicSiteUrl();
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) || raw.startsWith("//")) {
    throw new Error(
      "toPublicAbsoluteUrl only accepts site-relative paths (no absolute or protocol-relative URLs).",
    );
  }

  // Pathname only — never inherit query/fragment into SEO joins accidentally.
  const pathname = (raw.split(/[?#]/, 1)[0] ?? "").replace(/^\/+/, "");
  const site = getPublicSiteUrl();
  if (!pathname) return site;
  return `${site}/${pathname}`;
}

/** @deprecated Prefer getIdentityApiBaseUrl or getStaysApiBaseUrl */
export function getApiBaseUrl(): string {
  return getIdentityApiBaseUrl();
}

/** When "mock", card checkout simulates success (no CMI/Payzone redirect). */
export function isMockPaymentProvider(): boolean {
  const provider = process.env.NEXT_PUBLIC_STAYS_PAYMENT_PROVIDER ?? "mock";
  return provider === "mock";
}
