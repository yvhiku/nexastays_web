/**
 * Listing page “vibe” chips — local art in `images/assets/`, served from `public/images/assets/`.
 * `objectPosition` tunes crop for the 140×80px horizontal cards.
 * `filters` map a tap to listings search query params.
 */
export const VIBE_CARDS = [
  {
    id: "rooftop-sunsets",
    labelKey: "listings.rooftopSunsets",
    src: "/images/assets/rooftop-riad.jpg",
    objectPosition: "center 45%",
    filters: { listing_type: "RIAD" as const },
  },
  {
    id: "riad-magic",
    labelKey: "listings.riadMagic",
    src: "/images/assets/riad-magic.jpg",
    objectPosition: "center 55%",
    filters: { listing_type: "RIAD" as const },
  },
  {
    id: "ocean-view",
    labelKey: "listings.oceanView",
    src: "/images/assets/ocean-view.jpg",
    objectPosition: "center center",
    filters: { city: "Agadir" },
  },
  {
    id: "cozy-quiet",
    labelKey: "listings.cozyQuiet",
    src: "/images/assets/cozy.jpg",
    objectPosition: "center 40%",
    filters: { listing_type: "APARTMENT" as const },
  },
  {
    id: "luxury-minimal",
    labelKey: "listings.luxuryMinimal",
    src: "/images/assets/luxury.jpg",
    objectPosition: "center 35%",
    filters: { listing_type: "VILLA" as const },
  },
  {
    id: "family-ready",
    labelKey: "listings.familyReady",
    src: "/images/assets/family-ready.jpg",
    objectPosition: "left center",
    filters: { guests: 4 },
  },
] as const;
