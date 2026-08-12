/**
 * Phase 4/5: only EN guide articles are treated as indexable localized content.
 * FR/AR guide rows are English clones (noindex) — do not promote those URLs.
 */

export function indexableGuideArticlePath(slug: string): string {
  const cleaned = slug
    .trim()
    .replace(/^\/+/, "")
    .replace(/^(en|fr|ar)\/guides\//, "")
    .replace(/^guides\//, "");
  return `/en/guides/${cleaned}`;
}

export function isIndexableGuideArticleHref(href: string): boolean {
  return /^\/en\/guides\/[^/]+\/?$/.test(href.trim());
}

/** EN guide article path (with or without origin) for sitemap alternate scoping. */
export function isEnglishGuideArticlePath(path: string): boolean {
  return /^\/en\/guides\/[^/]+\/?$/.test(path.trim());
}

/**
 * Resolve href for Next `<Link>` + localePath:
 * - EN guide articles stay on `/en/guides/...`
 * - everything else is stripped for localePath re-prefixing
 */
export function seoLinkHrefForLocalePath(href: string): {
  href: string;
  preserveAbsolute: boolean;
} {
  if (isIndexableGuideArticleHref(href)) {
    return { href: href.replace(/\/$/, ""), preserveAbsolute: true };
  }
  const stripped = href.replace(/^\/(en|fr|ar)(?=\/|$)/, "") || "/";
  return { href: stripped, preserveAbsolute: false };
}

export function toClientSeoHref(
  href: string,
  localePath: (path: string) => string,
): string {
  const resolved = seoLinkHrefForLocalePath(href);
  return resolved.preserveAbsolute
    ? resolved.href
    : localePath(resolved.href);
}
