"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import { newBedroom } from "@/lib/host-listing-wizard/form-defaults";
import { isMultiUnitFlow } from "@/lib/host-listing-wizard/step-config";
import {
  MAX_GUEST_OPTIONS,
  SHARED_FEATURES,
  VILLA_FEATURES,
  aboutCopyKeys,
} from "@/lib/host-listing-wizard/step-content";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  TITLE_MAX,
} from "@/lib/host-listing-wizard/validators";
import { cn } from "@/lib/utils";
import {
  CheckRow,
  Field,
  SectionCard,
  StepHeader,
  invalidControlClassName,
  textareaClassName,
} from "../wizard-ui";
import { resolveMessage } from "../WizardErrorSummary";
import type { StepProps } from "./step-props";

const K = "hostListing.wizard.about.";

export function AboutStep({ form, patch, errors }: StepProps) {
  const { t, tf } = useLanguage();
  const err = (id: string) => (errors[id] ? resolveMessage(tf, errors[id]) : null);
  const copy = aboutCopyKeys(form.listingType);
  const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
  const guestOptions = MAX_GUEST_OPTIONS.map((v) => ({
    value: v,
    label: tf("hostListing.wizard.about.guestsCount", { count: v }),
  }));
  const descLen = form.description.trim().length;

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow={t(copy.eyebrowKey)}
        title={t(copy.titleKey)}
        description={t(copy.descriptionKey)}
      />

      <SectionCard title={t(K + "basicsTitle")} description={t(K + "basicsDesc")}>
        <Field
          id="title"
          label={t(K + "listingTitle")}
          required
          hint={t(K + "listingTitleHint")}
          error={err("title")}
          counter={`${form.title.length} / ${TITLE_MAX}`}
        >
          <Input
            value={form.title}
            maxLength={TITLE_MAX}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder={t(K + "listingTitlePlaceholder")}
          />
        </Field>
        <div className="mt-4">
          <Field
            id="description"
            label={t(K + "description")}
            required
            hint={tf(K + "descriptionHint", { min: DESCRIPTION_MIN })}
            error={err("description")}
            counter={
              descLen < DESCRIPTION_MIN
                ? tf(K + "descriptionCounterMin", { count: descLen, min: DESCRIPTION_MIN })
                : `${descLen} / ${DESCRIPTION_MAX}`
            }
          >
            <textarea
              value={form.description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => patch({ description: e.target.value })}
              rows={5}
              className={cn(textareaClassName, err("description") && invalidControlClassName)}
              placeholder={t(K + "descriptionPlaceholder")}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={t(K + "detailsTitle")} description={t(K + "detailsDesc")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            id="maxGuests"
            label={t(K + "maxGuests")}
            required
            hint={multi ? t(K + "maxGuestsHintMulti") : t(K + "maxGuestsHint")}
            error={err("maxGuests")}
          >
            <NexaSelect
              variant="field"
              value={String(Math.min(15, Math.max(1, form.maxGuests)))}
              onChange={(value) => patch({ maxGuests: Number(value) })}
              options={guestOptions}
              aria-label={t(K + "maxGuests")}
            />
          </Field>
          <Field id="sizeSqm" label={t(K + "size")} hint={t(K + "sizeHint")}>
            <Input
              value={form.sizeSqm}
              inputMode="numeric"
              onChange={(e) => patch({ sizeSqm: e.target.value })}
              placeholder="85"
            />
          </Field>
          {(form.listingType === "HOTEL" || form.listingType === "HOSTEL") && (
            <Field id="totalRooms" label={t(K + "totalRooms")} hint={t(K + "totalRoomsHint")}>
              <Input
                value={String(form.propertyDetails.total_rooms ?? "")}
                inputMode="numeric"
                onChange={(e) =>
                  patch({
                    propertyDetails: { ...form.propertyDetails, total_rooms: e.target.value },
                  })
                }
                placeholder="24"
              />
            </Field>
          )}
        </div>
      </SectionCard>

      {!multi && (
        <SectionCard
          title={t(K + "bedroomsTitle")}
          description={t(K + "bedroomsDesc")}
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patch({ bedrooms: [...form.bedrooms, newBedroom(form.bedrooms.length + 1)] })
              }
            >
              {t(K + "addBedroom")}
            </Button>
          }
        >
          <div className="space-y-3">
            {form.bedrooms.map((b, idx) => (
              <div key={b.id} className="rounded-xl border-2 border-nexa-line bg-nexa-bg p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-nexa-primary">
                    {tf(K + "bedroomN", { n: idx + 1 })}
                    <span className="ms-2 font-normal normal-case tracking-normal text-nexa-ink-4">
                      {[b.bedSummary, tf(K + "sleepsN", { n: b.sleeps })].filter(Boolean).join(" · ")}
                    </span>
                  </p>
                  {form.bedrooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        patch({ bedrooms: form.bedrooms.filter((x) => x.id !== b.id) })
                      }
                      aria-label={tf(K + "removeBedroom", { n: idx + 1 })}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-nexa-ink-3 transition-colors duration-150 hover:bg-white hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label={t(K + "bedroomName")}>
                    <Input
                      value={b.label}
                      onChange={(e) => {
                        const next = [...form.bedrooms];
                        next[idx] = { ...b, label: e.target.value };
                        patch({ bedrooms: next });
                      }}
                      placeholder={t(K + "bedroomNamePlaceholder")}
                    />
                  </Field>
                  <Field label={t(K + "beds")} hint={t(K + "bedsHint")}>
                    <Input
                      value={b.bedSummary}
                      onChange={(e) => {
                        const next = [...form.bedrooms];
                        next[idx] = { ...b, bedSummary: e.target.value };
                        patch({ bedrooms: next });
                      }}
                      placeholder={t(K + "bedsPlaceholder")}
                    />
                  </Field>
                  <Field label={t(K + "sleeps")} hint={t(K + "sleepsHint")}>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={b.sleeps}
                      onChange={(e) => {
                        const next = [...form.bedrooms];
                        next[idx] = { ...b, sleeps: Number(e.target.value) || 1 };
                        patch({ bedrooms: next });
                      }}
                    />
                  </Field>
                  <div className="flex items-end pb-1">
                    <CheckRow
                      checked={b.privateBathroom}
                      onChange={(checked) => {
                        const next = [...form.bedrooms];
                        next[idx] = { ...b, privateBathroom: checked };
                        patch({ bedrooms: next });
                      }}
                      label={t(K + "privateBathroom")}
                      hint={t(K + "privateBathroomHint")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {form.listingType === "VILLA" && (
        <FeatureGrid
          title={t(K + "villaFeaturesTitle")}
          description={t(K + "villaFeaturesDesc")}
          features={VILLA_FEATURES}
          form={form}
          patch={patch}
        />
      )}

      {(form.listingType === "RIAD" ||
        form.listingType === "HOTEL" ||
        form.listingType === "HOSTEL") && (
        <FeatureGrid
          title={t(K + "sharedFeaturesTitle")}
          description={t(K + "sharedFeaturesDesc")}
          features={SHARED_FEATURES}
          form={form}
          patch={patch}
        />
      )}
    </div>
  );
}

function FeatureGrid({
  title,
  description,
  features,
  form,
  patch,
}: {
  title: string;
  description: string;
  features: Array<{ key: string; labelKey: string }>;
} & Pick<StepProps, "form" | "patch">) {
  const { t } = useLanguage();
  return (
    <SectionCard title={title} description={description}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {features.map((f) => (
          <CheckRow
            key={f.key}
            checked={Boolean(form.propertyDetails[f.key])}
            onChange={(checked) =>
              patch({ propertyDetails: { ...form.propertyDetails, [f.key]: checked } })
            }
            label={t(f.labelKey)}
          />
        ))}
      </div>
    </SectionCard>
  );
}
