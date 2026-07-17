"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toAppError, type AppError } from "@/lib/errors";

export type AlertVariant = "error" | "success" | "warning" | "info";

const VARIANT_STYLES: Record<
  AlertVariant,
  {
    wrap: string;
    iconWrap: string;
    title: string;
    body: string;
    dismiss: string;
    Icon: typeof AlertCircle;
  }
> = {
  error: {
    wrap: "border-nexa-primary/25 bg-gradient-to-br from-nexa-primary-soft/80 to-white shadow-[0_8px_24px_rgba(232,80,122,0.08)]",
    iconWrap: "bg-nexa-primary text-white",
    title: "text-nexa-ink",
    body: "text-nexa-ink-3",
    dismiss: "text-nexa-ink-4 hover:text-nexa-primary hover:bg-nexa-primary-soft",
    Icon: AlertCircle,
  },
  success: {
    wrap: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white shadow-[0_8px_24px_rgba(16,185,129,0.08)]",
    iconWrap: "bg-emerald-600 text-white",
    title: "text-emerald-950",
    body: "text-emerald-900/75",
    dismiss: "text-emerald-700/70 hover:text-emerald-900 hover:bg-emerald-100",
    Icon: CheckCircle2,
  },
  warning: {
    wrap: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white shadow-[0_8px_24px_rgba(245,158,11,0.08)]",
    iconWrap: "bg-amber-500 text-white",
    title: "text-amber-950",
    body: "text-amber-900/75",
    dismiss: "text-amber-700/70 hover:text-amber-900 hover:bg-amber-100",
    Icon: TriangleAlert,
  },
  info: {
    wrap: "border-nexa-line bg-gradient-to-br from-nexa-bg-2 to-white shadow-nexa-sm",
    iconWrap: "bg-nexa-ink text-white",
    title: "text-nexa-ink",
    body: "text-nexa-ink-3",
    dismiss: "text-nexa-ink-4 hover:text-nexa-ink hover:bg-nexa-bg-2",
    Icon: Info,
  },
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  /** Prefer passing structured API errors */
  error?: AppError | null;
  className?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function Alert({
  variant = "error",
  title,
  children,
  error,
  className,
  onDismiss,
  dismissLabel = "Dismiss",
  action,
  compact = false,
}: AlertProps) {
  const resolvedVariant = variant;
  const styles = VARIANT_STYLES[resolvedVariant];
  const Icon = styles.Icon;
  const heading = title ?? error?.title;
  const body = children ?? error?.message;

  if (!heading && !body) return null;

  return (
    <div
      role={resolvedVariant === "error" || resolvedVariant === "warning" ? "alert" : "status"}
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        compact ? "p-3.5" : "p-4 sm:p-5",
        styles.wrap,
        className,
      )}
    >
      <div className="flex gap-3 sm:gap-3.5">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl",
            compact ? "h-9 w-9" : "h-10 w-10",
            styles.iconWrap,
          )}
          aria-hidden
        >
          <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          {heading && (
            <p
              className={cn(
                "font-semibold tracking-tight",
                compact ? "text-sm" : "text-[0.95rem]",
                styles.title,
              )}
            >
              {heading}
            </p>
          )}
          {body && (
            <div
              className={cn(
                "leading-relaxed",
                heading ? "mt-1" : "",
                compact ? "text-xs" : "text-sm",
                styles.body,
              )}
            >
              {body}
            </div>
          )}
          {action && <div className="mt-3">{action}</div>}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              styles.dismiss,
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Convenience wrapper when you only have a thrown unknown / string. */
export function ErrorAlert({
  error,
  fallbackTitle = "Something went wrong",
  onDismiss,
  className,
  compact,
  action,
}: {
  error: unknown;
  fallbackTitle?: string;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  if (error == null || error === "") return null;

  if (typeof error === "object" && error !== null && "title" in error && "message" in error) {
    return (
      <Alert
        variant="error"
        error={error as AppError}
        onDismiss={onDismiss}
        className={className}
        compact={compact}
        action={action}
      />
    );
  }

  // Prefer structured parsing (covers bare "Network Error", axios errors, etc.)
  if (typeof error !== "string") {
    const app = toAppError(error);
    return (
      <Alert
        variant="error"
        error={app}
        onDismiss={onDismiss}
        className={className}
        compact={compact}
        action={action}
      />
    );
  }

  const message = error.trim();
  if (!message) return null;

  const lower = message.toLowerCase();
  if (lower === "network error" || lower.includes("failed to fetch")) {
    const app = toAppError(new Error(message));
    return (
      <Alert
        variant="error"
        error={app}
        onDismiss={onDismiss}
        className={className}
        compact={compact}
        action={action}
      />
    );
  }

  // Already "Title. Message" from formatUserError / API interceptors
  const dot = message.indexOf(". ");
  if (dot > 0 && dot < 48) {
    return (
      <Alert
        variant="error"
        title={message.slice(0, dot)}
        onDismiss={onDismiss}
        className={className}
        compact={compact}
        action={action}
      >
        {message.slice(dot + 2)}
      </Alert>
    );
  }

  return (
    <Alert
      variant="error"
      title={fallbackTitle}
      onDismiss={onDismiss}
      className={className}
      compact={compact}
      action={action}
    >
      {message}
    </Alert>
  );
}
