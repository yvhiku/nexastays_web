/**
 * User-facing error normalization for Nexa Stays web.
 * Turns Axios/raw failures into titled, actionable copy (never bare "Network Error").
 */

import axios, { type AxiosError } from "axios";

export type AppErrorKind =
  | "network"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limit"
  | "server"
  | "unknown";

export interface AppError {
  kind: AppErrorKind;
  /** Short heading for banners */
  title: string;
  /** One or two sentences the guest/host can act on */
  message: string;
  status?: number;
  details?: unknown;
}

type ApiPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function joinMessages(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(". ") || undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}

function isNetworkFailure(err: AxiosError): boolean {
  if (err.code === "ERR_NETWORK" || err.code === "ECONNABORTED") return true;
  if (!err.response && err.message) {
    const m = err.message.toLowerCase();
    return (
      m === "network error" ||
      m.includes("failed to fetch") ||
      m.includes("networkerror") ||
      m.includes("load failed")
    );
  }
  return false;
}

/** Map a thrown value / Axios failure into a structured AppError. */
export function toAppError(err: unknown): AppError {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<ApiPayload>;
    const status = e.response?.status;
    const apiMsg = joinMessages(e.response?.data?.message) ?? e.response?.data?.error;

    if (e.code === "ECONNABORTED" || e.message?.toLowerCase().includes("timeout")) {
      return {
        kind: "timeout",
        title: "Request timed out",
        message: "The server took too long to respond. Check your connection and try again.",
        status,
        details: e.response?.data,
      };
    }

    if (isNetworkFailure(e) || status == null) {
      return {
        kind: "network",
        title: "Connection problem",
        message:
          "We couldn’t reach Nexa Stays. Check your internet connection, or try again in a moment.",
        status: 0,
        details: e.message,
      };
    }

    if (status === 401) {
      return {
        kind: "unauthorized",
        title: "Sign in required",
        message: apiMsg || "Your session expired. Please sign in again to continue.",
        status,
        details: e.response?.data,
      };
    }

    if (status === 403) {
      return {
        kind: "forbidden",
        title: "Not allowed",
        message: apiMsg || "You don’t have permission to do that.",
        status,
        details: e.response?.data,
      };
    }

    if (status === 404) {
      return {
        kind: "not_found",
        title: "Not found",
        message: apiMsg || "We couldn’t find what you were looking for.",
        status,
        details: e.response?.data,
      };
    }

    if (status === 409) {
      return {
        kind: "validation",
        title: "Conflict",
        message: apiMsg || "That action conflicts with the current state. Refresh and try again.",
        status,
        details: e.response?.data,
      };
    }

    if (status === 422 || status === 400) {
      return {
        kind: "validation",
        title: "Check your details",
        message: apiMsg || "Some fields need attention before we can continue.",
        status,
        details: e.response?.data,
      };
    }

    if (status === 429) {
      return {
        kind: "rate_limit",
        title: "Slow down",
        message: apiMsg || "Please wait a moment and try again.",
        status,
        details: e.response?.data,
      };
    }

    if (status >= 500) {
      return {
        kind: "server",
        title: "Something went wrong on our side",
        message:
          apiMsg ||
          "We’re having trouble completing that request. Please try again shortly.",
        status,
        details: e.response?.data,
      };
    }

    return {
      kind: "unknown",
      title: "Request failed",
      message: apiMsg || e.message || "Something went wrong. Please try again.",
      status,
      details: e.response?.data,
    };
  }

  if (err instanceof Error) {
    const raw = err.message?.trim() || "Something went wrong.";
    const lower = raw.toLowerCase();
    if (lower === "network error" || lower.includes("failed to fetch")) {
      return {
        kind: "network",
        title: "Connection problem",
        message:
          "We couldn’t reach Nexa Stays. Check your internet connection, or try again in a moment.",
        status: 0,
      };
    }
    // Domain messages already written for humans
    return {
      kind: "unknown",
      title: "Something went wrong",
      message: raw,
    };
  }

  return {
    kind: "unknown",
    title: "Something went wrong",
    message: "Please try again.",
  };
}

/** Single-line string for older `setError(string)` call sites. Prefer title+message in UI. */
export function formatUserError(err: unknown): string {
  const app = toAppError(err);
  if (app.title && app.message && !app.message.startsWith(app.title)) {
    return `${app.title}. ${app.message}`;
  }
  return app.message || app.title;
}

/** Attach structured data for interceptors / logging. */
export function toErrorWithAppError(err: unknown): Error & { appError: AppError } {
  const app = toAppError(err);
  const e = new Error(app.message) as Error & { appError: AppError };
  e.name = "AppError";
  e.appError = app;
  return e;
}
