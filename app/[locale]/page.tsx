import { buildPublicStaticMetadata } from "@/lib/seo/static-route-metadata";

export { /* @next-codemod-error `default` export is re-exported. Check if this component uses `params` or `searchParams`*/
default, revalidate } from "./home/HomePage.server";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return buildPublicStaticMetadata("home", params.locale);
}
