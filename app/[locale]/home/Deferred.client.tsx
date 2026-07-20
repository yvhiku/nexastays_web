"use client";

import dynamic from "next/dynamic";

const RecentlyViewedSection = dynamic(
  () =>
    import("@/components/home/RecentlyViewedSection").then((m) => ({
      default: m.RecentlyViewedSection,
    })),
  { ssr: false },
);

export function DeferredHomeClient() {
  return <RecentlyViewedSection />;
}
