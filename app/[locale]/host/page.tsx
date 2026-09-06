"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { OverlayPortal } from "@/components/ui/OverlayPortal";
import {
  getHostVerification,
  submitHostVerification,
  uploadHostDocumentFront,
  uploadHostDocumentBack,
  uploadHostSelfie,
  normalizeHostVerificationStatus,
} from "@/lib/stays-api";
import type { HostVerificationStatus } from "@/lib/stays-types";
import {
  completeRegistration,
  sendOtp,
  verifyOtp,
  type IdentityOnboardingState,
} from "@/lib/auth-api";
import { submitKyc, syncSumsubStatus, updateProfile } from "@/lib/kyc-api";
import { resolveOtpPostVerifyState } from "@/lib/auth-flow";
import {
  canAutoSubmitHostApplication,
  clearHostApplyDraft,
  identityFieldsFromUser,
  isKycVerifiedStatus,
  loadHostApplyDraft,
  mapKycStatusToFinal,
  resolveHostApplyIdentityMode,
  resolveHostApplySession,
  saveHostApplyDraft,
  shouldSeedKycProfile,
  type HostApplyIdentityFields,
  type HostKycFinalStatus,
} from "@/lib/host-apply-flow";
import { DatePicker } from "@/components/ui/DatePicker";
import { MOROCCO_CITIES } from "@/lib/moroccan-cities";
import {
  SumsubWebVerification,
  type SumsubFinalStatus,
} from "@/components/kyc/SumsubWebVerification";
import { normalizePhone, parseLocalDate, validateDateOfBirth, validateEmail, validatePhone } from "@/lib/validators";
import { formatUserError } from "@/lib/errors";
import { useAuth, type TokenType } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lock, Menu, ShieldCheck, XCircle } from "lucide-react";
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

type HostKycPhase = "verify" | "reviewing" | "rejected";

/**
 * Read-only identity summary for accounts whose KYC is already verified.
 * Nothing here is editable on purpose: the host application reuses the
 * verified Identity profile, so re-typing would only invite mismatches.
 */
function VerifiedIdentityCard({
  identity,
  t,
  locale,
  profileHref,
}: {
  identity: HostApplyIdentityFields;
  t: (key: string) => string;
  locale: string;
  profileHref: string;
}) {
  const dob = identity.dateOfBirth
    ? (() => {
        const d = parseLocalDate(identity.dateOfBirth);
        return d
          ? d.toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : identity.dateOfBirth;
      })()
    : "";
  const rows: Array<{ label: string; value: string; locked?: boolean }> = [
    { label: t("hostApply.fullLegalName"), value: identity.fullName, locked: true },
    { label: t("hostApply.phoneLabel"), value: identity.phone, locked: true },
    { label: t("hostApply.dobLabel"), value: dob, locked: true },
    { label: t("hostApply.emailLabel"), value: identity.email },
    { label: t("hostApply.cityLabel"), value: identity.city },
  ];
  return (
    <div
      className="rounded-2xl border border-nexa-primary/20 bg-nexa-primary-soft p-5"
      data-testid="host-apply-verified-identity"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nexa-primary text-white">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold text-nexa-ink">{t("hostApply.verifiedIdentityCardTitle")}</p>
          <p className="mt-0.5 text-sm text-nexa-ink-3">{t("hostApply.verifiedIdentityCardBody")}</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-white/80 px-3.5 py-2.5">
            <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">
              {row.label}
              {row.locked && <Lock className="h-3 w-3" aria-hidden="true" />}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-nexa-ink">
              {row.value || <span className="text-nexa-ink-4">{t("hostApply.notProvided")}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-nexa-ink-4">
        {t("hostApply.verifiedIdentityEditHint")}{" "}
        <Link href={profileHref} className="text-nexa-primary hover:underline">
          {t("hostApply.openProfile")}
        </Link>
      </p>
    </div>
  );
}

function HostVerificationStep({
  token,
  tokenType,
  user,
  hostStatus: _hostStatus,
  hostLoading,
  hostSubmitLoading,
  hostError,
  kycPhase,
  applicantEmail,
  applicantPhone,
  lang,
  onSumsubSubmitted,
  onSumsubFinalStatus,
  onSumsubError,
  onRetryKyc,
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
  onDismissError,
}: {
  token: string | null;
  tokenType: TokenType;
  user: { kyc_status?: string } | null;
  hostStatus: { status: string; message?: string } | null;
  hostLoading: boolean;
  hostSubmitLoading: boolean;
  hostError: string | null;
  kycPhase: HostKycPhase;
  applicantEmail?: string;
  applicantPhone?: string;
  lang: string;
  onSumsubSubmitted: () => void;
  onSumsubFinalStatus: (
    status: SumsubFinalStatus,
    onboarding?: IdentityOnboardingState,
  ) => void;
  onSumsubError: (message: string) => void;
  onRetryKyc: () => void;
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
  onDismissError: () => void;
}) {
  const { t, tf } = useLanguage();
  const onLoadStatusRef = React.useRef(onLoadStatus);
  onLoadStatusRef.current = onLoadStatus;
  const [showManualDocs, setShowManualDocs] = useState(false);

  useEffect(() => {
    if (tokenType === "jwt" && token) onLoadStatusRef.current();
  }, [tokenType, token]);

  // Step 3 could not establish a Nexa session (OTP response without tokens).
  // Fall back to the classic sign-in wall instead of a dead end.
  if (!token || tokenType === "none") {
    return (
      <div>
        <span className="text-xs font-semibold uppercase text-nexa-primary">
          {tf("hostApply.stepOf", { step: 4, total: totalSteps })}
        </span>
        <h2 className="text-2xl font-semibold mt-2 mb-2">{t("host.identityVerification")}</h2>
        <p className="text-nexa-ink-3 mb-8">{t("hostApply.signInForApplication")}</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onBack}>{t("hostApply.back")}</Button>
          <Button onClick={onLoginRedirect}>{t("hostApply.signInToContinue")}</Button>
        </div>
      </div>
    );
  }

  const kycApproved = isKycVerifiedStatus(user?.kyc_status);

  return (
    <div>
      <span className="text-xs font-semibold uppercase text-nexa-primary">
        {tf("hostApply.stepOf", { step: 4, total: totalSteps })}
      </span>
      <h2 className="text-2xl font-semibold mt-2 mb-2">{t("hostApply.step4Title")}</h2>
      <p className="text-nexa-ink-3 mb-6">{t("hostApply.step4SubtitleShort")}</p>
      {hostLoading ? (
        <div className="py-8 text-center text-nexa-ink-4">{t("common.loading")}</div>
      ) : (
        <>
          {hostError && (
            <ErrorAlert
              error={hostError}
              className="mb-6"
              onDismiss={onDismissError}
            />
          )}

          {kycApproved && (
            <div className="mb-6 p-5 rounded-xl bg-nexa-primary-soft border border-nexa-primary/20">
              <h3 className="font-semibold text-nexa-ink mb-2">{t("hostApply.useVerifiedIdentityTitle")}</h3>
              <p className="text-sm text-nexa-ink-3 mb-4">
                {hostSubmitLoading
                  ? t("hostApply.kycAutoSubmitting")
                  : t("hostApply.useVerifiedIdentityDesc")}
              </p>
              <Button onClick={onSubmitUseExistingKyc} disabled={hostSubmitLoading} className="w-full sm:w-auto">
                {hostSubmitLoading ? t("host.applying") : t("host.applyAsHost")}
              </Button>
            </div>
          )}

          {!kycApproved && kycPhase === "verify" && (
            <div className="mb-6" data-testid="host-apply-sumsub">
              <SumsubWebVerification
                getToken={() => token}
                source="STAYS"
                applicantEmail={applicantEmail}
                applicantPhone={applicantPhone}
                lang={lang}
                onSubmitted={onSumsubSubmitted}
                onFinalStatus={onSumsubFinalStatus}
                onError={onSumsubError}
              />
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={onBack}>{t("hostApply.back")}</Button>
              </div>
            </div>
          )}

          {!kycApproved && kycPhase === "reviewing" && (
            <div className="mb-6 text-center py-6 rounded-2xl border border-nexa-line bg-white px-6">
              <div className="text-5xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold text-nexa-ink mb-2">{t("hostApply.kycReviewingTitle")}</h3>
              <p className="text-sm text-nexa-ink-3 mb-3 max-w-md mx-auto">{t("hostApply.kycReviewingDesc")}</p>
              <p className="text-xs text-nexa-ink-4">
                {hostSubmitLoading ? t("hostApply.kycAutoSubmitting") : t("hostApply.kycReviewingHint")}
              </p>
            </div>
          )}

          {!kycApproved && kycPhase === "rejected" && (
            <div className="mb-6">
              <Alert variant="warning" title={t("hostApply.kycRejectedTitle")}>
                {t("hostApply.kycRejectedDesc")}
              </Alert>
              <div className="flex gap-3 mt-5">
                <Button variant="ghost" onClick={onBack}>{t("hostApply.back")}</Button>
                <Button onClick={onRetryKyc}>{t("hostApply.kycRetry")}</Button>
              </div>
            </div>
          )}

          {kycApproved && (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-nexa-line" />
              <button
                type="button"
                className="text-xs font-medium text-nexa-ink-4 hover:text-nexa-primary hover:underline"
                onClick={() => setShowManualDocs((v) => !v)}
                aria-expanded={showManualDocs}
              >
                {t("hostApply.orSubmitNewDocuments")}
              </button>
              <div className="flex-1 h-px bg-nexa-line" />
            </div>
          )}

          {kycApproved && showManualDocs && (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
            <div>
              <label className="block text-sm font-semibold mb-2">{t("hostApply.idTypeRequired")}</label>
              <NexaSelect
                variant="field"
                value={docType}
                onChange={onDocTypeChange}
                aria-label={t("hostApply.idType")}
                options={[
                  { value: "CNIE", label: t("hostApply.idTypeCnie") },
                  { value: "PASSPORT", label: t("hostApply.idTypePassport") },
                  { value: "OTHER", label: t("hostApply.idTypeOther") },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t("hostApply.idNumber")}</label>
              <Input
                placeholder={t("host.yourIdNumber")}
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
                {docFrontLoading
                  ? t("common.uploading")
                  : docFrontAssetId
                    ? t("host.idFrontUploaded")
                    : t("host.idFront")}
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
                {docBackLoading
                  ? t("common.uploading")
                  : docBackAssetId
                    ? t("host.idBackUploaded")
                    : t("host.idBack")}
              </div>
            </label>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">{t("hostApply.profilePhotoRequired")}</label>
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
                {selfieLoading
                  ? t("common.uploading")
                  : selfieAssetId
                    ? t("host.selfieUploaded")
                    : t("host.selfie")}
              </div>
            </label>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>{t("hostApply.back")}</Button>
            <Button onClick={onSubmit} disabled={hostSubmitLoading}>
              {hostSubmitLoading ? t("host.submitting") : t("hostApply.submitApplication")}
            </Button>
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}

export default function HostPage() {
  const router = useRouter();
  const { t, tf, localePath, locale } = useLanguage();
  const {
    token,
    tokenType,
    user,
    ready: authReady,
    setAuthJwt,
    setAuthOtpSession,
    setOnboarding,
    refreshUser,
  } = useAuth();
  const [step, setStep] = useState(1);
  const [kycPhase, setKycPhase] = useState<HostKycPhase>("verify");
  const [step2Submitting, setStep2Submitting] = useState(false);
  const [step3Submitting, setStep3Submitting] = useState(false);
  const [otpStepSkipped, setOtpStepSkipped] = useState(false);
  const [draftStep, setDraftStep] = useState<number | null>(null);
  /** Guards the one-shot auto-submit after KYC approval (backend is idempotent anyway). */
  const autoSubmitRef = React.useRef(false);
  const [hostType, setHostType] = useState<"apartment" | "hotel" | "hostel">("apartment");
  const [hostStatus, setHostStatus] = useState<HostVerificationStatus | null>(null);
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
  const [reapplying, setReapplying] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [city, setCity] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [smsCodeSent, setSmsCodeSent] = useState(false);

  const hostTypeApi =
    hostType === "hotel" ? "HOTEL" : hostType === "hostel" ? "HOSTEL" : "APARTMENT";

  /**
   * Step-2 form mode. Verified accounts reuse their Identity profile (no PII
   * re-entry); guests and unverified accounts fill the real identity fields.
   */
  const identityMode = resolveHostApplyIdentityMode({
    tokenType,
    hasToken: !!token,
    kycStatus: user?.kyc_status,
  });
  const verifiedIdentity = identityFieldsFromUser(user);

  useEffect(() => {
    if (!user) return;
    const fromUser = identityFieldsFromUser(user);
    setFullName((prev) => prev || fromUser.fullName);
    setEmail((prev) => prev || fromUser.email);
    // Always prefer the account phone when signed in — drafts must not lock a different number.
    if (fromUser.phone && (tokenType === "jwt" || tokenType === "otp_session")) {
      setPhone(fromUser.phone);
    } else {
      setPhone((prev) => prev || fromUser.phone);
    }
    setDateOfBirth((prev) => prev || fromUser.dateOfBirth);
    setCity((prev) => prev || fromUser.city);
  }, [user, tokenType]);

  // Draft continuity: restore steps 1–2 after a refresh (e.g. mid-Sumsub).
  useEffect(() => {
    const draft = loadHostApplyDraft();
    if (!draft) return;
    setHostType(draft.hostType);
    setFullName((prev) => prev || draft.fullName);
    setEmail((prev) => prev || draft.email);
    // Do not pre-fill email confirm from draft — force re-typing after refresh.
    setPhone((prev) => prev || draft.phone);
    setDateOfBirth((prev) => prev || draft.dateOfBirth);
    setCity((prev) => prev || draft.city);
    setTermsAccepted(draft.termsAccepted);
    if (draft.otpStepSkipped) setOtpStepSkipped(true);
    setDraftStep(draft.step);
  }, []);

  // Resume where the applicant left off once we know whether a JWT survived the
  // reload. OTP binders are memory-only, so without a JWT they re-verify phone.
  useEffect(() => {
    if (!authReady || draftStep == null) return;
    if (draftStep >= 3) {
      setStep(tokenType === "jwt" && token ? 4 : 3);
    } else {
      setStep(draftStep);
    }
    setDraftStep(null);
  }, [authReady, draftStep, tokenType, token]);

  const persistDraft = (nextStep: number) => {
    saveHostApplyDraft({
      hostType,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dateOfBirth: dateOfBirth.trim(),
      city: city.trim(),
      termsAccepted,
      step: nextStep,
      otpStepSkipped,
    });
  };

  /** Identity fields that go to Stays / Identity: verified accounts always use the verified profile. */
  const effectiveIdentity =
    identityMode === "verified"
      ? verifiedIdentity
      : {
          fullName: fullName.trim() || verifiedIdentity.fullName,
          phone: phone.trim() || verifiedIdentity.phone,
          email: email.trim() || verifiedIdentity.email,
          dateOfBirth: dateOfBirth.trim() || verifiedIdentity.dateOfBirth,
          city: city.trim() || verifiedIdentity.city,
        };

  const buildSubmitPayload = (useExistingKyc: boolean) => ({
    full_name: effectiveIdentity.fullName || undefined,
    email: effectiveIdentity.email || undefined,
    phone: effectiveIdentity.phone || undefined,
    city: effectiveIdentity.city || undefined,
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

  const normalizedHostStatus = hostStatus
    ? normalizeHostVerificationStatus(
        hostStatus as Parameters<typeof normalizeHostVerificationStatus>[0],
      )
    : null;
  const isRejected =
    !reapplying &&
    !applicationSubmitted &&
    (normalizedHostStatus?.status === "REJECTED" ||
      normalizedHostStatus?.application_status === "REJECTED");
  const showApplicationForm = statusChecked && !applicationSubmitted && !isRejected;

  // Load host status whenever we have a JWT (including mid-onboarding).
  useEffect(() => {
    if (tokenType !== "jwt" || !token) {
      setStatusChecked(true);
      return;
    }
    setHostLoading(true);
    getHostVerification(token)
      .then((s) => {
        setHostStatus(s);
        if (isApplicationPendingOrApproved(s)) {
          setApplicationSubmitted(true);
          setReapplying(false);
        }
      })
      .catch(() => {})
      .finally(() => {
        setHostLoading(false);
        setStatusChecked(true);
      });
  }, [tokenType, token]);

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

  /** Real identity fields → Identity profile (and KYC seed while onboarding is still open). */
  const seedIdentityProfile = async (
    getSessionToken: () => string | null,
    opts: { seedKyc: boolean; patchProfile: boolean },
  ): Promise<{ ok: boolean; error?: string }> => {
    const pii = {
      full_name: fullName.trim() || undefined,
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      date_of_birth: dateOfBirth.trim() || undefined,
    };
    try {
      if (opts.seedKyc) {
        await submitKyc(
          {
            phone_number: phone,
            ...pii,
            documents: { id_document: true, selfie: true },
            source: "STAYS",
          },
          getSessionToken,
        );
      }
      if (opts.patchProfile) {
        await updateProfile(pii, getSessionToken);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatUserError(e) || t("hostApply.profileSaveFailed") };
    }
  };

  const handleStep2Continue = async () => {
    if (!termsAccepted) {
      setStep2Error(t("hostApply.termsRequired"));
      return;
    }

    // Verified account: identity comes from Identity — nothing to re-enter.
    if (identityMode === "verified") {
      setStep2Error(null);
      setOtpStepSkipped(true);
      autoSubmitRef.current = false;
      setKycPhase("verify");
      persistDraft(4);
      setStep(4);
      return;
    }

    if (!fullName.trim()) {
      setStep2Error(t("hostApply.fullNameRequired"));
      return;
    }
    if (!phone.trim()) {
      setStep2Error(t("hostApply.phoneRequired"));
      return;
    }
    if (!validatePhone(phone).valid) {
      setStep2Error(t("hostApply.phoneInvalid"));
      return;
    }
    const dobCheck = validateDateOfBirth(dateOfBirth.trim());
    if (!dobCheck.valid) {
      setStep2Error(
        !dateOfBirth.trim()
          ? t("hostApply.dobRequired")
          : dobCheck.error === "Invalid date"
            ? t("hostApply.dobInvalid")
            : t("hostApply.dobUnderage"),
      );
      return;
    }
    if (!city.trim()) {
      setStep2Error(t("hostApply.cityRequired"));
      return;
    }
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setStep2Error(
        !email.trim() ? t("hostApply.validEmailRequired") : t("hostApply.validEmailRequired"),
      );
      return;
    }
    if (email.trim().toLowerCase() !== emailCode.trim().toLowerCase()) {
      setStep2Error(t("hostApply.emailConfirmMismatch"));
      return;
    }
    setStep2Error(null);
    // Already signed in with this phone → no need to re-verify by SMS.
    const alreadyVerifiedPhone =
      tokenType === "jwt" &&
      !!token &&
      !!user?.phone_number &&
      normalizePhone(user.phone_number) === normalizePhone(phone);
    const nextStep = alreadyVerifiedPhone ? 4 : 3;
    setOtpStepSkipped(alreadyVerifiedPhone);
    if (alreadyVerifiedPhone) {
      autoSubmitRef.current = false;
      setKycPhase("verify");
      // Skipping OTP means step 3 never runs — push DOB/city to the account here.
      const jwt = token;
      setStep2Submitting(true);
      try {
        const seeded = await seedIdentityProfile(() => jwt, {
          seedKyc: user?.onboarding?.required === true,
          patchProfile: true,
        });
        if (!seeded.ok) {
          setStep2Error(seeded.error || t("hostApply.profileSaveFailed"));
          return;
        }
        void refreshUser().catch(() => undefined);
      } finally {
        setStep2Submitting(false);
      }
    }
    persistDraft(nextStep);
    setStep(nextStep);
  };

  const handleSendSmsCode = async () => {
    if (!phone.trim()) {
      setStep3Error(t("hostApply.enterPhoneStep2"));
      return;
    }
    setStep3Error(null);
    try {
      await sendOtp(phone);
      setSmsCodeSent(true);
    } catch (e) {
      setStep3Error(e instanceof Error ? e.message : t("hostApply.smsSendFailed"));
    }
  };

  /**
   * Step 3: OTP verify doubles as account creation. Identity creates the
   * CONSUMER shell on first verified OTP, so we persist the returned session
   * (JWT or OTP binder) exactly like /login does, then seed the KYC profile
   * with the step-2 PII so Sumsub receives name/email.
   */
  const handleStep3Continue = async () => {
    if (!smsCodeSent || smsCode.trim().length < 4) {
      setStep3Error(t("hostApply.smsCodeRequired"));
      return;
    }
    setStep3Error(null);
    setStep3Submitting(true);
    try {
      const result = await verifyOtp(phone, smsCode.trim());
      if (!result.verified) {
        setStep3Error(t("hostApply.smsInvalid"));
        return;
      }
      if (resolveOtpPostVerifyState(result) === "INCOMPLETE_RESPONSE") {
        setStep3Error(t("hostApply.sessionFailed"));
        return;
      }
      const session = resolveHostApplySession(result);
      let sessionToken: string | null = null;
      if (session.kind === "jwt") {
        setAuthJwt(session.accessToken, session.refreshToken, result.onboarding);
        sessionToken = session.accessToken;
      } else if (session.kind === "otp_session") {
        setAuthOtpSession(session.token, result.onboarding);
        sessionToken = session.token;
      }
      if (!sessionToken) {
        setStep3Error(t("hostApply.sessionFailed"));
        return;
      }

      // Push step-2 PII (name, email, DOB, city) to Identity so the account is real.
      const getSessionToken = () => sessionToken;
      const seedKyc = shouldSeedKycProfile(result);
      const patchProfile = session.kind === "jwt";
      if (seedKyc || patchProfile) {
        const seeded = await seedIdentityProfile(getSessionToken, { seedKyc, patchProfile });
        if (!seeded.ok) {
          setStep3Error(seeded.error || t("hostApply.profileSaveFailed"));
          return;
        }
      }

      autoSubmitRef.current = false;
      setKycPhase("verify");
      persistDraft(4);
      setStep(4);
    } catch (e) {
      setStep3Error(e instanceof Error ? e.message : t("hostApply.phoneVerifyFailed"));
    } finally {
      setStep3Submitting(false);
    }
  };

  /** Submit the host application with an explicit JWT (context may lag right after KYC). */
  const submitApplication = async (useExistingKyc: boolean, jwt: string) => {
    setHostSubmitLoading(true);
    setHostError(null);
    try {
      const res = await submitHostVerification(buildSubmitPayload(useExistingKyc), jwt);
      const normalized = normalizeHostVerificationStatus(res);
      setHostStatus(normalized);
      if (isApplicationPendingOrApproved(normalized)) {
        setApplicationSubmitted(true);
        setReapplying(false);
        clearHostApplyDraft();
      }
      return true;
    } catch (e) {
      autoSubmitRef.current = false;
      setHostError(
        formatUserError(e) ||
          t(useExistingKyc ? "host.applicationFailed" : "host.submissionFailed"),
      );
      return false;
    } finally {
      setHostSubmitLoading(false);
    }
  };

  /**
   * Terminal Sumsub outcome (from the widget or our own polling). On approval,
   * turn the OTP binder into a JWT if needed and send the application to the
   * ops inbox automatically. Rejections never reach the dashboard.
   */
  const handleKycFinalStatus = async (
    status: HostKycFinalStatus,
    canonicalOnboarding?: IdentityOnboardingState,
  ) => {
    if (canonicalOnboarding) setOnboarding(canonicalOnboarding);
    if (status === "REJECTED") {
      setKycPhase("rejected");
      return;
    }
    if (!canAutoSubmitHostApplication(status, canonicalOnboarding)) {
      // Identity still reports onboarding required — keep waiting for sync.
      setKycPhase("reviewing");
      return;
    }
    if (autoSubmitRef.current) return;
    autoSubmitRef.current = true;

    let jwt: string | null = tokenType === "jwt" ? token : null;
    try {
      if (tokenType === "otp_session" && token) {
        const exchanged = await completeRegistration(token);
        if (exchanged?.access_token) {
          setAuthJwt(exchanged.access_token, exchanged.refresh_token, canonicalOnboarding);
          jwt = exchanged.access_token;
        }
      } else if (tokenType === "jwt") {
        await refreshUser().catch(() => {
          /* profile refresh is cosmetic here; submit uses the live Identity snapshot */
        });
      }
    } catch (e) {
      autoSubmitRef.current = false;
      setHostError(formatUserError(e) || t("hostApply.sessionFailed"));
      return;
    }
    if (!jwt) {
      autoSubmitRef.current = false;
      setHostError(t("hostApply.sessionFailed"));
      return;
    }
    await submitApplication(true, jwt);
  };

  // Widget is unmounted while "reviewing" — keep polling Identity ourselves.
  useEffect(() => {
    if (step !== 4 || kycPhase !== "reviewing" || !token) return;
    let cancelled = false;
    const tok = token;
    const pollOnce = async () => {
      try {
        const r = await syncSumsubStatus(() => tok, "STAYS");
        if (cancelled) return;
        if (r.onboarding) setOnboarding(r.onboarding);
        const terminal = mapKycStatusToFinal(r.status);
        if (terminal) void handleKycFinalStatus(terminal, r.onboarding);
      } catch {
        // transient; next tick retries
      }
    };
    void pollOnce();
    const id = setInterval(() => void pollOnce(), 6000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, kycPhase, token]);

  // Already-verified identity (existing Nexa user, or KYC finished elsewhere):
  // reuse it and send the application without asking for documents again.
  useEffect(() => {
    if (step !== 4 || !statusChecked || hostLoading) return;
    if (applicationSubmitted || autoSubmitRef.current) return;
    if (tokenType !== "jwt" || !token) return;
    if (!isKycVerifiedStatus(user?.kyc_status)) return;
    autoSubmitRef.current = true;
    void submitApplication(true, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, statusChecked, hostLoading, applicationSubmitted, tokenType, token, user?.kyc_status]);

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
        <main className="pt-[calc(72px+env(safe-area-inset-top))] min-h-screen flex items-center justify-center">
          <AppLoader />
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="pt-[calc(72px+env(safe-area-inset-top))] min-h-screen grid grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="hidden lg:block bg-gradient-to-br from-nexa-ink to-nexa-ink-2 p-10 overflow-y-auto sticky top-[72px] h-[calc(100vh-72px)]">
          {stepsContent}
        </aside>

        {/* Mobile steps button */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-layer-sticky">
          <button
            onClick={() => setMobileStepsOpen(true)}
            className="flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-full bg-nexa-ink text-white shadow-lg font-semibold text-sm"
          >
            <Menu className="h-4 w-4" />
            {tf("hostApply.mobileSteps", { step, total: totalSteps })}
          </button>
        </div>

        {/* Mobile steps drawer */}
        <OverlayPortal layer="drawer">
        <div
          className={cn(
            "fixed inset-0 z-layer-drawer lg:hidden transition-opacity duration-300",
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
        </OverlayPortal>

        <div className="bg-nexa-bg py-8 sm:py-10 lg:py-12 px-4 sm:px-6 md:px-10 lg:px-20 pb-20 lg:pb-16">
          <div className="max-w-[600px]">
            {!statusChecked && token && (
              <div className="py-12 text-center text-nexa-ink-4">{t("common.loading")}</div>
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
                  {isApproved ? (
                    <Button asChild>
                      <Link href={localePath("/host/listings/new")}>{t("hostDashboard.addListing")}</Link>
                    </Button>
                  ) : null}
                  <Button asChild>
                    <Link href={localePath("/host/dashboard")}>{t("hostApply.goToDashboard")}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={localePath("/")}>{t("hostApply.backToHome")}</Link>
                  </Button>
                </div>
              </div>
            )}

            {statusChecked && isRejected && (
              <div className="py-4">
                <div className="flex flex-col items-start gap-4 rounded-2xl border border-nexa-line bg-white p-6 sm:p-8 shadow-nexa-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white">
                    <XCircle className="h-7 w-7" />
                  </div>
                  <div className="w-full">
                    <h2 className="text-2xl font-semibold text-nexa-ink">
                      {t("hostApply.rejectedTitle")}
                    </h2>
                    <p className="mt-2 text-nexa-ink-3">
                      {t("hostApply.rejectedDesc")}
                    </p>
                    <div className="mt-4">
                      <Alert variant="warning" title={t("hostApply.rejectionReasonLabel")}>
                        <span className="whitespace-pre-wrap">
                          {normalizedHostStatus?.rejection_reason?.trim() ||
                            t("hostDashboard.reapplyMessage")}
                        </span>
                      </Alert>
                    </div>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Button
                        onClick={() => {
                          setReapplying(true);
                          setStep(1);
                          setHostError(null);
                          setDocFrontAssetId(null);
                          setDocBackAssetId(null);
                          setSelfieAssetId(null);
                        }}
                      >
                        {t("hostApply.reapplyCta")}
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={localePath("/host/dashboard")}>
                          {t("hostApply.goToDashboard")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showApplicationForm && step === 1 && (
              <div>
                <span className="text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary">
                  {tf("hostApply.stepOf", { step: 1, total: totalSteps })}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <button
                    type="button"
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
                    type="button"
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
                  <button
                    type="button"
                    onClick={() => setHostType("hostel")}
                    className={cn(
                      "border-2 rounded-[22px] p-7 text-center cursor-pointer transition-all",
                      hostType === "hostel"
                        ? "border-nexa-primary bg-nexa-primary-soft"
                        : "border-nexa-line hover:border-nexa-primary"
                    )}
                  >
                    <div className="text-4xl mb-3">🛏️</div>
                    <h3 className="font-semibold mb-1">{t("hostApply.step1HostelTitle")}</h3>
                    <p className="text-sm text-nexa-ink-3">{t("hostApply.step1HostelDesc")}</p>
                  </button>
                </div>
                <Button onClick={handleStep1Continue}>{t("hostApply.continue")}</Button>
              </div>
            )}

            {showApplicationForm && step === 2 && (
              <div>
                <span className="text-xs font-semibold uppercase text-nexa-primary">
                  {tf("hostApply.stepOf", { step: 2, total: totalSteps })}
                </span>
                <h2 className="text-2xl font-semibold mt-2 mb-2">
                  {identityMode === "verified"
                    ? t("hostApply.step2VerifiedTitle")
                    : t("hostApply.step2Title")}
                </h2>
                <p className="text-nexa-ink-3 mb-8">
                  {identityMode === "verified"
                    ? t("hostApply.step2VerifiedSubtitle")
                    : identityMode === "signed_in"
                      ? t("hostApply.step2SignedInSubtitle")
                      : t("hostApply.step2Subtitle")}
                </p>
                <div className="space-y-5 mb-8">
                  {identityMode === "verified" ? (
                    <VerifiedIdentityCard
                      identity={verifiedIdentity}
                      t={t}
                      locale={locale}
                      profileHref={localePath("/profile")}
                    />
                  ) : (
                    <>
                      <div>
                        <label htmlFor="host-apply-full-name" className="block text-sm font-semibold mb-2">
                          {t("hostApply.fullLegalName")} <span className="text-nexa-primary">*</span>
                        </label>
                        <Input
                          id="host-apply-full-name"
                          autoComplete="name"
                          placeholder={t("hostApply.asOnId")}
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            setStep2Error(null);
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="host-apply-phone" className="block text-sm font-semibold mb-2">
                            {t("hostApply.phoneLabel")} <span className="text-nexa-primary">*</span>
                          </label>
                          <Input
                            id="host-apply-phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder={t("contact.phonePlaceholder")}
                            value={phone}
                            readOnly={
                              identityMode === "signed_in" &&
                              !!verifiedIdentity.phone &&
                              normalizePhone(phone) === normalizePhone(verifiedIdentity.phone)
                            }
                            aria-describedby={
                              identityMode === "signed_in" &&
                              verifiedIdentity.phone &&
                              normalizePhone(phone) === normalizePhone(verifiedIdentity.phone)
                                ? "host-apply-phone-hint"
                                : undefined
                            }
                            className={cn(
                              identityMode === "signed_in" &&
                                verifiedIdentity.phone &&
                                normalizePhone(phone) === normalizePhone(verifiedIdentity.phone) &&
                                "bg-nexa-bg-2 text-nexa-ink-2",
                            )}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              setStep2Error(null);
                            }}
                          />
                          {identityMode === "signed_in" &&
                            verifiedIdentity.phone &&
                            normalizePhone(phone) === normalizePhone(verifiedIdentity.phone) && (
                            <p id="host-apply-phone-hint" className="mt-1 text-xs text-nexa-ink-4">
                              {t("hostApply.phoneFromAccount")}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="host-apply-email" className="block text-sm font-semibold mb-2">
                            {t("hostApply.emailLabel")} <span className="text-nexa-primary">*</span>
                          </label>
                          <Input
                            id="host-apply-email"
                            type="email"
                            autoComplete="email"
                            placeholder={t("contact.emailPlaceholder")}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setStep2Error(null);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="host-apply-email-confirm" className="block text-sm font-semibold mb-2">
                          {t("hostApply.confirmEmail")} <span className="text-nexa-primary">*</span>
                        </label>
                        <Input
                          id="host-apply-email-confirm"
                          type="email"
                          autoComplete="off"
                          placeholder={t("hostApply.reenterEmail")}
                          value={emailCode}
                          onChange={(e) => {
                            setEmailCode(e.target.value);
                            setStep2Error(null);
                          }}
                        />
                        <p className="mt-1 text-xs text-nexa-ink-4">{t("hostApply.confirmEmailHint")}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="host-apply-dob" className="block text-sm font-semibold mb-2">
                            {t("hostApply.dobLabel")} <span className="text-nexa-primary">*</span>
                          </label>
                          <DatePicker
                            id="host-apply-dob"
                            variant="field"
                            value={dateOfBirth}
                            onChange={(v) => {
                              setDateOfBirth(v);
                              setStep2Error(null);
                            }}
                            aria-label={t("hostApply.dobLabel")}
                            placeholder={t("hostApply.dobPlaceholder")}
                            max={new Date().toISOString().slice(0, 10)}
                            locale={locale}
                          />
                          <p className="mt-1 text-xs text-nexa-ink-4">{t("hostApply.dobHint")}</p>
                        </div>
                        <div>
                          <label htmlFor="host-apply-city" className="block text-sm font-semibold mb-2">
                            {t("hostApply.cityLabel")} <span className="text-nexa-primary">*</span>
                          </label>
                          <NexaSelect
                            id="host-apply-city"
                            variant="field"
                            value={city}
                            onChange={(v) => {
                              setCity(v);
                              setStep2Error(null);
                            }}
                            aria-label={t("hostApply.cityLabel")}
                            options={[
                              { value: "", label: t("hostApply.cityPlaceholder") },
                              ...(city && !MOROCCO_CITIES.includes(city)
                                ? [{ value: city, label: city }]
                                : []),
                              ...MOROCCO_CITIES.map((c) => ({ value: c, label: c })),
                            ]}
                          />
                          <p className="mt-1 text-xs text-nexa-ink-4">{t("hostApply.cityHint")}</p>
                        </div>
                      </div>
                    </>
                  )}
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
                      {t("hostApply.agreeTermsPrefix")}{" "}
                      <Link href={localePath("/terms")} className="text-nexa-primary hover:underline">
                        {t("hostApply.termsLink")}
                      </Link>{" "}
                      &{" "}
                      <Link href={localePath("/privacy")} className="text-nexa-primary hover:underline">
                        {t("hostApply.privacyLink")}
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
                    {t("hostApply.back")}
                  </Button>
                  <Button
                    onClick={() => void handleStep2Continue()}
                    disabled={!termsAccepted || step2Submitting}
                    aria-busy={step2Submitting || undefined}
                  >
                    {step2Submitting ? t("hostApply.savingProfile") : t("hostApply.continue")}
                  </Button>
                </div>
              </div>
            )}

            {showApplicationForm && step === 3 && (
              <div>
                <span className="text-xs font-semibold uppercase text-nexa-primary">
                  {tf("hostApply.stepOf", { step: 3, total: totalSteps })}
                </span>
                <h2 className="text-2xl font-semibold mt-2 mb-2">{t("hostApply.step3Title")}</h2>
                <p className="text-nexa-ink-3 mb-6">
                  {t("hostApply.step3Subtitle")}
                </p>
                <p className="text-sm text-nexa-ink-4 mb-6 rounded-lg bg-nexa-bg-2 px-3 py-2">
                  {tf("hostApply.smsNotice", {
                    phone: phone || t("hostApply.yourPhone"),
                  })}
                </p>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-nexa-ink mb-1">
                      {t("hostApply.smsVerificationCode")}
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={t("hostApply.smsCodePlaceholder")}
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
                      {smsCodeSent ? t("hostApply.resendSmsCode") : t("hostApply.sendSmsCode")}
                    </button>
                  </div>
                  {step3Error && (
                    <p className="text-sm text-red-600" role="alert">
                      {step3Error}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => goToStep(2)}>{t("hostApply.back")}</Button>
                  <Button
                    onClick={handleStep3Continue}
                    disabled={smsCode.length < 4 || step3Submitting}
                  >
                    {step3Submitting ? t("hostApply.creatingAccount") : t("hostApply.continue")}
                  </Button>
                </div>
              </div>
            )}

            {showApplicationForm && step === 4 && (
              <HostVerificationStep
                token={token}
                tokenType={tokenType}
                user={user}
                hostStatus={hostStatus}
                hostLoading={hostLoading}
                hostSubmitLoading={hostSubmitLoading}
                hostError={hostError}
                kycPhase={kycPhase}
                applicantEmail={email.trim() || user?.email || undefined}
                applicantPhone={phone.trim() || user?.phone_number || undefined}
                lang={locale}
                onSumsubSubmitted={() => setKycPhase("reviewing")}
                onSumsubFinalStatus={(s, nextOnboarding) =>
                  void handleKycFinalStatus(s, nextOnboarding)
                }
                onSumsubError={(msg) => setHostError(msg)}
                onRetryKyc={() => {
                  setHostError(null);
                  setKycPhase("verify");
                }}
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
                    setHostError(formatUserError(e) || t("host.uploadFailed"));
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
                    setHostError(formatUserError(e) || t("host.uploadFailed"));
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
                    setHostError(formatUserError(e) || t("host.uploadFailed"));
                  } finally {
                    setSelfieLoading(false);
                  }
                }}
                onLoadStatus={() => {
                  setHostLoading(true);
                  setHostError(null);
                  getHostVerification(token)
                    .then(setHostStatus)
                    .catch((e) => setHostError(formatUserError(e) || t("common.failedLoad")))
                    .finally(() => setHostLoading(false));
                }}
                onSubmitUseExistingKyc={async () => {
                  if (!token || tokenType !== "jwt") return;
                  autoSubmitRef.current = true;
                  await submitApplication(true, token);
                }}
                onSubmit={async () => {
                  if (!token || tokenType !== "jwt") return;
                  if (!docFrontAssetId || !selfieAssetId) {
                    setHostError(t("hostApply.missingIdUploads"));
                    return;
                  }
                  await submitApplication(false, token);
                }}
                onBack={() => goToStep(otpStepSkipped ? 2 : 3)}
                onLoginRedirect={() =>
                  router.push(
                    `${localePath("/login")}?redirect=${encodeURIComponent(localePath("/host"))}`,
                  )
                }
                onDismissError={() => setHostError(null)}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
