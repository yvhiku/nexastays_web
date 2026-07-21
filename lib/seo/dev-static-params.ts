/**
 * Skip bulk generateStaticParams in development unless SEO_DEV_STATIC_PARAMS=true.
 * Production builds still pre-render all SEO pages.
 */
export function staticParamsInDev<T>(params: T[]): T[] {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.SEO_DEV_STATIC_PARAMS !== "true"
  ) {
    return [];
  }
  return params;
}
