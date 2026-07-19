export type DestinationKind = "city" | "tourist_destination" | "landmark";

export type DestinationCategory =
  | "city"
  | "beach"
  | "surf"
  | "mountain"
  | "desert"
  | "medina"
  | "nature"
  | "lake"
  | "ski"
  | "historic"
  | "island";

export type DestinationEntry = {
  id: string;
  slug: string;
  kind: DestinationKind;
  label: string;
  aliases: string[];
  categories: DestinationCategory[];
  popularity: number;
  searchWeight: number;
  /** City string sent to listings search API */
  resolveCity: string;
  /** Parent city for hierarchy / SEO (Level 2–3) */
  parentCity?: string;
  /** i18n key under searchBar.destSubtitles.* */
  subtitleKey?: string;
  osmId?: string;
  wikidataId?: string;
};
