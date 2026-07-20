# Nexa Stays PWA roadmap

Installable Progressive Web App and mobile shell for [`nexastays_web`](../nexastays_web).

## Status

| Phase | Focus | Status |
| --- | --- | --- |
| 1 | PWA core + installable polish (Sprint 1 B+) | **Done — launch-complete** |
| 2 | Mobile shell (4-tab bottom nav, safe areas) | **Done** (superseded by floating glass below) |
| Sprint 1 nav + Save | Floating glass nav, Search FAB sheet, Saved rename, premium Save UX | **Done** |
| Sprint 1 Product Guidance | Guest discovery engine (Welcome → Search → Save → Trips + Install queue) | **Done** |
| PWA Branding | Real logo icons, versioned assets, splash, screenshots | **Done** |
| Launch Polish | Transparent v3 favicons, seamless updates, skeletons, motion, feedback | **Done** |
| Sprint 2 | Rich search sheet + **Saved Collections** + host guidance + interaction quality | Deferred |
| 3 | Search redesign + install funnel analytics | Deferred (partially in Sprint 2) |
| 4 | Explore map | Deferred |
| 5 | Bottom sheets | Deferred (Sprint 2) |
| 6 | Offline enhancements (saved trips) | Deferred |
| 7 | Push notifications | Deferred |
| 8 | Share + shortcuts | Done |
| 9 | Performance budget enforcement | Documented; CI later |
| 10 | WebAuthn | Deferred |

## Sprint 1 B+ — shipped

- Value-only install triggers (no 45s timer): 2nd listing, wishlist, booking, return visit; host listing submit, host approved, dashboard 3+
- Contextual install copy; Android Install App / iOS Show me how + illustration
- `dismissed_until` 30 days; install = never again
- One-time standalone welcome screen
- Premium update banner (Update Now / Dismiss)
- Offline: No internet + recently viewed + Retry + Browse recently viewed
- Adaptive splash 500–1200ms (standalone, once per open)
- Icons: generated from `public/images/nexastays.png` (see Brand assets)
- Screenshots: welcome / explore / listing / host (hand-authored)
- Manifest: description, categories, portrait, standalone + window-controls-overlay

## Brand assets (PWA icons)

```text
public/images/nexastays.png   ← only hand-edited brand file
        │
        ▼
npm run generate:pwa
        │
        ▼
public/icons/*.v3.png + public/favicon.ico + build.json
        │
        ▼
lib/pwa-assets.ts  → layout / manifest / splash / install UI
```

**Rules**

- Browser favicons + `icon-192` / `icon-512`: **transparent logo mark** (black knocked out) — no black square in the tab.
- Maskable only: black plate + `SAFE_PADDING = 0.18`.
- Never edit files under `public/icons/` by hand — regenerate them.
- Never let the generator write under `public/pwa/screenshots/` (hand-authored product captures).
- Consumers must import paths from `lib/pwa-assets.ts` (no hardcoded `/icons/...` strings).

**When the logo changes**

1. Replace `public/images/nexastays.png`
2. Bump `ICON_VERSION` in `scripts/generate-pwa-icons.ts` **and** `PWA_ICON_VERSION` in `lib/pwa-assets.ts` (e.g. `v3` → `v4`)
3. Run `npm run generate:pwa`
4. Commit icons + code
5. Users: tap **Update Now** for in-app assets; fully close the PWA so Chrome can refresh the Home Screen icon (WebAPK) — uninstall not required when icon URLs change

**Updates (SW vs launcher icon)**

- **Update Now** → `SKIP_WAITING` → clear image caches → reload (app content + in-app icons).
- **Home Screen icon** → Chrome WebAPK after the app is fully closed (manifest `icons` URL change required).

**QA matrix**

- Android: Chrome · Samsung Internet · Edge · Brave
- iPhone: Safari
- Desktop: Chrome · Edge · Safari · Firefox
- Verify: install, update, offline, splash, favicons (transparent), bottom nav, search sheet, saved, trips, guidance, motion, skeletons, safe areas

## Launch Polish (shipped)

- Transparent v3 branding + `/favicon.ico`
- Hardened Update Now (applying state, poll, fallback reload)
- Listing / profile skeletons (no spinner-first on primary routes)
- Motion tokens (`lib/motion.ts`) + press feedback on buttons / sheets
- Overscroll + tap highlight polish; focus rings on buttons

## Sprint 1 — premium mobile nav + Save (shipped)

**Guest nav:** Explore · Saved · Search (center FAB) · Trips · Profile — floating glass chrome (`rounded-[28px]`, blur, soft shadow).

**Host nav:** Dashboard · Bookings · Listings · Profile — same chrome, no Search FAB.

**Search FAB:** Opens a minimal sheet wrapping existing `SearchBar` → `/listings?...`. Recents / popular / recently viewed = Sprint 2.

**Saved (renamed from Wishlist):** Bookmark metaphor; copy in en/fr/ar; manifest shortcut **Saved**; URL remains `/saved-listings`.

**Premium Save UX:**

- Bookmark fill/pop animation on save
- First save: Product Guidance celebration (`save.png`) → Saved tab spotlight (replaces old sheet)
- Every later save: toast “Saved · View Saved →” (~2s)
- Once at 3+ saves: “You’re building your collection · See Saved →”
- Unsave: “Removed · Undo” (~4s)
- Empty Saved page: bookmark + travel copy + Explore CTA

**Collections** (named lists) = Sprint 2.

## Sprint 1 — Product Guidance (shipped)

Unified `ProductGuidanceProvider` queue (never two at once; CRITICAL bypasses 30s cooldown).

Guest journey: Splash → Home → 700ms → Welcome → Search FAB spotlight → (explore) → first Save celebration → Saved spotlight → booking celebration → Trips spotlight → Install (eligibility) in same queue.

Host journey deferred. Search field multi-step coachmarks deferred.

## Sprint 2 — post-launch UX

- Rich mobile search sheet (recents / popular / recently viewed)
- **Saved Collections** (named lists)
- Host Product Guidance (dashboard / calendar / pricing)
- Skeleton loading
- Page transitions
- Bottom sheets (filters / guests / dates)
- Pull-to-refresh
- Lighthouse 95+ (Performance / A11y / SEO / Best Practices)

## Future

- Restore last-visited page on open (not search-first)
- Install funnel analytics: `install_prompt_shown`, `install_clicked`, `install_accepted`, `install_dismissed`, `app_installed`

## Performance budget (enforce later)

| Metric | Budget |
| --- | --- |
| JS initial (gzipped, critical route) | < 250 KB |
| LCP | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| Images | WebP/AVIF + lazy load |
