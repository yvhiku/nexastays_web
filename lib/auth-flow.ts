import type { VerifyOtpResult } from "./auth-api";

export type OtpPostVerifyState =
  | "REGISTRATION"
  | "AUTHENTICATED"
  | "INCOMPLETE_RESPONSE";

/**
 * Identity's onboarding object is authoritative. Token presence only selects
 * the credential transport; it does not prove Stays onboarding is complete.
 */
export function resolveOtpPostVerifyState(
  result: VerifyOtpResult,
): OtpPostVerifyState {
  if (result.onboarding?.required) return "REGISTRATION";
  if (result.access_token) return "AUTHENTICATED";
  if (result.otp_session_token || result.identity_session_token) {
    return "REGISTRATION";
  }
  return "INCOMPLETE_RESPONSE";
}
