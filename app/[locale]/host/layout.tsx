import type { ReactNode } from "react";
import { buildPublicStaticMetadata } from "@/lib/seo/static-route-metadata";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return buildPublicStaticMetadata("host", params.locale);
}

export default function HostLayout({ children }: { children: ReactNode }) {
  return children;
}
