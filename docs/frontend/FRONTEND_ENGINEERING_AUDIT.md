# Frontend Architecture, Performance and Code Quality Audit

## Executive summary

Phase E reviewed the Next.js App Router structure, 507 TypeScript source files,
283 client boundaries, shared state/API layers, hooks, rendering, assets,
accessibility infrastructure, cleanup paths, dependencies, security-sensitive
rendering, tests, and the production build.

The application is buildable and its existing feature architecture is generally
coherent. Verified security, cleanup, accessibility and tooling defects were fixed. One dependency-security launch
blocker remains because npm's available remediation requires coordinated breaking
upgrades of Next.js and the PWA toolchain.

## Findings

| Severity | Files / module | Finding, root cause and impact | Resolution / verification |
| --- | --- | --- | --- |
| High | `app/layout.tsx`; listing, stays and guide route JSON-LD scripts | Dynamic structured data used raw `JSON.stringify` inside an inline script. A value containing `</script>` could terminate the element and inject markup. | Added `serializeJsonLd`, which neutralizes `<` and JavaScript line separators. All five JSON-LD surfaces now use it; regression tests cover script termination. |
| High | `lib/i18n/index.ts`; `RichText`, `RichTextServer` | The formatter converted supported tokens but accepted arbitrary raw HTML and unescaped interpolation values. This made the shared rich-text boundary unsafe if content ceased to be fully static. | The formatter now escapes text and variables before adding only supported `<em>` and `<br />` markup. Client and server renderers share the fix. |
| Medium | `lib/messaging/AttachmentManager.ts` | Staged and resumed attachment preview object URLs were revoked during normal actions but not when the owner unmounted. Repeated abandoned composer sessions could retain blobs. | Added unmount cleanup for staged and active-send previews and the pending save timer. |
| Medium | `app/[locale]/host/listings/new/page.tsx` | Photo and walkthrough preview object URLs were released on explicit removal but not when leaving the wizard. Large media drafts could remain retained until page teardown. | Added owner-level unmount cleanup using the existing current-form ref. |
| Medium | project ESLint configuration and affected source files | `npm run lint` opened an interactive setup prompt, so CI could not enforce linting. Enabling the installed Next.js rules exposed dead imports, an incorrectly hook-shaped handler name, incomplete ARIA option semantics, unstable effect dependencies and one unmanaged map settle timer. | Added the standard Next.js ESLint configuration and resolved every reported error and warning without disabling core rules. Lint now runs non-interactively with zero warnings. |
| High — open | `next`, `@ducanh2912/next-pwa` and transitive Workbox/PostCSS tooling | `npm audit --omit=dev` reports 13 high and 3 moderate advisories. npm proposes Next 16 and a breaking PWA change for full remediation. Applying `--force` without a migration would risk routing, PWA caching and production behavior. | Launch blocker: schedule a Next/PWA upgrade branch, re-run the complete route/PWA suite, and require a clean production dependency audit before release. Do not use `npm audit fix --force` on the release branch. |
| Medium — open | `package.json` | Static dependency analysis reports four likely unused direct packages: three Radix primitives and `react-easy-crop`. The PWA webpack analyzer failed, so this result is not sufficient proof for automatic removal. | Confirm through bundle analysis and clean-install CI, then remove in a dedicated lockfile change. |
| Medium — open | `WizardStepBody.tsx`, inbox route, listings route, `stays-api.ts` | Several files exceed 1,000 lines. They increase review cost, but working systems are already divided through hooks/components in important paths. | Incrementally extract by responsibility only when changing those areas; no stylistic rewrite in Phase E. |
| Low — open | `public/guidance/*` | Four PNG guidance assets are 0.70–0.95 MB each. They are deferred, but modern formats would reduce transfer and cache storage. | Convert with visual-diff verification in the asset pipeline; do not recompress blindly. |
| Low — open | client component boundaries | 283 of 507 TypeScript files are client boundaries. Interactive product scope explains much of this, but it raises hydration cost. | Measure route-level hydration before moving boundaries. The current server-rendered SEO/home shells were preserved. |

## Architecture and code-health review

- Feature directories are established for messaging, search, listings, host wizard,
  bookings, reviews, saved state, SEO, mobile surfaces, and shared UI.
- Shared API modules centralize authentication refresh and error normalization.
- Race protections exist for map viewport searches, reviews, notifications,
  listing detail data, authentication storage synchronization and serialized host
  autosaves.
- Messaging retains paginated/virtualized rendering, incremental reconciliation,
  lazy media surfaces and explicit realtime cleanup.
- Overlay layering, modal focus management, reduced motion, route localization and
  RTL behavior are covered by existing policy tests.
- No circular dependency was demonstrated by the production compiler.
- No production-sensitive `console.log` was found. Existing debug logging is gated
  to analytics/performance diagnostics.
- ESLint now runs non-interactively with the Next.js Core Web Vitals and TypeScript
  rule sets and reports no errors or warnings.

## Build and performance baseline

- Largest route chunk before this audit: messaging thread, approximately 282 KB
  first-load JS.
- Listing detail is approximately 308 KB first-load JS and remains a candidate for
  measured lazy-loading work.
- Static generation covers 631 pages.
- Largest public files are guidance PNGs under 1 MB each.
- No new runtime dependency was added.

## Required release follow-up

1. Upgrade Next.js and the PWA/Workbox chain on an isolated branch.
2. Verify middleware, localized routing, image optimization, service-worker update,
   offline fallback and all 631 static paths.
3. Run `npm audit --omit=dev` and require zero unaccepted high findings.
4. Validate the backend-provided SEO `bodyHtml` trust boundary. The frontend treats
   it as curated HTML; sanitization must be guaranteed at ingestion or added with a
   reviewed allowlist.
5. Run browser profiling before splitting large components or moving client
   boundaries; line count alone is not evidence of a runtime regression.
