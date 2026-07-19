"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { NavBar } from "@/components/navbar/NavBar";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  createHostListing,
  getHostListingById,
  getHostVerification,
  normalizeHostVerificationStatus,
  replaceListingMedia,
  replaceListingUnitTypes,
  submitHostListing,
  updateHostListing,
  uploadListingPhoto,
  uploadListingWalkthrough,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import { ListingWizardShell } from "@/components/host/listing-wizard/ListingWizardShell";
import { WizardStepBody } from "@/components/host/listing-wizard/WizardStepBody";
import { defaultWizardForm } from "@/lib/host-listing-wizard/form-defaults";
import {
  defaultBookingModel,
  getWizardSteps,
  GUEST_HOUSE_UI,
  PROPERTY_TYPE_COPY,
} from "@/lib/host-listing-wizard/step-config";
import { validateStep } from "@/lib/host-listing-wizard/validators";
import {
  assertCanSubmit,
  computeCompletionFlags,
} from "@/lib/host-listing-wizard/completion";
import {
  buildReplaceMediaBody,
  buildReplaceUnitTypesBody,
  buildUpdateHostListingBody,
  completionInputFromForm,
  hydrateWizardFromListing,
  listingCompletePercent,
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
import { PROPERTY_TYPE_ICONS } from "@/components/host/listing-wizard/icons/PropertyTypeIcons";
import { ChoiceCard, SoftTip, StepHeader } from "@/components/host/listing-wizard/wizard-ui";
import { isMultiUnitFlow } from "@/lib/host-listing-wizard/step-config";

const TYPES: ListingType[] = ["APARTMENT", "VILLA", "RIAD", "HOTEL", "HOSTEL"];

function ListingWizardContent() {
  const { token, user } = useAuth();
  const { t, localePath } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftParam = searchParams.get("draft");

  const [form, setForm] = useState<ListingWizardFormState>(defaultWizardForm);
  const [listingId, setListingId] = useState<string | null>(draftParam);
  const [phase, setPhase] = useState<"type" | "wizard" | "celebrate">(
    draftParam ? "wizard" : "type",
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hostReady, setHostReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [hydrating, setHydrating] = useState(Boolean(draftParam));
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [feeRates, setFeeRates] = useState<StaysFeeRates>(DEFAULT_FEE_RATES);
  const skipAutosave = useRef(true);
  const formRef = useRef(form);
  formRef.current = form;

  const steps = useMemo(
    () => getWizardSteps(form.listingType, form.bookingModel),
    [form.listingType, form.bookingModel],
  );
  const currentStep = steps[Math.min(stepIndex, Math.max(steps.length - 1, 0))];
  const completionPct = listingCompletePercent(form);

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
    if (!token || !draftParam) {
      setHydrating(false);
      return;
    }
    setHydrating(true);
    getHostListingById(draftParam, token)
      .then((detail) => {
        if (detail.status !== "DRAFT" && detail.status !== "REJECTED") {
          router.replace(localePath(`/host/listings/${detail.id}/edit`));
          return;
        }
        setForm(
          hydrateWizardFromListing(detail, {
            name: user?.full_name,
            phone: user?.phone_number,
          }),
        );
        setListingId(detail.id);
        setPhase("wizard");
        skipAutosave.current = true;
      })
      .catch((e) => {
        setError(formatUserError(e) || "Could not load draft.");
        setPhase("type");
        setListingId(null);
      })
      .finally(() => setHydrating(false));
  }, [token, draftParam, router, localePath, user?.full_name, user?.phone_number]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        contactName: prev.contactName || user.full_name?.trim() || "",
        contactPhone: prev.contactPhone || user.phone_number?.trim() || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (stepIndex >= steps.length && steps.length > 0) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  useEffect(() => {
    if (phase !== "celebrate") return;
    void import("@/lib/pwa-engagement").then((m) => m.markPwaListingSubmitted());
  }, [phase]);

  const patch = useCallback((partial: Partial<ListingWizardFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const syncMedia = useCallback(
    async (id: string, next: ListingWizardFormState) => {
      if (!token) return next;
      let photos = [...next.photos];
      let walkthroughAssetId = next.walkthroughAssetId ?? null;

      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.file && !p.assetId) {
          const { asset_id } = await uploadListingPhoto(p.file, token);
          photos[i] = { ...p, assetId: asset_id, file: null };
        }
      }

      if (next.walkthrough && !walkthroughAssetId) {
        const { asset_id } = await uploadListingWalkthrough(
          next.walkthrough,
          token,
        );
        walkthroughAssetId = asset_id;
      }

      const synced: ListingWizardFormState = {
        ...next,
        photos,
        walkthrough: null,
        walkthroughAssetId,
      };
      await replaceListingMedia(id, buildReplaceMediaBody(synced), token);
      return synced;
    },
    [token],
  );

  const persistServer = useCallback(
    async (opts?: { syncUnits?: boolean; syncMedia?: boolean }) => {
      const id = listingId;
      if (!token || !id) return;
      const current = formRef.current;
      try {
        let next = current;
        await updateHostListing(id, buildUpdateHostListingBody(current), token);
        if (opts?.syncUnits && isMultiUnitFlow(current.listingType, current.bookingModel)) {
          await replaceListingUnitTypes(
            id,
            buildReplaceUnitTypesBody(current),
            token,
          );
        }
        if (opts?.syncMedia) {
          next = await syncMedia(id, current);
          setForm(next);
        }
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSavedLabel(
          t("hostListing.draftSavedAt").replace("{time}", time),
        );
      } catch (e) {
        setSavedLabel(t("hostListing.draftSaveFailed"));
        setError(formatUserError(e) || t("hostListing.draftSaveFailed"));
      }
    },
    [listingId, token, syncMedia, t],
  );

  // Debounced autosave (fields only; media on leave / submit)
  useEffect(() => {
    if (phase !== "wizard" || !listingId || hydrating) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void persistServer();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [form, listingId, phase, hydrating, persistServer]);

  const createDraftFromType = async (
    type: ListingType,
    guestHouse = false,
  ) => {
    if (!token) return;
    setCreatingDraft(true);
    setError(null);
    try {
      const created = await createHostListing(
        {
          listing_type: type,
          guest_house: guestHouse || undefined,
        },
        token,
      );
      const detail = await getHostListingById(created.id, token);
      setForm({
        ...hydrateWizardFromListing(detail, {
          name: user?.full_name,
          phone: user?.phone_number,
        }),
        guestHouse,
        listingType: type,
        bookingModel: defaultBookingModel(type),
      });
      setListingId(created.id);
      setPhase("wizard");
      setStepIndex(0);
      skipAutosave.current = true;
      router.replace(localePath(`/host/listings/new?draft=${created.id}`));
    } catch (e) {
      setError(formatUserError(e) || t("host.failedSubmit"));
    } finally {
      setCreatingDraft(false);
    }
  };

  const canContinue = currentStep
    ? validateStep(currentStep.id, form) === null
    : false;

  const goNext = async () => {
    if (!currentStep || !listingId) return;
    const err = validateStep(currentStep.id, form);
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    const leavingUnits = currentStep.id === "unitTypes";
    const leavingMedia = currentStep.id === "media";
    const leavingPricing = currentStep.id === "pricing";

    if (leavingUnits || leavingPricing || leavingMedia) {
      setSubmitting(true);
      try {
        await persistServer({
          syncUnits: leavingUnits || leavingPricing,
          syncMedia: leavingMedia,
        });
      } catch (e) {
        setError(formatUserError(e) || t("hostListing.draftSaveFailed"));
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

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
    if (!token || !listingId) return;
    for (let i = 0; i < steps.length; i++) {
      const err = validateStep(steps[i].id, form);
      if (err) {
        setError(err);
        setStepIndex(i);
        return;
      }
    }
    const submitErr = assertCanSubmit(
      computeCompletionFlags(completionInputFromForm(form)),
    );
    if (submitErr) {
      setError(submitErr);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      setUploadProgress(t("hostListing.uploadingPhotos").replace(
        "{count}",
        String(form.photos.length),
      ));
      const synced = await syncMedia(listingId, form);
      setForm(synced);
      if (isMultiUnitFlow(synced.listingType, synced.bookingModel)) {
        await replaceListingUnitTypes(
          listingId,
          buildReplaceUnitTypesBody(synced),
          token,
        );
      }
      await updateHostListing(
        listingId,
        buildUpdateHostListingBody(synced),
        token,
      );
      setUploadProgress(t("hostListing.submittingListing"));
      await submitHostListing(listingId, token);
      setPhase("celebrate");
    } catch (e) {
      setError(formatUserError(e) || t("host.failedSubmit"));
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (hostReady === null || hydrating) {
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

  if (phase === "celebrate") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-nexa-ink">
          Listing submitted!
        </h2>
        <p className="mb-2 text-nexa-ink-3">
          Our team will review your listing within{" "}
          <strong className="font-semibold text-nexa-ink">1–2 business days</strong>.
        </p>
        <p className="mb-6 text-sm text-nexa-ink-4">
          We’ll email you when it’s approved or if anything needs changes. You can
          track status on your dashboard.
        </p>
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

  if (phase === "type") {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8">
        {error && (
          <ErrorAlert
            error={error}
            className="mb-4"
            onDismiss={() => setError(null)}
          />
        )}
        <StepHeader
          eyebrow="New listing"
          title="What are you listing?"
          description="Choose a property type to create your draft. You can refine details, photos, and pricing anytime before submitting."
          tip="Guest House maps to apartment inventory for now."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((type) => {
            const Icon = PROPERTY_TYPE_ICONS[type];
            const copy = PROPERTY_TYPE_COPY[type];
            return (
              <ChoiceCard
                key={type}
                selected={false}
                onClick={() => void createDraftFromType(type, false)}
                title={copy.label}
                support={copy.support}
                icon={<Icon className="h-8 w-8 text-nexa-primary" />}
              />
            );
          })}
          <ChoiceCard
            selected={false}
            onClick={() => void createDraftFromType("APARTMENT", true)}
            title={GUEST_HOUSE_UI.label}
            support={GUEST_HOUSE_UI.support}
          />
        </div>
        {creatingDraft && (
          <div className="mt-6 flex justify-center">
            <AppLoader />
          </div>
        )}
        <div className="mt-6">
          <SoftTip>
            Your draft is saved on Nexa as soon as you pick a type — no lost progress.
          </SoftTip>
        </div>
      </div>
    );
  }

  return (
    <ListingWizardShell
      brandTitle={t("hostListing.wizardTitle")}
      steps={steps}
      stepIndex={Math.min(stepIndex, Math.max(steps.length - 1, 0))}
      completionPercentage={completionPct}
      savedLabel={savedLabel}
      canContinue={canContinue}
      continuing={submitting}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      onBack={goBack}
      onContinue={() => void goNext()}
      onSaveDraft={() => void persistServer({ syncMedia: true, syncUnits: true })}
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
        progress: "Listing complete",
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
        />
      )}
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
