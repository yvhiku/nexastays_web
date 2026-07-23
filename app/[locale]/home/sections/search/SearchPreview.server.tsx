import type { ServerT } from "@/lib/i18n/server";

type Props = {
  t: ServerT;
  variant?: "standalone" | "hero";
};

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative text-left px-4 sm:px-5 py-3.5 min-h-[64px] rounded-2xl sm:rounded-full">
      <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-nexa-ink-3 mb-0.5">
        {label}
      </span>
      <span className="block text-sm font-medium truncate text-nexa-ink-4">{value}</span>
    </div>
  );
}

export function SearchPreview({ t, variant = "standalone" }: Props) {
  const inner = (
    <>
      <div
        className="relative bg-white border border-nexa-line shadow-nexa-lg rounded-2xl sm:rounded-full p-2 max-w-[920px] mx-auto cursor-pointer"
        aria-hidden
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 min-w-0">
          <div className="flex-1 min-w-0 sm:basis-[32%]">
            <PreviewField label={t("searchBar.where")} value={t("searchBar.searchDestinations")} />
          </div>
          <div className="hidden sm:block w-px self-stretch bg-nexa-line my-3" />
          <div className="flex-1 min-w-0 sm:basis-[28%]">
            <PreviewField label={t("searchBar.when")} value={t("searchBar.addDates")} />
          </div>
          <div className="hidden sm:block w-px self-stretch bg-nexa-line my-3" />
          <div className="flex-1 min-w-0 sm:basis-[28%]">
            <PreviewField label={t("searchBar.who")} value={t("searchBar.addGuests")} />
          </div>
          <div className="p-1 sm:ps-2 flex items-center">
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-nexa-primary text-white font-semibold shadow-[0_4px_16px_rgba(232,80,122,.32)] w-full sm:w-auto min-h-[48px] px-5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span>{t("searchBar.search")}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-nexa-ink-4 max-w-[640px] mx-auto mt-4">
        {t("home.search.helperText")}
      </p>
    </>
  );

  if (variant === "hero") {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {inner}
      </div>
    );
  }

  return (
    <section className="py-10 sm:py-14 md:py-16 bg-nexa-bg-2 border-b border-nexa-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {inner}
      </div>
    </section>
  );
}
