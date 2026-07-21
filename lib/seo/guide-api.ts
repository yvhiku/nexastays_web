import { getStaysApiBaseUrl } from "@/lib/env";
import type {
  SeoGuidePagePayload,
  SeoGuideSummaryDto,
  SeoGuideType,
  SeoLocale,
} from "./types";

const REVALIDATE = 86400;

async function guideFetch<T>(path: string, revalidate = REVALIDATE): Promise<T | null> {
  const base = getStaysApiBaseUrl().replace(/\/$/, "");
  try {
    const res = await fetch(`${base}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchSeoGuides(
  locale: SeoLocale,
  guideType?: SeoGuideType,
): Promise<SeoGuideSummaryDto[]> {
  const typeParam = guideType ? `&type=${guideType}` : "";
  return (
    (await guideFetch<SeoGuideSummaryDto[]>(
      `/stays/seo/guides?locale=${locale}${typeParam}`,
    )) ?? []
  );
}

export async function fetchSeoGuidePage(
  slug: string,
  locale: SeoLocale,
): Promise<SeoGuidePagePayload | null> {
  return guideFetch<SeoGuidePagePayload>(
    `/stays/seo/guides/${encodeURIComponent(slug)}?locale=${locale}`,
  );
}

export function guideTypeLabel(type: SeoGuideType, t: (key: string) => string): string {
  const key = `seo.guideType.${type}`;
  const label = t(key);
  return label !== key ? label : type;
}
