import type { StaysListing } from "@/lib/stays-types";
import type {
  SeoGuidePagePayload,
  SeoGuideSummaryDto,
  SeoListingPagePayload,
  SeoLocale,
  SeoPagePayload,
} from "./types";

export type TravelEntityKind =
  | "country"
  | "region"
  | "city"
  | "district"
  | "neighborhood"
  | "landmark"
  | "attraction"
  | "beach"
  | "mountain"
  | "airport"
  | "train_station"
  | "university"
  | "business_district"
  | "shopping_center"
  | "hospital"
  | "transportation_hub"
  | "guide"
  | "listing"
  | "property_type"
  | "amenity";

export type TravelRelationshipType =
  | "contains"
  | "near"
  | "belongs_to"
  | "serves"
  | "related_to"
  | "located_in"
  | "accessible_from"
  | "featured_in"
  | "recommended_for";

export type TravelEntitySource = "registry" | "marketplace" | "editorial";

export interface TravelEntity {
  id: string;
  kind: TravelEntityKind;
  slug: string;
  locale: SeoLocale;
  name: string;
  summary?: string;
  href: string;
  coordinates?: { latitude: number; longitude: number };
  parentId?: string;
  source: TravelEntitySource;
  lastUpdated: string;
}

export interface TravelRelationship {
  id: string;
  type: TravelRelationshipType;
  fromId: string;
  toId: string;
  source: TravelEntitySource;
}

export interface TravelEntityGraph {
  locale: SeoLocale;
  rootId: string;
  entities: TravelEntity[];
  relationships: TravelRelationship[];
}

export interface SemanticBreadcrumb {
  name: string;
  path: string;
}

export interface EntityGraphIssue {
  code:
    | "duplicate_entity"
    | "duplicate_slug"
    | "dangling_relationship"
    | "self_relationship"
    | "duplicate_relationship"
    | "missing_name"
    | "invalid_href"
    | "parent_cycle"
    | "orphan_entity";
  entityId?: string;
  relationshipId?: string;
}

const MOROCCO_NAMES: Record<SeoLocale, string> = {
  en: "Morocco",
  fr: "Maroc",
  ar: "المغرب",
};

const MOROCCO_SUMMARIES: Record<SeoLocale, string> = {
  en: "Explore verified stays, destinations, and travel guides across Morocco.",
  fr: "Découvrez des séjours vérifiés, des destinations et des guides de voyage au Maroc.",
  ar: "اكتشف الإقامات الموثقة والوجهات وأدلة السفر في المغرب.",
};

function entityId(kind: TravelEntityKind, slug: string): string {
  return `${kind}:${slug}`;
}

function relationship(
  type: TravelRelationshipType,
  fromId: string,
  toId: string,
  source: TravelEntitySource,
): TravelRelationship {
  return {
    id: `${type}:${fromId}:${toId}`,
    type,
    fromId,
    toId,
    source,
  };
}

function slugFromHref(href: string, fallback: string): string {
  const path = href.split(/[?#]/, 1)[0] ?? "";
  return path.split("/").filter(Boolean).at(-1) ?? fallback;
}

function normalizedHref(href: string, locale: SeoLocale): string {
  if (!href.startsWith("/")) return href;
  if (/^\/(en|fr|ar)(?:\/|$)/.test(href)) {
    return href.replace(/^\/(en|fr|ar)(?=\/|$)/, `/${locale}`);
  }
  return `/${locale}${href === "/" ? "" : href}`;
}

function countryEntity(locale: SeoLocale, lastUpdated: string): TravelEntity {
  return {
    id: entityId("country", "morocco"),
    kind: "country",
    slug: "morocco",
    locale,
    name: MOROCCO_NAMES[locale],
    summary: MOROCCO_SUMMARIES[locale],
    href: `/${locale}/stays`,
    source: "editorial",
    lastUpdated,
  };
}

function guideEntity(
  guide: SeoGuideSummaryDto,
  locale: SeoLocale,
  lastUpdated: string,
): TravelEntity {
  return {
    id: entityId("guide", guide.slug),
    kind: "guide",
    slug: guide.slug,
    locale,
    name: guide.title,
    summary: guide.description || undefined,
    href: normalizedHref(guide.href, locale),
    source: "editorial",
    lastUpdated,
  };
}

function listingEntity(
  listing: StaysListing,
  locale: SeoLocale,
  lastUpdated: string,
): TravelEntity {
  return {
    id: entityId("listing", listing.id),
    kind: "listing",
    slug: listing.id,
    locale,
    name: listing.title,
    summary: [listing.neighborhood, listing.city].filter(Boolean).join(", "),
    href: `/${locale}/listings/${listing.id}`,
    coordinates:
      listing.geo_lat != null && listing.geo_lng != null
        ? { latitude: listing.geo_lat, longitude: listing.geo_lng }
        : undefined,
    source: "marketplace",
    lastUpdated,
  };
}

export function deriveSeoPageEntityGraph(
  page: SeoPagePayload,
  listings: StaysListing[] = [],
): TravelEntityGraph {
  const entities: TravelEntity[] = [countryEntity(page.locale, page.lastmod)];
  const relationships: TravelRelationship[] = [];
  const countryId = entityId("country", "morocco");

  let root: TravelEntity;
  let cityId: string | undefined;

  if (page.destination) {
    cityId = entityId("city", page.destination.slug);
    const city: TravelEntity = {
      id: cityId,
      kind: "city",
      slug: page.destination.slug,
      locale: page.locale,
      name: page.destination.name,
      summary: page.description,
      href: `/${page.locale}/stays/${page.destination.slug}`,
      coordinates:
        page.destination.latitude != null && page.destination.longitude != null
          ? {
              latitude: page.destination.latitude,
              longitude: page.destination.longitude,
            }
          : undefined,
      parentId: countryId,
      source: "registry",
      lastUpdated: page.lastmod,
    };
    entities.push(city);
    relationships.push(relationship("contains", countryId, cityId, "registry"));
  }

  if (page.neighborhood && cityId) {
    root = {
      id: entityId("neighborhood", `${page.destination!.slug}:${page.neighborhood.slug}`),
      kind: "neighborhood",
      slug: page.neighborhood.slug,
      locale: page.locale,
      name: page.neighborhood.name,
      summary: page.description,
      href: page.canonical,
      parentId: cityId,
      source: "registry",
      lastUpdated: page.lastmod,
    };
    entities.push(root);
    relationships.push(relationship("contains", cityId, root.id, "registry"));
  } else if (page.landmark) {
    root = {
      id: entityId("landmark", page.landmark.slug),
      kind: "landmark",
      slug: page.landmark.slug,
      locale: page.locale,
      name: page.landmark.name,
      summary: page.description,
      href: page.canonical,
      coordinates: {
        latitude: page.landmark.latitude,
        longitude: page.landmark.longitude,
      },
      parentId: cityId,
      source: "registry",
      lastUpdated: page.lastmod,
    };
    entities.push(root);
    relationships.push(
      relationship(cityId ? "located_in" : "belongs_to", root.id, cityId ?? countryId, "registry"),
    );
  } else if (page.pageType === "property_type" || page.pageType === "city_property_type") {
    const slug = page.registrySlug || slugFromHref(page.canonical, page.filterLabel ?? "property");
    root = {
      id: entityId("property_type", slug),
      kind: "property_type",
      slug,
      locale: page.locale,
      name: page.filterLabel ?? page.h1,
      summary: page.description,
      href: page.canonical,
      parentId: cityId ?? countryId,
      source: "registry",
      lastUpdated: page.lastmod,
    };
    entities.push(root);
    relationships.push(relationship("contains", cityId ?? countryId, root.id, "registry"));
  } else if (page.pageType === "amenity" || page.pageType === "city_amenity") {
    const slug = page.registrySlug || slugFromHref(page.canonical, page.filterLabel ?? "amenity");
    root = {
      id: entityId("amenity", slug),
      kind: "amenity",
      slug,
      locale: page.locale,
      name: page.filterLabel ?? page.h1,
      summary: page.description,
      href: page.canonical,
      parentId: cityId ?? countryId,
      source: "registry",
      lastUpdated: page.lastmod,
    };
    entities.push(root);
    relationships.push(relationship("recommended_for", root.id, cityId ?? countryId, "registry"));
  } else if (cityId) {
    root = entities.find((entity) => entity.id === cityId)!;
  } else {
    root = entities[0]!;
  }

  for (const item of page.neighborhoodLinks ?? []) {
    const id = entityId(
      "neighborhood",
      `${page.destination?.slug ?? "morocco"}:${item.slug}`,
    );
    entities.push({
      id,
      kind: "neighborhood",
      slug: item.slug,
      locale: page.locale,
      name: item.label,
      href: normalizedHref(item.href, page.locale),
      parentId: cityId,
      source: "registry",
      lastUpdated: page.lastmod,
    });
    relationships.push(relationship("contains", cityId ?? root.id, id, "registry"));
  }

  for (const item of page.propertyTypeLinks ?? []) {
    const id = entityId("property_type", item.slug);
    entities.push({
      id,
      kind: "property_type",
      slug: item.slug,
      locale: page.locale,
      name: item.label,
      href: normalizedHref(item.href, page.locale),
      source: "registry",
      lastUpdated: page.lastmod,
    });
    relationships.push(relationship("recommended_for", id, root.id, "registry"));
  }

  for (const item of page.amenityLinks ?? []) {
    const id = entityId("amenity", item.slug);
    entities.push({
      id,
      kind: "amenity",
      slug: item.slug,
      locale: page.locale,
      name: item.label,
      href: normalizedHref(item.href, page.locale),
      source: "registry",
      lastUpdated: page.lastmod,
    });
    relationships.push(relationship("recommended_for", id, root.id, "registry"));
  }

  for (const destination of page.nearbyDestinations ?? []) {
    const id = entityId("city", destination.slug);
    entities.push({
      id,
      kind: "city",
      slug: destination.slug,
      locale: page.locale,
      name: destination.name,
      href: `/${page.locale}/stays/${destination.slug}`,
      coordinates:
        destination.latitude != null && destination.longitude != null
          ? { latitude: destination.latitude, longitude: destination.longitude }
          : undefined,
      parentId: countryId,
      source: "registry",
      lastUpdated: page.lastmod,
    });
    relationships.push(relationship("near", root.id, id, "registry"));
  }

  for (const destination of page.relatedDestinations ?? []) {
    const id = entityId("city", destination.slug);
    entities.push({
      id,
      kind: "city",
      slug: destination.slug,
      locale: page.locale,
      name: destination.name,
      href: normalizedHref(destination.href, page.locale),
      parentId: countryId,
      source: "registry",
      lastUpdated: page.lastmod,
    });
    relationships.push(
      relationship(
        destination.relationType === "near" ? "near" : "related_to",
        root.id,
        id,
        "registry",
      ),
    );
  }

  const guides = [
    ...(page.cityGuideLink
      ? [
          {
            slug: page.cityGuideLink.slug,
            guideType: "travel" as const,
            title: page.cityGuideLink.label,
            description: "",
            destinationSlug: page.destination?.slug ?? null,
            destinationName: page.destination?.name ?? null,
            href: page.cityGuideLink.href,
            seoScore: 0,
          },
        ]
      : []),
    ...(page.relatedGuides ?? []),
  ];
  for (const guide of guides) {
    const entity = guideEntity(guide, page.locale, page.lastmod);
    entities.push(entity);
    relationships.push(relationship("featured_in", entity.id, root.id, "editorial"));
  }

  for (const poi of page.contentBlocks?.nearby_poi ?? []) {
    if (!poi.href.startsWith("/")) continue;
    const slug = slugFromHref(poi.href, poi.name.toLowerCase().replace(/\s+/g, "-"));
    const id = entityId("attraction", slug);
    entities.push({
      id,
      kind: "attraction",
      slug,
      locale: page.locale,
      name: poi.name,
      summary: poi.description,
      href: normalizedHref(poi.href, page.locale),
      source: "editorial",
      lastUpdated: page.lastmod,
    });
    relationships.push(relationship("near", root.id, id, "editorial"));
  }

  for (const listing of listings) {
    const entity = listingEntity(listing, page.locale, page.lastmod);
    entities.push(entity);
    relationships.push(relationship("featured_in", entity.id, root.id, "marketplace"));
  }

  return dedupeGraph({
    locale: page.locale,
    rootId: root.id,
    entities,
    relationships,
  });
}

export function deriveGuideEntityGraph(
  page: SeoGuidePagePayload,
  listings: StaysListing[] = [],
): TravelEntityGraph {
  const country = countryEntity(page.locale, page.lastmod);
  const guide: TravelEntity = {
    id: entityId("guide", page.slug),
    kind: "guide",
    slug: page.slug,
    locale: page.locale,
    name: page.h1,
    summary: page.description,
    href: page.canonical,
    source: "editorial",
    lastUpdated: page.lastmod,
  };
  const entities = [country, guide];
  const relationships = [relationship("featured_in", guide.id, country.id, "editorial")];

  if (page.destination) {
    const city: TravelEntity = {
      id: entityId("city", page.destination.slug),
      kind: "city",
      slug: page.destination.slug,
      locale: page.locale,
      name: page.destination.name,
      href: `/${page.locale}/stays/${page.destination.slug}`,
      coordinates:
        page.destination.latitude != null && page.destination.longitude != null
          ? {
              latitude: page.destination.latitude,
              longitude: page.destination.longitude,
            }
          : undefined,
      parentId: country.id,
      source: "registry",
      lastUpdated: page.lastmod,
    };
    entities.push(city);
    relationships.push(
      relationship("contains", country.id, city.id, "registry"),
      relationship("featured_in", guide.id, city.id, "editorial"),
    );
  }

  for (const related of page.relatedGuides) {
    const entity = guideEntity(related, page.locale, page.lastmod);
    entities.push(entity);
    relationships.push(relationship("related_to", guide.id, entity.id, "editorial"));
  }

  for (const listing of listings) {
    const entity = listingEntity(listing, page.locale, page.lastmod);
    entities.push(entity);
    relationships.push(relationship("featured_in", entity.id, guide.id, "marketplace"));
  }

  return dedupeGraph({
    locale: page.locale,
    rootId: guide.id,
    entities,
    relationships,
  });
}

export function deriveListingEntityGraph(page: SeoListingPagePayload): TravelEntityGraph {
  const country = countryEntity(page.locale, page.lastmod);
  const citySlug = page.city.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  const city: TravelEntity = {
    id: entityId("city", citySlug),
    kind: "city",
    slug: citySlug,
    locale: page.locale,
    name: page.city,
    href: `/${page.locale}/stays/${citySlug}`,
    parentId: country.id,
    source: "marketplace",
    lastUpdated: page.lastmod,
  };
  const listing: TravelEntity = {
    id: entityId("listing", page.listingId),
    kind: "listing",
    slug: page.listingId,
    locale: page.locale,
    name: page.h1,
    summary: page.description,
    href: page.canonical,
    coordinates:
      page.geoLat != null && page.geoLng != null
        ? { latitude: page.geoLat, longitude: page.geoLng }
        : undefined,
    parentId: city.id,
    source: "marketplace",
    lastUpdated: page.lastmod,
  };
  const entities = [country, city, listing];
  const relationships = [
    relationship("contains", country.id, city.id, "marketplace"),
    relationship("located_in", listing.id, city.id, "marketplace"),
  ];

  if (page.neighborhood) {
    const slug = page.neighborhood.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const neighborhood: TravelEntity = {
      id: entityId("neighborhood", `${citySlug}:${slug}`),
      kind: "neighborhood",
      slug,
      locale: page.locale,
      name: page.neighborhood,
      href: `/${page.locale}/stays/${citySlug}/${slug}`,
      parentId: city.id,
      source: "marketplace",
      lastUpdated: page.lastmod,
    };
    entities.push(neighborhood);
    relationships.push(
      relationship("contains", city.id, neighborhood.id, "marketplace"),
      relationship("located_in", listing.id, neighborhood.id, "marketplace"),
    );
  }

  const propertySlug =
    {
      APARTMENT: "apartments",
      HOTEL: "hotels",
      RIAD: "riads",
      VILLA: "villas",
      HOSTEL: "hostels",
    }[page.listingType.toUpperCase()] ??
    page.listingType.toLowerCase().replace(/_/g, "-");
  const property: TravelEntity = {
    id: entityId("property_type", propertySlug),
    kind: "property_type",
    slug: propertySlug,
    locale: page.locale,
    name: page.listingType,
    href: `/${page.locale}/stays/${citySlug}/${propertySlug}`,
    source: "marketplace",
    lastUpdated: page.lastmod,
  };
  entities.push(property);
  relationships.push(relationship("belongs_to", listing.id, property.id, "marketplace"));

  return dedupeGraph({
    locale: page.locale,
    rootId: listing.id,
    entities,
    relationships,
  });
}

function dedupeGraph(graph: TravelEntityGraph): TravelEntityGraph {
  return {
    ...graph,
    entities: Array.from(new Map(graph.entities.map((entity) => [entity.id, entity])).values()),
    relationships: Array.from(
      new Map(graph.relationships.map((item) => [item.id, item])).values(),
    ),
  };
}

export function relatedEntities(
  graph: TravelEntityGraph,
): Array<{ entity: TravelEntity; relationship: TravelRelationship }> {
  const byId = new Map(graph.entities.map((entity) => [entity.id, entity]));
  const seen = new Set<string>();
  const result: Array<{ entity: TravelEntity; relationship: TravelRelationship }> = [];
  for (const item of graph.relationships) {
    const entityId =
      item.fromId === graph.rootId
        ? item.toId
        : item.toId === graph.rootId
          ? item.fromId
          : null;
    if (!entityId || seen.has(entityId)) continue;
    const entity = byId.get(entityId);
    if (!entity) continue;
    seen.add(entityId);
    result.push({ entity, relationship: item });
  }
  return result;
}

export function validateEntityGraph(graph: TravelEntityGraph): EntityGraphIssue[] {
  const issues: EntityGraphIssue[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const entity of graph.entities) {
    if (ids.has(entity.id)) issues.push({ code: "duplicate_entity", entityId: entity.id });
    ids.add(entity.id);
    const slugKey = `${entity.kind}:${entity.slug}`;
    if (slugs.has(slugKey)) issues.push({ code: "duplicate_slug", entityId: entity.id });
    slugs.add(slugKey);
    if (!entity.name.trim()) issues.push({ code: "missing_name", entityId: entity.id });
    if (!entity.href.startsWith(`/${graph.locale}/`)) {
      issues.push({ code: "invalid_href", entityId: entity.id });
    }
  }

  const relationshipIds = new Set<string>();
  const connected = new Set<string>([graph.rootId]);
  for (const item of graph.relationships) {
    if (relationshipIds.has(item.id)) {
      issues.push({ code: "duplicate_relationship", relationshipId: item.id });
    }
    relationshipIds.add(item.id);
    if (!ids.has(item.fromId) || !ids.has(item.toId)) {
      issues.push({ code: "dangling_relationship", relationshipId: item.id });
    }
    if (item.fromId === item.toId) {
      issues.push({ code: "self_relationship", relationshipId: item.id });
    }
    connected.add(item.fromId);
    connected.add(item.toId);
  }

  const parents = new Map(
    graph.entities
      .filter((entity) => entity.parentId)
      .map((entity) => [entity.id, entity.parentId!]),
  );
  for (const entity of graph.entities) {
    const visited = new Set<string>();
    let current: string | undefined = entity.id;
    while (current) {
      if (visited.has(current)) {
        issues.push({ code: "parent_cycle", entityId: entity.id });
        break;
      }
      visited.add(current);
      current = parents.get(current);
    }
    if (!connected.has(entity.id)) issues.push({ code: "orphan_entity", entityId: entity.id });
  }
  return issues;
}

export function semanticBreadcrumbsForSeoPage(page: SeoPagePayload): SemanticBreadcrumb[] {
  const crumbs: SemanticBreadcrumb[] = [
    { name: MOROCCO_NAMES[page.locale], path: `/${page.locale}/stays` },
  ];
  if (page.destination) {
    crumbs.push({
      name: page.destination.name,
      path: `/${page.locale}/stays/${page.destination.slug}`,
    });
  }
  if (page.neighborhood) {
    crumbs.push({ name: page.neighborhood.name, path: page.canonical });
  } else if (page.landmark) {
    crumbs.push({ name: page.landmark.name, path: page.canonical });
  } else if (page.filterLabel) {
    crumbs.push({ name: page.filterLabel, path: page.canonical });
  } else if (crumbs.at(-1)?.path !== page.canonical) {
    crumbs.push({ name: page.h1, path: page.canonical });
  }
  return uniqueBreadcrumbs(crumbs);
}

export function semanticBreadcrumbsForGuide(
  page: SeoGuidePagePayload,
): SemanticBreadcrumb[] {
  const crumbs: SemanticBreadcrumb[] = [
    { name: MOROCCO_NAMES[page.locale], path: `/${page.locale}/stays` },
    {
      name: page.locale === "fr" ? "Guides" : page.locale === "ar" ? "الأدلة" : "Guides",
      path: `/${page.locale}/guides`,
    },
  ];
  if (page.destination) {
    crumbs.push({
      name: page.destination.name,
      path: `/${page.locale}/stays/${page.destination.slug}`,
    });
  }
  crumbs.push({ name: page.h1, path: page.canonical });
  return uniqueBreadcrumbs(crumbs);
}

export function semanticBreadcrumbsForListing(
  page: SeoListingPagePayload,
): SemanticBreadcrumb[] {
  const citySlug = page.city.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  const crumbs: SemanticBreadcrumb[] = [
    { name: MOROCCO_NAMES[page.locale], path: `/${page.locale}/stays` },
    { name: page.city, path: `/${page.locale}/stays/${citySlug}` },
  ];
  if (page.neighborhood) {
    const slug = page.neighborhood.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    crumbs.push({
      name: page.neighborhood,
      path: `/${page.locale}/stays/${citySlug}/${slug}`,
    });
  }
  crumbs.push({ name: page.h1, path: page.canonical });
  return uniqueBreadcrumbs(crumbs);
}

function uniqueBreadcrumbs(crumbs: SemanticBreadcrumb[]): SemanticBreadcrumb[] {
  return Array.from(new Map(crumbs.map((crumb) => [crumb.path, crumb])).values());
}
