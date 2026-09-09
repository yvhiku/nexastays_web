import { fetchSeoJson } from "./fetch-json";
import type {
  SeoGuidePagePayload,
  SeoGuideSummaryDto,
  SeoGuideType,
  SeoLocale,
} from "./types";

const REVALIDATE = 86400;

export async function fetchSeoGuides(
  locale: SeoLocale,
  guideType?: SeoGuideType,
): Promise<SeoGuideSummaryDto[]> {
  const typeParam = guideType ? `&type=${guideType}` : "";
  return (
    (await fetchSeoJson<SeoGuideSummaryDto[]>(
      `/stays/seo/guides?locale=${locale}${typeParam}`, REVALIDATE,
    )) ?? []
  );
}

export async function fetchSeoGuidePage(
  slug: string,
  locale: SeoLocale,
): Promise<SeoGuidePagePayload | null> {
  return fetchSeoJson<SeoGuidePagePayload>(
    `/stays/seo/guides/${encodeURIComponent(slug)}?locale=${locale}`, REVALIDATE, true,
  );
}

export function guideTypeLabel(type: SeoGuideType, t: (key: string) => string): string {
  const key = `seo.guideType.${type}`;
  const label = t(key);
  return label !== key ? label : type;
}
