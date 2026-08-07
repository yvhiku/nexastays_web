import type { ReactNode } from "react";
import { buildPublicStaticMetadata } from "@/lib/seo/static-route-metadata";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return buildPublicStaticMetadata("listings", params.locale);
}

export default function ListingsLayout({ children }: { children: ReactNode }) {
  return children;
}
