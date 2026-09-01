/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const isDev = process.env.NODE_ENV === "development";
const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";
const identityApi =
  process.env.NEXT_PUBLIC_IDENTITY_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3001";
const staysApi =
  process.env.NEXT_PUBLIC_STAYS_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3002";
const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
const errorReportingEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;

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
const analyticsOrigin = originOf(analyticsEndpoint);
const errorReportingOrigin = originOf(errorReportingEndpoint);
const sumsubApiOrigin = "https://api.sumsub.com";
const sumsubStaticOrigin = "https://static.sumsub.com";
const approvedListingImageHosts = [
  "media.nexastays.ma",
  "cdn.nexastays.ma",
  "storage.nexastays.ma",
];
const staysImageHost = (() => {
  try {
    return new URL(staysApi).hostname;
  } catch {
    return undefined;
  }
})();
const uniqueOrigins = (...origins) => [...new Set(origins.filter(Boolean))];
// Browsers treat localhost and 127.0.0.1 as different origins. Dev CSP must
// allow both so OTP/login is not blocked as a connect-src violation.
const devLoopbackApis = isDev
  ? [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3002",
      "http://localhost:3005",
      "http://127.0.0.1:3005",
    ]
  : [];
const connectOrigins = uniqueOrigins(
  siteOrigin,
  identityOrigin,
  staysOrigin,
  sumsubApiOrigin,
  analyticsOrigin,
  errorReportingOrigin,
  ...devLoopbackApis,
);
const staysMediaOrigins = uniqueOrigins(staysOrigin, ...devLoopbackApis.filter((o) => o.endsWith(":3002")));

const csp = [
  "default-src 'self'",
  `script-src 'self' ${sumsubStaticOrigin} ${isProd ? "" : "'unsafe-eval'"} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.tile.openstreetmap.org https://staticmap.openstreetmap.de https://*.basemaps.cartocdn.com" +
    staysMediaOrigins.map((origin) => ` ${origin}`).join(""),
  "font-src 'self' data:",
  "media-src 'self'" + staysMediaOrigins.map((origin) => ` ${origin}`).join(""),
  "connect-src 'self'" + connectOrigins.map((origin) => ` ${origin}`).join(""),
  `frame-src 'self' ${sumsubApiOrigin}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
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
    value:
      'camera=(self "https://api.sumsub.com"), microphone=(self "https://api.sumsub.com"), geolocation=(self)',
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
  distDir: isDev ? ".next-dev" : ".next",
  // PPR requires Next.js canary — static shell + Suspense streaming is used instead (see HomePage.server.tsx).
  experimental: {
    // Avoid huge lucide vendor chunks that often go stale in dev on Windows.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Acknowledge Turbopack when using `npm run dev:turbo` (Next.js 16 requires this if webpack is also configured).
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      // Filesystem webpack cache + Windows file locks → missing ./8948.js / vendor-chunks/*.js
      config.cache = { type: "memory", maxGenerations: 1 };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...approvedListingImageHosts.map((hostname) => ({
        protocol: "https",
        hostname,
        pathname: "/**",
      })),
      ...(staysImageHost && !["localhost", "127.0.0.1"].includes(staysImageHost)
        ? [
            {
              protocol: "https",
              hostname: staysImageHost,
              pathname: "/api/v1/stays/listings/**",
            },
          ]
        : []),
      ...(!isProd
        ? [
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
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/nexastays.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },
};

const withPWA = (config) => config;
void ({
  dest: "public",
  // Skip PWA webpack work in dev — reduces cache corruption; SW recovery stays in NexaDebugBoot.
  disable: process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DISABLE_PWA === "true",
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
        // Authenticated API responses must never enter a shared service-worker cache.
        handler: "NetworkOnly",
        method: "GET",
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
