"use client";

import React from "react";
import Link from "next/link";
import type { VerificationStatus } from "@/lib/booking-verification-types";
import { AlertCircle, Clock, CheckCircle, XCircle, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationStatusBannerProps {
  status: VerificationStatus;
  message?: string;
  onCompleteVerificationHref?: string;
  t: (key: string) => string;
  localePath: (path: string) => string;
  className?: string;
}

const statusConfig: Record<
  VerificationStatus,
  { icon: React.ElementType; bg: string; text: string; border: string }
> = {
  PENDING_VERIFICATION: {
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  UNDER_REVIEW: {
    icon: AlertCircle,
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  APPROVED: {
    icon: CheckCircle,
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
  },
  REJECTED: {
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
  BLOCKED: {
    icon: ShieldOff,
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
};

export function VerificationStatusBanner({
  status,
  message,
  onCompleteVerificationHref,
  t,
  localePath,
  className,
}: VerificationStatusBannerProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const statusLabels: Record<VerificationStatus, string> = {
    PENDING_VERIFICATION: t("bookingVerification.pendingVerification"),
    UNDER_REVIEW: t("bookingVerification.underReview"),
    APPROVED: t("bookingVerification.approved"),
    REJECTED: t("bookingVerification.rejected"),
    BLOCKED: t("bookingVerification.blocked"),
  };

  const statusDesc: Record<VerificationStatus, string> = {
    PENDING_VERIFICATION: t("bookingVerification.blockedDesc"),
    UNDER_REVIEW: message ?? t("bookingVerification.underReview"),
    APPROVED: message ?? "",
    REJECTED: message ?? "",
    BLOCKED: t("bookingVerification.blockedDesc"),
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-start gap-3",
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{statusLabels[status]}</p>
        {statusDesc[status] && (
          <p className="text-sm mt-0.5 opacity-90">{statusDesc[status]}</p>
        )}
        {onCompleteVerificationHref && (status === "PENDING_VERIFICATION" || status === "BLOCKED") && (
          <Link
            href={localePath(onCompleteVerificationHref)}
            className="text-sm font-medium underline mt-2 inline-block hover:opacity-80"
          >
            {t("bookingVerification.completeVerification")}
          </Link>
        )}
      </div>
    </div>
  );
}
