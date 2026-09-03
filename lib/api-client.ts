/**
 * Shared API error helpers.
 * Domain clients (stays/auth/kyc/messaging) own their own axios instances.
 */

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
