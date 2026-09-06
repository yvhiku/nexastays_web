/**
 * Become-a-Host wizard helpers (guest → account → Sumsub KYC → application).
 *
 * Pure logic lives here so the `/host` page stays declarative and the flow
 * can be unit-tested without React.
 */
import type { IdentityOnboardingState, VerifyOtpResult } from "./auth-api";

export type HostApplyHostType = "apartment" | "hotel" | "hostel";

/** Tab-scoped draft so a refresh mid-Sumsub does not wipe steps 1–2. */
export interface HostApplyDraft {
  hostType: HostApplyHostType;
  fullName: string;
  email: string;
  phone: string;
  /** ISO date (YYYY-MM-DD); empty when not collected yet. */
  dateOfBirth: string;
  city: string;
  termsAccepted: boolean;
  /** Highest step the applicant reached (2–4). */
  step: number;
  /** True when the signed-in user skipped the OTP step. */
  otpStepSkipped?: boolean;
}

export const HOST_APPLY_DRAFT_KEY = "nexa-host-apply-draft";

const HOST_TYPES: HostApplyHostType[] = ["apartment", "hotel", "hostel"];

export function saveHostApplyDraft(draft: HostApplyDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HOST_APPLY_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    //
  }
}

export function loadHostApplyDraft(): HostApplyDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HOST_APPLY_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HostApplyDraft> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const hostType = HOST_TYPES.includes(parsed.hostType as HostApplyHostType)
      ? (parsed.hostType as HostApplyHostType)
      : "apartment";
    const step =
      typeof parsed.step === "number" && parsed.step >= 2 && parsed.step <= 4
        ? parsed.step
        : 2;
    return {
      hostType,
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      dateOfBirth: typeof parsed.dateOfBirth === "string" ? parsed.dateOfBirth : "",
      city: typeof parsed.city === "string" ? parsed.city : "",
      termsAccepted: parsed.termsAccepted === true,
      step,
      otpStepSkipped: parsed.otpStepSkipped === true,
    };
  } catch {
    return null;
  }
}

export function clearHostApplyDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(HOST_APPLY_DRAFT_KEY);
  } catch {
    //
  }
}

/** Identity KYC statuses that let Stays reuse the verified identity for hosting. */
export function isKycVerifiedStatus(status?: string | null): boolean {
  const s = (status || "").toUpperCase();
  return s === "APPROVED" || s === "VERIFIED";
}

/**
 * Which step-2 form the applicant sees.
 * - `guest`: no Nexa session — collect full name, phone, email, DOB, city; OTP creates the account.
 * - `signed_in`: JWT but KYC not verified — same form, prefilled; fill in missing DOB/city.
 * - `verified`: JWT + KYC APPROVED/VERIFIED — reuse the verified identity, collect terms only.
 */
export type HostApplyIdentityMode = "guest" | "signed_in" | "verified";

export function resolveHostApplyIdentityMode(input: {
  tokenType: "jwt" | "otp_session" | "none" | string;
  hasToken: boolean;
  kycStatus?: string | null;
}): HostApplyIdentityMode {
  if (input.tokenType !== "jwt" || !input.hasToken) return "guest";
  return isKycVerifiedStatus(input.kycStatus) ? "verified" : "signed_in";
}

/** Identity fields the verified card shows / the payload reuses. */
export interface HostApplyIdentityFields {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  city: string;
}

/** Normalise a profile snapshot (AuthContext user) into the identity fields. */
export function identityFieldsFromUser(
  user:
    | {
        full_name?: string | null;
        phone_number?: string | null;
        email?: string | null;
        date_of_birth?: string | null;
        city?: string | null;
      }
    | null
    | undefined,
): HostApplyIdentityFields {
  return {
    fullName: user?.full_name?.trim() ?? "",
    phone: user?.phone_number?.trim() ?? "",
    email: user?.email?.trim() ?? "",
    dateOfBirth: user?.date_of_birth ? String(user.date_of_birth).slice(0, 10) : "",
    city: user?.city?.trim() ?? "",
  };
}

export type HostApplySession =
  | { kind: "jwt"; accessToken: string; refreshToken?: string }
  | { kind: "otp_session"; token: string }
  | { kind: "none" };

/**
 * Pick the credential to persist in AuthContext after step-3 OTP.
 * Identity creates the CONSUMER shell on OTP verify, so any token here means
 * the applicant now has a Nexa account.
 */
export function resolveHostApplySession(result: VerifyOtpResult): HostApplySession {
  if (result.access_token) {
    return {
      kind: "jwt",
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }
  const session = result.otp_session_token ?? result.identity_session_token;
  if (session) return { kind: "otp_session", token: session };
  return { kind: "none" };
}

/**
 * `POST /kyc/submit` resets kyc_profiles to PENDING. Only seed the profile
 * with step-2 PII when Identity still requires onboarding; never for an
 * already-verified account (that would silently revoke their KYC).
 */
export function shouldSeedKycProfile(result: VerifyOtpResult): boolean {
  if (result.onboarding) return result.onboarding.required === true;
  return !isKycVerifiedStatus(result.nexa_profile?.kyc_status);
}

export type HostKycFinalStatus = "APPROVED" | "VERIFIED" | "REJECTED";

/** Map Identity `/kyc/sumsub/sync-status` → terminal outcome (null while reviewing). */
export function mapKycStatusToFinal(status?: string | null): HostKycFinalStatus | null {
  const u = (status || "").toUpperCase();
  if (u === "APPROVED") return "APPROVED";
  if (u === "VERIFIED") return "VERIFIED";
  if (u === "REJECTED") return "REJECTED";
  return null;
}

/**
 * Stays `submitHostOnboarding` needs Identity KYC APPROVED/VERIFIED for
 * `use_existing_kyc`. Only auto-submit after an authoritative approval.
 */
export function canAutoSubmitHostApplication(
  status: HostKycFinalStatus,
  onboarding?: IdentityOnboardingState | null,
): boolean {
  if (status === "REJECTED") return false;
  return onboarding?.required !== true;
}
