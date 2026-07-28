import type { Locale } from "@/lib/i18n";

const LOCALE_BCP47: Record<Locale, string> = {
  en: "en-MA",
  fr: "fr-MA",
  ar: "ar-MA",
};

function roundAmount(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

type MoneyFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/** Locale-aware currency display (MAD default for Morocco). */
export function formatMoney(
  amount: number,
  currency: string,
  locale: Locale,
  options?: MoneyFormatOptions,
): string {
  const code = (currency || "MAD").trim().toUpperCase() || "MAD";
  const maxFrac = options?.maximumFractionDigits ?? 0;
  const minFrac = options?.minimumFractionDigits ?? maxFrac;
  const value = maxFrac > 0 ? amount : roundAmount(amount);
  const bcp47 = LOCALE_BCP47[locale] ?? LOCALE_BCP47.en;

  try {
    return new Intl.NumberFormat(bcp47, {
      style: "currency",
      currency: code,
      maximumFractionDigits: maxFrac,
      minimumFractionDigits: minFrac,
    }).format(value);
  } catch {
    return `${value.toLocaleString(bcp47)} ${code}`;
  }
}

/** Nightly rate with localized per-night suffix from i18n. */
export function formatNightlyPrice(
  amount: number,
  currency: string,
  locale: Locale,
  perNightLabel: string,
): string {
  return `${formatMoney(amount, currency, locale)}${perNightLabel}`;
}

/** Compact total + night count for sticky bars and summaries. */
export function formatBookingTotalLine(
  total: number,
  currency: string,
  nights: number,
  locale: Locale,
  labels: { total: string; night: string; nights: string; separator: string },
): string {
  const nightLabel = nights === 1 ? labels.night : labels.nights.replace("{count}", String(nights));
  return `${formatMoney(total, currency, locale)} ${labels.total}${labels.separator}${nightLabel}`;
}
