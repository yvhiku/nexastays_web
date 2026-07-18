/**
 * Nexa unified auth API (phone OTP + PIN)
 * Used for guest/host login. Stays uses same auth as Pay/Go.
 */

import axios, { type InternalAxiosRequestConfig } from "axios";
import { getIdentityApiBaseUrl } from "./env";
import { normalizePhone } from "./validators";

type RequestConfigWithRetry = InternalAxiosRequestConfig & { __retryCount?: number };

const API_BASE = getIdentityApiBaseUrl();

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/** Retry on 429 once; always show friendly message instead of raw ThrottlerException */
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as RequestConfigWithRetry | undefined;
    const is429 = err.response?.status === 429;
    if (is429 && config && (config.__retryCount ?? 0) < 1) {
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      await new Promise((r) => setTimeout(r, 2000));
      return client.request(config);
    }
    if (is429) {
      const raw = err.response?.data?.message;
      err.message =
        raw && !String(raw).toLowerCase().includes("throttler")
          ? raw
          : "Too many requests. Please wait a moment and try again.";
    }
    return Promise.reject(err);
  }
);

/** Pass through E.164; bare national digits still default to +212 */
function apiPhone(phone_number: string): string {
  return normalizePhone(phone_number);
}

/** Send OTP to phone */
export async function sendOtp(phone_number: string): Promise<{ sent: boolean }> {
  const res = await client.post("/auth/otp/send", {
    phone_number: apiPhone(phone_number),
  });
  return res.data?.data ?? res.data ?? { sent: true };
}

/** Nexa unified profile snippet returned from OTP verify (same phone across apps). */
export interface NexaProfileSnippet {
  exists?: boolean;
  full_name?: string | null;
  email?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  kyc_status?: string;
  identity_verified?: boolean;
  linked_services?: string[];
}

/** Verify OTP; returns access_token for sign-in, or otp_session_token for new users to set PIN */
export async function verifyOtp(
  phone_number: string,
  otp: string
): Promise<{
  verified: boolean;
  otp_session_token?: string;
  identity_session_token?: string;
  access_token?: string;
  refresh_token?: string;
  user_id?: string;
  accounts?: Array<{ id: string; account_type: string }>;
  nexa_profile?: NexaProfileSnippet;
}> {
  const res = await client.post("/auth/otp/verify", {
    phone_number: apiPhone(phone_number),
    otp,
  });
  const raw = res.data?.data ?? res.data ?? {};
  return {
    verified: !!raw.verified,
    otp_session_token: raw.otp_session_token,
    identity_session_token: raw.identity_session_token,
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    user_id: raw.user_id,
    accounts: raw.accounts,
    nexa_profile: raw.nexa_profile as NexaProfileSnippet | undefined,
  };
}

/** Set PIN (new users, requires otp_session_token from verifyOtp) */
export async function setPin(
  otp_session_token: string,
  pin: string
): Promise<{ success: boolean }> {
  const res = await client.post("/auth/pin/set", { otp_session_token, pin });
  return res.data?.data ?? res.data ?? { success: true };
}

/** Exchange OTP session for access_token after KYC submission (user created on KYC) */
export async function completeRegistration(
  otp_session_token: string
): Promise<{ access_token: string; refresh_token?: string; user_id: string }> {
  const res = await client.post("/auth/registration/complete", {
    otp_session_token,
  });
  const raw = res.data?.data ?? res.data ?? {};
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    user_id: raw.user_id,
  };
}

/** Refresh access token using refresh_token (for persistent sessions) */
export async function refreshToken(
  refresh_token: string
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await client.post("/auth/refresh", { refresh_token });
  const raw = res.data?.data ?? res.data ?? {};
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token ?? refresh_token,
  };
}

/** Notify AuthContext that tokens were refreshed (e.g. by API interceptor) */
export function notifyTokenRefreshed(accessToken: string): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nexa:auth:token-refreshed", { detail: { accessToken } })
    );
  }
}

/** Notify AuthContext that refresh failed and user should be logged out */
export function notifyAuthLogout(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nexa:auth:logout"));
  }
}

/** Verify PIN; returns access_token and user_id for logged-in session */
export async function verifyPin(
  phone_number: string,
  pin: string,
  account_type: string = "CONSUMER"
): Promise<{ verified: boolean; access_token?: string; user_id?: string }> {
  const res = await client.post("/auth/verify-pin", {
    phone_number: apiPhone(phone_number),
    pin,
    account_type,
  });
  return res.data?.data ?? res.data ?? { verified: false };
}
