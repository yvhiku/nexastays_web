export type ExploreCityContext = {
  slug: string;
  /** Display city name matching explore API `city` */
  city: string;
  titleKey: string;
  subtitleKey: string;
  neighborhoods: string[];
};

export const EXPLORE_CITY_CONTEXTS: ExploreCityContext[] = [
  {
    slug: "casablanca",
    city: "Casablanca",
    titleKey: "explore.cityCasablancaTitle",
    subtitleKey: "explore.cityCasablancaSubtitle",
    neighborhoods: [
      "Maarif",
      "Anfa",
      "Ain Diab",
      "Old Medina",
      "Sidi Maarouf",
      "Gauthier",
    ],
  },
  {
    slug: "marrakech",
    city: "Marrakech",
    titleKey: "explore.cityMarrakechTitle",
    subtitleKey: "explore.cityMarrakechSubtitle",
    neighborhoods: [
      "Medina",
      "Gueliz",
      "Hivernage",
      "Palmeraie",
      "Agafay",
      "Ourika",
    ],
  },
  {
    slug: "agadir",
    city: "Agadir",
    titleKey: "explore.cityAgadirTitle",
    subtitleKey: "explore.cityAgadirSubtitle",
    neighborhoods: ["Marina", "Talborjt", "Founty", "Taghazout"],
  },
  {
    slug: "tangier",
    city: "Tangier",
    titleKey: "explore.cityTangierTitle",
    subtitleKey: "explore.cityTangierSubtitle",
    neighborhoods: ["Kasbah", "Malabata", "Marshan", "Iberia"],
  },
  {
    slug: "essaouira",
    city: "Essaouira",
    titleKey: "explore.cityEssaouiraTitle",
    subtitleKey: "explore.cityEssaouiraSubtitle",
    neighborhoods: ["Medina", "Beachfront", "Diabat"],
  },
  {
    slug: "fes",
    city: "Fes",
    titleKey: "explore.cityFesTitle",
    subtitleKey: "explore.cityFesSubtitle",
    neighborhoods: ["Fes el-Bali", "Ville Nouvelle", "Mellah"],
  },
  {
    slug: "rabat",
    city: "Rabat",
    titleKey: "explore.cityRabatTitle",
    subtitleKey: "explore.cityRabatSubtitle",
    neighborhoods: ["Agdal", "Hassan", "Souissi", "Medina"],
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
