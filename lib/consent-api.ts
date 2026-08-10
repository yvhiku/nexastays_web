/**
 * User consent API (Terms & Privacy) - shared with Pay/Go
 */

import axios from "axios";
import { getIdentityApiBaseUrl } from "./env";
import { bearerAuthHeaders } from "./access-token-store";
import { attachBrowserBearerAuth } from "./attach-browser-bearer-auth";

const API_BASE = getIdentityApiBaseUrl();
const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
client.defaults.headers.common["X-Auth-Transport"] = "cookie";
attachBrowserBearerAuth(client);

function getAuthHeaders(token?: string | null): Record<string, string> {
  if (typeof window === "undefined") return {};
  if (token) return { Authorization: `Bearer ${token}` };
  return bearerAuthHeaders();
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
