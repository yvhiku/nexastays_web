import { buildPublicStaticMetadata } from "@/lib/seo/static-route-metadata";

export { default, revalidate } from "./home/HomePage.server";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPublicStaticMetadata("home", params.locale);
}
