import type { ReactNode } from "react";
import { buildPublicStaticMetadata } from "@/lib/seo/static-route-metadata";
export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPublicStaticMetadata("terms", params.locale);
}
export default function Layout({ children }: { children: ReactNode }) { return children; }
