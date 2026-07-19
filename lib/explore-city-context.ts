export type ExploreNeighborhood = {
  name: string;
  /** i18n key for short descriptor (Shopping, Beach, …) */
  descriptorKey: string;
};

export type ExploreCityContext = {
  slug: string;
  /** Display city name matching explore API `city` */
  city: string;
  titleKey: string;
  subtitleKey: string;
  /** One-line Morocco identity tagline for map canvas */
  taglineKey: string;
  neighborhoods: ExploreNeighborhood[];
};

export const EXPLORE_CITY_CONTEXTS: ExploreCityContext[] = [
  {
    slug: "casablanca",
    city: "Casablanca",
    titleKey: "explore.cityCasablancaTitle",
    subtitleKey: "explore.cityCasablancaSubtitle",
    taglineKey: "explore.taglineCasablanca",
    neighborhoods: [
      { name: "Maarif", descriptorKey: "explore.descShopping" },
      { name: "Anfa", descriptorKey: "explore.descResidential" },
      { name: "Ain Diab", descriptorKey: "explore.descBeach" },
      { name: "Old Medina", descriptorKey: "explore.descHistoric" },
      { name: "Sidi Maarouf", descriptorKey: "explore.descBusiness" },
      { name: "Gauthier", descriptorKey: "explore.descUrban" },
    ],
  },
  {
    slug: "marrakech",
    city: "Marrakech",
    titleKey: "explore.cityMarrakechTitle",
    subtitleKey: "explore.cityMarrakechSubtitle",
    taglineKey: "explore.taglineMarrakech",
    neighborhoods: [
      { name: "Medina", descriptorKey: "explore.descHistoric" },
      { name: "Gueliz", descriptorKey: "explore.descUrban" },
      { name: "Hivernage", descriptorKey: "explore.descLuxury" },
      { name: "Palmeraie", descriptorKey: "explore.descNature" },
      { name: "Agafay", descriptorKey: "explore.descNature" },
      { name: "Ourika", descriptorKey: "explore.descNature" },
    ],
  },
  {
    slug: "agadir",
    city: "Agadir",
    titleKey: "explore.cityAgadirTitle",
    subtitleKey: "explore.cityAgadirSubtitle",
    taglineKey: "explore.taglineAgadir",
    neighborhoods: [
      { name: "Marina", descriptorKey: "explore.descBeach" },
      { name: "Talborjt", descriptorKey: "explore.descUrban" },
      { name: "Founty", descriptorKey: "explore.descBeach" },
      { name: "Taghazout", descriptorKey: "explore.descBeach" },
    ],
  },
  {
    slug: "tangier",
    city: "Tangier",
    titleKey: "explore.cityTangierTitle",
    subtitleKey: "explore.cityTangierSubtitle",
    taglineKey: "explore.taglineTangier",
    neighborhoods: [
      { name: "Kasbah", descriptorKey: "explore.descHistoric" },
      { name: "Malabata", descriptorKey: "explore.descBeach" },
      { name: "Marshan", descriptorKey: "explore.descResidential" },
      { name: "Iberia", descriptorKey: "explore.descUrban" },
    ],
  },
  {
    slug: "essaouira",
    city: "Essaouira",
    titleKey: "explore.cityEssaouiraTitle",
    subtitleKey: "explore.cityEssaouiraSubtitle",
    taglineKey: "explore.taglineEssaouira",
    neighborhoods: [
      { name: "Medina", descriptorKey: "explore.descHistoric" },
      { name: "Beachfront", descriptorKey: "explore.descBeach" },
      { name: "Diabat", descriptorKey: "explore.descNature" },
    ],
  },
  {
    slug: "fes",
    city: "Fes",
    titleKey: "explore.cityFesTitle",
    subtitleKey: "explore.cityFesSubtitle",
    taglineKey: "explore.taglineFes",
    neighborhoods: [
      { name: "Fes el-Bali", descriptorKey: "explore.descHistoric" },
      { name: "Ville Nouvelle", descriptorKey: "explore.descUrban" },
      { name: "Mellah", descriptorKey: "explore.descHistoric" },
    ],
  },
  {
    slug: "rabat",
    city: "Rabat",
    titleKey: "explore.cityRabatTitle",
    subtitleKey: "explore.cityRabatSubtitle",
    taglineKey: "explore.taglineRabat",
    neighborhoods: [
      { name: "Agdal", descriptorKey: "explore.descUrban" },
      { name: "Hassan", descriptorKey: "explore.descHistoric" },
      { name: "Souissi", descriptorKey: "explore.descResidential" },
      { name: "Medina", descriptorKey: "explore.descHistoric" },
    ],
  },
  {
    slug: "chefchaouen",
    city: "Chefchaouen",
    titleKey: "explore.cityChefchaouenTitle",
    subtitleKey: "explore.cityChefchaouenSubtitle",
    taglineKey: "explore.taglineChefchaouen",
    neighborhoods: [
      { name: "Medina", descriptorKey: "explore.descHistoric" },
      { name: "Ras El Ma", descriptorKey: "explore.descNature" },
    ],
  },
  {
    slug: "tetouan",
    city: "Tetouan",
    titleKey: "explore.cityTetouanTitle",
    subtitleKey: "explore.cityTetouanSubtitle",
    taglineKey: "explore.taglineTetouan",
    neighborhoods: [
      { name: "Medina", descriptorKey: "explore.descHistoric" },
      { name: "Ensanche", descriptorKey: "explore.descUrban" },
    ],
  },
];

export const MOROCCO_CONTEXT = {
  titleKey: "explore.moroccoTitle",
  subtitleKey: "explore.moroccoSubtitle",
  popularCities: [
    "Marrakech",
    "Casablanca",
    "Agadir",
    "Tangier",
    "Essaouira",
    "Fes",
  ],
} as const;

export function getCityContextByCity(city: string): ExploreCityContext | null {
  const c = city.trim().toLowerCase();
  if (!c) return null;
  return (
    EXPLORE_CITY_CONTEXTS.find((x) => x.city.toLowerCase() === c) ??
    EXPLORE_CITY_CONTEXTS.find((x) => x.slug === c) ??
    null
  );
}

export function slugifyNeighborhood(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Match a free-text neighborhood against curated catalog names. */
export function matchCuratedNeighborhood(
  city: string,
  candidate: string,
): ExploreNeighborhood | null {
  const ctx = getCityContextByCity(city);
  if (!ctx || !candidate.trim()) return null;
  const slug = slugifyNeighborhood(candidate);
  return (
    ctx.neighborhoods.find((n) => slugifyNeighborhood(n.name) === slug) ?? null
  );
}

export function viewportAvgPrice(
  listings: { rate_plan?: { base_price?: number | null; currency?: string | null } | null }[],
): { avg: number; currency: string } | null {
  const priced = listings
    .map((l) => Number(l.rate_plan?.base_price))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (priced.length === 0) return null;
  const avg = Math.round(
    priced.reduce((a, b) => a + b, 0) / priced.length,
  );
  const currency =
    listings.find((l) => l.rate_plan?.currency)?.rate_plan?.currency?.toUpperCase() ||
    "MAD";
  return { avg, currency };
}
