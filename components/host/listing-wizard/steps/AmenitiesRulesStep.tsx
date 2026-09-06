"use client";

import { Input } from "@/components/ui/input";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import { AMENITY_OPTIONS } from "@/lib/host-listing-constants";
import { SAFETY_KEYS, safetyLabelKey } from "@/lib/host-listing-wizard/step-content";
import type { ListingWizardFormState } from "@/lib/host-listing-wizard/form-types";
import {
  CheckRow,
  Field,
  SectionCard,
  StepHeader,
  ToggleChip,
  textareaClassName,
} from "../wizard-ui";
import type { StepProps } from "./step-props";

const K = "hostListing.wizard.rules.";

/** Optional step: amenities, house rules, check-in. Skipping never blocks submit. */
export function AmenitiesRulesStep({ form, patch }: StepProps) {
  const { t } = useLanguage();
  const toggleAmenity = (tag: string) =>
    patch({
      amenities: form.amenities.includes(tag)
        ? form.amenities.filter((a) => a !== tag)
        : [...form.amenities, tag],
    });

  const opt = <T extends string>(values: readonly T[], prefix: string) =>
    values.map((v) => ({ value: v, label: t(`${K}${prefix}.${v}`) }));

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow={t(K + "eyebrow")}
        title={t(K + "title")}
        description={t(K + "description")}
        badge={t("hostListing.wizard.shell.optional")}
      />

      <SectionCard title={t(K + "amenitiesTitle")} description={t(K + "amenitiesDesc")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITY_OPTIONS.map((a) => (
            <ToggleChip
              key={a.tag}
              selected={form.amenities.includes(a.tag)}
              onClick={() => toggleAmenity(a.tag)}
            >
              <span className="me-1.5" aria-hidden="true">
                {a.emoji}
              </span>
              {t(`hostListing.wizard.amenities.${a.tag}`)}
            </ToggleChip>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t(K + "safetyTitle")} description={t(K + "safetyDesc")}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SAFETY_KEYS.map((key) => (
            <CheckRow
              key={key}
              checked={Boolean(form.safety[key])}
              onChange={(checked) => patch({ safety: { ...form.safety, [key]: checked } })}
              label={t(safetyLabelKey(key))}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t(K + "houseRulesTitle")} description={t(K + "houseRulesDesc")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t(K + "pets")}>
            <NexaSelect
              variant="field"
              value={form.petsPolicy}
              onChange={(v) => patch({ petsPolicy: v as ListingWizardFormState["petsPolicy"] })}
              options={opt(["NO", "DOGS_CATS", "ALLOWED"] as const, "petsOptions")}
              aria-label={t(K + "pets")}
            />
          </Field>
          <Field label={t(K + "smoking")}>
            <NexaSelect
              variant="field"
              value={form.smokingPolicy}
              onChange={(v) =>
                patch({ smokingPolicy: v as ListingWizardFormState["smokingPolicy"] })
              }
              options={opt(["NOT_ALLOWED", "ALLOWED"] as const, "smokingOptions")}
              aria-label={t(K + "smoking")}
            />
          </Field>
          <Field label={t(K + "cancellation")} hint={t(K + "cancellationHint")}>
            <NexaSelect
              variant="field"
              value={form.cancellationPolicy}
              onChange={(v) =>
                patch({ cancellationPolicy: v as ListingWizardFormState["cancellationPolicy"] })
              }
              options={opt(["FLEXIBLE", "MODERATE", "STRICT"] as const, "cancellationOptions")}
              aria-label={t(K + "cancellation")}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t(K + "minStay")}>
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                value={form.minStay}
                onChange={(e) => patch({ minStay: Math.max(1, Number(e.target.value) || 1) })}
              />
            </Field>
            <Field label={t(K + "maxStay")}>
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                value={form.maxStay}
                onChange={(e) => patch({ maxStay: Math.max(1, Number(e.target.value) || 1) })}
              />
            </Field>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <CheckRow checked={form.quietHours} onChange={(v) => patch({ quietHours: v })} label={t(K + "quietHours")} hint={t(K + "quietHoursHint")} />
          <CheckRow checked={form.couplesWelcome} onChange={(v) => patch({ couplesWelcome: v })} label={t(K + "couplesWelcome")} />
          <CheckRow checked={form.childrenAllowed} onChange={(v) => patch({ childrenAllowed: v })} label={t(K + "childrenAllowed")} />
          <CheckRow checked={form.visitorsAllowed} onChange={(v) => patch({ visitorsAllowed: v })} label={t(K + "visitorsAllowed")} />
          <CheckRow checked={form.partiesAllowed} onChange={(v) => patch({ partiesAllowed: v })} label={t(K + "partiesAllowed")} />
        </div>
      </SectionCard>

      <SectionCard title={t(K + "checkinTitle")} description={t(K + "checkinDesc")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t(K + "checkinFrom")}>
            <Input type="time" value={form.checkinTime} onChange={(e) => patch({ checkinTime: e.target.value })} />
          </Field>
          <Field label={t(K + "checkoutBy")}>
            <Input type="time" value={form.checkoutTime} onChange={(e) => patch({ checkoutTime: e.target.value })} />
          </Field>
          <Field label={t(K + "checkinMethod")}>
            <NexaSelect
              variant="field"
              value={form.checkinMethod}
              onChange={(v) => patch({ checkinMethod: v as ListingWizardFormState["checkinMethod"] })}
              options={opt(["IN_PERSON", "SELF", "RECEPTION"] as const, "checkinOptions")}
              aria-label={t(K + "checkinMethod")}
            />
          </Field>
          <Field label={t(K + "guestLanguage")} hint={t(K + "guestLanguageHint")}>
            <NexaSelect
              variant="field"
              value={form.guestLanguage}
              onChange={(v) => patch({ guestLanguage: v })}
              options={opt(["fr", "en", "ar", "es"] as const, "languages")}
              aria-label={t(K + "guestLanguage")}
            />
          </Field>
          <Field label={t(K + "contactName")}>
            <Input value={form.contactName} onChange={(e) => patch({ contactName: e.target.value })} autoComplete="name" />
          </Field>
          <Field label={t(K + "contactPhone")}>
            <Input value={form.contactPhone} onChange={(e) => patch({ contactPhone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="+212 6…" />
          </Field>
          <Field label={t(K + "contactRole")}>
            <NexaSelect
              variant="field"
              value={form.contactRole}
              onChange={(v) => patch({ contactRole: v as ListingWizardFormState["contactRole"] })}
              options={opt(["OWNER", "CO_HOST", "AGENT"] as const, "roleOptions")}
              aria-label={t(K + "contactRole")}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label={t(K + "accessInstructions")} hint={t(K + "accessInstructionsHint")}>
            <textarea
              value={form.accessInstructions}
              onChange={(e) => patch({ accessInstructions: e.target.value })}
              rows={3}
              className={textareaClassName}
              placeholder={t(K + "accessInstructionsPlaceholder")}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
