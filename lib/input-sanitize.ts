/**
 * Client-side sanitizers for search/filter inputs.
 * Server ValidationPipe remains the source of truth.
 */

const CITY_MAX = 100;
const CITY_PATTERN = /^[\p{L}\p{N}\s\-'.]*$/u;

export function sanitizeCityInput(raw: string): string {
  const trimmed = (raw ?? "").trim().slice(0, CITY_MAX);
  if (!trimmed) return "";
  if (!CITY_PATTERN.test(trimmed)) {
    return trimmed.replace(/[^\p{L}\p{N}\s\-'.]/gu, "").slice(0, CITY_MAX);
  }
  return trimmed;
}

export function sanitizeGuestCount(raw: string | number, max = 50): number | undefined {
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(Math.floor(n), max);
}

/** YYYY-MM-DD only */
export function sanitizeDateInput(raw: string): string {
  const v = (raw ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}
