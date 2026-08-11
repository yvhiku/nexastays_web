"use client";

import React from "react";
import { Wallet } from "lucide-react";
import type { HostDashboardAggregate } from "@/lib/stays-types";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import type { Locale } from "@/lib/i18n";

type TranslateFn = (key: string) => string;

interface HostPayoutStatusProps {
  dashboard: HostDashboardAggregate | null;
  loading?: boolean;
  t: TranslateFn;
  locale: Locale;
}

function isSimulated(provider: string, mode: string): boolean {
  const p = provider.toLowerCase();
  const m = mode.toLowerCase();
  return p === "mock" || m.includes("mock") || m === "dogfood" || m.includes("simulat");
}

export function HostPayoutStatus({
  dashboard,
  loading,
  t,
  locale,
}: HostPayoutStatusProps) {
  if (loading && !dashboard) {
    return (
      <section
        className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 animate-pulse"
        aria-busy="true"
      >
        <div className="h-5 w-40 bg-nexa-bg-2 rounded mb-3" />
        <div className="h-4 w-full bg-nexa-bg-2 rounded" />
      </section>
    );
  }

  if (!dashboard) return null;

  const { payouts } = dashboard;
  const simulated = isSimulated(payouts.provider, payouts.mode);
  const currency = payouts.currency || dashboard.currency;
  const showPending = payouts.pending > 0;

  return (
    <section
      className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 sm:p-8"
      aria-labelledby="host-payout-heading"
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-nexa-primary-soft text-nexa-primary shrink-0">
          <Wallet className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="host-payout-heading"
            className="text-lg font-semibold text-nexa-ink"
          >
            {t("hostDashboard.payoutStatusTitle")}
          </h2>
          <p className="text-sm text-nexa-ink-3 mt-0.5">
            {simulated
              ? t("hostDashboard.payoutSimulatedBadge")
              : t("hostDashboard.payoutStatusDesc")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-nexa-bg-1 border border-nexa-line px-4 py-3">
          <p className="text-xs text-nexa-ink-4 uppercase tracking-wide">
            {t("hostDashboard.pendingPayout")}
          </p>
          <p className="mt-1 text-xl font-semibold text-nexa-ink tabular-nums">
            {showPending
              ? formatHostCurrency(payouts.pending, currency, locale)
              : formatHostCurrency(0, currency, locale)}
          </p>
          {!showPending ? (
            <p className="mt-1 text-xs text-nexa-ink-4">
              {t("hostDashboard.noPendingPayout")}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl bg-nexa-bg-1 border border-nexa-line px-4 py-3">
          <p className="text-xs text-nexa-ink-4 uppercase tracking-wide">
            {t("hostDashboard.availablePayout")}
          </p>
          <p className="mt-1 text-xl font-semibold text-nexa-ink tabular-nums">
            {formatHostCurrency(payouts.available, currency, locale)}
          </p>
          <p className="mt-1 text-xs text-nexa-ink-4">
            {t("hostDashboard.availablePayoutHint")}
          </p>
        </div>
        <div className="rounded-xl bg-nexa-bg-1 border border-nexa-line px-4 py-3">
          <p className="text-xs text-nexa-ink-4 uppercase tracking-wide">
            {t("hostDashboard.paidOutPayout")}
          </p>
          <p className="mt-1 text-xl font-semibold text-nexa-ink tabular-nums">
            {formatHostCurrency(payouts.paid_out, currency, locale)}
          </p>
          <p className="mt-1 text-xs text-nexa-ink-4">
            {t("hostDashboard.paidOutPayoutHint")}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-nexa-bg-1 border border-nexa-line px-4 py-3">
        <p className="text-xs text-nexa-ink-4 uppercase tracking-wide">
          {t("hostDashboard.payoutMethodLabel")}
        </p>
        <p className="mt-1 text-sm font-medium text-nexa-ink">
          {simulated
            ? t("hostDashboard.payoutMethodSimulated")
            : t("hostDashboard.payoutMethodGeneric")
                .replace("{provider}", payouts.provider)
                .replace("{mode}", payouts.mode)}
        </p>
        <p className="mt-1 text-xs text-nexa-ink-4">
          {t("hostDashboard.payoutWalletNotEnabled")}
        </p>
      </div>

      <p
        className="mt-4 text-xs text-nexa-ink-3 leading-relaxed rounded-lg bg-amber-50 border border-amber-100 px-3 py-2"
        role="note"
      >
        {payouts.disclaimer || t("hostDashboard.payoutDisclaimerFallback")}
      </p>
    </section>
  );
}
