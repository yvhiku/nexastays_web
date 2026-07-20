import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["en", "fr", "ar"] as const;
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE = "nexa_locale";

function getPreferredLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && LOCALES.includes(cookie as (typeof LOCALES)[number])) return cookie;

  const acceptLanguage = request.headers.get("Accept-Language") ?? "";
  for (const loc of LOCALES) {
    if (acceptLanguage.toLowerCase().includes(loc)) return loc;
  }
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Enforce HTTPS when behind a TLS-terminating proxy (production)
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENFORCE_HTTPS !== "false"
  ) {
    const proto = request.headers.get("x-forwarded-proto");
    if (proto === "http") {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      return NextResponse.redirect(url, 301);
    }
  }

  const pathnameHasLocale = LOCALES.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));
  if (pathnameHasLocale) return NextResponse.next();

  if (pathname === "/") {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Skip locale rewrite for Next internals, API, and static public assets
    "/((?!api|_next/static|_next/image|favicon.ico|icons|images|guidance|pwa|manifest\\.webmanifest|sw\\.js|workbox|offline\\.html|fallback).*)",
  ],
};
