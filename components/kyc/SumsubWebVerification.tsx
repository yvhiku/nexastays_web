"use client";

import { useEffect, useRef, useState } from "react";
import {
  createSumsubSdkToken,
  syncSumsubStatus,
  type KycProductSource,
} from "@/lib/kyc-api";
import { normalizeError } from "@/lib/api-client";

const SUMSUB_SCRIPT_SRC =
  "https://static.sumsub.com/idensic/static/sns-websdk-builder.js";

export type SumsubFinalStatus = "APPROVED" | "VERIFIED" | "REJECTED";

declare global {
  interface Window {
    snsWebSdk?: {
      init: (
        accessToken: string,
        updateAccessToken: () => Promise<string>
      ) => SumsubFluentBuilder;
    };
  }
}

/** Minimal fluent typing for sns-websdk-builder.js */
interface SumsubFluentBuilder {
  withConf: (c: Record<string, unknown>) => SumsubFluentBuilder;
  withOptions: (o: Record<string, unknown>) => SumsubFluentBuilder;
  on: (event: string, handler: (...args: unknown[]) => void) => SumsubFluentBuilder;
  onMessage: (
    handler: (type: string, payload: unknown) => void
  ) => SumsubFluentBuilder;
  build: () => { launch: (selector: string) => void; destroy?: () => void };
}

function loadSumsubScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("SSR"));
      return;
    }
    if (window.snsWebSdk) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${SUMSUB_SCRIPT_SRC}"]`
    ) as HTMLScriptElement | null;

    const onReady = () => {
      if (window.snsWebSdk) resolve();
      else reject(new Error("Sumsub snsWebSdk global missing after load"));
    };

    if (existing) {
      if (window.snsWebSdk) {
        resolve();
        return;
      }
      const started = Date.now();
      const wait = setInterval(() => {
        if (window.snsWebSdk) {
          clearInterval(wait);
          resolve();
        } else if (Date.now() - started > 20000) {
          clearInterval(wait);
          reject(new Error("Sumsub script timeout"));
        }
      }, 100);
      existing.addEventListener("error", () => {
        clearInterval(wait);
        reject(new Error("Sumsub script failed"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = SUMSUB_SCRIPT_SRC;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Failed to load Sumsub WebSDK"));
    document.head.appendChild(script);
  });
}

function mapBackendStatusToFinal(
  status?: string
): SumsubFinalStatus | null {
  const u = (status || "").toUpperCase();
  if (u === "APPROVED" || u === "VERIFIED") {
    return u === "VERIFIED" ? "VERIFIED" : "APPROVED";
  }
  if (u === "REJECTED") return "REJECTED";
  return null;
}

export interface SumsubWebVerificationProps {
  getToken: () => string | null;
  source?: KycProductSource;
  applicantEmail?: string;
  applicantPhone?: string;
  lang?: string;
  /** First successful backend sync (applicant exists / pending review). */
  onSubmitted: () => void;
  /** Terminal verification outcome from Nexa after Sumsub sync. */
  onFinalStatus: (status: SumsubFinalStatus) => void;
  onError?: (message: string) => void;
}

export function SumsubWebVerification({
  getToken,
  source = "STAYS",
  applicantEmail,
  applicantPhone,
  lang = "en",
  onSubmitted,
  onFinalStatus,
  onError,
}: SumsubWebVerificationProps) {
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const submittedOnceRef = useRef(false);
  const finalEmittedRef = useRef(false);
  /** Avoid JWT exchange until user has interacted with Sumsub (step completed). */
  const hasSdkProgressRef = useRef(false);

  const getTokenRef = useRef(getToken);
  const onSubmittedRef = useRef(onSubmitted);
  const onFinalStatusRef = useRef(onFinalStatus);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    getTokenRef.current = getToken;
    onSubmittedRef.current = onSubmitted;
    onFinalStatusRef.current = onFinalStatus;
    onErrorRef.current = onError;
  }, [getToken, onSubmitted, onFinalStatus, onError]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let instance: { launch?: (s: string) => void; destroy?: () => void } | null =
      null;

    const trySync = async (): Promise<void> => {
      const token = getTokenRef.current();
      if (!token || cancelled || finalEmittedRef.current) return;

      try {
        const result = await syncSumsubStatus(() => token, source);
        const terminal = mapBackendStatusToFinal(result.status);
        if (terminal) {
          finalEmittedRef.current = true;
          onFinalStatusRef.current(terminal);
          return;
        }
        const review = (result.reviewStatus || "").toLowerCase();
        /** Backend mapped decision may still be PENDING while Sumsub finished steps */
        const reviewDoneHint =
          review === "completed" || review === "awaitingservice";

        if (
          !submittedOnceRef.current &&
          result.updated !== false &&
          (hasSdkProgressRef.current || reviewDoneHint)
        ) {
          submittedOnceRef.current = true;
          onSubmittedRef.current();
        }
      } catch (e: unknown) {
        const err = normalizeError(e);
        if (err.status === 404) return;
        // Backend used to map Sumsub applicant 404 to HTTP 400 with JSON body { code: 404 }.
        const msg = `${err.message}`.toLowerCase();
        if (
          err.status === 400 &&
          (msg.includes("applicant not found") || /"code"\s*:\s*404/.test(msg))
        ) {
          return;
        }
        onErrorRef.current?.(err.message || "Verification sync failed");
      }
    };

    async function bootstrap() {
      try {
        await loadSumsubScript();
        if (cancelled || !window.snsWebSdk) {
          throw new Error("Sumsub WebSDK unavailable");
        }

        const tokenResp = await createSumsubSdkToken(getTokenRef.current, source);
        const accessToken = tokenResp.token;
        if (!accessToken) throw new Error("No Sumsub access token returned");

        const refreshAccessToken = async (): Promise<string> => {
          const r = await createSumsubSdkToken(getTokenRef.current, source);
          if (!r.token) throw new Error("Sumsub token refresh failed");
          return r.token;
        };

        const builder = window.snsWebSdk.init(accessToken, refreshAccessToken);

        instance = builder
          .withConf({
            lang,
            ...(applicantEmail ? { email: applicantEmail } : {}),
            ...(applicantPhone ? { phone: applicantPhone } : {}),
          })
          .withOptions({ addViewportTag: false, adaptIframeHeight: true })
          .on("idCheck.onStepCompleted", () => {
            hasSdkProgressRef.current = true;
            void trySync();
          })
          .on("idCheck.stepCompleted", () => {
            hasSdkProgressRef.current = true;
            void trySync();
          })
          .on("idCheck.onError", (error: unknown) => {
            console.error("Sumsub idCheck.onError", error);
            const msg =
              typeof error === "object" &&
              error !== null &&
              "message" in error &&
              typeof (error as { message: unknown }).message === "string"
                ? (error as { message: string }).message
                : "Verification error";
            onErrorRef.current?.(msg);
          })
          .onMessage((type: string) => {
            const t = (type || "").toLowerCase();
            if (
              t.includes("applicantstatus") ||
              t.includes("onapplicantstatuschanged") ||
              t.includes("review")
            ) {
              void trySync();
            }
          })
          .build();

        instance.launch("#sumsub-websdk-container");

        void trySync();
        pollTimer = setInterval(() => void trySync(), 12000);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            normalizeError(e).message || "Failed to start verification";
          setBootstrapError(msg);
          onErrorRef.current?.(msg);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      try {
        instance?.destroy?.();
      } catch {
        //
      }
    };
  }, [source, applicantEmail, applicantPhone, lang]);

  return (
    <div className="space-y-4">
      {bootstrapError && (
        <p className="text-red-600 text-sm" role="alert">
          {bootstrapError}
        </p>
      )}
      <div
        id="sumsub-websdk-container"
        className="min-h-[480px] w-full rounded-xl border border-nexa-line bg-white overflow-hidden"
      />
      <p className="text-[0.78rem] text-nexa-ink-4">
        Complete the steps below. Camera access may be required for identity
        verification.
      </p>
    </div>
  );
}
