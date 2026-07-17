"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { sendOtp, verifyOtp } from "@/lib/auth-api";
import { validatePhone, normalizeMoroccanPhone, getLocalPhonePart } from "@/lib/validators";
import { normalizeError } from "@/lib/api-client";
import { resolveLocalizedPath } from "@/lib/locale-path";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, tf, localePath, locale } = useLanguage();
  const homePath = localePath("/");
  const { setAuthJwt, setAuthOtpSession, isAuthenticated, ready } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const postLoginDestination = (() => {
    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      return resolveLocalizedPath(redirectParam, locale);
    }
    return homePath;
  })();

  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    router.replace(postLoginDestination);
  }, [ready, isAuthenticated, router, postLoginDestination]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalized = normalizeMoroccanPhone(phone);
    const vr = validatePhone(phone);
    if (!vr.valid) {
      setError(vr.error ?? t("login.enterValidPhone"));
      return;
    }
    setLoading(true);
    try {
      await sendOtp(normalized);
      setPhone(normalized);
      setStep("otp");
    } catch (err: unknown) {
      const apiErr = normalizeError(err);
      setError(
        apiErr.title ? `${apiErr.title}. ${apiErr.message}` : apiErr.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length < 4) {
      setError(t("login.enterCode"));
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(phone, otp);
      const data = res && typeof res === "object" ? res : {};
      const accessToken =
        "access_token" in data
          ? (data as { access_token?: string }).access_token
          : undefined;
      const otpSessionToken =
        "otp_session_token" in data
          ? (data as { otp_session_token?: string }).otp_session_token
          : undefined;
      const identitySessionToken =
        "identity_session_token" in data
          ? (data as { identity_session_token?: string }).identity_session_token
          : undefined;

      const identitySession = otpSessionToken ?? identitySessionToken;
      const registrationUrl = `${localePath("/registration")}?redirect=${encodeURIComponent(homePath)}&phone=${encodeURIComponent(phone)}`;

      const refresh =
        "refresh_token" in data
          ? (data as { refresh_token?: string }).refresh_token
          : undefined;

      if (accessToken) {
        setAuthJwt(accessToken, refresh);
        router.push(postLoginDestination);
        return;
      }
      if (identitySession) {
        setAuthOtpSession(identitySession);
        router.push(registrationUrl);
        return;
      }
      setError(t("login.couldNotComplete"));
    } catch (err: unknown) {
      const apiErr = normalizeError(err);
      if (
        apiErr.status === 404 ||
        apiErr.message?.toLowerCase().includes("not found")
      ) {
        router.push(
          `${localePath("/registration")}?redirect=${encodeURIComponent(homePath)}&phone=${encodeURIComponent(phone)}`
        );
        return;
      }
      setError(
        apiErr.title ? `${apiErr.title}. ${apiErr.message}` : apiErr.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-gradient-to-br from-nexa-primary to-nexa-primary-dark flex items-center justify-center p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 xl:pl-16 relative overflow-hidden min-h-[calc(100vh-72px)]">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-[400px]">
            <Link
              href={localePath("/")}
              className="flex items-center gap-2.5 mb-12 cursor-pointer hover:opacity-90"
            >
              <div className="relative w-11 h-11 rounded-lg overflow-hidden">
                <Image
                  src={NEXA_STAYS_LOGO_SRC}
                  alt="Nexa Stays"
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
              <span className="font-display text-2xl font-bold text-white">
                Nexa Stays
              </span>
            </Link>
            <h2 className="text-white text-xl sm:text-2xl font-semibold mb-4">
              {t("login.title")}
            </h2>
            <p className="text-white/75 text-base mb-10">
              {t("login.subtitle")}
            </p>
            <div className="flex flex-col gap-3.5">
              {[
                { icon: "📱", text: t("login.step1") },
                { icon: "✉️", text: t("login.step2") },
                { icon: "✓", text: t("login.step3") },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 text-white/85 text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm shrink-0">
                    {item.icon}
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-nexa-bg flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-10 lg:pl-16">
          <div className="w-full max-w-[400px]">
            {step === "phone" && (
              <form onSubmit={handleSendOtp}>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">{t("login.title")}</h2>
                <p className="text-nexa-ink-3 text-sm mb-6">
                  {t("login.subtitle")}
                </p>
                <div className="mb-5">
                  <PhoneInput
                    value={getLocalPhonePart(phone)}
                    onChange={(v) => setPhone(v)}
                    placeholder="6 XX XX XX XX"
                    autoFocus
                  />
                </div>
                {error && (
                  <ErrorAlert
                    error={error}
                    className="mb-4"
                    compact
                    onDismiss={() => setError("")}
                  />
                )}
                <Button
                  type="submit"
                  className="w-full justify-center"
                  disabled={loading}
                >
                  {loading ? t("login.sending") : t("login.sendCode")}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp}>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">{t("login.codeTitle")}</h2>
                <p className="text-nexa-ink-3 text-sm mb-6">
                  {tf("login.codeSubtitle", { phone })}
                </p>
                <div className="mb-5">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, ""))
                    }
                    autoFocus
                  />
                </div>
                {error && (
                  <ErrorAlert
                    error={error}
                    className="mb-4"
                    compact
                    onDismiss={() => setError("")}
                  />
                )}
                <Button
                  type="submit"
                  className="w-full justify-center"
                  disabled={loading}
                >
                  {loading ? t("login.verifying") : t("common.signIn")}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError("");
                  }}
                  className="w-full mt-4 text-sm text-nexa-ink-4 hover:text-nexa-primary"
                >
                  {t("login.useDifferent")}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
