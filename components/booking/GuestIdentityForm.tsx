"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/button";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { validateImageFile } from "@/lib/validators";
import { uploadOccupantIdDocument } from "@/lib/stays-api";
import { uploadDocument as uploadKycDocument } from "@/lib/kyc-api";
import type { GuestIdentityFormData, GuestGender } from "@/lib/booking-verification-types";
import { Upload, Check, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestIdentityFormProps {
  guest: GuestIdentityFormData;
  onChange: (guest: GuestIdentityFormData) => void;
  index: number;
  isPrimary: boolean;
  guestCount: number;
  getToken: () => string | null;
  t: (key: string) => string;
  compact?: boolean;
}

export function GuestIdentityForm({
  guest,
  onChange,
  index,
  isPrimary,
  guestCount,
  getToken,
  t,
  compact,
}: GuestIdentityFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const needsPhoneEmail = isPrimary || guest.gender === "MALE" || guest.gender === "PREFER_NOT_TO_SAY";

  const handleFileUpload = async (file: File, side: "front" | "back") => {
    const vr = validateImageFile(file);
    if (!vr.valid) {
      setUploadError(vr.error ?? "Invalid file");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      let assetId: string;
      try {
        const res = await uploadOccupantIdDocument(file, side, getToken());
        assetId = res.asset_id;
      } catch {
        const res = await uploadKycDocument(file, { side }, getToken);
        assetId = res.url || "";
      }
      if (side === "front") {
        onChange({ ...guest, id_document_front_asset_id: assetId });
      } else {
        onChange({ ...guest, id_document_back_asset_id: assetId });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-nexa-line bg-white p-5",
        compact && "p-4"
      )}
    >
      <h4 className="font-semibold text-nexa-ink mb-4 flex items-center gap-2">
        <User className="h-4 w-4" />
        {isPrimary ? t("bookingVerification.primaryGuest") : t("bookingVerification.guest").replace("{n}", String(index + 1))}
      </h4>

      {guestCount > 1 && !isPrimary && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-nexa-ink-2 mb-2">Gender (for required fields)</label>
          <NexaSelect
            variant="field"
            value={guest.gender ?? ""}
            onChange={(v) =>
              onChange({
                ...guest,
                gender: (v || undefined) as GuestGender | undefined,
              })
            }
            aria-label="Gender"
            options={[
              { value: "", label: "Select" },
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
            ]}
          />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-nexa-ink-2 mb-1">
            {t("bookingVerification.fullName")} <span className="text-nexa-primary">*</span>
          </label>
          <Input
            placeholder={t("bookingVerification.fullNamePlaceholder")}
            value={guest.full_name}
            onChange={(e) => onChange({ ...guest, full_name: e.target.value.trim() })}
          />
        </div>

        {needsPhoneEmail && (
          <>
            <div>
              <label className="block text-sm font-medium text-nexa-ink-2 mb-1">
                {t("bookingVerification.phone")} <span className="text-nexa-primary">*</span>
              </label>
              <PhoneInput
                value={guest.phone ?? ""}
                onChange={(v) => onChange({ ...guest, phone: v })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-nexa-ink-2 mb-1">
                {t("bookingVerification.email")} <span className="text-nexa-primary">*</span>
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={guest.email ?? ""}
                onChange={(e) => onChange({ ...guest, email: e.target.value.trim() })}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-nexa-ink-2 mb-1">
            {t("bookingVerification.idNumber")} <span className="text-nexa-primary">*</span>
          </label>
          <Input
            placeholder={t("bookingVerification.idNumberPlaceholder")}
            value={guest.id_number}
            onChange={(e) => onChange({ ...guest, id_number: e.target.value.trim() })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-nexa-ink-2 mb-2">
            {t("bookingVerification.idUpload")} <span className="text-nexa-primary">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <input
              ref={frontRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f, "front");
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => frontRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {guest.id_document_front_asset_id ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {guest.id_document_front_asset_id ? t("bookingVerification.uploaded") : t("bookingVerification.idUploadFront")}
            </Button>
          </div>
          {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}
        </div>
      </div>
    </div>
  );
}
