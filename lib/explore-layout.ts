export type ExploreLayout = "list" | "map" | "split";

export type ExploreViewport = "mobile" | "desktop";

export function parseExploreLayout(raw: string | null): ExploreLayout {
  if (raw === "map" || raw === "split" || raw === "list") return raw;
  return "list";
}

/** Desktop defaults to split (list + map). Mobile uses list unless layout=map. */
export function resolveExploreLayout(
  rawLayout: string | null,
  viewport: ExploreViewport,
): ExploreLayout {
  const parsed = parseExploreLayout(rawLayout);
  if (viewport === "mobile") {
    return parsed === "split" ? "list" : parsed;
  }
  if (parsed === "map") return "map";
  if (rawLayout === "list") return "list";
  return "split";
}

export function showsExploreMap(layout: ExploreLayout): boolean {
  return layout === "map" || layout === "split";
}
