/** Shared motion tokens for mobile search 2.1 */
export const SEARCH_MOTION = {
  rootOpenMs: 220,
  stepOpenMs: 250,
  stepCloseMs: 200,
  flashMs: 250,
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const SEARCH_SHEET_HEIGHT = {
  summary: "min-h-[42dvh] max-h-[45dvh]",
  full: "h-[95dvh] max-h-[95dvh]",
  guests: "h-[60dvh] max-h-[60dvh]",
} as const;

export type SearchSheetHeight = keyof typeof SEARCH_SHEET_HEIGHT;

export function nexaHaptic(ms = 12): void {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}
