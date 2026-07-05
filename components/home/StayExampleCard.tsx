"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

type StayExampleCardProps = {
  layout?: "hero" | "panel";
};

export function StayExampleCard({ layout = "hero" }: StayExampleCardProps) {
  const { t } = useLanguage();

  const imageBlock = (
    <div
      className={
        layout === "hero"
          ? "relative h-[70%] w-full bg-nexa-ink-4/10"
          : "relative h-[220px] sm:h-[260px] w-full bg-nexa-ink-4/10"
      }
    >
      <Image
        src="/images/assets/rooftop-riad.jpg"
        alt={t("home.hero.previewTitle")}
        fill
        priority={layout === "hero"}
        sizes={layout === "hero" ? "(max-width: 768px) 90vw, 340px" : "(max-width: 1024px) 100vw, 420px"}
        className="object-cover"
        style={{ objectPosition: "center 42%" }}
      />
      {layout === "panel" && (
        <div className="absolute top-4 start-4 rounded-full bg-white py-1.5 px-3.5 shadow-nexa-md flex items-center gap-1.5 text-xs font-semibold text-nexa-ink">
          <span>📋</span> {t("home.hero.previewStatus")}
        </div>
      )}
    </div>
  );

  const textBlock = (
    <div className={layout === "hero" ? "p-4" : "p-5 sm:p-6"}>
      <p className="text-xs font-semibold uppercase text-nexa-primary mb-1">
        {t("home.hero.previewLabel")}
      </p>
      <h4
        className={
          layout === "hero"
            ? "font-display text-base font-semibold mb-1"
            : "font-display text-lg sm:text-xl font-semibold mb-1"
        }
      >
        {t("home.hero.previewTitle")}
      </h4>
      <span className="text-sm text-nexa-ink-3">{t("home.hero.previewLocation")}</span>
    </div>
  );

  if (layout === "panel") {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-gradient-to-br from-[#f9d8e3] via-[#fce7d3] to-[#f8d4e3] rounded-2xl sm:rounded-[32px] p-6 sm:p-10">
        <div className="w-full max-w-[340px] overflow-hidden rounded-[22px] bg-white shadow-nexa-lg">
          {imageBlock}
          {textBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-white">
      {imageBlock}
      {textBlock}
    </div>
  );
}
