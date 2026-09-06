/** Viewport-relative offset for sticky chrome: fixed NavBar + optional “Get the app” banner. */
export const WIZARD_STICKY_TOP =
  "calc(72px + env(safe-area-inset-top, 0px) + var(--nexa-app-banner-h, 0px))";
