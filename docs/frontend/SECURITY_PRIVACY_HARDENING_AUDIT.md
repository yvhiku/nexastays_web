# Security, Privacy and Production Hardening Audit

## Executive summary

Phase F audited authentication and session recovery, route protection, API
authorization, browser storage, service-worker behavior, user-generated content,
navigation URLs, uploads, media downloads, personal-data rendering, errors,
logging, public environment variables, browser policies, degraded states and
dependencies.

Seven verified defects were fixed without changing backend APIs or business rules.
The production build and security regression suite pass. Two coordinated launch
items remain: migration away from browser-readable bearer-token storage and the
Next.js/PWA dependency upgrade already identified in Phase E.

## Findings and remediation

| Severity | Category / files | Root cause and security impact | Resolution and verification |
| --- | --- | --- | --- |
| Critical | Service worker; `next.config.js`, `pwa-sw-update.ts`, `AuthContext.tsx` | A generic `NetworkFirst` API rule cached authenticated GET responses for 24 hours using shared URL keys. Personal inbox, booking, profile or notification responses could persist across logout/account changes. | All API traffic is now `NetworkOnly`. Legacy `apis` caches are deleted at startup, logout and failed-session cleanup. Public media keeps its separate cache. |
| Critical | Messaging actions and notifications; `actions/registry.ts`, `useNotificationsFeed.ts` | Backend-provided action URLs were sent directly to browser navigation. An executable scheme such as `javascript:` could run in the application origin. | Added shared internal, HTTP(S), telephone and email URL allowlists. Notifications accept only safe internal paths; messaging handlers reject executable and credentialed URLs. |
| Critical | SEO guides; `SeoGuidePage.client.tsx`, guide server route | `bodyHtml` crossed from an API payload into `dangerouslySetInnerHTML` without a frontend allowlist. A compromised content source could execute markup. | Server route sanitizes through a strict semantic-tag/attribute/scheme allowlist before data reaches the client renderer. |
| High | Attachment proxy; `app/api/messaging/attachment-download/route.ts` | URL validation used a string prefix, followed redirects, had no timeout and buffered arbitrary response sizes. This weakened SSRF and resource-exhaustion defenses. | Uses parsed exact-origin/path validation, rejects credentials and redirects, enforces a 15-second timeout and a 30 MB cap, and returns generic errors. |
| High | Host listing uploads; `stays-api.ts` | Listing photo/video upload helpers relied on file-picker `accept`, which is advisory and bypassable. | API boundary now validates image type/5 MB limit and walkthrough MP4/MOV/WebM type/100 MB limit before upload. |
| High | Browser policies; `next.config.js` | Permissions Policy disabled camera and microphone globally while KYC and voice capture require them; CSP omitted the provider script/frame/connect origins. | Restricted capture to self and `https://api.sumsub.com`, allowed the documented Sumsub SDK origins, retained `frame-ancestors 'none'`, and reduced `form-action` to self. |
| Medium | Booking privacy; guest and host booking details | Full government ID numbers were rendered in booking screens. This exposed more identity data than needed for recognition. | All displayed IDs are masked to the final four characters. Backend data and authorization rules are unchanged. |
| Medium | Error handling; `lib/errors.ts` | HTTP 5xx response text and response details could be shown or propagated, potentially exposing stack, SQL or internal service information. | Server errors now always use generic actionable copy and omit backend details. |
| Medium | KYC logging; `SumsubWebVerification.tsx` | Raw SDK error objects were logged to the browser console and could include provider/applicant context. | Removed raw object logging; existing user-safe error handling remains. |
| High — open | Authentication storage | Access, refresh and OTP-session bearer tokens remain in `localStorage`, making them readable to any successful same-origin XSS. Moving to HttpOnly, Secure, SameSite cookies requires coordinated Identity API/session changes. | Launch recommendation: implement a backend-for-frontend cookie session or Identity-issued HttpOnly cookies, then remove browser-readable refresh and OTP tokens. Existing XSS defenses, CSP and cross-tab logout reduce but do not eliminate this risk. |
| High — open | Dependencies | `npm audit --omit=dev` still reports 13 high and 3 moderate advisories in Next.js 14, PWA/Workbox/PostCSS and multipart dependencies. npm proposes breaking framework/plugin changes for full remediation. | Upgrade Next/PWA in an isolated migration branch and require a clean accepted-risk audit before launch. Do not run `npm audit fix --force` on the release branch. |
| Medium — open | CSP | Next.js 14 currently requires `'unsafe-inline'` for existing inline bootstrap/JSON-LD behavior. | Replace with a nonce/hash CSP during the framework upgrade and verify PWA/static generation. |

## Verified controls

- Protected routes wait for session restoration and distinguish JWT from temporary
  OTP sessions.
- Login and registration redirects pass through localized same-origin path
  normalization; external redirect targets are rejected.
- Token refresh failures clear tokens and synchronize logout across tabs.
- Tokens, OTPs and PINs were not found in URLs or production logs.
- Messages, reviews, listing descriptions and host text render through normal React
  escaping; rich translations and SEO HTML now have explicit sanitization.
- KYC/profile/review/messaging image validation and messaging attachment batch
  limits remain active.
- Access credentials stay guest-only, date-gated and absent from timeline events.
- Security headers include HSTS in production, nosniff, DENY framing,
  no-referrer, COOP, restrictive permissions, object blocking and HTTPS upgrade.
- Public environment variables contain only API/site/provider configuration; no
  client-side secrets were identified.
- Rate limits, offline state, API downtime and session expiry retain user-safe
  fallbacks.

## Production release actions

1. Complete the HttpOnly cookie session migration with Identity.
2. Complete the Next.js/PWA dependency upgrade and rerun the full A–F audit suite.
3. Configure trusted production domains in Sumsub WebSDK settings.
4. Replace the inline-script CSP allowance with nonces or hashes.
5. Verify headers at the deployed edge/proxy, not only in Next.js configuration.
6. Test logout/account switching with an existing legacy service-worker `apis`
   cache and confirm it is deleted.
