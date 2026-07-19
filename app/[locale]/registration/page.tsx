"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { completeRegistration } from "@/lib/auth-api";
import {
  updateProfile,
  submitKyc,
  getCurrentUserOrNull,
  syncSumsubStatus,
} from "@/lib/kyc-api";
import { normalizeError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { validateEmail, validateDateOfBirth } from "@/lib/validators";
import { useLanguage } from "@/contexts/LanguageContext";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { resolveLocalizedPath } from "@/lib/locale-path";
import { MOROCCO_CITIES } from "@/lib/moroccan-cities";
import { NexaSelect } from "@/components/ui/NexaSelect";
import {
  SumsubWebVerification,
  type SumsubFinalStatus,
} from "@/components/kyc/SumsubWebVerification";

const steps = [
  { id: 1, label: "Personal Info" },
  { id: 2, label: "Verify" },
  { id: 3, label: "Result" },
];

function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function applyProfileToForm(
  u: {
    full_name?: string;
    email?: string;
    city?: string;
    date_of_birth?: string;
    phone_number?: string;
    nationality?: string;
  },
  setters: {
    setFirstName: React.Dispatch<React.SetStateAction<string>>;
    setLastName: React.Dispatch<React.SetStateAction<string>>;
    setEmail: React.Dispatch<React.SetStateAction<string>>;
    setCity: React.Dispatch<React.SetStateAction<string>>;
    setDateOfBirth: React.Dispatch<React.SetStateAction<string>>;
    setPhone: React.Dispatch<React.SetStateAction<string>>;
    setNationality: React.Dispatch<React.SetStateAction<string>>;
  },
) {
  if (u.full_name) {
    const { first, last } = splitFullName(String(u.full_name));
    setters.setFirstName((prev) => prev || first);
    setters.setLastName((prev) => prev || last);
  }
  if (u.email) setters.setEmail((prev) => prev || String(u.email));
  if (u.city) setters.setCity((prev) => prev || String(u.city));
  if (u.date_of_birth) {
    setters.setDateOfBirth((prev) => prev || String(u.date_of_birth).slice(0, 10));
  }
  if (u.phone_number) setters.setPhone((prev) => prev || String(u.phone_number));
  if (u.nationality) setters.setNationality(String(u.nationality));
}

export default function RegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectRaw = searchParams.get("redirect") || "/";
  const existingAccount = searchParams.get("existing") === "1";
  const { token, tokenType, isAuthenticated, setAuthJwt, user } = useAuth();
  const { localePath, locale } = useLanguage();
  const redirectTarget = resolveLocalizedPath(redirectRaw, locale);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [step1Submitting, setStep1Submitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [nationality, setNationality] = useState("MA");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");

  /** After Sumsub submit: waiting for APPROVED/REJECTED */
  const [awaitingDecision, setAwaitingDecision] = useState(false);
  const [finalOutcome, setFinalOutcome] = useState<SumsubFinalStatus | null>(
    null
  );

  useEffect(() => {
    const p = searchParams.get("phone");
    if (p) setPhone(p);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined" && !token && !isAuthenticated) {
      const regUrl =
        localePath("/registration") +
        (redirectRaw
          ? "?redirect=" + encodeURIComponent(redirectTarget)
          : "");
      router.push(
        `${localePath("/login")}?redirect=${encodeURIComponent(regUrl)}`
      );
    }
  }, [token, isAuthenticated, router, redirectRaw, redirectTarget, localePath]);

  useEffect(() => {
    if (tokenType === "jwt" && token) {
      getCurrentUserOrNull(() => token).then((u) => {
        if (!u) return;
        const k = (u.kyc_status || "").toUpperCase();
        if (k === "APPROVED" || k === "VERIFIED") {
          router.replace(redirectTarget);
          return;
        }
        applyProfileToForm(u, {
          setFirstName,
          setLastName,
          setEmail,
          setCity,
          setDateOfBirth,
          setPhone,
          setNationality,
        });
      });
    }
  }, [tokenType, token, router, redirectTarget]);

  useEffect(() => {
    if (user && tokenType === "jwt") {
      applyProfileToForm(user, {
        setFirstName,
        setLastName,
        setEmail,
        setCity,
        setDateOfBirth,
        setPhone,
        setNationality,
      });
    }
  }, [user, tokenType]);

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const exchangeOtpSessionForJwt = useCallback(async () => {
    if (tokenType !== "otp_session" || !token) return;
    const result = await completeRegistration(token);
    if (result?.access_token) {
      setAuthJwt(result.access_token, result.refresh_token);
    }
  }, [tokenType, token, setAuthJwt]);

  const handlePersonalContinue = async () => {
    if (!phone) {
      setError("Phone number is required");
      return;
    }
    const emailRes = validateEmail(email);
    if (!emailRes.valid) {
      setError(emailRes.error ?? "Invalid email");
      return;
    }
    if (dateOfBirth) {
      const dobRes = validateDateOfBirth(dateOfBirth);
      if (!dobRes.valid) {
        setError(dobRes.error ?? "Invalid date of birth");
        return;
      }
    }
    if (!fullName) {
      setError("Full name is required");
      return;
    }

    setStep1Submitting(true);
    setError("");
    const getToken = () => token;
    try {
      await submitKyc(
        {
          phone_number: phone,
          full_name: fullName,
          email: email || undefined,
          city: city || undefined,
          nationality: nationality || undefined,
          date_of_birth: dateOfBirth || undefined,
          national_id_number: idNumber || undefined,
          documents: { id_document: true, selfie: true },
          source: "STAYS",
        },
        getToken
      );

      await updateProfile(
        {
          full_name: fullName,
          email: email || undefined,
          city: city || undefined,
          nationality: nationality || undefined,
          date_of_birth: dateOfBirth || undefined,
        },
        getToken
      );

      setFinalOutcome(null);
      setAwaitingDecision(false);
      setStep(2);
    } catch (err: unknown) {
      const apiErr = normalizeError(err);
      setError(
        apiErr.title
          ? `${apiErr.title}. ${apiErr.message}`
          : apiErr.message || "Could not save your information",
      );
    } finally {
      setStep1Submitting(false);
    }
  };

  const handleSumsubSubmitted = () => {
    setAwaitingDecision(true);
    setFinalOutcome(null);
    setStep(3);
  };

  const handleSumsubFinalStatus = async (status: SumsubFinalStatus) => {
    try {
      await exchangeOtpSessionForJwt();
    } catch (e: unknown) {
      const apiErr = normalizeError(e);
      setError(
        apiErr.title
          ? `${apiErr.title}. ${apiErr.message}`
          : apiErr.message || "Could not complete registration",
      );
    }
    setFinalOutcome(status);
    setAwaitingDecision(false);
    setStep(3);
  };

  /** Poll while waiting on step 3 (widget unmounted). */
  useEffect(() => {
    if (step !== 3 || !awaitingDecision || !token) return;

    let cancelled = false;

    const pollOnce = async () => {
      const tok = token;
      try {
        const r = await syncSumsubStatus(() => tok, "STAYS");
        const u = (r.status || "").toUpperCase();
        const terminal =
          u === "APPROVED"
            ? ("APPROVED" as const)
            : u === "VERIFIED"
              ? ("VERIFIED" as const)
              : u === "REJECTED"
                ? ("REJECTED" as const)
                : null;
        if (!terminal || cancelled) return;

        try {
          const result = await completeRegistration(tok);
          if (!cancelled && result?.access_token) {
            setAuthJwt(result.access_token, result.refresh_token);
          }
        } catch {
          //
        }
        if (!cancelled) {
          setFinalOutcome(terminal);
          setAwaitingDecision(false);
        }
      } catch {
        //
      }
    };

    void pollOnce();
    const id = setInterval(() => {
      if (!cancelled) void pollOnce();
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [step, awaitingDecision, token]);

  if (!token) {
    return null;
  }

  const showApproved =
    finalOutcome === "APPROVED" || finalOutcome === "VERIFIED";
  const showRejected = finalOutcome === "REJECTED";

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="order-2 lg:order-1 bg-gradient-to-br from-nexa-primary to-nexa-primary-dark flex items-center justify-center p-6 sm:p-10 md:p-14 lg:p-16 xl:p-20 xl:pl-16 relative overflow-hidden min-h-[40vh] lg:min-h-[calc(100vh-72px)]">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-[400px]">
            <Link
              href="/"
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
            <h2 className="text-white text-2xl font-semibold mb-4">
              Complete your profile
            </h2>
            <p className="text-white/75 text-base mb-10">
              Identity verification protects everyone. Complete Sumsub
              verification — you can browse listings while we finalize review.
            </p>
            <div className="flex flex-col gap-3.5">
              {[
                { icon: "🪪", text: "ID verified for real trust" },
                { icon: "🔒", text: "Data used only for verification" },
                { icon: "✓", text: "Booking unlocks after approval" },
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

        <div className="order-1 lg:order-2 bg-nexa-bg flex items-center justify-center p-6 sm:p-8 md:p-10 lg:pl-16">
          <div className="w-full max-w-[460px]">
            <div className="flex gap-0 mb-10">
              {steps.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex-1 text-center relative",
                    i < steps.length - 1 &&
                      "after:content-[''] after:absolute after:top-4 after:left-1/2 after:right-[-50%] after:h-0.5 after:bg-nexa-line after:z-0",
                    step > s.id && "after:bg-nexa-primary"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2 relative z-10 transition-all",
                      step > s.id
                        ? "border-nexa-primary bg-nexa-primary text-white"
                        : step === s.id
                          ? "border-nexa-primary text-nexa-primary border-2 bg-nexa-bg"
                          : "border-2 border-nexa-line text-nexa-ink-4 bg-nexa-bg"
                    )}
                  >
                    {step > s.id ? "✓" : s.id}
                  </div>
                  <div
                    className={cn(
                      "text-[0.72rem]",
                      step === s.id
                        ? "text-nexa-primary font-semibold"
                        : "text-nexa-ink-4"
                    )}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  {existingAccount ? "Continue verification" : "Your information"}
                </h2>
                <p className="text-nexa-ink-3 text-sm mb-7">
                  {existingAccount
                    ? "We found your existing Nexa account from the mobile app. Confirm your details and complete identity verification to use Nexa Stays on the web."
                    : "Required for identity verification. Same account as Nexa Pay and Nexa Go. Next step opens Sumsub secure verification."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-nexa-ink-2 mb-2">
                      First Name <span className="text-nexa-primary">*</span>
                    </label>
                    <Input
                      placeholder="Youssef"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-nexa-ink-2 mb-2">
                      Last Name <span className="text-nexa-primary">*</span>
                    </label>
                    <Input
                      placeholder="Ait Omar"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-nexa-ink-2 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6 XX XX XX XX"
                    readOnly
                    className="bg-nexa-bg-2"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-nexa-ink-2 mb-2">
                    Email <span className="text-nexa-primary">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-nexa-ink-2 mb-2">
                    City
                  </label>
                  <NexaSelect
                    variant="field"
                    value={city}
                    onChange={setCity}
                    aria-label="City"
                    options={[
                      { value: "", label: "Select city" },
                      ...MOROCCO_CITIES.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-nexa-ink-2 mb-2">
                      Nationality
                    </label>
                    <NexaSelect
                      variant="field"
                      value={nationality}
                      onChange={setNationality}
                      aria-label="Nationality"
                      options={[
                        { value: "MA", label: "Morocco" },
                        { value: "OTHER", label: "Other" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-nexa-ink-2 mb-2">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-nexa-ink-2 mb-2">
                    ID Number
                  </label>
                  <Input
                    placeholder="CNIE or passport number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
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
                  className="w-full justify-center"
                  onClick={() => void handlePersonalContinue()}
                  disabled={!firstName || !lastName || step1Submitting}
                >
                  {step1Submitting ? "Saving…" : "Continue →"}
                </Button>
                <p className="text-[0.78rem] text-nexa-ink-4 text-center mt-4">
                  You can browse while verification is pending. Booking unlocks
                  after approval.
                </p>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  Identity verification
                </h2>
                <p className="text-nexa-ink-3 text-sm mb-7">
                  Follow the secure Sumsub steps to verify your identity.
                </p>
                {error && (
                  <ErrorAlert
                    error={error}
                    className="mb-4"
                    compact
                    onDismiss={() => setError("")}
                  />
                )}
                <SumsubWebVerification
                  getToken={() => token}
                  applicantEmail={email || undefined}
                  applicantPhone={phone || undefined}
                  onSubmitted={() => void handleSumsubSubmitted()}
                  onFinalStatus={(s) => void handleSumsubFinalStatus(s)}
                  onError={(msg) => setError(msg)}
                />
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                  >
                    ← Back
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && awaitingDecision && !finalOutcome && (
              <div className="text-center py-5">
                <div className="text-5xl mb-4">⏳</div>
                <h2 className="text-2xl font-semibold mb-2">
                  Verification submitted
                </h2>
                <p className="text-nexa-ink-3 text-sm mb-6">
                  Sumsub is reviewing your submission. This page will update when
                  a decision is ready. You can keep browsing Nexa Stays in the
                  meantime.
                </p>
                <p className="text-xs text-nexa-ink-4 mb-6">
                  Checking status every few seconds…
                </p>
                {error && (
                  <ErrorAlert
                    error={error}
                    className="mb-4"
                    compact
                    onDismiss={() => setError("")}
                  />
                )}
                <Button className="w-full justify-center" asChild>
                  <Link href={redirectTarget}>Browse Stays →</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-center mt-2.5"
                  asChild
                >
                  <Link href={localePath("/")}>Go to Home</Link>
                </Button>
              </div>
            )}

            {step === 3 && showApproved && (
              <div className="text-center py-5">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-2xl font-semibold mb-2">
                  Verification approved
                </h2>
                <p className="text-nexa-ink-3 text-sm mb-6">
                  Your identity is verified. You can book stays on Nexa Stays.
                </p>
                <div className="flex flex-col gap-2.5 mb-6 text-left">
                  <div className="flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm bg-green-50 text-green-800">
                    ✅ Browse listings
                  </div>
                  <div className="flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm bg-green-50 text-green-800">
                    ✅ Book stays
                  </div>
                </div>
                <Button className="w-full justify-center" asChild>
                  <Link href={redirectTarget}>Browse Stays →</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-center mt-2.5"
                  asChild
                >
                  <Link href={localePath("/")}>Go to Home</Link>
                </Button>
              </div>
            )}

            {step === 3 && showRejected && (
              <div className="text-center py-5">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-2xl font-semibold mb-2">
                  Verification not approved
                </h2>
                <p className="text-nexa-ink-3 text-sm mb-6">
                  We couldn&apos;t approve your verification this time. Check
                  your email or contact support if you need help.
                </p>
                <Button className="w-full justify-center" asChild>
                  <Link href={localePath("/profile")}>Go to Profile</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-center mt-2.5"
                  asChild
                >
                  <Link href={localePath("/")}>Go to Home</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
