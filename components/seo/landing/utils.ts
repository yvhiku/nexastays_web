export function formatStarRating(value?: number): string {
  if (value == null || value <= 0) return "";
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function formatLastmod(iso: string, locale: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return locale === "fr" ? "Aujourd'hui" : locale === "ar" ? "اليوم" : "Today";
    if (diffDays === 1) return locale === "fr" ? "Hier" : locale === "ar" ? "أمس" : "Yesterday";
    return date.toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function areaLabel(page: {
  neighborhood?: { name: string } | null;
  filterLabel?: string | null;
  destination?: { name: string } | null;
  h1: string;
}): string {
  return page.neighborhood?.name ?? page.filterLabel ?? page.destination?.name ?? page.h1;
}
