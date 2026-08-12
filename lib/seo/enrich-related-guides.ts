import { fetchSeoGuides } from "@/lib/seo/guide-api";
import { indexableGuideArticlePath } from "@/lib/seo/guide-links";
import type { SeoGuideSummaryDto, SeoPagePayload } from "@/lib/seo/types";

const RELATED_GUIDE_CAP = 4;

function withEnGuideHref(guide: SeoGuideSummaryDto): SeoGuideSummaryDto {
  return {
    ...guide,
    href: indexableGuideArticlePath(guide.slug),
  };
}

/**
 * Ensure destination SEO pages expose related guides with EN article hrefs.
 * Uses existing EN guide list when API omitted cityGuideLink/relatedGuides
 * (backend currently fills those mainly for neighborhoods).
 */
export async function enrichSeoPageWithRelatedGuides(
  page: SeoPagePayload,
): Promise<SeoPagePayload> {
  if (!page.destination) {
    return normalizeGuideHrefsOnPage(page);
  }

  const destSlug = page.destination.slug;
  let related = (page.relatedGuides ?? []).map(withEnGuideHref);
  let cityGuide = page.cityGuideLink
    ? {
        ...page.cityGuideLink,
        href: indexableGuideArticlePath(
          page.cityGuideLink.slug ||
            page.cityGuideLink.href.replace(/^.*\/guides\//, ""),
        ),
      }
    : null;

  if (related.length === 0 || !cityGuide) {
    const enGuides = await fetchSeoGuides("en");
    const forCity = enGuides
      .filter((g) => g.destinationSlug === destSlug)
      .map(withEnGuideHref);

    if (related.length === 0) {
      related = forCity.slice(0, RELATED_GUIDE_CAP);
    }

    if (!cityGuide) {
      const travel =
        forCity.find((g) => g.guideType === "travel") ?? forCity[0] ?? null;
      if (travel) {
        cityGuide = {
          slug: travel.slug,
          href: travel.href,
          label: travel.title,
        };
      }
    }
  }

  return {
    ...page,
    relatedGuides: related,
    cityGuideLink: cityGuide,
  };
}

function normalizeGuideHrefsOnPage(page: SeoPagePayload): SeoPagePayload {
  return {
    ...page,
    relatedGuides: (page.relatedGuides ?? []).map(withEnGuideHref),
    cityGuideLink: page.cityGuideLink
      ? {
          ...page.cityGuideLink,
          href: indexableGuideArticlePath(
            page.cityGuideLink.slug ||
              page.cityGuideLink.href.replace(/^.*\/guides\//, ""),
          ),
        }
      : page.cityGuideLink,
  };
}
