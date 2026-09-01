/**
 * Guide article paths — all locales may be indexable when backend marks them indexable.
 */

export function indexableGuideArticlePath(slug: string, locale = "en"): string {
  const cleaned = slug
    .trim()
    .replace(/^\/+/, "")
    .replace(/^(en|fr|ar)\/guides\//, "")
    .replace(/^guides\//, "");
  const loc = locale === "fr" || locale === "ar" ? locale : "en";
  return `/${loc}/guides/${cleaned}`;
}

export function isIndexableGuideArticleHref(href: string): boolean {
  return /^\/(en|fr|ar)\/guides\/[^/]+\/?$/.test(href.trim());
}

/** Guide article path (with or without origin) for sitemap alternate scoping. */
export function isGuideArticlePath(path: string): boolean {
  return /^\/(en|fr|ar)\/guides\/[^/]+\/?$/.test(path.trim());
}

/**
 * Resolve href for Next `<Link>` + localePath:
 * Guide articles keep locale in path; other SEO paths strip for localePath re-prefixing.
 */
export function seoLinkHrefForLocalePath(href: string): {
  href: string;
  preserveAbsolute: boolean;
} {
  const stripped = href.replace(/^\/(en|fr|ar)(?=\/|$)/, "") || "/";
  return { href: stripped, preserveAbsolute: false };
}

export function toClientSeoHref(
  href: string,
  localePath: (path: string) => string,
): string {
  const resolved = seoLinkHrefForLocalePath(href);
  return localePath(resolved.href);
}
