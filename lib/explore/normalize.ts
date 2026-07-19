/** Accent-fold and tokenize place names for catalog matching. */
export function normalizePlaceQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable URL slug from a display name (ASCII-focused). */
export function toPlaceSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function queriesMatch(a: string, b: string): boolean {
  const na = normalizePlaceQuery(a);
  const nb = normalizePlaceQuery(b);
  if (!na || !nb) return false;
  return na === nb;
}
