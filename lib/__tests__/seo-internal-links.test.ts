import assert from "node:assert/strict";
import test from "node:test";
import {
  indexableGuideArticlePath,
  isGuideArticlePath,
  isIndexableGuideArticleHref,
  seoLinkHrefForLocalePath,
  toClientSeoHref,
} from "../seo/guide-links";

test("indexableGuideArticlePath targets locale-scoped guide URLs", () => {
  assert.equal(
    indexableGuideArticlePath("morocco-travel-guide"),
    "/en/guides/morocco-travel-guide",
  );
  assert.equal(
    indexableGuideArticlePath("morocco-travel-guide", "fr"),
    "/fr/guides/morocco-travel-guide",
  );
  assert.equal(
    indexableGuideArticlePath("/fr/guides/casablanca-travel-guide", "ar"),
    "/ar/guides/casablanca-travel-guide",
  );
  assert.equal(isIndexableGuideArticleHref("/en/guides/foo"), true);
  assert.equal(isIndexableGuideArticleHref("/fr/guides/foo"), true);
  assert.equal(isGuideArticlePath("/en/guides/foo"), true);
  assert.equal(isGuideArticlePath("/fr/guides"), false);
});

test("toClientSeoHref prefixes locale for guide and stays paths", () => {
  const frPath = (p: string) => `/fr${p.startsWith("/") ? p : `/${p}`}`;
  assert.equal(
    toClientSeoHref("/en/guides/morocco-travel-guide", frPath),
    "/fr/guides/morocco-travel-guide",
  );
  assert.equal(
    toClientSeoHref("/fr/stays/casablanca", frPath),
    "/fr/stays/casablanca",
  );
  assert.deepEqual(seoLinkHrefForLocalePath("/en/guides/x"), {
    href: "/guides/x",
    preserveAbsolute: false,
  });
});

test("locale stays paths keep locale prefix shape", () => {
  const frPath = (p: string) => {
    const clean = p.startsWith("/") ? p : `/${p}`;
    return `/fr${clean}`;
  };
  assert.equal(toClientSeoHref("/fr/stays/casablanca/apartments", frPath), "/fr/stays/casablanca/apartments");
  assert.equal(toClientSeoHref("/en/stays/marrakech", frPath), "/fr/stays/marrakech");
});
