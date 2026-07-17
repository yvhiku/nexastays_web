"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StaysBooking } from "@/lib/stays-types";

function hoursUntil(dateOnly: string): number {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const checkin = new Date(y, (m || 1) - 1, d || 1);
  return (checkin.getTime() - Date.now()) / (1000 * 60 * 60);
}

function estimateRefund(booking: StaysBooking): number {
  const totalPaid = Number(booking.total_paid ?? booking.total_subtotal + (booking.guest_fee ?? 0));
  if (booking.status === "PAYMENT_PENDING" || booking.status === "INITIATED") return 0;

  const policy = booking.listing?.rules?.cancellation_policy ?? "MODERATE";
  const hours = hoursUntil(booking.checkin_date);
  if (policy === "FLEXIBLE") {
    if (hours >= 24) return totalPaid;
    return Math.max(0, Math.round((totalPaid - booking.total_subtotal * 0.1) * 100) / 100);
  }
  if (policy === "STRICT") {
    return hours >= 7 * 24 ? Math.round(totalPaid * 0.5 * 100) / 100 : 0;
  }
  if (hours >= 5 * 24) return totalPaid;
  if (hours >= 24) return Math.round(totalPaid * 0.5 * 100) / 100;
  return 0;
}

interface CancelBookingDialogProps {
  booking: StaysBooking | null;
  role: "guest" | "host";
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void> | void;
  t: (key: string) => string;
}

export function CancelBookingDialog({
  booking,
  role,
  open,
  loading = false,
  onClose,
  onConfirm,
  t,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const refundEstimate = useMemo(() => (booking ? estimateRefund(booking) : 0), [booking]);

  if (!open || !booking) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-nexa-card border border-nexa-line">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-nexa-ink-4 hover:bg-nexa-bg-2"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-nexa-ink">
              {t("bookings.cancelTitle")}
            </h2>
            <p className="mt-1 text-sm text-nexa-ink-3">
              {role === "host" ? t("bookings.hostCancelWarning") : t("bookings.guestCancelWarning")}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-nexa-bg-1 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-nexa-ink-3">{t("bookings.estimatedRefund")}</span>
            <span className="font-semibold text-nexa-ink">
              {refundEstimate.toFixed(2)} {booking.currency}
            </span>
          </div>
          <p className="mt-2 text-xs text-nexa-ink-4">
            {t("bookings.refundEstimateHint")}
          </p>
        </div>

        <label className="mt-5 block text-sm font-medium text-nexa-ink">
          {t("bookings.cancelReason")}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            className="mt-2 w-full rounded-2xl border border-nexa-line p-3 text-sm font-normal text-nexa-ink outline-none focus:border-nexa-primary"
            placeholder={t("bookings.cancelReasonPlaceholder")}
          />
        </label>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? t("myBookings.cancelling") : t("bookings.confirmCancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
