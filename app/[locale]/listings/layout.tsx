import type { ReactNode } from "react";
import { buildPublicStaticMetadata } from "@/lib/seo/static-route-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPublicStaticMetadata("listings", params.locale);
}

export default function ListingsLayout({ children }: { children: ReactNode }) {
  return children;
}
