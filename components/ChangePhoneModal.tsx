"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { ErrorAlert } from "@/components/ui/Alert";
import { sendOtp } from "@/lib/auth-api";
import { changePhone } from "@/lib/kyc-api";
import { formatUserError } from "@/lib/errors";
import { normalizeMoroccanPhone, getLocalPhonePart } from "@/lib/validators";
import { cn } from "@/lib/utils";

type Step = "current_otp" | "new_phone" | "new_otp" | "done";

interface ChangePhoneModalProps {
  currentPhone: string;
  getToken: () => string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePhoneModal({
  currentPhone,
  getToken,
  onClose,
  onSuccess,
}: ChangePhoneModalProps) {
  const [step, setStep] = useState<Step>("current_otp");
  const [currentOtp, setCurrentOtp] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newOtp, setNewOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtpToCurrent = async () => {
    setError(null);
    setSendingOtp(true);
    try {
      await sendOtp(currentPhone);
      setStep("current_otp");
    } catch (err) {
      setError(formatUserError(err) || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSendOtpToNew = async () => {
    if (!newPhone.trim()) {
      setError("Enter new phone number");
      return;
    }
    const normalized = normalizeMoroccanPhone(newPhone);
    setError(null);
    setSendingOtp(true);
    try {
      await sendOtp(normalized);
      setNewPhone(normalized);
      setStep("new_otp");
    } catch (err) {
      setError(formatUserError(err) || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyCurrentAndNext = () => {
    if (!currentOtp.trim()) {
      setError("Enter OTP code");
      return;
    }
    setError(null);
    setStep("new_phone");
  };

  const handleSubmit = async () => {
    if (!currentOtp.trim() || !newPhone.trim() || !newOtp.trim()) {
      setError("Fill all fields");
      return;
    }
    const normalizedNew = normalizeMoroccanPhone(newPhone);
    setError(null);
    setSubmitting(true);
    try {
      await changePhone(
        {
          current_otp: currentOtp.trim(),
          new_phone_number: normalizedNew,
          new_otp: newOtp.trim(),
        },
        getToken
      );
      setStep("done");
      onSuccess();
      onClose();
    } catch (err) {
      setError(formatUserError(err) || "Failed to change phone");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-[22px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexa-line">
          <h2 className="text-lg font-semibold text-nexa-ink">Change phone number</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-nexa-ink-4 hover:text-nexa-ink rounded"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <ErrorAlert
              error={error}
              compact
              onDismiss={() => setError(null)}
            />
          )}

          {step === "current_otp" && (
            <>
              <div>
                <p className="text-sm text-nexa-ink-3 mb-2">We'll send a code to your current number:</p>
                <p className="font-medium text-nexa-ink">{currentPhone}</p>
              </div>
              <Button
                type="button"
                onClick={handleSendOtpToCurrent}
                disabled={sendingOtp}
                className="w-full"
              >
                {sendingOtp ? "Sending…" : "Send OTP"}
              </Button>
              <div>
                <label className="block text-sm font-medium text-nexa-ink mb-2">Enter OTP code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={currentOtp}
                  onChange={(e) => setCurrentOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-nexa-line text-nexa-ink placeholder:text-nexa-ink-4"
                />
              </div>
              <Button
                type="button"
                onClick={handleVerifyCurrentAndNext}
                disabled={currentOtp.length < 6}
                className="w-full"
              >
                Continue
              </Button>
            </>
          )}

          {step === "new_phone" && (
            <>
              <div>
                <label className="block text-sm font-medium text-nexa-ink mb-2">New phone number</label>
                <PhoneInput
                  value={getLocalPhonePart(newPhone)}
                  onChange={(v) => setNewPhone(v)}
                  placeholder="6 XX XX XX XX"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("current_otp")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSendOtpToNew}
                  disabled={sendingOtp || !newPhone.trim()}
                  className="flex-1"
                >
                  {sendingOtp ? "Sending…" : "Send OTP"}
                </Button>
              </div>
            </>
          )}

          {step === "new_otp" && (
            <>
              <div>
                <p className="text-sm text-nexa-ink-3 mb-2">Enter the code sent to:</p>
                <p className="font-medium text-nexa-ink">{normalizeMoroccanPhone(newPhone) || newPhone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-nexa-ink mb-2">OTP code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={newOtp}
                  onChange={(e) => setNewOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-nexa-line text-nexa-ink placeholder:text-nexa-ink-4"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("new_phone")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || newOtp.length < 6}
                  className="flex-1"
                >
                  {submitting ? "Updating…" : "Update phone"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
