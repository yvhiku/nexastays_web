"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLoader } from "@/components/AppLoader";
import { ListingWizardShell } from "@/components/host/listing-wizard/ListingWizardShell";
import { WIZARD_STICKY_TOP } from "@/components/host/listing-wizard/wizard-chrome";
import { WizardStepBody } from "@/components/host/listing-wizard/WizardStepBody";
import { WizardErrorSummary } from "@/components/host/listing-wizard/WizardErrorSummary";
import { WizardSkeleton } from "@/components/host/listing-wizard/WizardSkeleton";
import { CelebrateScreen } from "@/components/host/listing-wizard/CelebrateScreen";
import { PROPERTY_TYPE_ICONS } from "@/components/host/listing-wizard/icons/PropertyTypeIcons";
import { ChoiceCard, SoftTip, StepHeader } from "@/components/host/listing-wizard/wizard-ui";
import { WizardStatusIcon } from "@/components/host/listing-wizard/wizard-status";
import { GUEST_HOUSE_UI, PROPERTY_TYPE_COPY } from "@/lib/host-listing-wizard/step-config";
import { useListingWizard } from "@/lib/host-listing-wizard/use-listing-wizard";
import type { ListingType } from "@/lib/host-listing-wizard/form-types";

const TYPES: ListingType[] = ["APARTMENT", "VILLA", "RIAD", "HOTEL", "HOSTEL"];

function ListingWizardContent() {
  const { token, user } = useAuth();
  const { t, tf, localePath } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftParam = searchParams.get("draft");
  const [mobileOpen, setMobileOpen] = useState(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const w = useListingWizard({ token, user, draftParam, router, localePath, t, tf });

  // After a failed Continue, move focus to the error summary (WCAG: focus not obscured, links to fields).
  useEffect(() => {
    if (w.invalidAttempt === 0) return;
    const id = window.requestAnimationFrame(() => {
      summaryRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      summaryRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [w.invalidAttempt]);

  if (w.hostReady === null || w.hydrating) {
    return <WizardSkeleton label={t("hostListing.wizard.states.loading")} />;
  }

  if (w.hostReady === false) {
    if (w.hostGateError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center" style={{ paddingTop: `calc(${WIZARD_STICKY_TOP} + 4rem)` }}>
          <h2 className="mb-2 text-2xl font-semibold text-nexa-ink">{t("hostListing.wizard.states.loadFailedTitle")}</h2>
          <p className="mb-6 text-nexa-ink-3">{w.hostGateError}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={w.refreshHostGate}>{t("hostListing.wizard.save.retry")}</Button>
            <Button variant="outline" asChild>
              <Link href={localePath("/host/dashboard")}>{t("hostDashboard.title")}</Link>
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center" style={{ paddingTop: `calc(${WIZARD_STICKY_TOP} + 4rem)` }}>
        <h2 className="mb-2 text-2xl font-semibold text-nexa-ink">{t("hostListing.notApprovedTitle")}</h2>
        <p className="mb-6 text-nexa-ink-3">{t("hostListing.notApprovedDesc")}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href={localePath("/host")}>{t("hostDashboard.becomeHost")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={localePath("/host/dashboard")}>{t("hostDashboard.title")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (w.hydrateError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16" style={{ paddingTop: `calc(${WIZARD_STICKY_TOP} + 4rem)` }}>
        <div role="alert" className="rounded-2xl border-2 border-red-500 bg-white p-6 text-center shadow-nexa-sm">
          <WizardStatusIcon status="error" size={28} className="mx-auto text-red-600" />
          <h2 className="mt-3 text-xl font-semibold text-nexa-ink">{t("hostListing.wizard.states.loadFailedTitle")}</h2>
          <p className="mt-2 text-sm text-nexa-ink-3">{w.hydrateError}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={w.retryHydrate}>{t("hostListing.wizard.save.retry")}</Button>
            <Button variant="outline" onClick={w.startAnother}>
              {t("hostListing.wizard.states.startNew")}
            </Button>
            <Button variant="ghost" asChild>
              <Link href={localePath("/host/dashboard")}>{t("hostListing.goToDashboard")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (w.phase === "celebrate") {
    return <CelebrateScreen onCreateAnother={w.startAnother} />;
  }

  if (w.phase === "type") {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8" style={{ paddingTop: `calc(${WIZARD_STICKY_TOP} + 2.5rem)` }}>
        {w.error && <ErrorAlert error={w.error} className="mb-4" onDismiss={() => w.setError(null)} />}
        <StepHeader
          eyebrow={t("hostListing.wizard.type.eyebrow")}
          title={t("hostListing.wizard.type.title")}
          description={t("hostListing.wizard.type.description")}
          tip={t("hostListing.wizard.type.tip")}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((type) => {
            const Icon = PROPERTY_TYPE_ICONS[type];
            const copy = PROPERTY_TYPE_COPY[type];
            return (
              <ChoiceCard
                key={type}
                selected={false}
                busy={w.creatingType === type}
                disabled={w.creatingType !== null && w.creatingType !== type}
                onClick={() => void w.createDraftFromType(type, false)}
                title={t(copy.labelKey)}
                support={t(copy.supportKey)}
                icon={<Icon className="h-8 w-8 text-nexa-primary" />}
              />
            );
          })}
          <ChoiceCard
            selected={false}
            busy={w.creatingType === "GUEST_HOUSE"}
            disabled={w.creatingType !== null && w.creatingType !== "GUEST_HOUSE"}
            onClick={() => void w.createDraftFromType("APARTMENT", true)}
            title={t(GUEST_HOUSE_UI.labelKey)}
            support={t(GUEST_HOUSE_UI.supportKey)}
          />
        </div>
        <div className="mt-6">
          <SoftTip>{t("hostListing.wizard.type.autosaveNote")}</SoftTip>
        </div>
      </div>
    );
  }

  const jumpToStepId = (stepId: string) => {
    const idx = w.steps.findIndex((s) => s.id === stepId);
    if (idx >= 0) {
      w.jumpTo(idx);
      setMobileOpen(false);
    }
  };

  return (
    <ListingWizardShell
      steps={w.steps}
      statuses={w.statuses}
      stepIndex={w.stepIndex}
      completionPercentage={w.completionPct}
      saveState={w.saveState}
      onRetrySave={w.retrySave}
      canContinue={w.canContinue}
      continuing={w.submitting}
      busyLabel={w.busyLabel}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      onBack={w.goBack}
      onContinue={() => void w.goNext()}
      onSaveDraft={w.saveDraft}
      onJump={(i) => {
        w.jumpTo(i);
        setMobileOpen(false);
      }}
    >
      {/* Enter in a single-line input triggers Continue. */}
      <div
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.defaultPrevented) return;
          const target = e.target as HTMLElement;
          if (target.tagName === "INPUT" && (target as HTMLInputElement).type !== "file") {
            e.preventDefault();
            void w.goNext();
          }
        }}
      >
        {w.error && <ErrorAlert error={w.error} className="mb-4" onDismiss={() => w.setError(null)} />}
        {w.currentStep && (
          <WizardStepBody
            stepId={w.currentStep.id}
            form={w.form}
            patch={w.patch}
            errors={w.stepErrors}
            feeRates={w.feeRates}
            photoActions={w.photoActions}
            listingStatus={w.listingStatus}
            onJump={jumpToStepId}
          />
        )}
        <WizardErrorSummary ref={summaryRef} errors={w.stepErrors} className="mt-6" />
      </div>
    </ListingWizardShell>
  );
}

export default function NewListingPage() {
  return (
    <ProtectedRoute>
      <NavBar />
      <React.Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <AppLoader />
          </div>
        }
      >
        <ListingWizardContent />
      </React.Suspense>
    </ProtectedRoute>
  );
}
