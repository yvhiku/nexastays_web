/**
 * Nexa KYC API (shared with Pay/Go)
 * Profile update, document upload, selfie, submit
 */

import axios from "axios";
import { getIdentityApiBaseUrl } from "./env";
import { isJwtExpired } from "./jwt-utils";
import { unwrapResponse } from "./api-client";
import { normalizeError } from "./api-client";
import { normalizePhone, validateImageFile } from "./validators";
import {
  notifyAuthLogout,
  notifyTokenRefreshed,
  refreshToken as refreshTokenApi,
} from "./auth-api";

const API_BASE = getIdentityApiBaseUrl();
const JWT_KEY = "nexa_access_token";
const REFRESH_TOKEN_KEY = "nexa_refresh_token";

function getAuthHeaders(getToken: () => string | null): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface UserProfile {
  id: string;
  phone_number?: string;
  full_name?: string;
  email?: string;
  kyc_status: string;
  account_type?: string;
  [key: string]: unknown;
}

export type GetCurrentUserResult =
  | { ok: true; user: UserProfile }
  | { ok: false; kind: "UNAUTHORIZED" | "NETWORK" | "SERVER" | "UNKNOWN" };

/**
 * Get current user. Only call when JWT exists.
 * Returns structured result - never swallows errors.
 */
export async function getCurrentUser(
  getJwt: () => string | null
): Promise<GetCurrentUserResult> {
  const token = getJwt();
  if (!token) {
    return { ok: false, kind: "UNAUTHORIZED" };
  }
  if (isJwtExpired(token)) {
    return { ok: false, kind: "UNAUTHORIZED" };
  }
  try {
    const res = await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });
    const data = unwrapResponse(res) ?? res.data;
    const user = data?.id ? data : null;
    if (!user) {
      return { ok: false, kind: "UNKNOWN" };
    }
    return { ok: true, user: user as UserProfile };
  } catch (err: unknown) {
    const apiErr = normalizeError(err);
    if (apiErr.status === 401) return { ok: false, kind: "UNAUTHORIZED" };
    if (apiErr.status >= 500) return { ok: false, kind: "SERVER" };
    if (apiErr.status === 0 || apiErr.message?.toLowerCase().includes("network")) {
      return { ok: false, kind: "NETWORK" };
    }
    return { ok: false, kind: "UNKNOWN" };
  }
}

/** Legacy: get user or null. Use getCurrentUser for structured handling. */
export async function getCurrentUserOrNull(
  getJwt: () => string | null
): Promise<UserProfile | null> {
  const r = await getCurrentUser(getJwt);
  return r.ok ? r.user : null;
}

const jsonClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

jsonClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as typeof err.config & { __refreshRetried?: boolean };
    if (
      err.response?.status === 401 &&
      config &&
      !config.__refreshRetried &&
      typeof window !== "undefined"
    ) {
      const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refresh) {
        config.__refreshRetried = true;
        try {
          const tokens = await refreshTokenApi(refresh);
          localStorage.setItem(JWT_KEY, tokens.access_token);
          if (tokens.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
          notifyTokenRefreshed(tokens.access_token);
          config.headers = { ...config.headers, Authorization: `Bearer ${tokens.access_token}` };
          return jsonClient.request(config);
        } catch {
          localStorage.removeItem(JWT_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          notifyAuthLogout();
        }
      }
    }
    return Promise.reject(err);
  },
);

/** Update user profile (name, email, etc.) - requires JWT */
export async function updateProfile(
  data: {
    full_name?: string;
    email?: string;
    city?: string;
    nationality?: string;
    date_of_birth?: string;
  },
  getJwt: () => string | null
): Promise<void> {
  await jsonClient.patch("/users/profile", data, {
    headers: getAuthHeaders(getJwt),
  });
}

/** Submit KYC data - creates/updates KYC profile. Use OTP or JWT. */
export async function submitKyc(
  data: {
    phone_number: string;
    full_name?: string;
    email?: string;
    city?: string;
    nationality?: string;
    date_of_birth?: string;
    national_id_number?: string;
    documents?: { id_document?: boolean; selfie?: boolean; liveness?: boolean };
    source?: "PAY" | "GO" | "STAYS";
  },
  getToken: () => string | null
): Promise<unknown> {
  const res = await jsonClient.post(
    "/kyc/submit",
    { ...data, phone_number: normalizePhone(data.phone_number) },
    {
      headers: {
        ...getAuthHeaders(getToken),
        "X-Nexa-Product": "STAYS",
      },
    }
  );
  return unwrapResponse(res) ?? res.data;
}

export type KycProductSource = "PAY" | "GO" | "STAYS";

/** Response shape from POST /kyc/sumsub/token */
export interface CreateSumsubSdkTokenResult {
  token?: string;
  externalUserId?: string;
  applicantId?: string | null;
  levelName?: string;
  ttlInSecs?: number;
}

/** Response shape from POST /kyc/sumsub/sync-status */
export interface SyncSumsubStatusResult {
  updated?: boolean;
  userId?: string;
  source?: string;
  reviewStatus?: string | null;
  reviewAnswer?: string | null;
  status?: string;
  kycProfileStatus?: string;
}

/** Create Sumsub Web/Mobile SDK access token (server calls Sumsub). Use OTP session or JWT. */
export async function createSumsubSdkToken(
  getToken: () => string | null,
  source: KycProductSource = "STAYS",
  extraBody?: Record<string, unknown>
): Promise<CreateSumsubSdkTokenResult> {
  const res = await jsonClient.post(
    "/kyc/sumsub/token",
    { source, ...extraBody },
    {
      headers: {
        ...getAuthHeaders(getToken),
        "X-Nexa-Product": "STAYS",
      },
    }
  );
  const data = (unwrapResponse(res) ?? res.data) as CreateSumsubSdkTokenResult;
  return data;
}

/** Sync Sumsub applicant review status into Nexa KYC records. */
export async function syncSumsubStatus(
  getToken: () => string | null,
  source: KycProductSource = "STAYS"
): Promise<SyncSumsubStatusResult> {
  const res = await jsonClient.post(
    "/kyc/sumsub/sync-status",
    { source },
    {
      headers: {
        ...getAuthHeaders(getToken),
        "X-Nexa-Product": "STAYS",
      },
    }
  );
  return (unwrapResponse(res) ?? res.data) as SyncSumsubStatusResult;
}

/** Upload ID document - validates file first */
export async function uploadDocument(
  file: File,
  options: {
    side?: "front" | "back";
    document_type?: string;
    document_country?: string;
    national_id_number?: string;
    national_id_number_extracted?: string;
  } = {},
  getToken: () => string | null
): Promise<{ url: string }> {
  const vr = validateImageFile(file);
  if (!vr.valid) throw new Error(vr.error);

  const form = new FormData();
  form.append("file", file);
  form.append("side", options.side ?? "front");
  if (options.document_type) form.append("document_type", options.document_type);
  if (options.document_country)
    form.append("document_country", options.document_country);
  if (options.national_id_number)
    form.append("national_id_number", options.national_id_number);
  if (options.national_id_number_extracted)
    form.append("national_id_number_extracted", options.national_id_number_extracted);

  const res = await axios.post(`${API_BASE}/kyc/upload/document`, form, {
    headers: {
      ...getAuthHeaders(getToken),
      "Content-Type": "multipart/form-data",
    },
    timeout: 30000,
  });
  return (unwrapResponse(res) ?? res.data) ?? { url: "" };
}

/** Change phone number - requires OTP verification on current and new phone. */
export async function changePhone(
  data: { current_otp: string; new_phone_number: string; new_otp: string },
  getJwt: () => string | null
): Promise<{ phone_number: string }> {
  const newPhone = normalizePhone(data.new_phone_number);
  const res = await jsonClient.post(
    "/users/me/change-phone",
    { ...data, new_phone_number: newPhone },
    {
      headers: getAuthHeaders(getJwt),
    }
  );
  return (unwrapResponse(res) ?? res.data) ?? { phone_number: newPhone };
}

/** Upload profile photo - requires JWT. Max 5MB, jpg/png. */
export async function uploadProfilePhoto(
  file: File,
  getJwt: () => string | null
): Promise<{ profile_photo_url: string }> {
  const vr = validateImageFile(file);
  if (!vr.valid) throw new Error(vr.error);
  if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be under 5MB");

  const form = new FormData();
  form.append("file", file);

  const res = await axios.post(`${API_BASE}/users/me/profile-photo`, form, {
    headers: {
      ...getAuthHeaders(getJwt),
    },
    timeout: 30000,
  });
  return (unwrapResponse(res) ?? res.data) ?? { profile_photo_url: "" };
}

/** Upload selfie - validates file first */
export async function uploadSelfie(
  file: File,
  getToken: () => string | null
): Promise<{ url: string }> {
  const vr = validateImageFile(file);
  if (!vr.valid) throw new Error(vr.error);

  const form = new FormData();
  form.append("file", file);

  const res = await axios.post(`${API_BASE}/kyc/upload/selfie`, form, {
    headers: {
      ...getAuthHeaders(getToken),
      "Content-Type": "multipart/form-data",
    },
    timeout: 30000,
  });
  return (unwrapResponse(res) ?? res.data) ?? { url: "" };
}
