import { MOROCCO_CITIES } from "@/lib/moroccan-cities";

export type SearchDestination = {
  id: string;
  label: string;
  /** i18n key under searchBar.destSubtitles.* or plain fallback */
  subtitleKey: string;
  /** Explore API city */
  resolveCity: string;
  popular?: boolean;
};

const ALIASES: SearchDestination[] = [
  {
    id: "medina-marrakech",
    label: "Medina",
    subtitleKey: "medina",
    resolveCity: "Marrakech",
  },
  {
    id: "agafay",
    label: "Agafay",
    subtitleKey: "desert",
    resolveCity: "Marrakech",
  },
  {
    id: "ourika",
    label: "Ourika",
    subtitleKey: "valley",
    resolveCity: "Marrakech",
  },
  {
    id: "merzouga",
    label: "Merzouga",
    subtitleKey: "sahara",
    resolveCity: "Errachidia",
  },
];

const POPULAR_ORDER = [
  "Marrakech",
  "Agadir",
  "Tangier",
  "Essaouira",
  "Casablanca",
  "Chefchaouen",
] as const;

const POPULAR_SUBTITLE: Record<string, string> = {
  Marrakech: "mostBooked",
  Agadir: "beach",
  Tangier: "north",
  Essaouira: "atlantic",
  Casablanca: "city",
  Chefchaouen: "blueCity",
};

function cityId(city: string): string {
  return `city-${city.toLowerCase().replace(/\s+/g, "-")}`;
}

const CITY_DESTINATIONS: SearchDestination[] = MOROCCO_CITIES.map((city) => ({
  id: cityId(city),
  label: city,
  subtitleKey: POPULAR_SUBTITLE[city] ?? "city",
  resolveCity: city,
  popular: (POPULAR_ORDER as readonly string[]).includes(city),
}));

export const SEARCH_DESTINATIONS: SearchDestination[] = [
  ...CITY_DESTINATIONS,
  ...ALIASES,
];

export const POPULAR_DESTINATIONS: SearchDestination[] = POPULAR_ORDER.map(
  (city) => CITY_DESTINATIONS.find((d) => d.resolveCity === city)!,
).filter(Boolean);

export function findDestinationById(id: string | null | undefined): SearchDestination | undefined {
  if (!id) return undefined;
  return SEARCH_DESTINATIONS.find((d) => d.id === id);
}

export function findDestinationByCity(city: string): SearchDestination | undefined {
  const c = city.trim();
  if (!c) return undefined;
  return (
    SEARCH_DESTINATIONS.find(
      (d) => d.resolveCity.toLowerCase() === c.toLowerCase() && d.id.startsWith("city-"),
    ) ?? SEARCH_DESTINATIONS.find((d) => d.label.toLowerCase() === c.toLowerCase())
  );
}

export function filterDestinations(query: string): SearchDestination[] {
  const q = query.trim().toLowerCase();
  if (!q) return SEARCH_DESTINATIONS;
  return SEARCH_DESTINATIONS.filter(
    (d) =>
      d.label.toLowerCase().includes(q) ||
      d.resolveCity.toLowerCase().includes(q),
  );
}
