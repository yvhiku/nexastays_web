import type { Locale } from "@/lib/i18n";
import { getServerTranslations } from "@/lib/i18n/server";
import { DEFAULT_FEE_RATES, fetchStaysFeeRates } from "@/lib/stays-fees";

type Props = {
  locale: Locale;
};

export async function StatsSection({ locale }: Props) {
  const { t } = getServerTranslations(locale);
  const rates = await fetchStaysFeeRates().catch(() => DEFAULT_FEE_RATES);
  const statKeys = [
    { labelKey: "home.stats.controlledLaunch" },
    { labelKey: "home.stats.casablancaFirst" },
    { labelKey: "home.stats.verifiedListings" },
    { labelKey: "home.stats.guestFee", value: `${rates.guest_fee_percent}%` },
  ];

  return (
    <section className="bg-gradient-to-br from-nexa-primary to-nexa-primary-dark py-12 sm:py-14 md:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {statKeys.map((stat) => (
            <div key={stat.labelKey}>
              {stat.value && (
                <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
              )}
              <div
                className={
                  stat.value
                    ? "text-sm text-white/75"
                    : "text-base sm:text-lg font-semibold text-white/90"
                }
              >
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
