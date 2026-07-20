/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";
const identityApi = process.env.NEXT_PUBLIC_IDENTITY_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3001";
const staysApi = process.env.NEXT_PUBLIC_STAYS_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3002";

function originOf(value) {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

const siteOrigin = originOf(appUrl);
const identityOrigin = originOf(identityApi);
const staysOrigin = originOf(staysApi);
const csp = [
  "default-src 'self'",
  `script-src 'self' ${isProd ? "" : "'unsafe-eval'"} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.tile.openstreetmap.org https://staticmap.openstreetmap.de https://*.basemaps.cartocdn.com" +
    (staysOrigin ? ` ${staysOrigin}` : ""),
  "font-src 'self' data:",
  "media-src 'self'" + (staysOrigin ? ` ${staysOrigin}` : ""),
  "connect-src 'self'" +
    [siteOrigin, identityOrigin, staysOrigin].filter(Boolean).map((origin) => ` ${origin}`).join(""),
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https:",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/api/v1/stays/listings/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/api/v1/stays/listings/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/api/v1/stays/listings/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  // Keep SW active in dev so Android can install a real standalone app (not a browser shortcut).
  disable: process.env.NEXT_PUBLIC_DISABLE_PWA === "true",
  register: true,
  fallbacks: {
    document: "/offline.html",
  },
  workboxOptions: {
    // Keep false so SwUpdateBanner can prompt before activating a new SW.
    skipWaiting: false,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-font-assets",
          expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: ({ url }) =>
          url.pathname.includes("/api/v1/stays/listings/") &&
          (url.pathname.includes("/media") || url.pathname.includes("/photo")),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "listing-images",
          expiration: { maxEntries: 96, maxAgeSeconds: 60 * 60 * 24 * 14 },
        },
      },
      {
        urlPattern: ({ url }) =>
          url.pathname.startsWith("/api/") ||
          /\/api\/v1\//.test(url.pathname) ||
          (typeof identityOrigin === "string" && url.origin === identityOrigin) ||
          (typeof staysOrigin === "string" && url.origin === staysOrigin),
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "apis",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
    ],
  },
});

module.exports = withPWA(nextConfig);
