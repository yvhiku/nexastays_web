"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GuestIdentityForm } from "./GuestIdentityForm";
import {
  validateGuestIdentity,
  validateGuestCountMatch,
  validateIdDocumentUploaded,
} from "@/lib/booking-verification-validators";
import type { GuestIdentityFormData } from "@/lib/booking-verification-types";
import type { CreateBookingOccupantDto } from "@/lib/stays-types";
import { Shield, X, BadgeCheck } from "lucide-react";

interface GuestVerificationStepProps {
  open: boolean;
  onClose: () => void;
  guestCount: number;
  userProfile?: { full_name?: string; phone_number?: string; email?: string } | null;
  onConfirm: (occupants: CreateBookingOccupantDto[], acknowledgeName: boolean) => void;
  submitting: boolean;
  t: (key: string) => string;
  getToken: () => string | null;
}

function toOccupantDto(g: GuestIdentityFormData): CreateBookingOccupantDto {
  return {
    full_name: g.full_name,
    id_number: g.id_number || undefined,
    is_primary: g.is_primary,
    phone: g.phone || undefined,
    email: g.email || undefined,
    gender: g.gender,
    id_document_front_asset_id: g.id_document_front_asset_id,
    id_document_back_asset_id: g.id_document_back_asset_id,
  };
}

export function GuestVerificationStep({
  open,
  onClose,
  guestCount,
  userProfile,
  onConfirm,
  submitting,
  t,
  getToken,
}: GuestVerificationStepProps) {
  const [acknowledgeName, setAcknowledgeName] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestIdentityFormData[]>([]);

  const hasVerifiedProfile = !!(userProfile?.full_name && userProfile.full_name.trim().length >= 2);
  const skipIdForVerifiedPrimary = hasVerifiedProfile;

  const initGuests = useCallback(() => {
    const primary: GuestIdentityFormData = {
      full_name: userProfile?.full_name ?? "",
      phone: userProfile?.phone_number ?? undefined,
      email: userProfile?.email ?? undefined,
      id_number: "",
      is_primary: true,
    };
    const rest = Array.from({ length: Math.max(0, guestCount - 1) }, (): GuestIdentityFormData => ({
      full_name: "",
      id_number: "",
      is_primary: false,
      gender: undefined,
    }));
    return [primary, ...rest];
  }, [guestCount, userProfile]);

  useEffect(() => {
    if (open) {
      setGuests(initGuests());
      setAcknowledgeName(false);
      setValidationError(null);
    }
  }, [open, guestCount, userProfile, initGuests]);

  const updateGuest = (index: number, data: GuestIdentityFormData) => {
    setGuests((prev) => {
      const next = [...prev];
      next[index] = data;
      return next;
    });
  };

  const errorRef = React.useRef<HTMLDivElement>(null);
  const scrollToError = () => {
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const countErr = validateGuestCountMatch(guestCount, guests);
    if (!countErr.valid) {
      setValidationError(countErr.error ?? "Guest count mismatch");
      scrollToError();
      return;
    }

    const opts = { skipIdForVerifiedPrimary };
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const v = validateGuestIdentity(g, i, opts);
      if (!v.valid) {
        setValidationError(v.error ?? "Invalid guest data");
        scrollToError();
        return;
      }
    }

    const idErr = validateIdDocumentUploaded(guests, opts);
    if (!idErr.valid) {
      setValidationError(idErr.error ?? "ID document upload required");
      scrollToError();
      return;
    }

    if (!acknowledgeName) {
      setValidationError("Please confirm that all names match official identification.");
      scrollToError();
      return;
    }

    const occupants = guests.map(toOccupantDto);
    onConfirm(occupants, acknowledgeName);
  };

  if (!open) return null;

  const additionalGuests = guests.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-verification-title"
      >
        <div className="sticky top-0 bg-white border-b border-nexa-line px-6 py-4 flex items-center justify-between">
          <h2 id="guest-verification-title" className="text-xl font-bold text-nexa-ink flex items-center gap-2">
            <Shield className="h-5 w-5 text-nexa-primary" />
            {t("bookingVerification.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-nexa-bg-1 text-nexa-ink-4"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-nexa-ink-3 text-sm">
            {hasVerifiedProfile && guestCount > 1
              ? t("bookingVerification.subtitleAdditionalOnly")
              : t("bookingVerification.subtitle")}
          </p>

          <div className="space-y-4">
            {hasVerifiedProfile && guests[0] && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <h4 className="font-semibold text-nexa-ink mb-2 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  {t("bookingVerification.verifiedPrimary")}
                </h4>
                <p className="font-medium text-nexa-ink">{guests[0].full_name}</p>
                {guests[0].phone && (
                  <p className="text-sm text-nexa-ink-3 mt-1">{guests[0].phone}</p>
                )}
                {guests[0].email && (
                  <p className="text-sm text-nexa-ink-3">{guests[0].email}</p>
                )}
                <p className="text-xs text-emerald-700 mt-2">
                  {t("bookingVerification.verifiedPrimaryHint")}
                </p>
              </div>
            )}

            {!hasVerifiedProfile && guests[0] && (
              <GuestIdentityForm
                guest={guests[0]}
                onChange={(data) => updateGuest(0, data)}
                index={0}
                isPrimary
                guestCount={guestCount}
                getToken={getToken}
                t={t}
              />
            )}

            {additionalGuests.length > 0 && (
              <p className="text-sm font-medium text-nexa-ink-2">
                {t("bookingVerification.additionalGuestsRequired").replace(
                  "{count}",
                  String(additionalGuests.length),
                )}
              </p>
            )}

            {additionalGuests.map((g, i) => (
              <GuestIdentityForm
                key={i + 1}
                guest={g}
                onChange={(data) => updateGuest(i + 1, data)}
                index={i + 1}
                isPrimary={false}
                guestCount={guestCount}
                getToken={getToken}
                t={t}
              />
            ))}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledgeName}
              onChange={(e) => setAcknowledgeName(e.target.checked)}
              className="mt-1 rounded border-nexa-line"
            />
            <span className="text-sm text-nexa-ink-3">{t("bookingVerification.acknowledgeName")}</span>
          </label>

          {validationError && (
            <div
              ref={errorRef}
              className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800"
              role="alert"
            >
              {validationError}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="sm:w-auto w-full">
              {t("bookingVerification.backToDates")}
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? t("common.loading") : t("bookingVerification.continueToBook")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
