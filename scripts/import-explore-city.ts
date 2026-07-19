/**
 * Scaffold a draft Explore city module from Nominatim (+ optional Overpass).
 *
 * Usage:
 *   npx --yes tsx scripts/import-explore-city.ts "Casablanca"
 *
 * Output is printed to stdout for manual review. Editorial fields
 * (descriptor, featuredOrder, searchWeight, tag, region) must be filled by hand.
 *
 * Geographic facts only — OSM is the source of truth. Google Maps is not queried.
 */
const USER_AGENT = "NexaStaysExploreCatalog/1.0 (join.nexastays.ma; import-script)";

type NominatimResult = {
  name?: string;
  lat: string;
  lon: string;
  osm_type: string;
  osm_id: number;
  boundingbox?: string[];
  extratags?: { wikidata?: string };
  display_name?: string;
};

function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function nominatimSearch(q: string): Promise<NominatimResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as NominatimResult[];
  return data[0] ?? null;
}

async function main() {
  const cityName = process.argv[2];
  if (!cityName) {
    console.error('Usage: npx tsx scripts/import-explore-city.ts "CityName"');
    process.exit(1);
  }

  console.error(`Looking up ${cityName}, Morocco via Nominatim…`);
  const hit = await nominatimSearch(`${cityName}, Morocco`);
  if (!hit) {
    console.error("No Nominatim result");
    process.exit(1);
  }

  const [south, north, west, east] = (hit.boundingbox || []).map(Number);
  const slug = toSlug(cityName);
  const osmId = `${hit.osm_type}/${hit.osm_id}`;

  const draft = {
    id: slug,
    slug,
    city: cityName,
    countryCode: "MA",
    region: "TODO_MoroccoRegionId",
    aliases: [cityName],
    tag: "TODO_CityTagId",
    timezone: "Africa/Casablanca",
    mapCenter: { lat: Number(hit.lat), lng: Number(hit.lon) },
    defaultZoom: 12,
    bounds: {
      southwest: { lat: south, lng: west },
      northeast: { lat: north, lng: east },
    },
    priority: 100,
    searchWeight: 50,
    osmId,
    wikidataId: hit.extratags?.wikidata,
    neighborhoods: [] as unknown[],
    nearbyDestinations: [] as unknown[],
  };

  console.log(`// Draft from Nominatim — review before commit`);
  console.log(`// display: ${hit.display_name}`);
  console.log(`// Next: Overpass neighborhoods inside ${osmId}, then assign descriptors.`);
  console.log(`export const ${slug.replace(/-/g, "_")} = ${JSON.stringify(draft, null, 2)} as const;`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
