import type {
  GeoBlockDto,
  SeoGuidePagePayload,
  SeoLocale,
  SeoPagePayload,
  SeoPageType,
} from "@/lib/seo/types";
import { SEO_AMENITY_SLUGS, SEO_PROPERTY_TYPE_SLUGS } from "@/lib/seo/types";

type LocaleText = Record<SeoLocale, string>;

const HOME: LocaleText = { en: "Home", fr: "Accueil", ar: "الرئيسية" };
const STAYS: LocaleText = { en: "Stays", fr: "Séjours", ar: "الإقامات" };
const MOROCCO: LocaleText = { en: "Morocco", fr: "Maroc", ar: "المغرب" };
const BRAND = "Nexa Stays";

const PROPERTY_PLURAL: Record<string, LocaleText> = {
  apartments: {
    en: "Apartments",
    fr: "Appartements",
    ar: "شقق",
  },
  hotels: { en: "Hotels", fr: "Hôtels", ar: "فنادق" },
  riads: { en: "Riads", fr: "Riads", ar: "رياض" },
  villas: { en: "Villas", fr: "Villas", ar: "فيلات" },
  hostels: { en: "Hostels", fr: "Auberges", ar: "نُزل" },
};

const PROPERTY_PLURAL_LOWER: Record<string, LocaleText> = {
  apartments: {
    en: "apartments",
    fr: "appartements",
    ar: "شقق",
  },
  hotels: { en: "hotels", fr: "hôtels", ar: "فنادق" },
  riads: { en: "riads", fr: "riads", ar: "رياض" },
  villas: { en: "villas", fr: "villas", ar: "فيلات" },
  hostels: { en: "hostels", fr: "auberges", ar: "نُزل" },
};

const AMENITY_LABEL: Record<string, LocaleText> = {
  pool: { en: "Pool", fr: "Piscine", ar: "مسبح" },
  "pet-friendly": {
    en: "Pet-friendly",
    fr: "Animaux acceptés",
    ar: "حيوانات أليفة مسموحة",
  },
  "free-parking": {
    en: "Free parking",
    fr: "Parking gratuit",
    ar: "موقف مجاني",
  },
  wifi: { en: "WiFi", fr: "Wi-Fi", ar: "واي فاي" },
  family: {
    en: "Family-friendly",
    fr: "Adapté aux familles",
    ar: "مناسب للعائلات",
  },
  luxury: { en: "Luxury", fr: "Luxe", ar: "فاخر" },
};

const AMENITY_LABEL_LOWER: Record<string, LocaleText> = {
  pool: { en: "pool", fr: "piscine", ar: "مسبح" },
  "pet-friendly": {
    en: "pet-friendly",
    fr: "animaux acceptés",
    ar: "حيوانات أليفة مسموحة",
  },
  "free-parking": {
    en: "free parking",
    fr: "parking gratuit",
    ar: "موقف مجاني",
  },
  wifi: { en: "WiFi", fr: "Wi-Fi", ar: "واي فاي" },
  family: {
    en: "family-friendly",
    fr: "adapté aux familles",
    ar: "مناسب للعائلات",
  },
  luxury: { en: "luxury", fr: "luxe", ar: "فاخر" },
};

function pick(map: LocaleText, locale: SeoLocale): string {
  return map[locale];
}

function propertySlugFromPage(page: SeoPagePayload): string | null {
  for (const slug of SEO_PROPERTY_TYPE_SLUGS) {
    if (page.registrySlug === slug || page.registrySlug.endsWith(`/${slug}`)) {
      return slug;
    }
    if (page.path.endsWith(`/${slug}`)) return slug;
  }
  // city_property_type registry often "casablanca/apartments"
  const parts = page.registrySlug.split("/");
  const last = parts[parts.length - 1];
  if ((SEO_PROPERTY_TYPE_SLUGS as readonly string[]).includes(last)) return last;
  return null;
}

function amenitySlugFromPage(page: SeoPagePayload): string | null {
  for (const slug of SEO_AMENITY_SLUGS) {
    if (page.registrySlug === slug || page.registrySlug.endsWith(`/${slug}`)) {
      return slug;
    }
    if (page.path.endsWith(`/${slug}`)) return slug;
  }
  const parts = page.registrySlug.split("/");
  const last = parts[parts.length - 1];
  if ((SEO_AMENITY_SLUGS as readonly string[]).includes(last)) return last;
  return null;
}

function cityName(page: SeoPagePayload): string {
  return page.destination?.name ?? MOROCCO[page.locale];
}

function buildCopy(page: SeoPagePayload): {
  title: string;
  description: string;
  h1: string;
  filterLabel: string | null;
} {
  const locale = page.locale;
  const city = cityName(page);
  const morocco = pick(MOROCCO, locale);
  const typeSlug = propertySlugFromPage(page);
  const amenitySlug = amenitySlugFromPage(page);
  const typePlural = typeSlug ? pick(PROPERTY_PLURAL[typeSlug]!, locale) : null;
  const typeLower = typeSlug
    ? pick(PROPERTY_PLURAL_LOWER[typeSlug]!, locale)
    : null;
  const amenity = amenitySlug ? pick(AMENITY_LABEL[amenitySlug]!, locale) : null;
  const amenityLower = amenitySlug
    ? pick(AMENITY_LABEL_LOWER[amenitySlug]!, locale)
    : null;

  const priceSuffix =
    page.intelligence.avgNightlyPrice != null
      ? locale === "fr"
        ? ` À partir de ${page.intelligence.avgNightlyPrice} ${page.intelligence.currency}/nuit.`
        : locale === "ar"
          ? ` ابتداءً من ${page.intelligence.avgNightlyPrice} ${page.intelligence.currency}/ليلة.`
          : ` From ${page.intelligence.avgNightlyPrice} ${page.intelligence.currency}/night.`
      : "";

  const pageType: SeoPageType = page.pageType;

  if (pageType === "city") {
    const h1 =
      locale === "fr"
        ? `Séjours à ${city}`
        : locale === "ar"
          ? `إقامات في ${city}`
          : `Stays in ${city}`;
    const title =
      locale === "fr"
        ? `Séjours à ${city} | Hôtels, riads et appartements | ${BRAND}`
        : locale === "ar"
          ? `إقامات في ${city} | فنادق ورياض وشقق | ${BRAND}`
          : `Stays in ${city} | Hotels, Riads & Apartments | ${BRAND}`;
    const description =
      locale === "fr"
        ? `Découvrez hôtels, riads, appartements et villas à ${city}. Comparez des annonces vérifiées et réservez en toute sécurité avec ${BRAND}.`
        : locale === "ar"
          ? `اكتشف الفنادق والرياض والشقق والفيلات في ${city}. قارن الإعلانات الموثقة واحجز بأمان مع ${BRAND}.`
          : `Discover hotels, riads, apartments and villas in ${city}. Compare verified listings and book securely with ${BRAND}.`;
    return { title, description: description + priceSuffix, h1, filterLabel: null };
  }

  if (pageType === "property_type" && typePlural && typeLower) {
    const h1 =
      locale === "fr"
        ? `${typePlural} au ${morocco}`
        : locale === "ar"
          ? `${typePlural} في ${morocco}`
          : `${typePlural} in ${morocco}`;
    const title = `${h1} | ${BRAND}`;
    const description =
      locale === "fr"
        ? `Parcourez des ${typeLower} vérifiés à travers le ${morocco}. Frais transparents et hôtes vérifiés sur ${BRAND}.`
        : locale === "ar"
          ? `تصفح ${typeLower} موثقة في أنحاء ${morocco}. رسوم واضحة ومضيفون موثوقون على ${BRAND}.`
          : `Browse verified ${typeLower} across ${morocco}. Transparent fees and identity-checked hosts on ${BRAND}.`;
    return {
      title,
      description: description + priceSuffix,
      h1,
      filterLabel: typePlural,
    };
  }

  if (pageType === "amenity" && amenity && amenityLower) {
    const h1 =
      locale === "fr"
        ? `Séjours ${amenityLower} au ${morocco}`
        : locale === "ar"
          ? `إقامات ${amenityLower} في ${morocco}`
          : `${amenity} stays in ${morocco}`;
    const title =
      locale === "fr"
        ? `Séjours ${amenityLower} au ${morocco} | ${BRAND}`
        : locale === "ar"
          ? `إقامات ${amenityLower} في ${morocco} | ${BRAND}`
          : `${amenity} Stays in ${morocco} | ${BRAND}`;
    const description =
      locale === "fr"
        ? `Trouvez des séjours ${amenityLower} à travers le ${morocco} sur ${BRAND}. Annonces vérifiées et tarifs clairs.`
        : locale === "ar"
          ? `اعثر على إقامات ${amenityLower} في أنحاء ${morocco} على ${BRAND}. إعلانات موثقة وأسعار واضحة.`
          : `Find ${amenityLower} stays across ${morocco} on ${BRAND}. Verified listings with clear pricing.`;
    return {
      title,
      description: description + priceSuffix,
      h1,
      filterLabel: amenity,
    };
  }

  if (pageType === "city_property_type" && typePlural && typeLower) {
    const h1 =
      locale === "fr"
        ? `${typePlural} à ${city}`
        : locale === "ar"
          ? `${typePlural} في ${city}`
          : `${typePlural} in ${city}`;
    const title = `${h1} | ${BRAND}`;
    const description =
      locale === "fr"
        ? `Parcourez des ${typeLower} à ${city}. Annonces vérifiées sur ${BRAND}.`
        : locale === "ar"
          ? `تصفح ${typeLower} في ${city}. إعلانات موثقة على ${BRAND}.`
          : `Browse ${typeLower} in ${city}. Verified listings on ${BRAND}.`;
    return {
      title,
      description: description + priceSuffix,
      h1,
      filterLabel: typePlural,
    };
  }

  if (pageType === "city_amenity" && amenity && amenityLower) {
    const h1 =
      locale === "fr"
        ? `Séjours ${amenityLower} à ${city}`
        : locale === "ar"
          ? `إقامات ${amenityLower} في ${city}`
          : `${amenity} stays in ${city}`;
    const title =
      locale === "fr"
        ? `Séjours ${amenityLower} à ${city} | ${BRAND}`
        : locale === "ar"
          ? `إقامات ${amenityLower} في ${city} | ${BRAND}`
          : `${amenity} Stays in ${city} | ${BRAND}`;
    const description =
      locale === "fr"
        ? `Trouvez des séjours ${amenityLower} à ${city} sur ${BRAND}.`
        : locale === "ar"
          ? `اعثر على إقامات ${amenityLower} في ${city} على ${BRAND}.`
          : `Find ${amenityLower} stays in ${city} on ${BRAND}.`;
    return {
      title,
      description: description + priceSuffix,
      h1,
      filterLabel: amenity,
    };
  }

  if (pageType === "city_neighborhood" && page.neighborhood) {
    const nb = page.neighborhood.name;
    const h1 =
      locale === "fr"
        ? `Séjours à ${nb}, ${city}`
        : locale === "ar"
          ? `إقامات في ${nb}، ${city}`
          : `Stays in ${nb}, ${city}`;
    const title = `${h1} | ${BRAND}`;
    const description =
      locale === "fr"
        ? `Parcourez des séjours vérifiés à ${nb}, ${city}. Comparez les prix et réservez en sécurité sur ${BRAND}.`
        : locale === "ar"
          ? `تصفح إقامات موثقة في ${nb}، ${city}. قارن الأسعار واحجز بأمان على ${BRAND}.`
          : `Browse verified stays in ${nb}, ${city}. Compare prices and book securely on ${BRAND}.`;
    return { title, description: description + priceSuffix, h1, filterLabel: null };
  }

  if (pageType === "landmark" && page.landmark) {
    const lm = page.landmark.name;
    const h1 =
      locale === "fr"
        ? `Séjours près de ${lm}`
        : locale === "ar"
          ? `إقامات قرب ${lm}`
          : `Stays near ${lm}`;
    const title = `${h1} | ${BRAND}`;
    const description =
      locale === "fr"
        ? `Trouvez des séjours vérifiés près de ${lm} à ${page.landmark.searchCity}. Réservez avec des tarifs transparents sur ${BRAND}.`
        : locale === "ar"
          ? `اعثر على إقامات موثقة قرب ${lm} في ${page.landmark.searchCity}. احجز بأسعار واضحة على ${BRAND}.`
          : `Find verified stays near ${lm} in ${page.landmark.searchCity}. Book with transparent pricing on ${BRAND}.`;
    return { title, description: description + priceSuffix, h1, filterLabel: null };
  }

  // Unknown page type — still localize chrome via breadcrumbs only; keep body fields.
  return {
    title: page.title,
    description: page.description,
    h1: page.h1,
    filterLabel: page.filterLabel,
  };
}

function buildGeoBlocks(
  locale: SeoLocale,
  h1: string,
  page: SeoPagePayload,
): GeoBlockDto[] {
  const intel = page.intelligence;
  const dest = page.destination;
  const landmark = page.landmark;
  const blocks: GeoBlockDto[] = [];

  if (intel.avgNightlyPrice != null) {
    blocks.push({
      question:
        locale === "fr"
          ? `Prix moyen pour ${h1} ?`
          : locale === "ar"
            ? `ما متوسط السعر لـ ${h1}؟`
            : `Average price for ${h1}?`,
      answer:
        locale === "fr"
          ? `Environ ${intel.avgNightlyPrice} ${intel.currency}/nuit selon les annonces live Nexa Stays.`
          : locale === "ar"
            ? `حوالي ${intel.avgNightlyPrice} ${intel.currency}/ليلة بناءً على إعلانات Nexa Stays المباشرة.`
            : `Around ${intel.avgNightlyPrice} ${intel.currency}/night based on live Nexa Stays listings.`,
      statKey: "avgNightlyPrice",
    });
  }
  if (intel.listingCount > 0) {
    blocks.push({
      question:
        locale === "fr"
          ? `Combien d'annonces correspondent à ${h1} ?`
          : locale === "ar"
            ? `كم عدد الإعلانات المطابقة لـ ${h1}؟`
            : `How many listings match ${h1}?`,
      answer:
        locale === "fr"
          ? `${intel.listingCount} annonces live (${intel.verifiedCount} avec visite virtuelle vérifiée).`
          : locale === "ar"
            ? `${intel.listingCount} إعلان مباشر (${intel.verifiedCount} بجولة موثقة).`
            : `${intel.listingCount} live listings (${intel.verifiedCount} with verified walkthrough).`,
      statKey: "listingCount",
    });
  }
  if (dest) {
    blocks.push({
      question:
        locale === "fr"
          ? `${dest.name} est-elle sûre pour les touristes ?`
          : locale === "ar"
            ? `هل ${dest.name} آمنة للسياح؟`
            : `Is ${dest.name} safe for tourists?`,
      answer:
        locale === "fr"
          ? `Oui. Les quartiers touristiques populaires de ${dest.name} sont généralement sûrs avec des séjours vérifiés.`
          : locale === "ar"
            ? `نعم. أحياء ${dest.name} السياحية الشائعة آمنة عمومًا عند اختيار إقامات موثقة.`
            : `Yes. Popular tourist districts in ${dest.name} are generally safe when using verified stays.`,
    });
    if (dest.bestTimeToVisit) {
      blocks.push({
        question:
          locale === "fr"
            ? `Meilleure période pour visiter ${dest.name} ?`
            : locale === "ar"
              ? `أفضل وقت لزيارة ${dest.name}؟`
              : `Best time to visit ${dest.name}?`,
        answer: dest.bestTimeToVisit,
      });
    }
  }
  if (landmark) {
    blocks.push({
      question:
        locale === "fr"
          ? `À quelle distance des séjours de ${landmark.name} ?`
          : locale === "ar"
            ? `ما مدى قرب الإقامات من ${landmark.name}؟`
            : `How close are stays to ${landmark.name}?`,
      answer:
        locale === "fr"
          ? `Les annonces affichées sont à environ ${landmark.radiusKm} km de ${landmark.name} à ${landmark.searchCity}.`
          : locale === "ar"
            ? `الإعلانات المعروضة ضمن حوالي ${landmark.radiusKm} كم من ${landmark.name} في ${landmark.searchCity}.`
            : `Listings shown are within about ${landmark.radiusKm} km of ${landmark.name} in ${landmark.searchCity}.`,
    });
  }
  return blocks;
}

/**
 * FR/AR neighborhood pages ship English editorial contentBlocks from seed clones.
 * Prefer noindex over partly-English indexable pages.
 */
export function shouldNoindexUntranslatedNeighborhood(
  page: SeoPagePayload,
): boolean {
  if (page.locale === "en") return false;
  if (page.pageType !== "city_neighborhood") return false;
  const blocks = page.contentBlocks;
  if (!blocks) return false;
  // Any editorial body present ⇒ English clone risk for non-EN locales.
  return Boolean(
    blocks.hero_intro ||
      blocks.why_stay_here ||
      (blocks.highlights && blocks.highlights.length > 0) ||
      (blocks.faq && blocks.faq.length > 0),
  );
}

/**
 * Web-owned locale SEO copy overlay. Regenerates template fields from structured
 * page data — does not silently fall back to English for fr/ar template surfaces.
 */
export function localizeSeoPagePayload(page: SeoPagePayload): SeoPagePayload {
  const locale = page.locale;
  const copy = buildCopy(page);
  const geoBlocks = buildGeoBlocks(locale, copy.h1, page);
  // Drop English editorial FAQ on non-EN; keep localized dynamic geo blocks only.
  const editorialFaq =
    locale === "en" ? (page.contentBlocks?.faq ?? []).map((f) => ({ ...f })) : [];
  const faq = [...editorialFaq, ...geoBlocks];

  const breadcrumbs = page.breadcrumbs.map((crumb, index) => {
    if (index === 0 && /^(Home|Accueil|الرئيسية)$/i.test(crumb.name)) {
      return { ...crumb, name: pick(HOME, locale) };
    }
    if (index === 1 && /^(Stays|Séjours|الإقامات)$/i.test(crumb.name)) {
      return { ...crumb, name: pick(STAYS, locale) };
    }
    return crumb;
  });
  // Ensure first two chrome crumbs when present
  if (breadcrumbs.length >= 1) {
    breadcrumbs[0] = { ...breadcrumbs[0]!, name: pick(HOME, locale) };
  }
  if (breadcrumbs.length >= 2) {
    breadcrumbs[1] = { ...breadcrumbs[1]!, name: pick(STAYS, locale) };
  }

  const propertyTypeLinks = page.propertyTypeLinks.map((link) => {
    const slug = link.slug;
    const labelMap = PROPERTY_PLURAL[slug];
    if (!labelMap || !page.destination) return link;
    const plural = pick(labelMap, locale);
    const city = page.destination.name;
    const label =
      locale === "fr"
        ? `${plural} à ${city}`
        : locale === "ar"
          ? `${plural} في ${city}`
          : `${plural} in ${city}`;
    return { ...link, label };
  });

  const amenityLinks = page.amenityLinks.map((link) => {
    const labelMap = AMENITY_LABEL[link.slug];
    if (!labelMap || !page.destination) return link;
    const amenity = pick(labelMap, locale);
    const city = page.destination.name;
    const label =
      locale === "fr"
        ? `${amenity} à ${city}`
        : locale === "ar"
          ? `${amenity} في ${city}`
          : `${amenity} in ${city}`;
    return { ...link, label };
  });

  let robots = page.robots;
  if (shouldNoindexUntranslatedNeighborhood(page)) {
    robots = "noindex,follow";
  }

  const aiSnippets = page.aiSnippets.map((snippet) => {
    if (snippet.source !== "marketplace") return snippet;
    if (snippet.type === "summary" && page.intelligence.listingCount > 0) {
      const content =
        locale === "fr"
          ? `${copy.h1} : ${page.intelligence.listingCount} séjours vérifiés sur ${BRAND}.`
          : locale === "ar"
            ? `${copy.h1}: ${page.intelligence.listingCount} إقامة موثقة على ${BRAND}.`
            : `${copy.h1}: ${page.intelligence.listingCount} verified stays on ${BRAND}.`;
      return { ...snippet, content };
    }
    if (
      snippet.type === "price" &&
      page.intelligence.avgNightlyPrice != null
    ) {
      const content =
        locale === "fr"
          ? `Le prix moyen par nuit est d'environ ${page.intelligence.avgNightlyPrice} ${page.intelligence.currency}.`
          : locale === "ar"
            ? `متوسط السعر لليلة حوالي ${page.intelligence.avgNightlyPrice} ${page.intelligence.currency}.`
            : `Average nightly price is about ${page.intelligence.avgNightlyPrice} ${page.intelligence.currency}.`;
      return { ...snippet, content };
    }
    return snippet;
  });

  return {
    ...page,
    title: copy.title,
    description: copy.description,
    h1: copy.h1,
    filterLabel: copy.filterLabel,
    breadcrumbs,
    geoBlocks,
    faq,
    propertyTypeLinks,
    amenityLinks,
    robots,
    indexable: robots.includes("noindex") ? false : page.indexable,
    aiSnippets,
  };
}

/** Guides FR/AR are English seed clones — must not stay indexable as localized content. */
export function applyGuideLocaleIndexPolicy(
  page: SeoGuidePagePayload,
): SeoGuidePagePayload {
  if (page.locale === "en") return page;
  return {
    ...page,
    robots: "noindex,follow",
    indexable: false,
    hreflang: { en: page.hreflang.en ?? `/en/guides/${page.slug}` },
    breadcrumbs: page.breadcrumbs.map((crumb, index) => {
      if (index === 0) return { ...crumb, name: pick(HOME, page.locale) };
      if (index === 1) {
        return {
          ...crumb,
          name:
            page.locale === "fr"
              ? "Guides"
              : page.locale === "ar"
                ? "الأدلة"
                : "Guides",
        };
      }
      return crumb;
    }),
  };
}

/** True when a sitemap path is a FR/AR guide article (not the guides hub). */
export function isNonEnglishGuideArticlePath(path: string): boolean {
  return /^\/(fr|ar)\/guides\/[^/]+\/?$/.test(path);
}
