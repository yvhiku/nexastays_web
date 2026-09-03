"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { reportClientError } from "@/lib/monitoring";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, localePath } = useLanguage();

  useEffect(() => {
    reportClientError("react", error, error.digest);
  }, [error]);

  return (
    <main className="min-h-screen bg-nexa-bg-1 pt-[calc(72px+env(safe-area-inset-top))] flex items-center justify-center px-4">
      <section className="max-w-md rounded-3xl bg-white border border-nexa-line p-8 text-center shadow-nexa-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          {t("navigationError.eyebrow")}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-nexa-ink">
          {t("navigationError.title")}
        </h1>
        <p className="mt-3 text-sm text-nexa-ink-3">
          {t("navigationError.body")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset}>
            {t("navigationError.retry")}
          </Button>
          <Button asChild variant="outline">
            <Link href={localePath("/")}>{t("navigationError.goHome")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
