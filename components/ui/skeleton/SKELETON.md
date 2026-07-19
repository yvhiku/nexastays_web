# Skeleton loading system

Production-frozen loading UI for Nexa Stays web. Import from `@/components/ui/skeleton`.

## Loading Design Principles

- No page-content spinners for marketplace data.
- Skeletons match final layout exactly; zero CLS.
- CSS shimmer only (~1.5s); never opacity pulse; never restart animation from JS.
- Respect `prefers-reduced-motion` (static base).
- Delay skeleton show ~180ms (`useDelayedLoading`).
- Skeletons only when no content exists (initial load). Revalidation keeps content visible + small indicator.
- Skeletons are decorative (`aria-hidden`). Loading regions use `aria-busy`.
- Images: placeholder → fade-in (never blank white flash).
- Empty ≠ Loading. Error ≠ Loading. States: Loading / Loaded / Empty / Error.
- Layout owns spacing; shared dimensions between real components and skeletons (`listing-card-dims.ts`).
- Route `loading.tsx` = shell only (`LocaleRouteSkeleton`); sections own grid skeletons.
- Single shimmer in `skeleton.css` via `--skeleton-base` / `--skeleton-highlight`.

## Primitives

`Skeleton`, `SkeletonText`, `SkeletonImage`, `SkeletonAvatar`, `SkeletonButton`, `SkeletonCard`, `SkeletonSection`

## Composed (marketplace)

`ListingCardSkeleton`, `ListingGridSkeleton`, `NavbarSkeleton`, `SearchBarSkeleton`, `LocaleRouteSkeleton`

## Reserved names (later)

`GallerySkeleton`, `TableSkeleton`, `ChartSkeleton`, `DashboardCardSkeleton`, …
