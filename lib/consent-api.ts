/**
 * User consent API (Terms & Privacy) - shared with Pay/Go
 */

import axios from "axios";
import {
  refreshToken as refreshTokenApi,
  notifyTokenRefreshed,
  notifyAuthLogout,
} from "./auth-api";
import { getIdentityApiBaseUrl } from "./env";

const API_BASE = getIdentityApiBaseUrl();
const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
client.defaults.headers.common["X-Auth-Transport"] = "cookie";

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as typeof err.config & { __refreshRetried?: boolean };
    if (!config) return Promise.reject(err);
    if (err.response?.status === 401 && !config.__refreshRetried && typeof window !== "undefined") {
      const hadAuth = config.headers?.["Authorization"] || config.headers?.Authorization;
      if (hadAuth) {
        config.__refreshRetried = true;
        try {
          const tokens = await refreshTokenApi();
          notifyTokenRefreshed(tokens.access_token);
          config.headers = { ...config.headers, Authorization: `Bearer ${tokens.access_token}` };
          return client.request(config);
        } catch {
          notifyAuthLogout();
        }
      }
    }
    return Promise.reject(err);
  }
);

function getAuthHeaders(token?: string | null): Record<string, string> {
  if (typeof window === "undefined") return {};
  return token ? { Authorization: `Bearer ${token}` } : {};
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
