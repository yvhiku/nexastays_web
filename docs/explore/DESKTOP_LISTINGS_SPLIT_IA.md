# Desktop Listings Split — Information Architecture

**Status:** PHASE 1 IMPLEMENTED  
**Scope:** Desktop (`xl+`) guest `/[locale]/listings` composition when `layout=split`  
**Does not authorize:** ListingCard redesign, map interaction redesign, pagination changes, explore API changes, Host Portal edits, or Phase 2 polish 

**Upstream / related:**

- Guest Listings audit: [`STAYS_LISTINGS_AUDIT.md`](../../STAYS_LISTINGS_AUDIT.md)
- Explore filter forwarding (backend): stays `fix(stays): forward explore filters`
- Map/list UX: tablet sticky header + mobile FAB — web `8a5db15`
- Layout model: [`lib/explore-layout.ts`](../../lib/explore-layout.ts)

> This document is the **authoritative IA contract** for the desktop split redesign.  
> Phase 1 implementation must follow these locks. Phase 2 interaction polish is explicitly deferred.

---

## 1. Design principles

1. **First viewport = stays** — Desktop split must answer “what stays are available?” before editorial destination content.
2. **Two surfaces, not three columns** — Permanent filter sidebar + list + map is too expensive; filters move to CTA + drawer.
3. **One owner for destination heading** — ResultsHeader owns name + count; DestinationContext does not duplicate large titles.
4. **Page scroll stays the scroll owner** — Sticky list header + sticky map; no nested dual scrollers in Phase 1.
5. **Reuse before invent** — Existing filter drawer, QuickFilters, ResultsHeader, ListingCard, ExploreMap, pagination.
6. **Freeze what already works** — Cursor pagination, explore API/filters, mobile pink FAB, tablet List/Map header.
7. **Phase 1 is IA only** — Not a ListingCard polish, not map hover/cluster redesign, not another pagination project.

---

## 2. Current anatomy (problem)

```text
[ xl sidebar 260–280 ] [ Search + QuickFilters + ResultsHeader ]
                       [ DestinationContext hero + ExploreCollections ]
                       [ list @container 2-col | sticky map ~46% ]
```

| Issue | Evidence |
| --- | --- |
| Three competing vertical regions | Outer `xl:grid-cols-[sidebar_1fr]` in `app/[locale]/listings/page.tsx` + split list/map |
| First viewport not “stays” | Full `DestinationContext` (city title/subtitle) + `ExploreCollections` above cards when `layout !== map` |
| Map feels bolted on | Hard `border-l` aside; ResultsHeader in **global** chrome above both panes |
| Density undermined | Compact `@container` 2-col exists, but editorial blocks consume list height |
| Card ↔ map hover sync | `ExploreMap` has cluster + click `selectedId` only — no list-card hover bridge (**Phase 2**) |

**Primary files today:**

| Piece | Path |
| --- | --- |
| Page composition | `app/[locale]/listings/page.tsx` |
| Destination hero/chips | `components/explore/DestinationContext.tsx` |
| Collections strip | `components/explore/ExploreCollections.tsx` |
| Results chrome | `components/explore/ResultsHeader.tsx` |
| Map panel | `components/explore/ListingsMapPanel.tsx` → `ExploreMap.tsx` |
| Mobile/tablet feed | `components/explore/feed/ExploreFeed.tsx` |
| Layout resolve | `lib/explore-layout.ts` |

---

## 3. Locked target architecture

Desktop `xl+`, default `layout=split` (unchanged resolve rules):

```text
GLOBAL HEADER
│
├── SEARCH: Where / When / Guests / Filters
│
├── Compact destination chips + QuickFilters / active chips
│
└── DESKTOP SPLIT  (~56% list / ~44% map; tune within 54–58 / 42–46)
    ┌──────────────────────────────┬────────────────────────────┐
    │ LIST PANE                    │ MAP                        │
    │ Sticky ResultsHeader         │ Sticky full-height map     │
    │ Destination · Count          │ Flush visual treatment     │
    │ Sort · layout controls       │ Existing Leaflet/clusters  │
    │ Compact ListingCards         │                            │
    │ 2-col only when pane wide    │                            │
    │ Load More / existing IO      │                            │
    └──────────────────────────────┴────────────────────────────┘
```

Approximate ratio after visual QA: **56% / 44%** within locked **54–58% / 42–46%**.

---

## 4. Five locked clarifications

### 4.1 Layout control semantics in split

Do **not** imply a binary List/Map toggle means “one pane or the other” while both panes are visible in split.

**Locks:**

- Preserve the existing layout model / `setLayout` / URL: `list` | `split` | `map` via `resolveExploreLayout`.
- Selected state must reflect the **current** mode clearly.
- Preferred desktop labels when all three modes are exposed: **`[ List ] [ Split ] [ Map ]`**.
- If the product continues to expose a smaller control set, selected state must still match reality (e.g. split mode must not look like “Map-only”).
- Do **not** invent a second, split-pane-only List/Map behavior that diverges from canonical layout state.

### 4.2 Vertical scroll model

**Phase 1 scroll ownership:**

```text
Page scroll (existing owner unless source inspection proves otherwise)
├── sticky global header / search context
└── split content
    ├── listings flow in document / page scroll
    │   └── ResultsHeader sticks (CSS position: sticky)
    └── map sticks to viewport (existing sticky aside)
```

**Do not** introduce nested independently scrolling list + map panes in Phase 1 (awkward wheel/touchpad and a11y).

Map remains independently **sticky**, not a nested scroll container for the listing flow.

### 4.3 DestinationContext ownership

**Desktop split:**

```text
DestinationContext → chipsOnly only
```

- No large title, no large descriptive copy, no editorial hero in the list column.
- **ResultsHeader owns destination name and result count** (single heading surface).
- DestinationContext contributes **only compact contextual chips** (neighborhood / popular cities as today’s `chipsOnly`).
- Prevents duplicated “Casablanca / Explore stays… / Casablanca stays / 1,004 stays”.

### 4.4 ExploreCollections scope

**Lock:**

> `ExploreCollections` is removed **only** from the desktop `xl+` `layout=split` composition in Phase 1.

Do **not** affect:

- mobile discovery (`ExploreFeed` rails)
- tablet list mode
- desktop `layout=list`
- desktop `layout=map`
- other routes

Use **conditional composition** in the page — do not gut or delete the component globally.

### 4.5 Two-column grid = container width only

**Lock:**

> Two compact columns only when the **actual list pane width** meets the existing safe `@container/split-list` threshold. Otherwise remain one column.

- Keep `@container/split-list` + `@[…]/split-list:grid-cols-2`.
- **Re-validate** the rem threshold after the sidebar disappears (more list width at 1280).
- Do **not** replace with blind `xl:grid-cols-2`.
- Critical at 1280, browser zoom, side panels, RTL, and wider map fractions.

---

## 5. Other Phase 1 locks

1. **Remove permanent left filter sidebar** on desktop. Filters live behind a **Filters** CTA + reuse existing `OverlayPortal` drawer body (verified / instant / property types). Enable Filters button on `xl+` (today often `xl:hidden`).
2. **Keep QuickFilters** (or equivalent active chips under search) so Instant / Verified / type stay one-tap.
3. **Map:** keep `ListingsMapPanel variant="panel"` + existing Leaflet / markercluster. Flush visual treatment only (padding / chrome). No cluster redesign in Phase 1.
4. **Phase 1 is IA + composition only** — not ListingCard redesign, not map interaction redesign, not pagination.

---

## 6. Component reuse matrix

| Component | Phase 1 action |
| --- | --- |
| `app/[locale]/listings/page.tsx` | Primary composition rewrite for desktop split |
| Left filter `<aside>` | Remove from desktop grid |
| Filter drawer (`OverlayPortal`) | Reuse body; open from desktop Filters |
| `QuickFilters` | Keep under search |
| `ResultsHeader` | Move into **list pane**; sticky; own destination + count; layout controls with clear selected mode |
| `DestinationContext` | Desktop split: **`chipsOnly` only** |
| `ExploreCollections` | Omit **only** when `xl+ && layout=split` |
| `ListingCard` | Keep contract; keep `density="compact"` in split |
| `@container/split-list` | Keep; re-validate threshold |
| `ListingsMapPanel` / `ExploreMap` | Keep; flush panel treatment only |
| `ExploreFeed` | Untouched (`xl:hidden` paths) |
| Pagination / IO / Load more | Untouched |
| Explore API / URL filters | Untouched |
| Host Portal | Frozen |

---

## 7. Phase 1 vs Phase 2

### Phase 1 — Desktop IA / composition (next implementation prompt)

Primary touch: `app/[locale]/listings/page.tsx` (+ minimal `ResultsHeader` label/selected-state if needed for List/Split/Map clarity).

Checklist:

- [ ] Drop sidebar column from outer grid; widen main
- [ ] Desktop Filters CTA opens shared drawer; remove incorrect `xl:hidden` gates
- [ ] Split: sticky in-pane ResultsHeader (destination · count · sort · layout)
- [ ] DestinationContext `chipsOnly` on desktop split
- [ ] Omit ExploreCollections only when `xl+ && split`
- [ ] Tune split fractions toward ~56/44 within locked range
- [ ] Keep `@container` 2-col + compact cards; re-validate threshold at 1280
- [ ] Page scroll model (no nested dual scrollers)
- [ ] Update `lib/__tests__/journey-production-audit.test.ts` contracts as needed
- [ ] Visual QA matrix below

### Phase 2 — Interaction / density polish (deferred)

- Card ↔ map hover highlight (shared hovered/selected id)
- Cluster density / fewer price pills at low zoom
- New filter popover (drawer is enough for Phase 1)
- ListingCard chrome / map preview redesign
- Optional: re-introduce ExploreCollections as editorial rail after N listing rows

---

## 8. Non-regression matrix

| Surface | Must remain |
| --- | --- |
| Phone `< md` | Pink bottom-nav FAB sole map/list control; no black ExploreFeed Map FAB |
| Tablet `md`–`< xl` | Sticky ResultsHeader in map mode; Map → List without resize |
| Desktop `layout=list` | Works; ExploreCollections may remain (not stripped by split-only rule) |
| Desktop `layout=map` | Full map path; layout toggle / URL intact |
| Desktop `layout=split` | New IA; pagination / filters / map fetch intact |
| RTL `/ar/listings` | Split direction + chips + header usable; no overflow |
| Explore API / URL filters | Unchanged |
| Host Portal | Untouched |

---

## 9. Phase 1 visual QA

| Viewport | Expected |
| --- | --- |
| **1280** | Clean split; no cramped cards; no map overflow (**mandatory**) |
| **1440** | Comfortable two-col list + immersive map when pane width allows |
| **1536** | Breathing room without excessively wide cards |
| **1920** | Sanity; intentional max-width behavior |

Also verify:

- Long French destination / filter labels
- Arabic RTL split
- Active / quick filter chips wrapping or scrolling cleanly
- Long listing titles
- Zero results empty state
- Load More visible at bottom of a populated split view
- Baseline browser zoom **100%** (do not redesign for artificial zoom)

---

## 10. Success criteria (Phase 1)

Phase 1 is done when:

1. Desktop split no longer shows a permanent filter sidebar.
2. First viewport of the list pane is dominated by stay cards (not DestinationContext hero / collections).
3. ResultsHeader is sticky inside the list pane and owns destination name + count.
4. DestinationContext is chips-only on desktop split.
5. ExploreCollections is absent from desktop split only (other modes unchanged).
6. Layout control selected state matches `list` / `split` / `map` reality.
7. Scroll model is page scroll + sticky header + sticky map (no nested dual panes).
8. Container-query 2-col still gates on list-pane width.
9. Pagination, explore API, mobile, tablet, Host Portal unchanged.
10. QA matrix at 1280 / 1440 / 1536 passes.

---

## 11. Explicit non-goals (Phase 1)

- ListingCard visual redesign
- Map hover sync / cluster retune
- New filter popover system
- Pagination / cursor / limit changes
- Explore service or DTO changes
- Host Portal / dashboard work
- Broad mobile/tablet redesign

---

**Next step after acceptance:** separate prompt — *Phase 1 implement desktop listings split IA* — product code only as scoped above.
