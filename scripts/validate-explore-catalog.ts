/**
 * Validate Explore destination catalog integrity.
 * Run: npx --yes tsx scripts/validate-explore-catalog.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  ALL_DESCRIPTOR_IDS,
  CATALOG_VERSION,
  EXPLORE_CITIES,
  normalizePlaceQuery,
  pointInBounds,
  type CityTagId,
  type DescriptorId,
  type MoroccoRegionId,
  type NearbyType,
} from "../lib/explore";

const ROOT = path.join(__dirname, "..");
const LOCALES = ["en", "fr", "ar"] as const;

const CITY_TAGS: CityTagId[] = [
  "economic_capital",
  "historic_imperial",
  "capital_city",
  "europe_africa_gateway",
  "atlantic_coastal_medina",
  "blue_city",
  "atlantic_beach",
  "white_dove",
  "spiritual_cultural",
  "alpine_town",
];

const REGIONS: MoroccoRegionId[] = [
  "casablanca_settat",
  "marrakech_safi",
  "souss_massa",
  "rabat_sale_kenitra",
  "fes_meknes",
  "tanger_tetouan_al_hoceima",
  "oriental",
  "beni_mellal_khenifra",
  "draa_tafilalet",
  "guelmim_oued_noun",
  "laayoune_sakia_el_hamra",
  "dakhla_oued_ed_dahab",
];

const NEARBY_TYPES: NearbyType[] = [
  "DAY_TRIP",
  "BEACH",
  "MOUNTAIN",
  "SURF",
  "VILLAGE",
  "NATURE",
  "DESERT",
];

const errors: string[] = [];
const warnings: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}
function warn(msg: string) {
  warnings.push(msg);
}

function validCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function getNested(obj: unknown, parts: string[]): unknown {
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function loadLocale(lang: string): unknown {
  const p = path.join(ROOT, "lib/i18n/locales", `${lang}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

console.log(`Validating Explore catalog ${CATALOG_VERSION}…`);

const cityIds = new Set<string>();
const citySlugs = new Set<string>();
const globalAliasNorm = new Map<string, string>();

for (const city of EXPLORE_CITIES) {
  if (!city.osmId) fail(`City ${city.id}: missing osmId`);
  if (city.countryCode !== "MA") fail(`City ${city.id}: countryCode must be MA`);
  if (city.timezone !== "Africa/Casablanca") {
    fail(`City ${city.id}: unexpected timezone`);
  }
  if (!CITY_TAGS.includes(city.tag)) fail(`City ${city.id}: invalid tag ${city.tag}`);
  if (!REGIONS.includes(city.region)) fail(`City ${city.id}: invalid region ${city.region}`);
  if (!(city.priority > 0)) fail(`City ${city.id}: priority must be > 0`);
  if (!(city.searchWeight > 0)) fail(`City ${city.id}: searchWeight must be > 0`);
  if (!validCoord(city.mapCenter.lat, city.mapCenter.lng)) {
    fail(`City ${city.id}: invalid mapCenter`);
  }
  if (
    city.bounds.southwest.lat >= city.bounds.northeast.lat ||
    city.bounds.southwest.lng >= city.bounds.northeast.lng
  ) {
    fail(`City ${city.id}: invalid bounds`);
  }

  if (cityIds.has(city.id)) fail(`Duplicate city id: ${city.id}`);
  cityIds.add(city.id);
  if (citySlugs.has(city.slug)) fail(`Duplicate city slug: ${city.slug}`);
  citySlugs.add(city.slug);

  for (const alias of [city.city, ...city.aliases]) {
    const n = normalizePlaceQuery(alias);
    if (!n) continue;
    const prev = globalAliasNorm.get(n);
    if (prev && prev !== city.id) {
      fail(`Ambiguous city alias "${alias}" → ${prev} and ${city.id}`);
    }
    globalAliasNorm.set(n, city.id);
  }

  const hoodIds = new Set<string>();
  const hoodSlugs = new Set<string>();
  const hoodAliasOwner = new Map<string, string>();

  for (const n of city.neighborhoods) {
    if (!n.id || !n.slug || !n.name) fail(`City ${city.id}: neighborhood missing id/slug/name`);
    if (hoodIds.has(n.id)) fail(`City ${city.id}: duplicate neighborhood id ${n.id}`);
    hoodIds.add(n.id);
    if (hoodSlugs.has(n.slug)) fail(`City ${city.id}: duplicate neighborhood slug ${n.slug}`);
    hoodSlugs.add(n.slug);
    if (!ALL_DESCRIPTOR_IDS.includes(n.descriptor as DescriptorId)) {
      fail(`City ${city.id}/${n.id}: invalid descriptor ${n.descriptor}`);
    }
    if (!validCoord(n.lat, n.lng)) fail(`City ${city.id}/${n.id}: invalid coords`);
    if (n.featuredOrder != null && !(n.featuredOrder > 0)) {
      fail(`City ${city.id}/${n.id}: featuredOrder must be > 0`);
    }
    if (!pointInBounds(n.lat, n.lng, city.bounds)) {
      fail(`City ${city.id}/${n.id}: coordinates outside city bounds`);
    }
    if (!n.osmId) warn(`City ${city.id}/${n.id}: missing osmId`);

    for (const alias of [n.name, ...n.aliases]) {
      const an = normalizePlaceQuery(alias);
      if (!an) continue;
      const owner = hoodAliasOwner.get(an);
      if (owner && owner !== n.id) {
        fail(
          `City ${city.id}: alias "${alias}" claimed by both ${owner} and ${n.id}`,
        );
      }
      hoodAliasOwner.set(an, n.id);
    }
  }

  const nearIds = new Set<string>();
  const nearSlugs = new Set<string>();
  for (const d of city.nearbyDestinations) {
    if (nearIds.has(d.id)) fail(`City ${city.id}: duplicate nearby id ${d.id}`);
    nearIds.add(d.id);
    if (nearSlugs.has(d.slug)) fail(`City ${city.id}: duplicate nearby slug ${d.slug}`);
    nearSlugs.add(d.slug);
    if (!NEARBY_TYPES.includes(d.type)) {
      fail(`City ${city.id}/${d.id}: invalid nearby type ${d.type}`);
    }
    if (!ALL_DESCRIPTOR_IDS.includes(d.descriptor as DescriptorId)) {
      fail(`City ${city.id}/${d.id}: invalid nearby descriptor`);
    }
    if (!validCoord(d.lat, d.lng)) fail(`City ${city.id}/${d.id}: invalid nearby coords`);
  }
}

for (const lang of LOCALES) {
  const locale = loadLocale(lang);
  for (const city of EXPLORE_CITIES) {
    const title = getNested(locale, ["explore", "cities", city.slug, "title"]);
    const subtitle = getNested(locale, ["explore", "cities", city.slug, "subtitle"]);
    if (typeof title !== "string" || !title) {
      fail(`Missing i18n ${lang} explore.cities.${city.slug}.title`);
    }
    if (typeof subtitle !== "string" || !subtitle) {
      fail(`Missing i18n ${lang} explore.cities.${city.slug}.subtitle`);
    }
    const tag = getNested(locale, ["explore", "cityTags", city.tag]);
    if (typeof tag !== "string" || !tag) {
      fail(`Missing i18n ${lang} explore.cityTags.${city.tag}`);
    }
    const region = getNested(locale, ["explore", "regions", city.region]);
    if (typeof region !== "string" || !region) {
      fail(`Missing i18n ${lang} explore.regions.${city.region}`);
    }
  }
  for (const id of ALL_DESCRIPTOR_IDS) {
    const d = getNested(locale, ["explore", "descriptors", id]);
    if (typeof d !== "string" || !d) {
      fail(`Missing i18n ${lang} explore.descriptors.${id}`);
    }
  }
}

for (const w of warnings) console.warn(`WARN: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`OK — ${EXPLORE_CITIES.length} cities, catalog ${CATALOG_VERSION}`);
