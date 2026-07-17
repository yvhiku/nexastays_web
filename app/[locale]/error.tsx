"use client";

import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-nexa-bg-1 pt-[72px] flex items-center justify-center px-4">
      <section className="max-w-md rounded-3xl bg-white border border-nexa-line p-8 text-center shadow-nexa-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-bold text-nexa-ink">
          We could not load this page.
        </h1>
        <p className="mt-3 text-sm text-nexa-ink-3">
          {error.message || "Please try again. If this continues, contact Nexa Stays support."}
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          Try again
        </Button>
      </section>
    </main>
  );
}
