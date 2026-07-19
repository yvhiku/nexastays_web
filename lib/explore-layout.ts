export type ExploreLayout = "list" | "map" | "split";

export function parseExploreLayout(raw: string | null): ExploreLayout {
  if (raw === "map" || raw === "split") return raw;
  return "list";
}
