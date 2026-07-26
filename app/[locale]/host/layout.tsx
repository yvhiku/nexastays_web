import type { ReactNode } from "react";
import { buildPublicStaticMetadata } from "@/lib/seo/static-route-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPublicStaticMetadata("host", params.locale);
}

export default function HostLayout({ children }: { children: ReactNode }) {
  return children;
}
