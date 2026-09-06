"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { isMultiUnitFlow } from "@/lib/host-listing-wizard/step-config";
import {
  DEFAULT_FEE_RATES,
  calculateBookingFees,
  type StaysFeeRates,
} from "@/lib/stays-fees";
import { AdornedInput, Field, SectionCard, SoftTip, StepHeader } from "../wizard-ui";
import { WizardStatusIcon } from "../wizard-status";
import { resolveMessage } from "../WizardErrorSummary";
import type { StepProps } from "./step-props";

const K = "hostListing.wizard.pricing.";

export function PricingStep({
  form,
  patch,
  errors,
  feeRates = DEFAULT_FEE_RATES,
}: StepProps & { feeRates?: StaysFeeRates }) {
  const { t, tf } = useLanguage();
  const err = (id: string) => (errors[id] ? resolveMessage(tf, errors[id]) : null);
  const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
  const unitPrices = form.unitTypes.map((u) => Number(u.basePrice) || 0).filter((n) => n > 0);
  const previewBase = multi
    ? unitPrices.length
      ? Math.min(...unitPrices)
      : 0
    : Number(form.basePrice) || 0;
  const fees = calculateBookingFees(previewBase, feeRates);
  const base = Number(form.basePrice) || 0;
  const weekend = Number(form.weekendPrice) || 0;
  const weekendBelowBase = !multi && base > 0 && weekend > 0 && weekend < base;
  const money = (n: number) =>
    `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow={multi ? t(K + "eyebrowMulti") : t(K + "eyebrow")}
        title={multi ? t(K + "titleMulti") : t(K + "title")}
        description={multi ? t(K + "descriptionMulti") : t(K + "description")}
        tip={t(K + "tip")}
      />

      {multi ? (
        <div data-wizard-field="unitTypes">
          <SoftTip>{t(K + "multiNote")}</SoftTip>
          {err("unitTypes") && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {err("unitTypes")}
            </p>
          )}
        </div>
      ) : (
        <SectionCard title={t(K + "ratesTitle")} description={t(K + "ratesDesc")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="basePrice"
              label={t(K + "pricePerNight")}
              required
              hint={t(K + "pricePerNightHint")}
              error={err("basePrice")}
            >
              <AdornedInput
                adornment="MAD"
                type="number"
                min={1}
                inputMode="decimal"
                value={form.basePrice}
                onChange={(e) => patch({ basePrice: e.target.value })}
                placeholder="650"
              />
            </Field>
            <Field
              id="weekendPrice"
              label={t(K + "weekendPrice")}
              hint={t(K + "weekendPriceHint")}
              error={err("weekendPrice")}
            >
              <AdornedInput
                adornment="MAD"
                type="number"
                min={0}
                inputMode="decimal"
                value={form.weekendPrice}
                onChange={(e) => patch({ weekendPrice: e.target.value })}
                placeholder="750"
              />
            </Field>
          </div>
          {weekendBelowBase && (
            <p className="mt-3 flex items-start gap-2 text-sm text-nexa-ink-2">
              <WizardStatusIcon status="needsAttention" size={16} className="mt-0.5 shrink-0 text-nexa-accent" />
              {t(K + "weekendBelowBase")}
            </p>
          )}
        </SectionCard>
      )}

      {previewBase > 0 && (
        <div className="overflow-hidden rounded-2xl border-2 border-nexa-primary/20 bg-gradient-to-br from-nexa-primary-soft to-white p-5 shadow-nexa-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-nexa-primary">
            {t(K + "feePreview")}
          </p>
          <p className="mt-2 font-sans text-lg font-semibold text-nexa-ink">
            {multi
              ? tf(K + "basedOnLowest", { amount: previewBase.toFixed(0) })
              : tf(K + "basedOnNight", { amount: previewBase.toFixed(0) })}
          </p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-nexa-ink-3">{t(K + "guestPays")}</dt>
              <dd className="font-semibold tabular-nums text-nexa-ink">{money(fees.totalGuestPays)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-nexa-ink-3">
                {tf(K + "guestFee", { percent: feeRates.guest_fee_percent })}
              </dt>
              <dd className="tabular-nums text-nexa-ink-2">{money(fees.guestFee)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-nexa-line pt-2">
              <dt className="text-nexa-ink-3">{t(K + "yourPayout")}</dt>
              <dd className="font-semibold tabular-nums text-nexa-primary">
                {money(Math.max(fees.hostPayout, 0))}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
