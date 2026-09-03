"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LocaleNotFound() {
  const { t, localePath } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-nexa-bg-1 px-4 pt-[calc(72px+env(safe-area-inset-top))]">
      <section className="max-w-md rounded-3xl border border-nexa-line bg-white p-8 text-center shadow-nexa-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-nexa-primary">
          404
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-nexa-ink">
          {t("navigationError.notFoundTitle")}
        </h1>
        <p className="mt-3 text-sm text-nexa-ink-3">
          {t("navigationError.notFoundBody")}
        </p>
        <Button asChild className="mt-6">
          <Link href={localePath("/")}>{t("navigationError.goHome")}</Link>
        </Button>
      </section>
    </main>
  );
}
