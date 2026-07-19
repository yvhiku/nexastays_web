"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  CalendarCheck,
  LogOut,
  CreditCard,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HostDashboardStats } from "@/lib/stays-types";

type TranslateFn = (key: string) => string;

interface HostTodayActionCenterProps {
  stats: HostDashboardStats;
  t: TranslateFn;
}

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HostTodayActionCenter({
  stats,
  t,
}: HostTodayActionCenterProps) {
  const checkins = stats.checkins_today ?? 0;
  const checkouts = stats.checkouts_tomorrow ?? 0;
  const awaiting = stats.awaiting_guest_payment ?? 0;
  const calIssues = stats.calendar_status?.listings_needing_attention ?? 0;
  const hasWork = checkins > 0 || checkouts > 0 || awaiting > 0 || calIssues > 0;

  const rows: Array<{
    key: string;
    ok: boolean;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    target?: string;
  }> = [
    {
      key: "checkins",
      ok: checkins === 0,
      icon: CalendarCheck,
      label:
        checkins === 0
          ? t("hostDashboard.actionNoCheckins")
          : t("hostDashboard.actionCheckinsToday").replace(
              "{count}",
              String(checkins),
            ),
      target: "host-bookings",
    },
    {
      key: "checkouts",
      ok: checkouts === 0,
      icon: LogOut,
      label:
        checkouts === 0
          ? t("hostDashboard.actionNoCheckouts")
          : t("hostDashboard.actionCheckoutsTomorrow").replace(
              "{count}",
              String(checkouts),
            ),
      target: "host-bookings",
    },
    {
      key: "payment",
      ok: awaiting === 0,
      icon: CreditCard,
      label:
        awaiting === 0
          ? t("hostDashboard.actionNoAwaitingPayment")
          : t("hostDashboard.actionAwaitingPayment").replace(
              "{count}",
              String(awaiting),
            ),
      target: "host-bookings",
    },
    {
      key: "calendar",
      ok: calIssues === 0,
      icon: Link2,
      label:
        calIssues === 0
          ? t("hostDashboard.actionCalendarOk")
          : t("hostDashboard.actionCalendarIssue").replace(
              "{count}",
              String(calIssues),
            ),
      target: "host-calendar-sync",
    },
  ];

  return (
    <section className="mb-8 rounded-2xl border border-nexa-line bg-white overflow-hidden">
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-nexa-ink mb-1">
          {t("hostDashboard.todayActions")}
        </h2>
        <p className="text-sm text-nexa-ink-3 mb-5">
          {t("hostDashboard.todayActionsDesc")}
        </p>

        {!hasWork ? (
          <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {t("hostDashboard.todayAllClear")}
          </div>
        ) : (
          <ul className="space-y-0 divide-y divide-nexa-line">
            {rows.map((row) => {
              const Icon = row.ok ? CheckCircle2 : AlertTriangle;
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => row.target && scrollToId(row.target)}
                    className="w-full flex items-center gap-3 py-3.5 text-left hover:bg-nexa-bg/40 transition-colors -mx-1 px-1 rounded-lg"
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        row.ok ? "text-green-600" : "text-amber-600",
                      )}
                    />
                    <row.icon className="h-4 w-4 text-nexa-ink-4 shrink-0" />
                    <span className="text-sm font-medium text-nexa-ink flex-1">
                      {row.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => scrollToId("host-bookings")}
          className="mt-5 text-sm font-semibold text-nexa-primary hover:underline"
        >
          {t("hostDashboard.viewBookingsLink")}
        </button>
      </div>
    </section>
  );
}
