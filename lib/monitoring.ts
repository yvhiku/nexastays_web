type ClientErrorKind = "react" | "window-error" | "unhandled-rejection";

type ClientErrorReport = {
  kind: ClientErrorKind;
  message: string;
  digest?: string;
  path: string;
  timestamp: string;
};

const MAX_MESSAGE_LENGTH = 500;

function safeMessage(value: unknown): string {
  if (value instanceof Error) return value.message.slice(0, MAX_MESSAGE_LENGTH);
  if (typeof value === "string") return value.slice(0, MAX_MESSAGE_LENGTH);
  return "Unexpected client error";
}

export function reportClientError(
  kind: ClientErrorKind,
  error: unknown,
  digest?: string,
): void {
  if (typeof window === "undefined") return;
  const endpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT?.trim();
  if (!endpoint) return;

  const body: ClientErrorReport = {
    kind,
    message: safeMessage(error),
    digest: digest?.slice(0, 128),
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
  const json = JSON.stringify(body);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([json], { type: "application/json" }));
    return;
  }
  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => undefined);
}

export function startClientErrorMonitoring(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onError = (event: ErrorEvent) =>
    reportClientError("window-error", event.error ?? event.message);
  const onUnhandledRejection = (event: PromiseRejectionEvent) =>
    reportClientError("unhandled-rejection", event.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
