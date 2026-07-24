# Z-index and stacking-context audit

The web app previously mixed global layers (`z-40`, `z-50`, `z-[1100]`) with
Leaflet-local values and rendered several menus inside clipped or transformed
ancestors. Numeric layer declarations have been replaced by the shared
semantic system.

## Floating surfaces

Body-portaled shared surfaces include:

- Homepage and listings destination, date, and guest search panels
- Shared date picker and select
- Language, notification, profile, and conversation menus
- Messaging emoji picker, attachment composer, and image viewer
- Mobile bottom sheets and navigation drawer
- Booking cancellation, phone change, guest verification, and review dialogs
- Saved onboarding, PWA welcome, spotlight, and guidance overlays

## Intentional local stacking contexts

These remain local and must not own overlays:

- Hero and SEO image treatments
- Listing and destination card image crops
- Explore and host-location maps
- Carousel controls and image-gallery controls
- Framer Motion animation elements
- Backdrop blur on headers, sticky bars, sheets, and modal surfaces
- Inbox and composer scroll containers

## Sticky and fixed chrome

- Main navigation and mobile bottom navigation use `header`.
- Listings search, wizard actions, booking actions, and floating map/search
  actions use `sticky`.
- Drawers and bottom sheets use `drawer`.
- Blocking dialogs and full-screen viewers use `modal`.
- Save and saved-item feedback use `toast`.

Any new stacking context that contains interactive floating content must be
rejected in review or the floating child must be moved to a body portal.
