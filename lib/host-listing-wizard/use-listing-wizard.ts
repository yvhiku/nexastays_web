"use client";

/**
 * Orchestration for the host create/resubmit listing wizard: form state,
 * serialized draft autosave, instant photo uploads + debounced media sync,
 * hydration/resume, validation gating, and submit. The page component is
 * layout only.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { useRouter } from "next/navigation";
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
import {
  DEFAULT_FEE_RATES,
  fetchStaysFeeRates,
  type StaysFeeRates,
} from "@/lib/stays-fees";
import { defaultWizardForm } from "./form-defaults";
import type {
  ListingType,
  ListingWizardFormState,
  MediaCategory,
  WizardFieldErrors,
  WizardStepId,
} from "./form-types";
import {
  defaultBookingModel,
  getWizardSteps,
  isMultiUnitFlow,
} from "./step-config";
import { validateStepFields } from "./validators";
import { assertCanSubmit, computeCompletionFlags } from "./completion";
import {
  buildReplaceUnitTypesBody,
  buildUpdateHostListingBody,
  completionInputFromForm,
  hydrateWizardFromListing,
  listingCompletePercent,
} from "./map-to-api";
import {
  PHOTO_UPLOAD_CONCURRENCY,
  enqueuePhotos,
  hasUnfinishedUploads,
  markFailed,
  markUploaded,
  markUploading,
  mediaBodyFromPhotos,
  movePhoto,
  pendingPhotoIds,
  removePhoto,
  reorderPhotos,
  retryPhoto,
  setCategory,
  setCover,
  uploadsInFlight,
  type PhotoFileRejection,
} from "./photo-queue";
import {
  firstIncompleteStepIndex,
  getStepStatuses,
  reduceSaveState,
  type SaveState,
} from "./step-status";

const AUTOSAVE_MS = 900;
const MEDIA_SYNC_MS = 600;

export type WizardPhase = "type" | "wizard" | "celebrate";
export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export interface UseListingWizardArgs {
  token: string | null | undefined;
  user: { full_name?: string | null; phone_number?: string | null } | null | undefined;
  draftParam: string | null;
  router: ReturnType<typeof useRouter>;
  localePath: (path: string) => string;
  t: (key: string) => string;
  tf: Translate;
}

/** Strip transient media state so upload progress never triggers a PATCH. */
function fieldsFingerprint(form: ListingWizardFormState): string {
  const { photos: _p, walkthrough: _w, walkthroughPreview: _wp, ...rest } = form;
  return JSON.stringify(rest);
}

export function useListingWizard({
  token,
  user,
  draftParam,
  router,
  localePath,
  t,
  tf,
}: UseListingWizardArgs) {
  const [form, setForm] = useState<ListingWizardFormState>(defaultWizardForm);
  const [listingId, setListingId] = useState<string | null>(draftParam);
  const [listingStatus, setListingStatus] = useState<string | null>(null);
  const [phase, setPhase] = useState<WizardPhase>(draftParam ? "wizard" : "type");
  const [stepIndex, setStepIndex] = useState(0);
  const [hostReady, setHostReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<ListingType | "GUEST_HOUSE" | null>(null);
  const [hydrating, setHydrating] = useState(Boolean(draftParam));
  const [hydrateError, setHydrateError] = useState<string | null>(null);
  const [hydrateAttempt, setHydrateAttempt] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [feeRates, setFeeRates] = useState<StaysFeeRates>(DEFAULT_FEE_RATES);
  const [touched, setTouched] = useState<Set<WizardStepId>>(() => new Set());
  const [invalidAttempt, setInvalidAttempt] = useState(0);

  const formRef = useRef(form);
  formRef.current = form;
  const skipAutosave = useRef(true);
  const lastPersistedFingerprint = useRef<string | null>(null);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mediaDirtyRef = useRef(false);
  const mediaTimerRef = useRef<number | null>(null);
  const mediaSyncInFlightRef = useRef<Promise<void>>(Promise.resolve());
  const inFlightUploadIds = useRef<Set<string>>(new Set());
  const cancelledIds = useRef<Set<string>>(new Set());
  /** Set when createDraftFromType already hydrated the draft — skip the URL-driven re-fetch. */
  const skipNextHydrateRef = useRef(false);

  // Release blob previews when the wizard unmounts.
  useEffect(() => {
    return () => {
      for (const photo of formRef.current.photos) {
        if (photo.preview.startsWith("blob:")) URL.revokeObjectURL(photo.preview);
      }
      const walkthroughPreview = formRef.current.walkthroughPreview;
      if (walkthroughPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(walkthroughPreview);
      }
    };
  }, []);

  const steps = useMemo(
    () => getWizardSteps(form.listingType, form.bookingModel),
    [form.listingType, form.bookingModel],
  );
  const safeIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[safeIndex];
  const completionPct = listingCompletePercent(form);
  const statuses = useMemo(
    () => getStepStatuses(steps, form, safeIndex),
    [steps, form, safeIndex],
  );

  const stepErrors: WizardFieldErrors = useMemo(() => {
    if (!currentStep || !touched.has(currentStep.id)) return {};
    return validateStepFields(currentStep.id, form);
  }, [currentStep, form, touched]);

  // Host gating
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

  // Hydrate draft; resume at the first incomplete step.
  useEffect(() => {
    if (!token || !draftParam) {
      setHydrating(false);
      return;
    }
    // Fresh create already loaded this draft — avoid skeleton flash + Guest House wipe.
    if (skipNextHydrateRef.current && listingId === draftParam) {
      skipNextHydrateRef.current = false;
      setHydrating(false);
      return;
    }
    let cancelled = false;
    setHydrating(true);
    setHydrateError(null);
    getHostListingById(draftParam, token)
      .then((detail) => {
        if (cancelled) return;
        if (detail.status !== "DRAFT" && detail.status !== "REJECTED") {
          router.replace(localePath(`/host/listings/${detail.id}/edit`));
          return;
        }
        const hydrated = hydrateWizardFromListing(detail, {
          name: user?.full_name ?? undefined,
          phone: user?.phone_number ?? undefined,
        });
        const hydratedSteps = getWizardSteps(hydrated.listingType, hydrated.bookingModel);
        setForm(hydrated);
        lastPersistedFingerprint.current = fieldsFingerprint(hydrated);
        setListingId(detail.id);
        setListingStatus(detail.status);
        setPhase("wizard");
        setStepIndex(firstIncompleteStepIndex(hydratedSteps, hydrated));
        skipAutosave.current = true;
      })
      .catch((e) => {
        if (cancelled) return;
        setHydrateError(formatUserError(e) || t("hostListing.wizard.states.loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, draftParam, hydrateAttempt, router, localePath]);

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

  // ---------------------------------------------------------------------
  // Media sync (PUT media) — debounced, flushed at navigation/save/submit.
  // ---------------------------------------------------------------------
  const runMediaSync = useCallback(async () => {
    const id = listingId;
    if (!token || !id || !mediaDirtyRef.current) return;
    const current = formRef.current;
    // Never PUT while any tile is still pending/uploading: the body would omit
    // those photos and replace the server set with a partial one. Stay dirty —
    // each upload completion calls markMediaDirty, so the last one flushes the
    // full set (and Leave/Save/Submit block until uploads finish).
    if (hasUnfinishedUploads(current.photos)) {
      return;
    }
    mediaDirtyRef.current = false;
    let walkthroughAssetId = current.walkthroughAssetId ?? null;
    if (current.walkthrough && !walkthroughAssetId) {
      const { asset_id } = await uploadListingWalkthrough(current.walkthrough, token);
      walkthroughAssetId = asset_id;
      setForm((prev) => ({ ...prev, walkthrough: null, walkthroughAssetId }));
    }
    try {
      await replaceListingMedia(
        id,
        mediaBodyFromPhotos(formRef.current.photos, walkthroughAssetId),
        token,
      );
    } catch (e) {
      mediaDirtyRef.current = true;
      throw e;
    }
  }, [listingId, token]);

  const flushMediaSync = useCallback(() => {
    if (mediaTimerRef.current != null) {
      window.clearTimeout(mediaTimerRef.current);
      mediaTimerRef.current = null;
    }
    const run = () => runMediaSync();
    const queued = mediaSyncInFlightRef.current.then(run, run);
    mediaSyncInFlightRef.current = queued.then(
      () => undefined,
      () => undefined,
    );
    return queued;
  }, [runMediaSync]);

  const markMediaDirty = useCallback(() => {
    mediaDirtyRef.current = true;
    if (mediaTimerRef.current != null) window.clearTimeout(mediaTimerRef.current);
    mediaTimerRef.current = window.setTimeout(() => {
      mediaTimerRef.current = null;
      flushMediaSync().catch((e) => {
        setSaveState((s) => reduceSaveState(s, { type: "failure", error: formatUserError(e) }));
      });
    }, MEDIA_SYNC_MS);
  }, [flushMediaSync]);

  // ---------------------------------------------------------------------
  // Instant uploads with bounded concurrency; completion applies by id.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!token || phase !== "wizard") return;
    const photos = form.photos;
    const pending = pendingPhotoIds(photos).filter((id) => !inFlightUploadIds.current.has(id));
    const slots = PHOTO_UPLOAD_CONCURRENCY - uploadsInFlight(photos);
    if (pending.length === 0 || slots <= 0) return;

    for (const id of pending.slice(0, slots)) {
      const photo = photos.find((p) => p.id === id);
      if (!photo?.file) continue;
      inFlightUploadIds.current.add(id);
      setForm((prev) => ({ ...prev, photos: markUploading(prev.photos, id) }));
      uploadListingPhoto(photo.file, token)
        .then(({ asset_id }) => {
          if (cancelledIds.current.has(id)) {
            cancelledIds.current.delete(id);
            return; // removed mid-flight — orphan asset is harmless
          }
          setForm((prev) => ({ ...prev, photos: markUploaded(prev.photos, id, asset_id) }));
          markMediaDirty();
        })
        .catch((e) => {
          if (cancelledIds.current.has(id)) {
            cancelledIds.current.delete(id);
            return;
          }
          setForm((prev) => ({
            ...prev,
            photos: markFailed(prev.photos, id, formatUserError(e) || t("hostListing.wizard.photos.uploadFailed")),
          }));
          // A failure may be the last unfinished tile; if a sync was deferred
          // while uploads were in flight, re-arm it so the dirty set still lands.
          if (mediaDirtyRef.current) markMediaDirty();
        })
        .finally(() => {
          inFlightUploadIds.current.delete(id);
        });
    }
  }, [form.photos, token, phase, markMediaDirty, t]);

  const photoActions = useMemo(
    () => ({
      onFilesAdded: (files: File[]): PhotoFileRejection[] => {
        const result = enqueuePhotos(formRef.current.photos, files);
        if (result.added.length > 0) {
          setForm((prev) => ({ ...prev, photos: [...prev.photos, ...result.added] }));
        }
        return result.rejected;
      },
      onRemove: (id: string) => {
        const target = formRef.current.photos.find((p) => p.id === id);
        if (target && (target.uploadStatus === "uploading" || target.uploadStatus === "pending")) {
          cancelledIds.current.add(id);
        }
        setForm((prev) => ({ ...prev, photos: removePhoto(prev.photos, id) }));
        if (target?.uploadStatus === "uploaded") markMediaDirty();
      },
      onRetry: (id: string) => {
        setForm((prev) => ({ ...prev, photos: retryPhoto(prev.photos, id) }));
      },
      onReorder: (ids: string[]) => {
        setForm((prev) => ({ ...prev, photos: reorderPhotos(prev.photos, ids) }));
        // Only sync when at least one tile is already on the server — otherwise an
        // all-pending reorder would PUT an empty media body and wipe prior assets.
        if (formRef.current.photos.some((p) => p.uploadStatus === "uploaded")) {
          markMediaDirty();
        }
      },
      onMove: (id: string, delta: -1 | 1) => {
        setForm((prev) => ({ ...prev, photos: movePhoto(prev.photos, id, delta) }));
        if (formRef.current.photos.some((p) => p.uploadStatus === "uploaded")) {
          markMediaDirty();
        }
      },
      onSetCover: (id: string) => {
        setForm((prev) => ({ ...prev, photos: setCover(prev.photos, id) }));
        if (formRef.current.photos.some((p) => p.uploadStatus === "uploaded")) {
          markMediaDirty();
        }
      },
      onSetCategory: (id: string, category: MediaCategory) => {
        setForm((prev) => ({ ...prev, photos: setCategory(prev.photos, id, category) }));
        if (formRef.current.photos.some((p) => p.uploadStatus === "uploaded")) {
          markMediaDirty();
        }
      },
      /** Clear walkthrough and flush removal to the server when it was already uploaded. */
      onWalkthroughCleared: () => {
        const hadServerAsset = Boolean(formRef.current.walkthroughAssetId);
        setForm((prev) => ({
          ...prev,
          walkthrough: null,
          walkthroughPreview: null,
          walkthroughAssetId: null,
        }));
        if (hadServerAsset) markMediaDirty();
      },
    }),
    [markMediaDirty],
  );

  // Walkthrough file chosen → needs a media sync.
  const walkthroughPending = Boolean(form.walkthrough && !form.walkthroughAssetId);
  useEffect(() => {
    if (walkthroughPending && phase === "wizard" && listingId) markMediaDirty();
  }, [walkthroughPending, phase, listingId, markMediaDirty]);

  // ---------------------------------------------------------------------
  // Draft autosave (fields + optional unit types), serialized.
  // ---------------------------------------------------------------------
  const persistServer = useCallback(
    (opts?: { syncUnits?: boolean; syncMedia?: boolean }) => {
      const id = listingId;
      if (!token || !id) return Promise.resolve();
      const current = formRef.current;
      const run = async () => {
        setSaveState((s) => reduceSaveState(s, { type: "start" }));
        try {
          await updateHostListing(id, buildUpdateHostListingBody(current), token);
          lastPersistedFingerprint.current = fieldsFingerprint(current);
          if (opts?.syncUnits && isMultiUnitFlow(current.listingType, current.bookingModel)) {
            await replaceListingUnitTypes(id, buildReplaceUnitTypesBody(current), token);
          }
          if (opts?.syncMedia) await flushMediaSync();
          setSaveState((s) => reduceSaveState(s, { type: "success", at: new Date() }));
        } catch (e) {
          setSaveState((s) =>
            reduceSaveState(s, { type: "failure", error: formatUserError(e) || null }),
          );
          throw e;
        }
      };
      const queued = persistQueueRef.current.then(run, run);
      persistQueueRef.current = queued.then(
        () => undefined,
        () => undefined,
      );
      return queued;
    },
    [listingId, token, flushMediaSync],
  );

  const fingerprint = fieldsFingerprint(form);
  useEffect(() => {
    if (phase !== "wizard" || !listingId || hydrating) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      lastPersistedFingerprint.current = fingerprint;
      return;
    }
    if (fingerprint === lastPersistedFingerprint.current) return;
    const timer = window.setTimeout(() => {
      persistServer().catch(() => undefined);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [fingerprint, listingId, phase, hydrating, persistServer]);

  const retrySave = useCallback(() => {
    persistServer({ syncUnits: true, syncMedia: true }).catch(() => undefined);
  }, [persistServer]);

  // Warn before leaving with unfinished uploads or unflushed media/fields.
  const unfinishedUploads = hasUnfinishedUploads(form.photos);
  useEffect(() => {
    if (phase !== "wizard") return;
    const handler = (e: BeforeUnloadEvent) => {
      const dirty =
        unfinishedUploads ||
        mediaDirtyRef.current ||
        saveState.status === "busy" ||
        fingerprint !== lastPersistedFingerprint.current;
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase, unfinishedUploads, saveState.status, fingerprint]);

  // ---------------------------------------------------------------------
  // Type picker → create draft
  // ---------------------------------------------------------------------
  const createDraftFromType = async (type: ListingType, guestHouse = false) => {
    if (!token || creatingType) return;
    setCreatingType(guestHouse ? "GUEST_HOUSE" : type);
    setError(null);
    try {
      const created = await createHostListing(
        { listing_type: type, guest_house: guestHouse || undefined },
        token,
      );
      const detail = await getHostListingById(created.id, token);
      const hydrated = {
        ...hydrateWizardFromListing(detail, {
          name: user?.full_name ?? undefined,
          phone: user?.phone_number ?? undefined,
        }),
        guestHouse,
        listingType: type,
        bookingModel: defaultBookingModel(type),
      };
      setForm(hydrated);
      lastPersistedFingerprint.current = fieldsFingerprint(hydrated);
      setListingId(created.id);
      setListingStatus(detail.status);
      setPhase("wizard");
      setStepIndex(0);
      setTouched(new Set());
      skipAutosave.current = true;
      skipNextHydrateRef.current = true;
      router.replace(localePath(`/host/listings/new?draft=${created.id}`));
    } catch (e) {
      setError(formatUserError(e) || t("host.failedSubmit"));
    } finally {
      setCreatingType(null);
    }
  };

  // ---------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------
  const flushBeforeLeave = useCallback(
    async (fromStep: WizardStepId | undefined) => {
      const syncUnits = fromStep === "unitTypes" || fromStep === "pricing";
      await persistServer({ syncUnits, syncMedia: true });
    },
    [persistServer],
  );

  const jumpTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length || index === safeIndex) return;
      setError(null);
      const from = currentStep?.id;
      setStepIndex(index);
      flushBeforeLeave(from).catch(() => undefined);
    },
    [steps.length, safeIndex, currentStep?.id, flushBeforeLeave],
  );

  const goBack = useCallback(() => {
    if (safeIndex === 0) return;
    jumpTo(safeIndex - 1);
  }, [safeIndex, jumpTo]);

  const canContinue = currentStep
    ? Object.keys(validateStepFields(currentStep.id, form)).length === 0
    : false;

  const handleSubmit = async () => {
    if (!token || !listingId) return;
    const current = formRef.current;
    for (let i = 0; i < steps.length; i++) {
      const errs = validateStepFields(steps[i].id, current);
      if (Object.keys(errs).length > 0) {
        setTouched((prev) => new Set(prev).add(steps[i].id));
        setStepIndex(i);
        setInvalidAttempt((n) => n + 1);
        return;
      }
    }
    if (hasUnfinishedUploads(current.photos)) {
      setError(t("hostListing.wizard.photos.waitForUploads"));
      return;
    }
    const gate = assertCanSubmit(computeCompletionFlags(completionInputFromForm(current)));
    if (gate) {
      setError(tf(gate.key, gate.vars));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      setBusyLabel(t("hostListing.wizard.states.savingMedia"));
      await flushMediaSync();
      if (isMultiUnitFlow(current.listingType, current.bookingModel)) {
        await replaceListingUnitTypes(listingId, buildReplaceUnitTypesBody(current), token);
      }
      await updateHostListing(listingId, buildUpdateHostListingBody(current), token);
      setBusyLabel(t("hostListing.wizard.states.submitting"));
      await submitHostListing(listingId, token);
      setPhase("celebrate");
    } catch (e) {
      setError(formatUserError(e) || t("host.failedSubmit"));
    } finally {
      setSubmitting(false);
      setBusyLabel(null);
    }
  };

  const goNext = async () => {
    if (!currentStep || !listingId) return;
    const errs = validateStepFields(currentStep.id, form);
    setTouched((prev) => new Set(prev).add(currentStep.id));
    if (Object.keys(errs).length > 0) {
      setInvalidAttempt((n) => n + 1);
      return;
    }
    setError(null);

    if (safeIndex >= steps.length - 1) {
      await handleSubmit();
      return;
    }

    setSubmitting(true);
    const inFlight = uploadsInFlight(form.photos);
    setBusyLabel(
      inFlight > 0
        ? tf("hostListing.wizard.states.uploadingCount", { count: inFlight })
        : t("hostListing.wizard.states.saving"),
    );
    try {
      await flushBeforeLeave(currentStep.id);
    } catch {
      // Save failure surfaces in the footer save state with Retry; still advance.
    } finally {
      setSubmitting(false);
      setBusyLabel(null);
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const saveDraft = () => {
    persistServer({ syncMedia: true, syncUnits: true }).catch(() => undefined);
  };

  const retryHydrate = () => setHydrateAttempt((n) => n + 1);

  const startAnother = () => {
    setForm(defaultWizardForm());
    setListingId(null);
    setListingStatus(null);
    setStepIndex(0);
    setTouched(new Set());
    setSaveState({ status: "idle" });
    setError(null);
    setPhase("type");
    mediaDirtyRef.current = false;
    inFlightUploadIds.current.clear();
    cancelledIds.current.clear();
    skipNextHydrateRef.current = false;
    if (mediaTimerRef.current != null) {
      window.clearTimeout(mediaTimerRef.current);
      mediaTimerRef.current = null;
    }
    router.replace(localePath("/host/listings/new"));
  };

  return {
    form,
    patch,
    steps,
    stepIndex: safeIndex,
    currentStep,
    statuses,
    completionPct,
    stepErrors,
    invalidAttempt,
    canContinue,
    listingId,
    listingStatus,
    phase,
    hostReady,
    hydrating,
    hydrateError,
    retryHydrate,
    error,
    setError,
    saveState,
    retrySave,
    submitting,
    busyLabel,
    creatingType,
    feeRates,
    createDraftFromType,
    goNext,
    goBack,
    jumpTo,
    saveDraft,
    photoActions,
    startAnother,
  };
}
