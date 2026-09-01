/** Persist registration wizard step across soft refresh (no PII). */
const KEY = "nexa-registration-step";

export function getPersistedRegistrationStep(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return n >= 2 && n <= 3 ? n : null;
  } catch {
    return null;
  }
}

export function setPersistedRegistrationStep(step: number): void {
  if (typeof window === "undefined") return;
  try {
    if (step >= 2) sessionStorage.setItem(KEY, String(step));
    else sessionStorage.removeItem(KEY);
  } catch {
    //
  }
}

export function clearPersistedRegistrationStep(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    //
  }
}

/** Set while Sumsub iframe is active — PWA update should not hard-reload mid-KYC. */
const KYC_ACTIVE_KEY = "nexa-kyc-active";

export function markKycFlowActive(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KYC_ACTIVE_KEY, "1");
  } catch {
    //
  }
}

export function clearKycFlowActive(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KYC_ACTIVE_KEY);
  } catch {
    //
  }
}

export function isKycFlowActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(KYC_ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}
