import { NextRequest, NextResponse } from "next/server";
import { findDestinationByCity } from "@/lib/search-destinations";

const LOCALES = ["en", "fr", "ar"] as const;
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE = "nexa_locale";

/** Browser / crawler probes — never locale-redirect; return 404 immediately. */
const PROBE_PATH =
  /^\/(?:\.well-known(?:\/|$)|favicon\.ico|apple-touch-icon[^/]*|robots\.txt|browserconfig\.xml|manifest\.json)/;

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

  if (PROBE_PATH.test(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

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

  if (pathnameHasLocale) {
    const locale = LOCALES.find((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) ?? DEFAULT_LOCALE;
    const listingsMatch = pathname.match(/^\/(en|fr|ar)\/listings\/?$/);
    if (listingsMatch) {
      const city = request.nextUrl.searchParams.get("city");
      if (city?.trim()) {
        const dest = findDestinationByCity(city);
        const slug = dest?.id ?? city.trim().toLowerCase().replace(/\s+/g, "-");
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/stays/${slug}`;
        const preserve = ["checkin_date", "checkout_date", "guests", "adults", "children", "infants", "pets"];
        for (const key of [...url.searchParams.keys()]) {
          if (key !== "city" && !preserve.includes(key)) url.searchParams.delete(key);
        }
        url.searchParams.delete("city");
        return NextResponse.redirect(url, 301);
      }
    }
    return NextResponse.next();
  }

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
    // Skip locale rewrite for Next internals, API, static assets, and browser probes
    "/((?!api|_next/static|_next/image|favicon\\.ico|icons|images|guidance|pwa|manifest\\.webmanifest|manifest\\.json|sw\\.js|workbox|offline\\.html|fallback|\\.well-known|apple-touch-icon|robots\\.txt|browserconfig\\.xml).*)",
  ],
};
