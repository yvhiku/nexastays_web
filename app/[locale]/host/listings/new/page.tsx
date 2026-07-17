"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  createHostListing,
  getHostVerification,
  uploadListingPhoto,
  uploadListingWalkthrough,
  normalizeHostVerificationStatus,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import { ListingWizardShell } from "@/components/host/listing-wizard/ListingWizardShell";
import { WizardStepBody } from "@/components/host/listing-wizard/WizardStepBody";
import {
  DRAFT_STORAGE_PREFIX,
  defaultWizardForm,
} from "@/lib/host-listing-wizard/form-defaults";
import { getWizardSteps, bookingModelOptions } from "@/lib/host-listing-wizard/step-config";
import { validateStep } from "@/lib/host-listing-wizard/validators";
import {
  buildCreateHostListingBody,
  serializeWizardDraft,
} from "@/lib/host-listing-wizard/map-to-api";
import type {
  ListingType,
  ListingWizardFormState,
} from "@/lib/host-listing-wizard/form-types";
import {
  DEFAULT_FEE_RATES,
  fetchStaysFeeRates,
  type StaysFeeRates,
} from "@/lib/stays-fees";
import { AppLoader } from "@/components/AppLoader";
import { CheckCircle2 } from "lucide-react";

function ListingWizardContent() {
  const { token, user } = useAuth();
  const { t, localePath } = useLanguage();

  const [form, setForm] = useState<ListingWizardFormState>(defaultWizardForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hostReady, setHostReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [feeRates, setFeeRates] = useState<StaysFeeRates>(DEFAULT_FEE_RATES);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const steps = useMemo(
    () => getWizardSteps(form.listingType, form.bookingModel),
    [form.listingType, form.bookingModel],
  );
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];

  const draftKey = user?.id ? `${DRAFT_STORAGE_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!token) return;
    getHostVerification(token)
      .then((s) => {
        const n = normalizeHostVerificationStatus(
          s as Parameters<typeof normalizeHostVerificationStatus>[0],
        );
        setHostReady(n.status === "APPROVED");
      })
      .catch(() => setHostReady(false));
  }, [token]);

  useEffect(() => {
    fetchStaysFeeRates().then(setFeeRates).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user || draftHydrated) return;
    setDraftHydrated(true);
    try {
      const raw = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ListingWizardFormState>;
        setForm((prev) => ({
          ...prev,
          ...parsed,
          photos: [],
          walkthrough: null,
          walkthroughPreview: null,
          contactName:
            (parsed.contactName as string) ||
            prev.contactName ||
            user.full_name?.trim() ||
            "",
          contactPhone:
            (parsed.contactPhone as string) ||
            prev.contactPhone ||
            user.phone_number?.trim() ||
            "",
        }));
        setSavedLabel(t("hostListing.draftRestored"));
      } else {
        setForm((prev) => ({
          ...prev,
          contactName: prev.contactName || user.full_name?.trim() || "",
          contactPhone: prev.contactPhone || user.phone_number?.trim() || "",
        }));
      }
    } catch {
      setForm((prev) => ({
        ...prev,
        contactName: prev.contactName || user.full_name?.trim() || "",
        contactPhone: prev.contactPhone || user.phone_number?.trim() || "",
      }));
    }
  }, [user, draftHydrated, t]);

  // Keep step index in range when step list shrinks (e.g. type change).
  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const patch = useCallback((partial: Partial<ListingWizardFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const persistDraft = useCallback(() => {
    if (!draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(serializeWizardDraft(form)));
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setSavedLabel(t("hostListing.draftSavedAt").replace("{time}", time));
    } catch {
      setSavedLabel(t("hostListing.draftSaveFailed"));
    }
  }, [draftKey, form, t]);

  // Autosave (debounced) when form changes after hydrate.
  useEffect(() => {
    if (!draftKey || !draftHydrated) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(serializeWizardDraft(form)));
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSavedLabel(t("hostListing.draftSavedAt").replace("{time}", time));
      } catch {
        /* ignore quota */
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [form, draftKey, draftHydrated, t]);

  const selectListingType = useCallback(
    (type: ListingType) => {
      const changing =
        form.listingType &&
        form.listingType !== type &&
        (stepIndex > 0 || form.unitTypes.length > 0 || form.title.trim().length > 0);
      if (changing) {
        const ok = window.confirm(t("hostListing.typeChangeConfirm"));
        if (!ok) return;
      }
      const models = bookingModelOptions(type);
      patch({
        listingType: type,
        bookingModel: models.length === 1 ? models[0].id : null,
        unitTypes: [],
        bedrooms: defaultWizardForm().bedrooms,
        propertyDetails: {},
      });
      setStepIndex(0);
      setError(null);
    },
    [form.listingType, form.unitTypes.length, form.title, stepIndex, patch, t],
  );

  const canContinue = currentStep
    ? validateStep(currentStep.id, form) === null
    : false;

  const goNext = async () => {
    if (!currentStep) return;
    const err = validateStep(currentStep.id, form);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (stepIndex >= steps.length - 1) {
      await handleSubmit();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleSubmit = async () => {
    for (let i = 0; i < steps.length; i++) {
      const err = validateStep(steps[i].id, form);
      if (err) {
        setError(err);
        setStepIndex(i);
        return;
      }
    }
    if (!token) return;

    setSubmitting(true);
    setError(null);
    try {
      setUploadProgress(
        t("hostListing.uploadingPhotos").replace(
          "{count}",
          String(form.photos.length),
        ),
      );
      const photoAssets: {
        asset_id: string;
        kind: "PHOTO";
        sort_order: number;
        category?: string;
        is_cover?: boolean;
      }[] = [];
      for (let i = 0; i < form.photos.length; i++) {
        const photo = form.photos[i];
        const { asset_id } = await uploadListingPhoto(photo.file, token);
        photoAssets.push({
          asset_id,
          kind: "PHOTO",
          sort_order: i,
          category: photo.category,
          is_cover: photo.isCover,
        });
      }

      setUploadProgress(t("hostListing.uploadingWalkthrough"));
      const { asset_id: videoId } = await uploadListingWalkthrough(
        form.walkthrough!,
        token,
      );

      setUploadProgress(t("hostListing.submittingListing"));
      const body = buildCreateHostListingBody(form, [
        ...photoAssets,
        {
          asset_id: videoId,
          kind: "WALKTHROUGH",
          sort_order: photoAssets.length,
        },
      ]);
      await createHostListing(body, token);

      if (draftKey) localStorage.removeItem(draftKey);
      setSubmitted(true);
    } catch (e) {
      setError(formatUserError(e) || t("host.failedSubmit"));
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (hostReady === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (hostReady === false) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="mb-2 text-2xl font-semibold text-nexa-ink">
          {t("hostListing.notApprovedTitle")}
        </h2>
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

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-nexa-ink">
          {t("hostListing.submittedTitle")}
        </h2>
        <p className="mb-6 text-nexa-ink-3">{t("hostListing.submittedDesc")}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href={localePath("/host/dashboard")}>
              {t("hostListing.goToDashboard")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={localePath("/")}>{t("hostDashboard.backToHome")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ListingWizardShell
      brandTitle={t("hostListing.wizardTitle")}
      steps={steps}
      stepIndex={Math.min(stepIndex, steps.length - 1)}
      savedLabel={savedLabel}
      canContinue={canContinue}
      continuing={submitting}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      onBack={goBack}
      onContinue={() => void goNext()}
      onSaveDraft={persistDraft}
      onJump={(i) => {
        if (i <= stepIndex) {
          setStepIndex(i);
          setMobileOpen(false);
          setError(null);
        }
      }}
      labels={{
        back: t("hostListing.back"),
        saveDraft: t("hostListing.saveDraft"),
        continue: t("hostListing.continue"),
        submit: t("hostListing.submitForReview"),
        progress: t("hostListing.progress"),
        stepOf: t("hostListing.stepOf"),
      }}
    >
      {error && (
        <ErrorAlert
          error={error}
          className="mb-4"
          onDismiss={() => setError(null)}
        />
      )}
      {uploadProgress && (
        <div className="mb-4 rounded-xl border border-nexa-line bg-white p-3 text-sm text-nexa-ink-2">
          {uploadProgress}
        </div>
      )}
      {currentStep && (
        <WizardStepBody
          stepId={currentStep.id}
          form={form}
          patch={patch}
          feeRates={feeRates}
          onSelectListingType={selectListingType}
        />
      )}
    </ListingWizardShell>
  );
}

export default function NewListingPage() {
  return (
    <ProtectedRoute>
      <NavBar />
      <ListingWizardContent />
    </ProtectedRoute>
  );
}
