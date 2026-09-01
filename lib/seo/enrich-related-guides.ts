import { fetchSeoGuides } from "@/lib/seo/guide-api";
import { indexableGuideArticlePath } from "@/lib/seo/guide-links";
import type { SeoGuideSummaryDto, SeoLocale, SeoPagePayload } from "@/lib/seo/types";

const RELATED_GUIDE_CAP = 4;

function withLocaleGuideHref(
  guide: SeoGuideSummaryDto,
  locale: SeoLocale,
): SeoGuideSummaryDto {
  return {
    ...guide,
    href: indexableGuideArticlePath(guide.slug, locale),
  };
}

/**
 * Ensure destination SEO pages expose related guides with locale-scoped article hrefs.
 * Uses guide list for the page locale when API omitted cityGuideLink/relatedGuides.
 */
export async function enrichSeoPageWithRelatedGuides(
  page: SeoPagePayload,
): Promise<SeoPagePayload> {
  if (!page.destination) {
    return normalizeGuideHrefsOnPage(page);
  }

  const locale = page.locale;
  const destSlug = page.destination.slug;
  let related = (page.relatedGuides ?? []).map((g) => withLocaleGuideHref(g, locale));
  let cityGuide = page.cityGuideLink
    ? {
        ...page.cityGuideLink,
        href: indexableGuideArticlePath(
          page.cityGuideLink.slug ||
            page.cityGuideLink.href.replace(/^.*\/guides\//, ""),
          locale,
        ),
      }
    : null;

  if (related.length === 0 || !cityGuide) {
    const localeGuides = await fetchSeoGuides(locale);
    const forCity = localeGuides
      .filter((g) => g.destinationSlug === destSlug)
      .map((g) => withLocaleGuideHref(g, locale));

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
  const locale = page.locale;
  return {
    ...page,
    relatedGuides: (page.relatedGuides ?? []).map((g) =>
      withLocaleGuideHref(g, locale),
    ),
    cityGuideLink: page.cityGuideLink
      ? {
          ...page.cityGuideLink,
          href: indexableGuideArticlePath(
            page.cityGuideLink.slug ||
              page.cityGuideLink.href.replace(/^.*\/guides\//, ""),
            locale,
          ),
        }
      : page.cityGuideLink,
  };
}
