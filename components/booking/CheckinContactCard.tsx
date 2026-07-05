"use client";

import React from "react";
import { Check, Lock, Phone } from "lucide-react";
import type { StaysBooking } from "@/lib/stays-types";
import { cn } from "@/lib/utils";

const REVEALED_STATUSES = new Set([
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
  "CHECKED_IN",
]);

function roleLabel(role?: string): string {
  switch ((role ?? "").toUpperCase()) {
    case "OWNER":
      return "Host";
    case "CO_HOST":
      return "Co-host";
    case "AGENT":
      return "Agent";
    default:
      return "";
  }
}

export function isCheckinDetailsRevealed(status: string): boolean {
  return REVEALED_STATUSES.has(status);
}

interface CheckinContactCardProps {
  booking: StaysBooking;
  t: (key: string) => string;
  className?: string;
}

export function CheckinContactCard({
  booking,
  t,
  className,
}: CheckinContactCardProps) {
  const revealed = isCheckinDetailsRevealed(booking.status);
  const contact = booking.listing?.check_in_contact;
  const contactName = contact?.full_name?.trim() ?? "";
  const phone = contact?.phone?.trim() ?? "";
  const address = booking.listing?.address?.trim() ?? "";
  const instructions =
    booking.listing?.check_in_instructions?.trim() ||
    contact?.access_instructions?.trim() ||
    "";
  const role = roleLabel(contact?.role);
  const hasDetails =
    contactName.length > 0 ||
    phone.length > 0 ||
    address.length > 0 ||
    instructions.length > 0;

  if (!revealed) {
    return (
      <div
        className={cn(
          "rounded-2xl border-[1.5px] border-amber-200 bg-amber-50 p-5",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-nexa-ink font-semibold text-sm">
          <Lock className="h-4 w-4 text-amber-600" />
          {t("bookings.contactDetails")}
        </div>
        <div className="my-3 border-t border-amber-200" />
        <div className="space-y-3">
          <MaskedRow />
          <MaskedRow width="w-28" />
          <MaskedRow width="w-44" />
        </div>
        <p className="mt-3 text-xs text-amber-800 leading-relaxed">
          {t("bookings.contactMaskedHint")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border-[1.5px] border-green-200 bg-green-50 p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600">
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        </span>
        <span className="font-semibold text-sm text-green-700">
          {hasDetails
            ? t("bookings.checkinDetails")
            : t("bookings.paymentConfirmed")}
        </span>
      </div>
      <div className="my-3 border-t border-green-200" />

      {!hasDetails ? (
        <p className="text-sm text-nexa-ink-3 leading-relaxed">
          {t("bookings.noCheckinDetailsYet")}
        </p>
      ) : (
        <div className="space-y-4">
          {contactName && (
            <DetailRow icon="👤" label={t("bookings.checkinContactLabel")}>
              <p className="font-semibold text-nexa-ink">{contactName}</p>
              {role && (
                <p className="text-xs text-nexa-ink-4 mt-0.5">{role}</p>
              )}
            </DetailRow>
          )}
          {phone && phone !== "[contact host]" && (
            <DetailRow icon="📞" label={t("bookings.phone")}>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="font-semibold text-nexa-primary underline underline-offset-2"
              >
                {phone}
              </a>
            </DetailRow>
          )}
          {address && (
            <DetailRow icon="📍" label={t("bookings.stayAddress")}>
              <p className="font-semibold text-nexa-ink">{address}</p>
            </DetailRow>
          )}
          {instructions && (
            <DetailRow icon="🔑" label={t("bookings.accessInstructions")}>
              <p className="text-sm text-nexa-ink-3 leading-relaxed">
                {instructions}
              </p>
            </DetailRow>
          )}
        </div>
      )}

      {phone && phone !== "[contact host]" && (
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-nexa-primary px-4 py-2.5 text-sm font-semibold text-nexa-primary hover:bg-nexa-primary-soft transition-colors"
        >
          <Phone className="h-4 w-4" />
          {t("bookings.callCheckinContact")}
        </a>
      )}
    </div>
  );
}

function MaskedRow({ width = "w-40" }: { width?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm opacity-60">•••</span>
      <div className={cn("h-3.5 rounded bg-gray-300", width)} />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-base shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-nexa-ink-4">
          {label}
        </p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
