"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getHostVerification,
  submitHostVerification,
  uploadHostDocumentFront,
  uploadHostDocumentBack,
  uploadHostSelfie,
  normalizeHostVerificationStatus,
} from "@/lib/stays-api";
import { sendOtp, verifyOtp } from "@/lib/auth-api";
import { validateEmail } from "@/lib/validators";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu } from "lucide-react";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { AppLoader } from "@/components/AppLoader";

const hostStepKeys = [
  "host.hostType",
  "host.createAccount",
  "host.confirmContact",
  "host.identityVerification",
] as const;

const totalSteps = hostStepKeys.length;

const progressWidths: Record<number, number> = {
  1: 25, 2: 50, 3: 75, 4: 100,
};

function HostVerificationStep({
  token,
  isAuthenticated,
  user,
  hostStatus,
  hostLoading,
  hostSubmitLoading,
  hostError,
  docType,
  docNumber,
  docFrontAssetId,
  docBackAssetId,
  selfieAssetId,
  docFrontLoading,
  docBackLoading,
  selfieLoading,
  onDocTypeChange,
  onDocNumberChange,
  onDocFrontUpload,
  onDocBackUpload,
  onSelfieUpload,
  onLoadStatus,
  onSubmit,
  onSubmitUseExistingKyc,
  onBack,
  onLoginRedirect,
}: {
  token: string | null;
  isAuthenticated: boolean;
  user: { kyc_status?: string } | null;
  hostStatus: { status: string; message?: string } | null;
  hostLoading: boolean;
  hostSubmitLoading: boolean;
  hostError: string | null;
  docType: string;
  docNumber: string;
  docFrontAssetId: string | null;
  docBackAssetId: string | null;
  selfieAssetId: string | null;
  docFrontLoading: boolean;
  docBackLoading: boolean;
  selfieLoading: boolean;
  onDocTypeChange: (v: string) => void;
  onDocNumberChange: (v: string) => void;
  onDocFrontUpload: (file: File) => void;
  onDocBackUpload: (file: File) => void;
  onSelfieUpload: (file: File) => void;
  onLoadStatus: () => void;
  onSubmit: () => Promise<void>;
  onSubmitUseExistingKyc: () => Promise<void>;
  onBack: () => void;
  onLoginRedirect: () => void;
}) {
  useEffect(() => {
    if (isAuthenticated && token) onLoadStatus();
  }, [isAuthenticated, token]);

  if (!isAuthenticated || !token) {
    return (
      <div>
        <span className="text-xs font-semibold uppercase text-nexa-primary">Step 4 of {totalSteps}</span>
        <h2 className="text-2xl font-semibold mt-2 mb-2">Identity Verification</h2>
        <p className="text-nexa-ink-3 mb-8">
          Sign in or create an account to submit your host application.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onBack}>← Back</Button>
          <Button onClick={onLoginRedirect}>Sign in to continue</Button>
        </div>
      </div>
    );
  }

  const kycApproved = (user?.kyc_status || "").toUpperCase() === "APPROVED" || (user?.kyc_status || "").toUpperCase() === "VERIFIED";

  return (
    <div>
      <span className="text-xs font-semibold uppercase text-nexa-primary">Step 4 of {totalSteps}</span>
      <h2 className="text-2xl font-semibold mt-2 mb-2">Verify your identity</h2>
      <p className="text-nexa-ink-3 mb-6">
        This protects guests and property owners. Required to become a host.
      </p>
      {hostLoading ? (
        <div className="py-8 text-center text-nexa-ink-4">Loading status…</div>
      ) : (
        <>
          {kycApproved && (
            <div className="mb-6 p-5 rounded-xl bg-nexa-primary-soft border border-nexa-primary/20">
              <h3 className="font-semibold text-nexa-ink mb-2">Use your verified identity</h3>
              <p className="text-sm text-nexa-ink-3 mb-4">
                Your identity is already verified (name, phone, email, date of birth). We&apos;ll use the same information for your host application — no need to re-upload documents.
              </p>
              <Button onClick={onSubmitUseExistingKyc} disabled={hostSubmitLoading} className="w-full sm:w-auto">
                {hostSubmitLoading ? "Applying…" : "Apply as Host with My Verified Identity"}
              </Button>
            </div>
          )}
          {kycApproved && (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-nexa-line" />
              <span className="text-xs font-medium text-nexa-ink-4">Or submit new documents</span>
              <div className="flex-1 h-px bg-nexa-line" />
            </div>
          )}
          {hostError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-sm">{hostError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
            <div>
              <label className="block text-sm font-semibold mb-2">ID Type *</label>
              <select
                value={docType}
                onChange={(e) => onDocTypeChange(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-nexa-line bg-white px-4 py-3 text-sm"
              >
                <option value="CNIE">CNIE</option>
                <option value="PASSPORT">Passport</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">ID Number</label>
              <Input
                placeholder="Your ID number"
                value={docNumber}
                onChange={(e) => onDocNumberChange(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
            <label className="border-2 border-dashed border-nexa-line rounded-xl p-6 sm:p-7 text-center cursor-pointer hover:border-nexa-primary hover:bg-nexa-primary-soft transition-colors min-h-[120px] flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onDocFrontUpload(f);
                  e.target.value = "";
                }}
              />
              <div className="text-3xl mb-2">📄</div>
              <div className="text-sm text-nexa-ink-4">
                {docFrontLoading ? "Uploading…" : docFrontAssetId ? "✓ ID Front uploaded" : "ID Front *"}
              </div>
            </label>
            <label className="border-2 border-dashed border-nexa-line rounded-xl p-6 sm:p-7 text-center cursor-pointer hover:border-nexa-primary hover:bg-nexa-primary-soft transition-colors min-h-[120px] flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onDocBackUpload(f);
                  e.target.value = "";
                }}
              />
              <div className="text-3xl mb-2">📄</div>
              <div className="text-sm text-nexa-ink-4">
                {docBackLoading ? "Uploading…" : docBackAssetId ? "✓ ID Back uploaded" : "ID Back *"}
              </div>
            </label>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Profile Photo *</label>
            <label className="block border-2 border-dashed border-nexa-line rounded-xl p-7 text-center cursor-pointer hover:border-nexa-primary hover:bg-nexa-primary-soft transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onSelfieUpload(f);
                  e.target.value = "";
                }}
              />
              <div className="text-3xl mb-2">🤳</div>
              <div className="text-sm text-nexa-ink-3">
                {selfieLoading ? "Uploading…" : selfieAssetId ? "✓ Selfie uploaded" : "Clear face photo"}
              </div>
            </label>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>← Back</Button>
            <Button onClick={onSubmit} disabled={hostSubmitLoading}>
              {hostSubmitLoading ? "Submitting…" : "Submit Application →"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function HostPage() {
  const router = useRouter();
  const { t, localePath } = useLanguage();
  const { token, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [hostType, setHostType] = useState<"apartment" | "hotel">("apartment");
  const [hostStatus, setHostStatus] = useState<{ status: string; message?: string } | null>(null);
  const [hostLoading, setHostLoading] = useState(false);
  const [hostSubmitLoading, setHostSubmitLoading] = useState(false);
  const [hostError, setHostError] = useState<string | null>(null);
  const [docType, setDocType] = useState("CNIE");
  const [docNumber, setDocNumber] = useState("");
  const [docFrontAssetId, setDocFrontAssetId] = useState<string | null>(null);
  const [docBackAssetId, setDocBackAssetId] = useState<string | null>(null);
  const [selfieAssetId, setSelfieAssetId] = useState<string | null>(null);
  const [docFrontLoading, setDocFrontLoading] = useState(false);
  const [docBackLoading, setDocBackLoading] = useState(false);
  const [selfieLoading, setSelfieLoading] = useState(false);
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const hostTypeApi = hostType === "hotel" ? "HOTEL" : "APARTMENT";

  useEffect(() => {
    if (!user) return;
    setFullName((prev) => prev || user.full_name?.trim() || "");
    setEmail((prev) => prev || user.email?.trim() || "");
    setPhone((prev) => prev || user.phone_number?.trim() || "");
  }, [user]);

  const buildSubmitPayload = (useExistingKyc: boolean) => ({
    full_name: fullName.trim() || user?.full_name,
    email: email.trim() || user?.email,
    phone: phone.trim() || user?.phone_number,
    host_type: hostTypeApi,
    hosting_policies_accepted: termsAccepted,
    use_existing_kyc: useExistingKyc,
    identity_reused: useExistingKyc,
    submitted_from: "WEB_BECOME_HOST",
    ...(useExistingKyc
      ? {}
      : {
          document_type: docType,
          document_number_hash: docNumber ? btoa(docNumber).slice(0, 64) : undefined,
          document_front_asset_id: docFrontAssetId ?? undefined,
          document_back_asset_id: docBackAssetId ?? undefined,
          selfie_asset_id: selfieAssetId ?? undefined,
        }),
  });

  const isApplicationPendingOrApproved = (s: { status?: string; application_status?: string }) => {
    const n = normalizeHostVerificationStatus(s as Parameters<typeof normalizeHostVerificationStatus>[0]);
    return (
      n.status === "APPROVED" ||
      n.status === "PENDING" ||
      n.application_status === "PENDING" ||
      n.application_status === "APPROVED"
    );
  };

  // Load host status on mount. If the user has already applied (or is approved),
  // show the confirmation screen instead of the application form.
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setStatusChecked(true);
      return;
    }
    setHostLoading(true);
    getHostVerification(token)
      .then((s) => {
        setHostStatus(s);
        if (isApplicationPendingOrApproved(s)) {
          setApplicationSubmitted(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        setHostLoading(false);
        setStatusChecked(true);
      });
  }, [isAuthenticated, token]);

  // Approved hosts use the dashboard — don't show the application flow again.
  useEffect(() => {
    if (!statusChecked || !hostStatus) return;
    const normalized = normalizeHostVerificationStatus(
      hostStatus as Parameters<typeof normalizeHostVerificationStatus>[0],
    );
    if (normalized.status === "APPROVED") {
      router.replace(localePath("/host/dashboard"));
    }
  }, [statusChecked, hostStatus, router, localePath]);

  const goToStep = (target: number) => {
    if (target > step) return;
    setStep(target);
    setMobileStepsOpen(false);
    setStep2Error(null);
    setStep3Error(null);
  };

  const handleStep1Continue = () => {
    if (!hostType) {
      return;
    }
    setStep(2);
  };

  const handleStep2Continue = () => {
    if (!termsAccepted) {
      setStep2Error("You must agree to the Terms and Privacy Policy to continue.");
      return;
    }
    if (!fullName.trim()) {
      setStep2Error("Full legal name is required.");
      return;
    }
    if (!phone.trim()) {
      setStep2Error("Phone number is required.");
      return;
    }
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setStep2Error(emailCheck.error ?? "Valid email is required.");
      return;
    }
    setStep2Error(null);
    setStep(3);
  };

  const handleSendSmsCode = async () => {
    if (!phone.trim()) {
      setStep3Error("Enter your phone number in step 2 first.");
      return;
    }
    setStep3Error(null);
    try {
      await sendOtp(phone);
      setSmsCodeSent(true);
    } catch (e) {
      setStep3Error(e instanceof Error ? e.message : "Failed to send SMS code");
    }
  };

  const handleSendEmailCode = async () => {
    // Email delivery is not wired yet — confirmation is re-typing the address.
    setEmailCodeSent(true);
    setStep3Error(null);
  };

  const handleStep3Continue = async () => {
    if (!smsCodeSent || smsCode.trim().length < 4) {
      setStep3Error("Request an SMS code and enter it to verify your phone.");
      return;
    }
    if (email.trim().toLowerCase() !== emailCode.trim().toLowerCase()) {
      setStep3Error("Re-enter your email address exactly to confirm it.");
      return;
    }
    setStep3Error(null);
    try {
      const result = await verifyOtp(phone, smsCode.trim());
      if (!result.verified) {
        setStep3Error("Invalid or expired SMS code. Request a new code and try again.");
        return;
      }
      setStep(4);
    } catch (e) {
      setStep3Error(e instanceof Error ? e.message : "Phone verification failed");
    }
  };

  const resolvedHostStatus = hostStatus
    ? normalizeHostVerificationStatus(
        hostStatus as Parameters<typeof normalizeHostVerificationStatus>[0],
      )
    : null;
  const isApproved = resolvedHostStatus?.status === "APPROVED";

  const stepsContent = (
    <>
      <Link href={localePath("/")} className="flex items-center gap-2.5 mb-6 lg:mb-10 cursor-pointer hover:opacity-90">
        <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
          <Image src={NEXA_STAYS_LOGO_SRC} alt="Nexa Stays" fill sizes="36px" className="object-cover" />
        </div>
        <span className="font-display text-xl font-bold text-white">{t("hostApply.title")}</span>
      </Link>
      <div className="mb-6 lg:mb-8">
        <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">{t("hostApply.progress")}</div>
        <div className="h-1 bg-white/15 rounded-sm">
          <div className="h-full rounded-sm bg-gradient-to-r from-nexa-primary to-nexa-primary-light transition-all duration-400" style={{ width: `${progressWidths[step] ?? 0}%` }} />
        </div>
      </div>
      <nav className="flex flex-col gap-1.5">
        {hostStepKeys.map((labelKey, i) => (
          <button
            key={labelKey}
            type="button"
            onClick={() => goToStep(i + 1)}
            disabled={i + 1 > step}
            className={cn(
              "flex items-center gap-3 py-2.5 px-3.5 rounded-xl transition-colors text-left min-h-[44px]",
              step === i + 1 ? "bg-nexa-primary/20" : "hover:bg-white/5",
              i + 1 > step && "opacity-50 cursor-not-allowed hover:bg-transparent",
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[0.78rem] font-bold border shrink-0",
              step > i + 1 ? "border-nexa-primary bg-nexa-primary text-white" : step === i + 1 ? "border-nexa-primary text-nexa-primary bg-nexa-primary/15" : "border-white/20 text-white/40"
            )}>{step > i + 1 ? "✓" : i + 1}</div>
            <span className={cn("text-sm", step === i + 1 ? "text-white font-semibold" : "text-white/50", step > i + 1 && "text-white/70")}>{t(labelKey)}</span>
          </button>
        ))}
      </nav>
      <div className="mt-6 bg-white/5 rounded-xl p-4 text-xs text-white/50">
        <strong className="text-white/80 block mb-1">🔒 {t("hostApply.privacyTitle")}</strong>
        {t("hostApply.privacyNote")}
      </div>
    </>
  );

  if (statusChecked && isApproved) {
    return (
      <>
        <NavBar />
        <main className="pt-[72px] min-h-screen flex items-center justify-center">
          <AppLoader />
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen grid grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="hidden lg:block bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-10 overflow-y-auto sticky top-[72px] h-[calc(100vh-72px)]">
          {stepsContent}
        </aside>

        {/* Mobile steps button */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setMobileStepsOpen(true)}
            className="flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-full bg-nexa-ink text-white shadow-lg font-semibold text-sm"
          >
            <Menu className="h-4 w-4" />
            Step {step} of {totalSteps}
          </button>
        </div>

        {/* Mobile steps drawer */}
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
            mobileStepsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-hidden={!mobileStepsOpen}
        >
          <div className="absolute inset-0 bg-nexa-ink/60" onClick={() => setMobileStepsOpen(false)} />
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 max-h-[85vh] bg-gradient-to-br from-nexa-ink to-nexa-ink-2 rounded-t-2xl p-6 overflow-y-auto transition-transform duration-300",
              mobileStepsOpen ? "translate-y-0" : "translate-y-full"
            )}
          >
            {stepsContent}
          </div>
        </div>

        <div className="bg-nexa-bg py-8 sm:py-10 lg:py-12 px-4 sm:px-6 md:px-10 lg:px-20 pb-20 lg:pb-16">
          <div className="max-w-[600px]">
            {!statusChecked && token && (
              <div className="py-12 text-center text-nexa-ink-4">Loading…</div>
            )}

            {statusChecked && applicationSubmitted && (
              <div className="text-center py-8">
                <div className={cn(
                  "inline-flex w-16 h-16 rounded-full items-center justify-center text-3xl mb-6",
                  isApproved ? "bg-green-100" : "bg-amber-100"
                )}>{isApproved ? "✓" : "⏳"}</div>
                <h2 className="text-2xl font-semibold text-nexa-ink mb-2">
                  {isApproved ? t("hostApply.approvedTitle") : t("hostApply.submittedTitle")}
                </h2>
                <p className="text-nexa-ink-3 mb-6 max-w-md mx-auto">
                  {isApproved ? t("hostApply.approvedDesc") : t("hostApply.submittedDesc")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href={localePath("/host/listings/new")}>{t("hostDashboard.addListing")}</Link>
                  </Button>
                  <Button asChild>
                    <Link href={localePath("/host/dashboard")}>Go to dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={localePath("/")}>Back to home</Link>
                  </Button>
                </div>
              </div>
            )}

            {statusChecked && !applicationSubmitted && step === 1 && (
              <div>
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary">
                  Step 1 of {totalSteps}
                </span>
                <h2 className="text-2xl font-semibold mt-2 mb-2">
                  {t("hostApply.step1Title")}
                </h2>
                <p className="text-nexa-ink-3 mb-4">
                  {t("hostApply.step1Subtitle")}
                </p>
                <p className="text-sm text-nexa-ink-4 mb-8 rounded-lg bg-nexa-bg-2 px-3 py-2">
                  {t("hostApply.launchNote")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setHostType("apartment")}
                    className={cn(
                      "border-2 rounded-[22px] p-7 text-center cursor-pointer transition-all",
                      hostType === "apartment"
                        ? "border-nexa-primary bg-nexa-primary-soft"
                        : "border-nexa-line hover:border-nexa-primary"
                    )}
                  >
                    <div className="text-4xl mb-3">🏠</div>
                    <h3 className="font-semibold mb-1">{t("hostApply.step1ApartmentTitle")}</h3>
                    <p className="text-sm text-nexa-ink-3">
                      {t("hostApply.step1ApartmentDesc")}
                    </p>
                  </button>
                  <button
                    onClick={() => setHostType("hotel")}
                    className={cn(
                      "border-2 rounded-[22px] p-7 text-center cursor-pointer transition-all",
                      hostType === "hotel"
                        ? "border-nexa-primary bg-nexa-primary-soft"
                        : "border-nexa-line hover:border-nexa-primary"
                    )}
                  >
                    <div className="text-4xl mb-3">🏨</div>
                    <h3 className="font-semibold mb-1">{t("hostApply.step1HotelTitle")}</h3>
                    <p className="text-sm text-nexa-ink-3">{t("hostApply.step1HotelDesc")}</p>
                  </button>
                </div>
                <Button onClick={handleStep1Continue}>Continue →</Button>
              </div>
            )}

            {statusChecked && !applicationSubmitted && step === 2 && (
              <div>
                <span className="text-xs font-semibold uppercase text-nexa-primary">
                  Step 2 of {totalSteps}
                </span>
                <h2 className="text-2xl font-semibold mt-2 mb-2">
                  {t("hostApply.step2Title")}
                </h2>
                <p className="text-nexa-ink-3 mb-8">
                  {t("hostApply.step2Subtitle")}
                </p>
                <div className="space-y-5 mb-8">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Full Legal Name <span className="text-nexa-primary">*</span>
                    </label>
                    <Input
                      placeholder="As on your ID"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Phone <span className="text-nexa-primary">*</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="+212 6 XX XX XX XX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Email <span className="text-nexa-primary">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (e.target.checked) setStep2Error(null);
                      }}
                      className="accent-nexa-primary mt-1"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href={localePath("/terms")} className="text-nexa-primary hover:underline">
                        Terms
                      </Link>{" "}
                      &{" "}
                      <Link href={localePath("/privacy")} className="text-nexa-primary hover:underline">
                        Privacy
                      </Link>{" "}
                      <span className="text-nexa-primary">*</span>
                    </span>
                  </label>
                  {step2Error && (
                    <p className="text-sm text-red-600" role="alert">
                      {step2Error}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => goToStep(1)}>
                    ← Back
                  </Button>
                  <Button onClick={handleStep2Continue} disabled={!termsAccepted}>
                    Continue →
                  </Button>
                </div>
              </div>
            )}

            {statusChecked && !applicationSubmitted && step === 3 && (
              <div>
                <span className="text-xs font-semibold uppercase text-nexa-primary">Step 3 of {totalSteps}</span>
                <h2 className="text-2xl font-semibold mt-2 mb-2">{t("hostApply.step3Title")}</h2>
                <p className="text-nexa-ink-3 mb-6">
                  {t("hostApply.step3Subtitle")}
                </p>
                <p className="text-sm text-nexa-ink-4 mb-6 rounded-lg bg-nexa-bg-2 px-3 py-2">
                  Verify your phone with the SMS code from Nexa Identity, then re-enter your email to confirm it.
                </p>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-nexa-ink mb-1">SMS verification code</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit code"
                      value={smsCode}
                      onChange={(e) => {
                        setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setStep3Error(null);
                      }}
                      maxLength={6}
                      className="max-w-[200px]"
                    />
                    <button
                      type="button"
                      className="text-xs text-nexa-primary mt-1 hover:underline"
                      onClick={handleSendSmsCode}
                    >
                      {smsCodeSent ? "Code sent — resend" : "Send code"}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-nexa-ink mb-1">Confirm email address</label>
                    <Input
                      type="email"
                      placeholder={email || "you@example.com"}
                      value={emailCode}
                      onChange={(e) => {
                        setEmailCode(e.target.value);
                        setStep3Error(null);
                      }}
                      className="max-w-md"
                    />
                    <button
                      type="button"
                      className="text-xs text-nexa-primary mt-1 hover:underline"
                      onClick={handleSendEmailCode}
                    >
                      {emailCodeSent ? "Email noted for account" : "Confirm email on file"}
                    </button>
                  </div>
                  {step3Error && (
                    <p className="text-sm text-red-600" role="alert">
                      {step3Error}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => goToStep(2)}>← Back</Button>
                  <Button
                    onClick={handleStep3Continue}
                    disabled={smsCode.length < 4 || !emailCode.trim()}
                  >
                    Continue →
                  </Button>
                </div>
              </div>
            )}

            {statusChecked && !applicationSubmitted && step === 4 && (
              <HostVerificationStep
                token={token}
                isAuthenticated={isAuthenticated}
                user={user}
                hostStatus={hostStatus}
                hostLoading={hostLoading}
                hostSubmitLoading={hostSubmitLoading}
                hostError={hostError}
                docType={docType}
                docNumber={docNumber}
                docFrontAssetId={docFrontAssetId}
                docBackAssetId={docBackAssetId}
                selfieAssetId={selfieAssetId}
                docFrontLoading={docFrontLoading}
                docBackLoading={docBackLoading}
                selfieLoading={selfieLoading}
                onDocTypeChange={setDocType}
                onDocNumberChange={setDocNumber}
                onDocFrontUpload={async (file) => {
                  setDocFrontLoading(true);
                  try {
                    const res = await uploadHostDocumentFront(file, token);
                    setDocFrontAssetId(res.asset_id);
                  } catch (e) {
                    setHostError(e instanceof Error ? e.message : "Upload failed");
                  } finally {
                    setDocFrontLoading(false);
                  }
                }}
                onDocBackUpload={async (file) => {
                  setDocBackLoading(true);
                  try {
                    const res = await uploadHostDocumentBack(file, token);
                    setDocBackAssetId(res.asset_id);
                  } catch (e) {
                    setHostError(e instanceof Error ? e.message : "Upload failed");
                  } finally {
                    setDocBackLoading(false);
                  }
                }}
                onSelfieUpload={async (file) => {
                  setSelfieLoading(true);
                  try {
                    const res = await uploadHostSelfie(file, token);
                    setSelfieAssetId(res.asset_id);
                  } catch (e) {
                    setHostError(e instanceof Error ? e.message : "Upload failed");
                  } finally {
                    setSelfieLoading(false);
                  }
                }}
                onLoadStatus={() => {
                  setHostLoading(true);
                  setHostError(null);
                  getHostVerification(token)
                    .then(setHostStatus)
                    .catch((e) => setHostError(e instanceof Error ? e.message : "Failed to load"))
                    .finally(() => setHostLoading(false));
                }}
                onSubmitUseExistingKyc={async () => {
                  if (!token) return;
                  setHostSubmitLoading(true);
                  setHostError(null);
                  try {
                    const res = await submitHostVerification(
                      buildSubmitPayload(true),
                      token,
                    );
                    const normalized = normalizeHostVerificationStatus(res);
                    setHostStatus(normalized);
                    if (isApplicationPendingOrApproved(normalized)) {
                      setApplicationSubmitted(true);
                    }
                  } catch (e) {
                    setHostError(e instanceof Error ? e.message : "Application failed");
                  } finally {
                    setHostSubmitLoading(false);
                  }
                }}
                onSubmit={async () => {
                  if (!token) return;
                  if (!docFrontAssetId || !selfieAssetId) {
                    setHostError("Please upload ID front and profile photo before submitting.");
                    return;
                  }
                  setHostSubmitLoading(true);
                  setHostError(null);
                  try {
                    const res = await submitHostVerification(
                      buildSubmitPayload(false),
                      token,
                    );
                    const normalized = normalizeHostVerificationStatus(res);
                    setHostStatus(normalized);
                    if (isApplicationPendingOrApproved(normalized)) {
                      setApplicationSubmitted(true);
                    }
                  } catch (e) {
                    setHostError(e instanceof Error ? e.message : "Submission failed");
                  } finally {
                    setHostSubmitLoading(false);
                  }
                }}
                onBack={() => goToStep(3)}
                onLoginRedirect={() =>
                  router.push(
                    `${localePath("/login")}?redirect=${encodeURIComponent(localePath("/host"))}`,
                  )
                }
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
