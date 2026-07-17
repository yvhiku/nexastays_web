/**
 * Centralized axios client with interceptors.
 * - Attaches JWT only when tokenType is jwt
 * - Normalizes errors into structured, user-friendly format
 */

import axios, { type AxiosError } from "axios";
import { getIdentityApiBaseUrl } from "./env";
import { toAppError, type AppError } from "./errors";

export interface ApiError {
  status: number;
  message: string;
  title?: string;
  kind?: AppError["kind"];
  details?: unknown;
}

export function normalizeError(err: unknown): ApiError {
  const app = toAppError(err);
  return {
    status: app.status ?? 0,
    message: app.message,
    title: app.title,
    kind: app.kind,
    details: app.details,
  };
}

/** Unwrap API response: handles data?.data ?? data */
export function unwrapResponse<T>(res: { data?: unknown }): T {
  const d = res.data;
  if (d && typeof d === "object" && "data" in d) {
    return (d as { data: T }).data;
  }
  return d as T;
}

type TokenProvider = () => { token: string | null; tokenType: "jwt" | "otp_session" | "none" };

/** Create axios instance. Token provider is set from client (browser) only. */
export function createApiClient(getToken?: TokenProvider) {
  const client = axios.create({
    baseURL: getIdentityApiBaseUrl(),
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    if (typeof window !== "undefined" && getToken) {
      const { token, tokenType } = getToken();
      if (token && tokenType === "jwt") {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const normalized = normalizeError(err);
      const apiErr = new Error(
        normalized.title
          ? `${normalized.title}. ${normalized.message}`
          : normalized.message,
      ) as Error & { apiError?: ApiError; appError?: AppError };
      apiErr.apiError = normalized;
      apiErr.appError = toAppError(err);
      return Promise.reject(apiErr);
    },
  );

  return client;
}

/** Default client (no auth – for public endpoints like OTP send) */
export const apiClient = createApiClient();
