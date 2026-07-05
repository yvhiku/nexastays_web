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
import { Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [useProfileSync, setUseProfileSync] = useState(!!userProfile?.full_name);
  const [acknowledgeName, setAcknowledgeName] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [guests, setGuests] = useState<GuestIdentityFormData[]>([]);

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
      setUseProfileSync(!!userProfile?.full_name);
      setAcknowledgeName(false);
      setValidationError(null);
    }
  }, [open, guestCount, userProfile, initGuests]);

  const syncFromProfile = useCallback(() => {
    if (!userProfile) return;
    setGuests((prev) => {
      const next = [...prev];
      if (next[0]) {
        next[0] = {
          ...next[0],
          full_name: userProfile.full_name ?? next[0].full_name,
          phone: userProfile.phone_number ?? next[0].phone,
          email: userProfile.email ?? next[0].email,
        };
      }
      return next;
    });
  }, [userProfile]);

  const handleSyncToggle = () => {
    const next = !useProfileSync;
    setUseProfileSync(next);
    if (next) syncFromProfile();
  };

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

    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const v = validateGuestIdentity(g, i);
      if (!v.valid) {
        setValidationError(v.error ?? "Invalid guest data");
        scrollToError();
        return;
      }
    }

    const idErr = validateIdDocumentUploaded(guests);
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
          <p className="text-nexa-ink-3 text-sm">{t("bookingVerification.subtitle")}</p>

          <div className="rounded-xl bg-nexa-primary-soft border border-nexa-primary/20 p-4">
            <h3 className="font-semibold text-nexa-ink mb-1">{t("bookingVerification.whyTitle")}</h3>
            <p className="text-sm text-nexa-ink-3">{t("bookingVerification.whyDesc")}</p>
          </div>

          {userProfile?.full_name && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useProfileSync}
                onChange={handleSyncToggle}
                className="mt-1 rounded border-nexa-line"
              />
              <span className="text-sm">
                <strong>{t("bookingVerification.syncProfile")}</strong>
                <br />
                <span className="text-nexa-ink-4">{t("bookingVerification.syncProfileDesc")}</span>
              </span>
            </label>
          )}

          <div className="space-y-4">
            <p className="text-sm font-medium text-nexa-ink-2">
              {guestCount === 1
                ? t("bookingVerification.primaryGuest")
                : t("bookingVerification.allGuestsRequired").replace("{count}", String(guestCount))}
            </p>
            {guests.map((g, i) => (
              <GuestIdentityForm
                key={i}
                guest={g}
                onChange={(data) => updateGuest(i, data)}
                index={i}
                isPrimary={i === 0}
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
