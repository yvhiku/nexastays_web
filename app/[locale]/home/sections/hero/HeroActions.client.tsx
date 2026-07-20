"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function HeroActions() {
  const { t, localePath } = useLanguage();

  return (
    <div className="flex flex-wrap gap-3.5 mb-10 px-6 sm:px-10 md:px-14 lg:px-16 xl:px-20 xl:ps-16 relative z-10">
      <Button size="lg" asChild>
        <Link href={localePath("/listings")}>{t("home.hero.searchStays")}</Link>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href={localePath("/host")}>{t("home.hero.becomeHost")}</Link>
      </Button>
    </div>
  );
}
