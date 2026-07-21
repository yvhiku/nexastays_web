/** Static SEO catalog mirrors backend seo-catalog.ts for SSG params. */

export const SEO_NEIGHBORHOODS_BY_CITY: Record<string, { slug: string; name: string }[]> = {
  marrakech: [
    { slug: "medina", name: "Medina" },
    { slug: "gueliz", name: "Gueliz" },
    { slug: "hivernage", name: "Hivernage" },
    { slug: "palmeraie", name: "Palmeraie" },
  ],
  casablanca: [
    { slug: "maarif", name: "Maarif" },
    { slug: "ain-diab", name: "Ain Diab" },
    { slug: "habous", name: "Habous" },
    { slug: "anfa", name: "Anfa" },
    { slug: "sidi-maarouf", name: "Sidi Maarouf" },
    { slug: "gauthier", name: "Gauthier" },
  ],
  agadir: [
    { slug: "marina", name: "Marina" },
    { slug: "founty", name: "Founty" },
    { slug: "talborjt", name: "Talborjt" },
    { slug: "sonaba", name: "Sonaba" },
  ],
  rabat: [
    { slug: "agdal", name: "Agdal" },
    { slug: "souissi", name: "Souissi" },
    { slug: "hassan", name: "Hassan" },
    { slug: "medina", name: "Medina" },
  ],
  fes: [
    { slug: "fes-el-bali", name: "Fes el-Bali" },
    { slug: "ville-nouvelle", name: "Ville Nouvelle" },
    { slug: "mellah", name: "Mellah" },
  ],
  tangier: [
    { slug: "kasbah", name: "Kasbah" },
    { slug: "malabata", name: "Malabata" },
    { slug: "marshan", name: "Marshan" },
    { slug: "iberia", name: "Iberia" },
  ],
  essaouira: [
    { slug: "medina", name: "Medina" },
    { slug: "diabat", name: "Diabat" },
  ],
  chefchaouen: [
    { slug: "medina", name: "Medina" },
    { slug: "ras-el-ma", name: "Ras El Ma" },
  ],
  tetouan: [
    { slug: "medina", name: "Medina" },
    { slug: "ensanche", name: "Ensanche" },
  ],
  ifrane: [{ slug: "centre-ville", name: "Centre-ville" }],
};

export const SEO_LANDMARK_URL_SLUGS = [
  "near-jemaa-el-fnaa",
  "near-koutoubia",
  "near-bahia-palace",
  "near-hassan-ii-mosque",
  "near-mohammed-v-square",
  "near-hassan-tower",
  "near-kasbah-oudayas",
  "near-chouara-tannery",
  "near-bab-bou-jeloud",
  "near-tangier-medina",
  "near-essaouira-ramparts",
  "near-chefchaouen-medina",
  "near-agadir-beach",
] as const;
