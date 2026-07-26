# Phase C — End-to-End User Journey Production Audit

Audit date: 2026-07-26

Scope: guest and host journeys in `nexastays_web`, frontend state recovery, API contracts, duplicate prevention, cross-tab behavior, public Stays service checks, and existing messaging/booking/listing workflow coverage.

## Executive result

The primary frontend journeys are connected and their public dependencies are healthy. Five functional defects were reproduced and fixed:

1. Authentication changes did not synchronize across tabs.
2. Invalid date ranges in shared search URLs reached discovery APIs.
3. Older map requests could overwrite pins for a newer viewport.
4. Booking confirmation had a same-render duplicate-submission window.
5. Host listing autosaves could reach the backend out of order and overwrite newer progress.

No backend APIs, schemas, permissions, or business rules were changed.

Destructive operations—creating bookings, simulating payments, submitting reviews, publishing listings, cancelling reservations, and changing KYC/application state—were intentionally not executed against existing local data during this audit. They require isolated seeded fixtures to produce trustworthy repeatable results.

## Safe live-service evidence

On 2026-07-26:

- Identity OpenAPI: HTTP 200.
- Stays OpenAPI: HTTP 200.
- Stays health: HTTP 200.
- Fee configuration: HTTP 200.
- General Explore query: HTTP 200.
- Filtered Agadir/2-guests Explore query: HTTP 200.
- Public API contracts for listings, availability, reviews, SEO, messaging media, and map pins were present.

The Stays Explore API currently accepts a reversed date range with HTTP 200. The frontend now removes the invalid checkout before constructing discovery API parameters, but backend validation should be considered separately for non-web clients.

## Findings and fixes

### High — Fixed: session state became stale across tabs

Journey: login, logout, token refresh, registration recovery, multiple tabs.

Root cause: `AuthContext` listened to same-document custom events, but browser `storage` events from other tabs were not handled.

Fix:

- Synchronize access-token, refresh-token, and OTP-session storage changes.
- Update token type immediately.
- Refresh the current user when another tab provides a JWT.
- Clear invalid cross-tab sessions.
- Protect asynchronous user hydration with a sequence so an older lookup cannot overwrite newer auth state.

### High — Fixed: host draft autosaves could overwrite newer progress

Journey: host listing creation and resume.

Root cause: the 900ms debounce reduced requests but did not prevent overlapping full-snapshot updates. Slow request A could finish after newer request B and restore stale fields.

Fix:

- Added a promise queue for draft persistence.
- Captured each form snapshot when its save was requested.
- Execute updates, unit synchronization, and media synchronization in invocation order.
- Preserve existing error messages, save labels, and explicit step-save behavior.

### High — Fixed: booking confirmation could submit twice

Journey: listing → verification → booking.

Root cause: the handler relied on React state to disable confirmation. Two events can enter before that state commits.

Fix: added an immediate ref-based submission lock, released in `finally`. Existing backend validation and payment idempotency remain unchanged.

### High — Fixed: stale map responses replaced current pins

Journey: discovery → filters → map pan/zoom.

Root cause: overlapping bounds requests had no request identity. The last response to finish won, even if it represented an older viewport.

Fix:

- Added monotonically increasing map request identity.
- Only the current request can update pins or loading state.
- Filter changes invalidate in-flight viewport responses.

### Medium — Fixed: malformed shared search URLs produced inconsistent journey state

Journey: shared URL, bookmark, refresh, browser navigation, listing transition.

Root cause: calendar interaction enforces date order, but URL hydration sanitized date syntax without validating that checkout followed check-in.

Fix:

- Invalid checkout is removed while preserving valid destination, check-in, and guest state.
- Applied the rule to both Search Bar hydration and canonical Explore filters.
- Invalid ranges no longer reach search, map, listing links, or pricing state.

### Medium — Fixed: saved listings did not synchronize across tabs

Journey: save → remove → view → persistence.

Root cause: same-tab custom events updated cards and the saved page, while native cross-tab storage events were ignored.

Fix:

- The global saved-experience host bridges active-user storage changes into the existing saved-listing event.
- Cross-tab synchronization is silent, avoiding duplicate toast/onboarding behavior.

## Journey assessment

| Journey | Evidence | Status |
| --- | --- | --- |
| Home → Search → Filters | URL serialization, sanitization, live Explore checks | Code/live read verified |
| Search → Map → Listing | Latest-request sequencing, shareable listing params | Fixed and regression covered |
| Listing gallery/details | Responsive/media components and public contracts | Code verified |
| Dates/guests/pricing | Local range validation, availability contract, shared fee provider | Code/API contract verified |
| Booking creation | Validation, verification, submission lock, ownership route | Fixed; destructive execution pending |
| Payment | Stable booking idempotency key and mock-only development path | Code verified; execution pending |
| Booking management | Lifecycle selector, filters, cancel/review/message actions | Code verified; mutations pending |
| Messaging | Pagination, optimistic reconciliation, realtime fallback, offline queue, scroll identity tests | Regression suite verified |
| Saved listings | Refresh persistence, same-tab and cross-tab synchronization | Fixed and regression covered |
| Reviews | Eligibility, validation, create/edit contracts | Code verified; mutation pending |
| Login/session refresh | Hydration dedupe, refresh retry, safe redirects, cross-tab sync | Fixed and regression covered |
| Become Host/KYC | Resume/status contracts and guarded dashboard transition | Code verified; state mutation pending |
| Listing creation | Server draft hydration, validation, uploads, serialized autosave | Fixed and regression covered |
| Host dashboard | Protected loading, application states, bookings/listings actions | Code verified; seeded browser run pending |

## Existing safeguards confirmed

- Search state is URL-backed and shareable.
- Listing detail preserves dates, guests, and active filters in return/navigation URLs.
- Listing booking validates date order and blocked-night overlap.
- Payment intent uses a stable per-booking idempotency key.
- Messaging preserves optimistic IDs, reconciliation, offline queueing, pagination, and unchanged message identity.
- Host listing drafts are server-owned and resume through the `draft` query parameter.
- Protected routes retain safe localized post-login redirects.
- Saved listings are namespaced by authenticated user.

## Open findings

### Critical validation gap — no isolated destructive E2E fixtures

The repository has no Playwright/Cypress harness or disposable guest/host dataset. Therefore the following launch-critical flows are not certified by this phase:

- create and pay for a booking;
- cancellation/refund state transitions;
- review submission/edit windows and display;
- host application/KYC progression;
- listing photo/walkthrough upload and publish;
- guest/host realtime messaging in two simultaneous authenticated browsers.

These should run against resettable accounts and mock payments only. Real SMS, email, push, identity vendors, and payment providers should remain disabled.

### High — Explore backend accepts reversed date ranges

The web client is now protected, but the public Explore endpoint returned HTTP 200 for checkout earlier than check-in. Backend validation should reject or explicitly normalize this input for consistent behavior across clients.

### Medium — Saved listings remain device-local by product design

The UI explicitly labels saved listings as device-only. They persist across refreshes and synchronize across tabs on the same device, but not across devices. Cross-device persistence would require a backend product change and was not introduced.

### Medium — Browser performance and recovery require measurement

Static/API tests cannot measure search latency, listing LCP, dashboard interaction latency, service-worker recovery, or mobile network transitions. These belong in the seeded browser harness.

## Regression coverage added

`lib/__tests__/journey-production-audit.test.ts` covers:

- complete search URL round trips;
- invalid deep-linked date ranges;
- canonical Explore API normalization;
- cross-tab JWT/logout/OTP synchronization;
- cross-tab saved-listing synchronization;
- latest-only map response reconciliation;
- booking duplicate-submission locking;
- serialized host draft autosaves.

## Release assessment

The audited frontend journey logic is safer and the five reproduced defects are resolved. Phase C cannot be honestly marked fully end-to-end production-certified until destructive flows run in a resettable, provider-isolated browser environment.
