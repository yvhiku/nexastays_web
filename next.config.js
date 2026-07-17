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
  "img-src 'self' data: blob: https://images.unsplash.com https://*.tile.openstreetmap.org https://staticmap.openstreetmap.de" +
    (staysOrigin ? ` ${staysOrigin}` : ""),
  "font-src 'self' data:",
  "media-src 'self'" + (staysOrigin ? ` ${staysOrigin}` : ""),
  "connect-src 'self'" +
    [siteOrigin, identityOrigin, staysOrigin].filter(Boolean).map((origin) => ` ${origin}`).join(""),
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

module.exports = nextConfig;
