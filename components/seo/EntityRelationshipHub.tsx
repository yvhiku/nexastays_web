"use client";

import Link from "next/link";
import {
  BookOpen,
  Building2,
  ChevronRight,
  Compass,
  Home,
  Landmark,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  relatedEntities,
  type TravelEntity,
  type TravelEntityGraph,
  type TravelEntityKind,
} from "@/lib/seo/entity-graph";

type EntityGroup = {
  id: string;
  titleKey: string;
  kinds: TravelEntityKind[];
  icon: typeof MapPin;
};

const ENTITY_COPY: Record<
  "en" | "fr" | "ar",
  Record<string, string>
> = {
  en: {
    "seo.entityGraphEyebrow": "Morocco travel network",
    "seo.entityGraphTitle": "Explore connected places and stays",
    "seo.entityGraphDescription":
      "Continue through verified destinations, local areas, travel guides, stay types, amenities, and live listings related to this page.",
    "seo.entityPlaces": "Places and nearby areas",
    "seo.entityTransport": "Transportation",
    "seo.entityLocalKnowledge": "Local points of interest",
    "seo.entityListings": "Related stays",
    "seo.entitySource": "Source",
    "seo.entityUpdated": "Updated",
    "seo.entitySourceMarketplace": "Nexa Stays marketplace",
    "seo.entitySourceEditorial": "Nexa Stays editorial",
    "seo.entitySourceRegistry": "Nexa Stays destination registry",
  },
  fr: {
    "seo.entityGraphEyebrow": "Réseau de voyage au Maroc",
    "seo.entityGraphTitle": "Explorer les lieux et séjours associés",
    "seo.entityGraphDescription":
      "Poursuivez votre découverte grâce aux destinations, quartiers, guides, types de logements et annonces liés à cette page.",
    "seo.entityPlaces": "Lieux et zones à proximité",
    "seo.entityTransport": "Transports",
    "seo.entityLocalKnowledge": "Points d’intérêt locaux",
    "seo.entityListings": "Séjours associés",
    "seo.entitySource": "Source",
    "seo.entityUpdated": "Mis à jour",
    "seo.entitySourceMarketplace": "Marché Nexa Stays",
    "seo.entitySourceEditorial": "Rédaction Nexa Stays",
    "seo.entitySourceRegistry": "Registre des destinations Nexa Stays",
  },
  ar: {
    "seo.entityGraphEyebrow": "شبكة السفر في المغرب",
    "seo.entityGraphTitle": "استكشف الأماكن والإقامات المرتبطة",
    "seo.entityGraphDescription":
      "تابع الاستكشاف عبر الوجهات والأحياء والأدلة وأنواع الإقامات والإعلانات المرتبطة بهذه الصفحة.",
    "seo.entityPlaces": "الأماكن والمناطق القريبة",
    "seo.entityTransport": "وسائل النقل",
    "seo.entityLocalKnowledge": "معالم محلية",
    "seo.entityListings": "إقامات مرتبطة",
    "seo.entitySource": "المصدر",
    "seo.entityUpdated": "تم التحديث",
    "seo.entitySourceMarketplace": "سوق Nexa Stays",
    "seo.entitySourceEditorial": "تحرير Nexa Stays",
    "seo.entitySourceRegistry": "سجل وجهات Nexa Stays",
  },
};

const GROUPS: EntityGroup[] = [
  {
    id: "places",
    titleKey: "seo.entityPlaces",
    kinds: [
      "country",
      "region",
      "city",
      "district",
      "neighborhood",
      "landmark",
      "attraction",
      "beach",
      "mountain",
    ],
    icon: MapPin,
  },
  {
    id: "transport",
    titleKey: "seo.entityTransport",
    kinds: ["airport", "train_station", "transportation_hub"],
    icon: Compass,
  },
  {
    id: "local",
    titleKey: "seo.entityLocalKnowledge",
    kinds: ["university", "business_district", "shopping_center", "hospital"],
    icon: Landmark,
  },
  {
    id: "guides",
    titleKey: "seo.relatedGuides",
    kinds: ["guide"],
    icon: BookOpen,
  },
  {
    id: "stay-types",
    titleKey: "seo.propertyTypes",
    kinds: ["property_type"],
    icon: Building2,
  },
  {
    id: "amenities",
    titleKey: "seo.amenities",
    kinds: ["amenity"],
    icon: Sparkles,
  },
  {
    id: "listings",
    titleKey: "seo.entityListings",
    kinds: ["listing"],
    icon: Home,
  },
];

export function EntityRelationshipHub({ graph }: { graph: TravelEntityGraph }) {
  const { t, locale, localePath } = useLanguage();
  const entityT = (key: string) => {
    const translated = t(key);
    return translated === key ? (ENTITY_COPY[locale][key] ?? key) : translated;
  };
  const related = relatedEntities(graph);
  const groups = GROUPS.map((group) => ({
    ...group,
    entities: related
      .map((item) => item.entity)
      .filter((entity) => group.kinds.includes(entity.kind))
      .sort((left, right) => left.name.localeCompare(right.name, graph.locale))
      .slice(0, 12),
  })).filter((group) => group.entities.length > 0);

  if (groups.length === 0) return null;

  const root = graph.entities.find((entity) => entity.id === graph.rootId);

  return (
    <section
      aria-labelledby="entity-relationships-title"
      className="rounded-[24px] border border-nexa-border/80 bg-white p-5 shadow-nexa-card sm:p-7"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexa-primary">
          {entityT("seo.entityGraphEyebrow")}
        </p>
        <h2
          id="entity-relationships-title"
          className="mt-2 font-display text-2xl font-semibold text-nexa-ink"
        >
          {entityT("seo.entityGraphTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-nexa-muted">
          {entityT("seo.entityGraphDescription")}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.id} aria-labelledby={`entity-group-${group.id}`}>
              <h3
                id={`entity-group-${group.id}`}
                className="flex items-center gap-2 text-sm font-semibold text-nexa-ink"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-nexa-primary-soft text-nexa-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {entityT(group.titleKey)}
              </h3>
              <ul className="mt-3 space-y-1.5">
                {group.entities.map((entity) => (
                  <EntityLink key={entity.id} entity={entity} localePath={localePath} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {root && (
        <p className="mt-6 border-t border-nexa-border/60 pt-4 text-xs text-nexa-muted">
          {entityT("seo.entitySource")}: {sourceLabel(root.source, entityT)}
          <span aria-hidden="true">{" \u00b7 "}</span>
          <time dateTime={root.lastUpdated}>
            {entityT("seo.entityUpdated")} {formatUpdated(root.lastUpdated, graph.locale)}
          </time>
        </p>
      )}
    </section>
  );
}

function EntityLink({
  entity,
  localePath,
}: {
  entity: TravelEntity;
  localePath: (path: string) => string;
}) {
  const href = entity.href.startsWith("/")
    ? localePath(entity.href.replace(/^\/(en|fr|ar)/, "") || "/")
    : entity.href;

  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="group flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-nexa-ink transition-colors hover:bg-nexa-primary-soft/70 hover:text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{entity.name}</span>
          {entity.summary && (
            <span className="mt-0.5 block line-clamp-1 text-xs text-nexa-muted">
              {entity.summary}
            </span>
          )}
        </span>
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-nexa-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
        />
      </Link>
    </li>
  );
}

function sourceLabel(
  source: TravelEntity["source"],
  t: (key: string) => string,
): string {
  if (source === "marketplace") return t("seo.entitySourceMarketplace");
  if (source === "editorial") return t("seo.entitySourceEditorial");
  return t("seo.entitySourceRegistry");
}

function formatUpdated(value: string, locale: TravelEntityGraph["locale"]): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  ).format(parsed);
}
