import type { Metadata } from "next";
import ListingsExploreClient from "./ListingsExploreClient";
import { buildExploreListingsMetadata } from "@/lib/seo/explore-indexability";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  return buildExploreListingsMetadata(params.locale, searchParams);
}

export default function ListingsPage() {
  return <ListingsExploreClient />;
}
