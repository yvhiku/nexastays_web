# Nexa Stays layering architecture

`nexastays_web` uses one global layer registry and body portals for floating UI.
The source of truth is `lib/ui/layers.ts`; Tailwind reads the same registry and
exposes semantic `z-layer-*` utilities.

## Layer hierarchy

| Layer | Value | Intended use |
| --- | ---: | --- |
| `base` | 0 | Page and isolated widget roots |
| `content` | 10 | Local card controls and decorative content |
| `header` | 40 | Global navigation and mobile navigation |
| `sticky` | 50 | Sticky search, fixed page actions, and sticky toolbars |
| `dropdown` | 1000 | Selects and anchored menus |
| `popover` | 1100 | Rich anchored popovers and guest selectors |
| `datePicker` | 1200 | Calendars and date-range panels |
| `commandPalette` | 1300 | Global command/search surfaces |
| `drawer` | 1400 | Side drawers and bottom sheets |
| `modal` | 1500 | Dialogs, viewers, and blocking guidance |
| `toast` | 1600 | Passive notifications and save feedback |
| `tooltip` | 1700 | Tooltips that must remain readable above other UI |

Use `LAYER_CLASS` when composing classes in TypeScript and `layerStyle()` only
when an inline numeric value is required. Static markup may use the matching
semantic Tailwind utility, such as `z-layer-sticky`. Never add numeric `z-*`
utilities or literal `style={{ zIndex: ... }}` values.

## Portal rules

Floating UI must render under `document.body`, outside page stacking contexts.

- Use `AnchoredOverlayPortal` for dropdowns, menus, calendars, selects,
  tooltips, and popovers. Pass the trigger ref, semantic layer, alignment, and
  width constraints. The primitive follows scroll and resize and clamps the
  overlay to the viewport.
- Use `OverlayPortal` for dialogs, blocking overlays, drawers, viewers, and
  toasts.
- Use `BottomSheet` for mobile sheets. Choose its semantic `layer`; callers
  cannot supply an arbitrary z-index class.
- Include both the trigger and portaled panel refs in outside-click handling.
- Keep focus trapping, Escape handling, `aria-modal`, and scroll locking in the
  owning overlay component.

## Stacking-context policy

Transforms, filters, opacity, isolation, containment, and overflow clipping are
allowed for local visuals and animation. They must not contain floating UI.

- `overflow-hidden` is appropriate for image crops, rounded media, maps, and
  deliberately clipped animation surfaces.
- Apply transforms to the element that moves, not a page/section wrapper.
- `isolate` is appropriate for self-contained maps and visual effects only.
- Sticky/fixed app chrome must use `header` or `sticky`; floating UI must use a
  portal layer above both.
- Leaflet/map controls remain local to an isolated map root and use `content`.
  Global overlays must never depend on Leaflet pane values.

## Prohibited patterns

- Numeric Tailwind layers: `z-10`, `z-50`, `z-[9999]`.
- Literal numeric inline z-index declarations.
- Absolutely positioned dropdowns inside page sections, cards, headers, or
  transformed containers.
- Raising a parent section above its siblings solely to make a child menu
  visible.
- Removing intentional clipping from media and maps to work around an overlay.

## Review checklist

Verify search destination, dates, guests, language, notifications, profile,
conversation actions, emoji picker, selects, bottom sheets, drawers, dialogs,
image viewers, guidance, and toasts at desktop, tablet, and mobile widths.
Each surface must remain above heroes, destination cards, maps, sticky search,
headers, bottom navigation, and banners, and must close on its documented
outside-click or Escape interaction.
