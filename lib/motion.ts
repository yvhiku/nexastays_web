/**
 * Shared motion tokens for premium UI. Prefer these over ad-hoc durations.
 * Always respect prefers-reduced-motion via useReducedMotion / CSS.
 */
export const MOTION = {
  FAST: 0.18,
  NORMAL: 0.22,
  SLOW: 0.28,
  /** Button / tap press */
  PRESS_SCALE: 0.95,
  /** Card hover / lift */
  CARD_SCALE: 1.02,
  SHEET_SPRING: { type: "spring" as const, stiffness: 380, damping: 32 },
  MODAL_SPRING: { type: "spring" as const, stiffness: 320, damping: 28 },
  FAB_SPRING: { type: "spring" as const, stiffness: 400, damping: 26 },
} as const;

/** Tailwind-friendly ms for CSS transitions */
export const MOTION_MS = {
  FAST: 180,
  NORMAL: 220,
  SLOW: 280,
} as const;

export const PRESS_CLASS = "active:scale-95 transition-transform duration-200";
export const CARD_HOVER_CLASS =
  "transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]";
