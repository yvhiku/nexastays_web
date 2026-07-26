# Phase H — Final Production Readiness and Launch Certification

Date: 2026-07-26  
Candidate: Nexa Stays Web  
Decision: **NO GO — not certified as RC1**

## Executive summary

The frontend compiles, its automated regression suite is healthy, technical SEO
is strong, and the Phase H audit added production configuration enforcement,
privacy-conscious client error reporting, and fixes for the accessibility
defects reported by Lighthouse.

The candidate cannot be certified for public launch today. The local release
environment fails the strict production configuration contract, the process
occupying the Nexa Stays API port does not answer HTTP requests, core guest and
host journeys therefore cannot be completed end-to-end, and previously
documented security/dependency/localization blockers remain open.

This is a release-environment and launch-risk decision, not a statement that
the frontend is generally unstable. Feature development should remain frozen
except for verified blocker fixes.

## Release metrics

| Metric | Result |
| --- | --- |
| Phase H issues recorded | 11 |
| Fixed in Phase H | 3 |
| Remaining Critical | 2 |
| Remaining High | 5 |
| Remaining Medium | 1 |
| Remaining Low | 0 |
| Production dependency audit | 0 critical, 13 high, 3 moderate |
| Automated tests before Phase H additions | 106 passed |
| Final automated regression tests | 112 passed |
| Translation catalog parity | 1,831 keys in each of EN, FR, and AR |
| Static pages generated in last clean build | 631 |

## Issues and disposition

| ID | Severity | Category | Finding / root cause | Disposition |
| --- | --- | --- | --- | --- |
| H-001 | Critical | Production configuration | Current configuration uses HTTP loopback Identity/Stays URLs, omits the public site URL, analytics and monitoring endpoints, and uses mock payment. The frontend previously accepted these defaults silently. | Added `npm run release:env`, which rejects missing, non-HTTPS, loopback, credential-bearing, legacy, mock-payment, and disabled-PWA production settings. Current environment intentionally fails; deployment values must be supplied before release. |
| H-002 | Critical | Core journeys | Identity OpenAPI responds, but the process listening on port 3002 times out or refuses HTTP. A second Stays startup reached Nest initialization but failed with `EADDRINUSE`, confirming a stale/unhealthy existing listener. Search, listing, booking, payment, messaging, host dashboard, calendar, and review journeys cannot be certified. | Open. Restore a healthy Stays deployment and run guest/host E2E tests with synthetic data and mock payments only in staging. |
| H-003 | High — fixed | Monitoring | No client crash/unhandled-rejection reporting integration existed. | Added a provider-neutral monitoring bootstrap and React error-boundary reporting. Envelopes contain only kind, capped message, digest, path, and timestamp—no stacks, tokens, request bodies, or user identifiers. |
| H-004 | High — fixed | CSP / telemetry | External analytics or monitoring endpoints would be blocked by `connect-src`. | Their configured origins are now included in CSP. |
| H-005 | High — fixed | Accessibility | Lighthouse found low-contrast tokens/footer text, invalid card heading order, duplicated logo alt text, and accessible-name mismatches on language/search activation. | Corrected tokens and footer contrast, promoted the card heading, made the adjacent logo decorative, included the visible locale in the language control name, and removed the conflicting search label. Requires post-API Lighthouse rerun. |
| H-006 | High | Performance | Homepage Lighthouse missed targets: desktop Performance 72 with LCP 4.8 s; mobile Performance 50 with LCP 25.9 s and TBT 1,060 ms. API connection errors and an unhealthy local backend contaminate the result, but it cannot be accepted as passing. | Open. Rerun against a healthy production-like Stays API, then profile remaining LCP/long-task work. |
| H-007 | High | Dependencies | `npm audit --omit=dev` reports 13 high and 3 moderate issues in Next.js/PWA/transitive packages. Full npm remediation is breaking. | Open launch blocker from Phases E/F. Upgrade Next/PWA in an isolated branch and rerun routing, PWA, security, and all static-generation tests. |
| H-008 | High | Session security | Access, refresh, and OTP session tokens remain browser-readable in `localStorage`. | Open launch blocker from Phase F. Complete the Identity/BFF HttpOnly Secure SameSite cookie migration. |
| H-009 | High | Internationalization | Catalog key parity is complete, but literal English remains in listing details, review authoring, and host onboarding; the server source initially declares English before hydration corrects locale direction/language. | Open from Phase G. Complete approved copy extraction and locale-aware root document migration. |
| H-010 | High | Browser/device certification | Automated responsive and accessibility policy tests pass, but Safari/iOS, Firefox, Edge, NVDA, VoiceOver, TalkBack, zoom/reflow, and physical-device journeys were not available in this Windows workspace. | Open. Execute the signed manual device/browser matrix against the deployed RC. |
| H-011 | Medium | Assets | Guidance PNGs remain 0.70–1.0 MB and the home `how-it-works.png` is about 0.70 MB. | Convert through an AVIF/WebP visual-diff pipeline after the blockers; do not recompress blindly on the release branch. |

## Lighthouse results

Run target: built production homepage at `http://127.0.0.1:3005/en`  
Tool: Lighthouse 12.8.2, installed Chrome, desktop and default mobile profiles

| Profile | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop | 72 | 95 | 96 | 100 | 4.8 s | 0.005 | 170 ms |
| Mobile | 50 | 94 | 96 | 100 | 25.9 s | 0.068 | 1,060 ms |

The report files were produced successfully. Lighthouse exited non-zero only
while cleaning its temporary Chrome directory on Windows (`EPERM`); this did
not prevent JSON result generation.

Console findings were failed requests to the unavailable Stays fee endpoint.
The mobile LCP and TBT cannot be treated as representative until the backend is
healthy. The accessibility defects listed under H-005 were fixed after this
measurement, so a new score is required.

## Journey certification

### Guest journey

| Step | Status |
| --- | --- |
| Home production shell | Passed HTTP smoke |
| Search / filters / map | Blocked by Stays API |
| Listing | Blocked by Stays API |
| Wishlist | Not runtime-certified |
| Booking / payment / confirmation | Blocked; production payment config also invalid |
| Messaging / review / profile | Blocked or authentication-dependent |

### Host journey

| Step | Status |
| --- | --- |
| Become Host / authentication entry | Source and build verified |
| Dashboard / create listing / uploads | Blocked by Stays API |
| Pricing / availability / publish | Blocked by Stays API |
| Booking / messaging / reservation / calendar / reviews | Blocked by Stays API |

No destructive records, real payments, CMI callbacks, SMS, email, push, or
Sumsub actions were executed.

## Build and regression status

The final Phase H validation passed:

- TypeScript
- ESLint with zero warnings
- 112 tests
- production Next.js build
- 631 generated static pages
- diff/whitespace validation

Phase H release-configuration and monitoring regression tests are included in
that result. Build-time Stays fetch failures remain while H-002 is open and are
themselves evidence that the release output is not clean enough for
certification.

## Configuration contract

Production deployment must pass:

```text
npm run release:env
```

Required:

- HTTPS Identity API
- HTTPS Stays API
- HTTPS public site URL
- HTTPS or same-origin analytics endpoint
- HTTPS or same-origin client-error endpoint
- non-mock payment provider
- enabled production PWA
- no legacy single API variable
- no loopback hosts or URL credentials

The validator prints only variable names and policy failures, never values or
secrets.

## Monitoring and logging

- Window errors, unhandled promise rejections, and React route errors have a
  sanitized reporting path.
- Analytics and monitoring network failures are swallowed to avoid recursive
  application failures.
- Development analytics, messaging scroll, and performance console diagnostics
  remain environment-gated.
- User-visible server errors remain redacted by Phase F handling.
- A real reporting endpoint and operational alert ownership must be configured
  before launch.

## Network resilience and persistence

Verified by source/tests:

- stable skeletons and error states;
- offline PWA fallback;
- API responses excluded from service-worker caches;
- offline messaging queue/drafts and retry behavior;
- search URL state;
- host wizard autosave serialization;
- authentication and saved-state cross-tab synchronization;
- messaging pagination, reconciliation, and route-identity protections;
- failed media and image fallback surfaces.

Runtime Slow 3G, offline, timeout, and recovery tests remain part of the staged
browser matrix because the current API environment is unhealthy.

## Legal and public content

Present and routed:

- Terms of Service
- Privacy Policy
- Refund Policy
- Safety & Transparency
- Contact
- Fees

A separate cookie policy is not present. Before enabling production analytics,
legal/product owners must decide whether the selected analytics implementation
uses non-essential storage or identifiers and, if so, publish the policy and
consent controls required for launch jurisdictions.

## Certification gate

RC1 can be reconsidered only when all of the following evidence is attached:

1. `npm run release:env` passes in the deployment environment.
2. Stays health/OpenAPI and all core guest/host E2E journeys pass.
3. Production payment configuration is non-mock; staging tests remain mock-only.
4. No unaccepted high production dependency findings remain.
5. HttpOnly session migration is complete or formally risk-accepted by the
   security owner.
6. Approved EN/FR/AR literal-copy extraction and server language attributes are complete.
7. Post-fix Lighthouse meets targets against healthy APIs or exceptions have
   explicit owner/date acceptance.
8. Chrome, Edge, Firefox, Safari and physical-device/accessibility matrices are signed.
9. Error reporting, analytics, alerts, and operational ownership are configured.

## Final recommendation

**NO GO. Do not label or deploy this candidate as RC1.**

The frontend changes from Phases A–H should remain frozen and move through a
blocker-only stabilization cycle. Once the critical environment/API gates and
the security/dependency blockers are resolved, rerun this exact certification
without feature changes.
