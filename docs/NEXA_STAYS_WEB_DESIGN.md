# Nexa Stays Web — Design System

Living design reference for the Nexa Stays web client (`nexastays_web`). Source of truth for tokens lives in code:

| Token source | Path |
|--------------|------|
| Tailwind theme | `../tailwind.config.ts` |
| CSS variables + map chrome | `../app/globals.css` |
| Fonts | `../app/layout.tsx` (Next.js `next/font`) |
| Buttons | `../components/ui/button.tsx` |
| Brand assets | `../lib/brand-assets.ts` |

Related docs: [monorepo `docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) · [monorepo `docs/DEPLOYMENT.md`](../../docs/DEPLOYMENT.md) · [canonical copy](../../docs/NEXA_STAYS_WEB_DESIGN.md)

---

## 1. Product positioning

**Nexa Stays** is a Morocco-first verified short-stay marketplace. The web UI should feel:

- **Trustworthy** — identity, walkthrough, and clear check-in language
- **Warm, not generic** — rose primary + soft blush surfaces (not purple SaaS)
- **Hospitality-forward** — Playfair display for titles, DM Sans for UI
- **Mobile-first** — 44px minimum touch targets, drawers on small screens

Brand lockup: **Nexa** (`text-nexa-ink`) + **Stays** (`text-nexa-primary`).

Tagline direction (marketing / metadata): *Verified stays in Morocco with more safety, transparency, and comfort.*

---

## 2. Typography

| Role | Font | CSS / Tailwind | Weights | Use |
|------|------|----------------|---------|-----|
| Display | [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) | `--font-playfair` · `font-display` | 400–700 | Logo wordmark, page titles (`h1`–`h4`), listing titles |
| UI / body | [DM Sans](https://fonts.google.com/specimen/DM+Sans) | `--font-dm-sans` · `font-sans` | 300–600 | Body, nav, buttons, forms, captions |

**Defaults** (`globals.css`):

- Body: `16px`, `line-height: 1.6`, `antialiased`
- Headings: `font-display`, `leading-tight`
- Prefer `tabular-nums` for prices and ratings

**Scale (common patterns):**

| Element | Classes |
|---------|---------|
| Page hero title | `font-display text-2xl sm:text-3xl md:text-4xl font-bold` |
| Section title | `font-display text-2xl font-semibold` |
| Card title | `font-display text-base font-semibold` |
| Body | `font-sans text-sm` → `text-base` |
| Meta / caption | `text-xs` or `text-[0.65rem]`–`text-[0.8rem]`, `text-nexa-ink-4`, often `uppercase tracking-wider` for location labels |

---

## 3. Color palette

### Brand tokens (`theme.extend.colors.nexa`)

| Token | Hex | Role |
|-------|-----|------|
| `nexa-primary` | `#E8507A` | CTAs, active nav, price bubbles, focus rings |
| `nexa-primary-dark` | `#C93A62` | Primary hover / pressed |
| `nexa-primary-light` | `#F4809A` | Soft accents |
| `nexa-primary-soft` | `#FDF0F3` | Selected chips, soft panels, alert fills |
| `nexa-accent` | `#F9A86C` | Warm secondary (locks, highlights) |
| `nexa-accent-soft` | `#FEF5EC` | Accent wash |
| `nexa-ink` | `#1A1118` | Primary text |
| `nexa-ink-2` | `#3D2B36` | Strong secondary text |
| `nexa-ink-3` | `#6B5460` | Muted body |
| `nexa-ink-4` | `#9E8A93` | Captions, placeholders |
| `nexa-line` | `#EDE0E5` | Borders, dividers |
| `nexa-bg` | `#FDFBFC` | Page background |
| `nexa-bg-2` | `#F8F2F5` | Nested surfaces, filter fields |

### Semantic extras

| Use | Color |
|-----|--------|
| Success | Emerald (`emerald-50` / `emerald-600`) — alerts, verified-positive |
| Warning | Amber — booking / verification banners |
| Star rating | Amber (`text-amber-400 fill-amber-400`) |
| Map selected pin | `#1A1A2E` (ink-like dark) |

### CSS HSL mirrors (`:root` in `globals.css`)

Used by shadcn-style primitives (`border`, `primary`, `ring`, etc.):

- Primary ≈ rose `347 76% 59%`
- Accent ≈ warm orange `27 94% 69%`
- Background blush `330 33% 99%`

**Do not** introduce purple-on-white gradient themes or cream + terracotta newspaper looks that fight this palette.

---

## 4. Radius, shadow, spacing

### Radius (`tailwind.config.ts`)

| Token | Value | Typical use |
|-------|-------|-------------|
| `rounded-sm` | `8px` | Small chips |
| `rounded-md` / `rounded-[14px]` | `14px` | Buttons (default), inputs |
| `rounded-lg` | `22px` | Cards / media |
| `rounded-xl` | `32px` | Large hero panels |
| `rounded-full` | pill | Sort select, view toggles, map CTAs |

Buttons also use `rounded-[14px]` (default) and `rounded-[18px]` (lg).

### Shadows

| Token | Value | Use |
|-------|--------|-----|
| `shadow-nexa-sm` | `0 2px 8px rgba(232,80,122,0.08)` | Light elevation |
| `shadow-nexa-md` | `0 6px 24px rgba(232,80,122,0.12)` | Hover cards, white buttons |
| `shadow-nexa-lg` | `0 16px 48px rgba(232,80,122,0.16)` | Strong lift |
| `shadow-nexa-card` | `0 4px 20px rgba(26,17,24,0.07)` | Listing cards, galleries |
| Primary CTA glow | `0 4px 16px rgba(232,80,122,.32)` | Default button |

### Spacing conventions

- Page content: `p-4 sm:p-5 md:p-6 xl:p-7`
- Card padding: `p-4 sm:p-5`
- Grid gaps: `gap-4` (listings), `gap-2.5 sm:gap-3` (vibe tiles)
- Touch targets: **min-height 44px** (`min-h-[44px]`) on primary controls

---

## 5. Components

### Buttons (`components/ui/button.tsx`)

| Variant | Look |
|---------|------|
| `default` | Solid `nexa-primary`, white text, rose shadow, slight lift on hover |
| `outline` | `1.5px` primary border, soft fill on hover |
| `ghost` | Line border, muted ink, `bg-nexa-bg-2` on hover |
| `white` | White surface, primary text, `shadow-nexa-md` |

Sizes: `default` (h-11), `sm` (h-9, still 44px on mobile), `lg` (h-12).

### Form fields

- Height ~`h-11`, `rounded-xl`, `border-nexa-line`
- Focus: `border-nexa-primary` + `ring-2 ring-nexa-primary/20`
- Shared filter shell on Explore: `filterFieldClass` on listings page

### Chips / filters

- Idle: `border-nexa-line text-nexa-ink-3`
- Active: `border-nexa-primary text-nexa-primary bg-nexa-primary-soft`
- Toggle dot fills with `bg-nexa-primary` when on

### Cards

- Listing card: white, `rounded-2xl`, `border-nexa-line/50`, `shadow-nexa-card`
- Hover: `hover:shadow-nexa-md`, `hover:-translate-y-0.5`
- Image overlays: soft black gradient; type + save + status pills on photo
- Always show **rating** (`★` + `0.0` when empty) and **review count** under it — real aggregates only (no hardcoding)

### Alerts (`components/ui/Alert.tsx`)

Variants: `error` | `success` | `warning` | `info` — soft gradient panels with tinted borders (error uses primary-soft; success emerald; warning amber).

### Navigation

- Desktop: sticky bar, display wordmark, underline active link in primary
- Mobile: full-screen drawer **`z-[1100]`** (must sit above Leaflet panes ~400–1000)
- Menu CTA: primary filled pill / rounded-xl

### Map (Explore)

- Price bubbles: `#E8507A` pill + triangle tip (`.nexa-price-bubble`)
- Selected: dark `#1A1A2E`
- Clusters: primary fill + white ring
- Preview card: image, heart, rating, meta, Verified, primary **View Details**
- Map wrapper: `isolate` / contained stacking so overlays don’t punch through chrome

### Icons

[Lucide React](https://lucide.dev/) — Heart, Star, Lock, Zap, BadgeCheck, Map, List, SlidersHorizontal, etc. Prefer stroke icons; fill primary/amber when selected or rated.

---

## 6. Layout & surfaces

| Surface | Treatment |
|---------|-----------|
| App shell | `bg-nexa-bg` |
| Explore hero band | `bg-gradient-to-br from-nexa-ink to-nexa-ink-2`, white text, large radius |
| Trust strip | `bg-nexa-primary-soft/80 border-nexa-primary/15 rounded-2xl` |
| Auth / registration hero | Dark / branded panel with white display logo |
| Listing detail | White cards, gallery `shadow-nexa-card`, booking sticky card |

**Breakpoints (Tailwind defaults):** `sm` / `md` / `lg` / `xl` / `2xl`. Explore filters move to a mobile drawer below `xl`.

**Locales:** `/en`, `/fr`, `/ar` — RTL for Arabic; keep layout mirrored via existing locale layout.

---

## 7. Motion

Keep motion purposeful and light:

- Card hover: translate + shadow (~300ms)
- Button hover: `-translate-y-px` / shadow deepen (~200ms)
- Rating stars: `.rating-star` scale `1.12` on hover
- Price bubble: scale `1.04` on hover
- Infinite scroll / Load more: no flashy loaders; quiet `text-nexa-ink-4` loading copy
- Prefer `transition-colors` / `transition-all duration-200|300` over long loops

Ship **2–3 intentional motions** on visually led pages (hero, cards, map), not noise.

---

## 8. Key screens (composition notes)

### Explore / listings (`/listings`)

1. Filters + search row  
2. Match count + **Sort by** (newest / top rated / cheapest / most expensive) + list|map toggle  
3. Dark title band  
4. Vibe tiles (one job: quick filter presets)  
5. Grid of listing cards **or** map  
6. Infinite scroll sentinel + **Load more** fallback  
7. Trust strip  

First viewport should stay one composition: brand/nav, search, and results — avoid dashboard clutter.

### Listing detail (`/listings/[id]`)

- Gallery first; Playfair title; rating from real reviews  
- Sections: About, amenities, rules, reviews, booking card  
- Trust / guarantee blocks use soft white + border, not heavy multi-shadow stacks  

### Host wizard & dashboard

- Step progress, soft tips, same primary CTAs  
- Preserve existing wizard patterns rather than inventing a second visual language  

### Auth (login / registration)

- Strong brand panel + form column  
- OTP / phone fields match shared input radius and focus ring  

---

## 9. Accessibility & i18n

- Skip link in root layout (`focus:z-[100]`)
- Focus rings: `ring-nexa-primary/20`–`/40`
- Min touch size 44×44 where possible  
- Copy via `t` / `tf` locale keys (`lib/i18n/locales/{en,fr,ar}.json`) — no hard-coded user-facing English in components when a key exists  
- Ratings: always show numeric avg (including `0.0`) and review count from API aggregates  

---

## 9b. Skeleton loading

Canonical rules: [`components/ui/skeleton/SKELETON.md`](../components/ui/skeleton/SKELETON.md).

- CSS tokens: `--skeleton-base`, `--skeleton-highlight` in `skeleton.css`
- Marketplace: `ListingGridSkeleton` on initial explore/saved load; keep content on filter revalidation
- Route shell: `app/[locale]/loading.tsx` → `LocaleRouteSkeleton` (not `AppLoader`)
- Shared card dims: `components/listing/listing-card-dims.ts`

---

## 10. Implementation checklist (new UI)

When adding a surface:

1. Use `nexa-*` tokens — avoid one-off hex unless map/Leaflet requires it (then match primary `#E8507A`).  
2. Titles → `font-display`; UI → `font-sans`.  
3. Primary actions → `Button` variants, not ad-hoc pink.  
4. Cards → white + `nexa-line` + `shadow-nexa-card`; hover lift optional.  
5. Mobile: drawers / full-bleed where Explore already does; keep `z-index` above Leaflet if overlaying maps.  
6. Wire real data (ratings, prices, media URLs) — no placeholder fake stats.  
7. Add/update locale strings for EN / FR / AR.  

---

## 11. File map (design-related)

```
nexastays_web/
  app/
    layout.tsx          # fonts, metadata
    globals.css         # base + Leaflet/map markers
    [locale]/...        # screens
  components/
    ui/                 # Button, Input, Alert, DatePicker, skeleton/
    listing/            # ListingCard, galleries
    explore/            # ExploreMap
    navbar/             # NavBar + mobile drawer
    host/               # listing wizard
  lib/
    brand-assets.ts
    i18n/locales/
  tailwind.config.ts
```

---

*Last aligned with the web codebase design tokens (Playfair + DM Sans, rose primary `#E8507A`). Update this doc when tokens or core components change.*
