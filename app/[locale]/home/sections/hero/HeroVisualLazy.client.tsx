"use client";

import dynamic from "next/dynamic";

export const HeroVisual = dynamic(
  () => import("./HeroVisual.client").then((m) => ({ default: m.HeroVisual })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-auto min-h-[320px] py-10 md:py-0 md:h-screen bg-gradient-to-br from-[#f9d8e3] via-[#fce7d3] to-[#f8d4e3] flex items-center justify-center relative overflow-hidden"
        aria-hidden
      />
    ),
  },
);
