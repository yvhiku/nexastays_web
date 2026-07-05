/**
 * User consent API (Terms & Privacy) - shared with Pay/Go
 */

import axios, { AxiosError } from "axios";
import {
  refreshToken as refreshTokenApi,
  notifyTokenRefreshed,
  notifyAuthLogout,
} from "./auth-api";
import { getIdentityApiBaseUrl } from "./env";

const API_BASE = getIdentityApiBaseUrl();
const JWT_KEY = "nexa_access_token";
const REFRESH_TOKEN_KEY = "nexa_refresh_token";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as typeof err.config & { __refreshRetried?: boolean };
    if (!config) return Promise.reject(err);
    if (err.response?.status === 401 && !config.__refreshRetried && typeof window !== "undefined") {
      const hadAuth = config.headers?.["Authorization"] || config.headers?.Authorization;
      const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (hadAuth && refresh) {
        config.__refreshRetried = true;
        try {
          const tokens = await refreshTokenApi(refresh);
          localStorage.setItem(JWT_KEY, tokens.access_token);
          if (tokens.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
          notifyTokenRefreshed(tokens.access_token);
          config.headers = { ...config.headers, Authorization: `Bearer ${tokens.access_token}` };
          return client.request(config);
        } catch {
          localStorage.removeItem(JWT_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          notifyAuthLogout();
        }
      }
    }
    return Promise.reject(err);
  }
);

function getAuthHeaders(token?: string | null): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem(JWT_KEY) : null);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export interface ConsentStatus {
  mandatoryAccepted: boolean;
  terms?: { version: string; acceptedAt: string; language?: string } | null;
  privacy?: { version: string; acceptedAt: string; language?: string } | null;
}

/** Get current consent status */
export async function getCurrentConsents(
  token?: string | null
): Promise<ConsentStatus> {
  const res = await client.get("/users/me/consents/current", {
    headers: getAuthHeaders(token),
  });
  const data = res.data?.data ?? res.data;
  return data as ConsentStatus;
}

const DEFAULT_VERSION = "2026-02";

/** Accept Terms & Privacy Policy (required before payments) */
export async function acceptMandatoryConsents(
  token?: string | null,
  options?: { termsVersion?: string; privacyVersion?: string; language?: string }
): Promise<{ mandatoryAccepted: boolean }> {
  const res = await client.post(
    "/users/me/consents/accept-mandatory",
    {
      termsVersion: options?.termsVersion ?? DEFAULT_VERSION,
      privacyVersion: options?.privacyVersion ?? DEFAULT_VERSION,
      language: options?.language ?? (typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "en"),
    },
    { headers: getAuthHeaders(token) }
  );
  const data = res.data?.data ?? res.data;
  return data as { mandatoryAccepted: boolean };
}
