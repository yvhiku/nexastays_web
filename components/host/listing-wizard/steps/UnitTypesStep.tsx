"use client";

import * as React from "react";
import { BedDouble, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import { newUnitType } from "@/lib/host-listing-wizard/form-defaults";
import { isMultiUnitFlow } from "@/lib/host-listing-wizard/step-config";
import {
  DORM_GENDER_OPTIONS,
  MAX_GUEST_OPTIONS,
  ROOM_QUANTITY_OPTIONS,
  UNIT_KIND_LABEL_KEY,
} from "@/lib/host-listing-wizard/step-content";
import type { UnitTypeDraft } from "@/lib/host-listing-wizard/form-types";
import { cn } from "@/lib/utils";
import {
  AdornedInput,
  EmptyInvite,
  Field,
  SoftTip,
  StepHeader,
  ToggleChip,
} from "../wizard-ui";
import { resolveMessage } from "../WizardErrorSummary";
import { WizardStatusIcon } from "../wizard-status";
import type { StepProps } from "./step-props";

const K = "hostListing.wizard.units.";

export function UnitTypesStep({ form, patch, errors }: StepProps) {
  const { t, tf } = useLanguage();
  const err = (id: string) => (errors[id] ? resolveMessage(tf, errors[id]) : null);
  const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  if (!multi) {
    return <SoftTip>{t(K + "singleUnitNote")}</SoftTip>;
  }

  const isHostel = form.listingType === "HOSTEL";
  const addKind = (): UnitTypeDraft["kind"] => {
    if (isHostel) {
      if (form.bookingModel === "DORM_BEDS") return "HOSTEL_DORM";
      if (form.bookingModel === "PRIVATE_ROOMS") return "HOSTEL_PRIVATE";
      return form.unitTypes.some((u) => u.kind === "HOSTEL_DORM")
        ? "HOSTEL_PRIVATE"
        : "HOSTEL_DORM";
    }
    if (form.listingType === "RIAD") return "RIAD_ROOM";
    if (form.listingType === "VILLA") return "VILLA_UNIT";
    if (form.listingType === "APARTMENT") return "APARTMENT_UNIT";
    return "HOTEL_ROOM";
  };
  const pricingUnit = (kind: UnitTypeDraft["kind"]) =>
    kind === "HOSTEL_DORM" ? "BED_NIGHT" : "ROOM_NIGHT";

  const addUnit = () => {
    const kind = addKind();
    const unit = newUnitType(kind, pricingUnit(kind));
    patch({ unitTypes: [...form.unitTypes, unit] });
    setExpanded((e) => ({ ...e, [unit.id]: true }));
  };
  const update = (idx: number, next: UnitTypeDraft) => {
    const list = [...form.unitTypes];
    list[idx] = next;
    patch({ unitTypes: list });
  };
  const guestOptions = MAX_GUEST_OPTIONS.map((v) => ({
    value: v,
    label: tf("hostListing.wizard.about.guestsCount", { count: v }),
  }));
  const qtyOptions = ROOM_QUANTITY_OPTIONS.map((v) => ({ value: v, label: v }));
  const addLabel = isHostel ? t(K + "addDormOrRoom") : t(K + "addRoomType");

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow={isHostel ? t(K + "eyebrowHostel") : t(K + "eyebrow")}
        title={isHostel ? t(K + "titleHostel") : t(K + "title")}
        description={isHostel ? t(K + "descriptionHostel") : t(K + "description")}
        tip={t(K + "tip")}
      />

      {form.unitTypes.length === 0 ? (
        <div data-wizard-field="unitTypes">
          <EmptyInvite
            icon={<BedDouble className="h-8 w-8" aria-hidden="true" />}
            title={isHostel ? t(K + "emptyTitleHostel") : t(K + "emptyTitle")}
            description={t(K + "emptyDesc")}
            action={
              <Button type="button" onClick={addUnit}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {addLabel}
              </Button>
            }
          />
          {err("unitTypes") && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {err("unitTypes")}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4" data-wizard-field="unitTypes">
          {form.unitTypes.map((u, idx) => {
            const perBed = u.pricingUnit === "BED_NIGHT";
            const nameErr = err(`unitTypes.${u.id}.name`);
            const priceErr = err(`unitTypes.${u.id}.basePrice`);
            const capErr = err(`unitTypes.${u.id}.capacity`);
            const hasErr = Boolean(nameErr || priceErr || capErr);
            const open = expanded[u.id] ?? (idx === form.unitTypes.length - 1 || hasErr);
            const priceLabel = perBed ? t(K + "pricePerBed") : t(K + "pricePerRoom");
            const summary = [
              `${u.quantity} × ${perBed ? t(K + "bedsUnit") : t(K + "roomsUnit")}`,
              u.basePrice ? `${Number(u.basePrice).toLocaleString()} MAD` : t(K + "noPriceYet"),
            ].join(" · ");
            return (
              <section
                key={u.id}
                className={cn(
                  "rounded-2xl border-2 bg-white shadow-nexa-sm",
                  hasErr ? "border-red-500" : "border-nexa-line",
                )}
              >
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [u.id]: !open }))}
                    aria-expanded={open}
                    className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3 text-start"
                  >
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-nexa-ink-3 transition-transform duration-150",
                        open && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-sans text-base font-semibold text-nexa-ink">
                        <span className="truncate">
                          {u.name.trim() || t(UNIT_KIND_LABEL_KEY[u.kind])}
                        </span>
                        {hasErr && <WizardStatusIcon status="error" className="text-red-600" />}
                      </span>
                      <span className="block truncate text-sm text-nexa-ink-3">
                        {t(UNIT_KIND_LABEL_KEY[u.kind])} · {summary}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <IconAction
                      label={t(K + "duplicate")}
                      onClick={() => {
                        const copy = { ...u, id: crypto.randomUUID(), name: `${u.name || t(K + "typeFallback")} ${t(K + "copySuffix")}` };
                        patch({ unitTypes: [...form.unitTypes, copy] });
                        setExpanded((e) => ({ ...e, [copy.id]: true }));
                      }}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label={t(K + "remove")}
                      danger
                      onClick={() =>
                        patch({ unitTypes: form.unitTypes.filter((x) => x.id !== u.id) })
                      }
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </IconAction>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-nexa-line p-4 sm:p-5">
                    <p className="mb-4 text-sm text-nexa-ink-3">
                      {perBed ? t(K + "perBedNote") : t(K + "perRoomNote")}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        id={`unitTypes.${u.id}.name`}
                        label={t(K + "displayName")}
                        required
                        hint={t(K + "displayNameHint")}
                        error={nameErr}
                      >
                        <Input
                          value={u.name}
                          onChange={(e) => update(idx, { ...u, name: e.target.value })}
                          placeholder={perBed ? t(K + "namePlaceholderDorm") : t(K + "namePlaceholderRoom")}
                        />
                      </Field>
                      <Field label={t(K + "bedsInType")} hint={t(K + "bedsInTypeHint")}>
                        <Input
                          value={u.bedConfig}
                          onChange={(e) => update(idx, { ...u, bedConfig: e.target.value })}
                          placeholder={perBed ? t(K + "bedsPlaceholderDorm") : t(K + "bedsPlaceholderRoom")}
                        />
                      </Field>
                      <Field
                        id={`unitTypes.${u.id}.capacity`}
                        label={perBed ? t(K + "howManyBeds") : t(K + "howManyRooms")}
                        hint={t(K + "inventoryHint")}
                        error={capErr}
                      >
                        <NexaSelect
                          variant="field"
                          value={String(Math.min(100, Math.max(1, u.quantity)))}
                          options={qtyOptions}
                          aria-label={perBed ? t(K + "howManyBeds") : t(K + "howManyRooms")}
                          onChange={(value) => update(idx, { ...u, quantity: Number(value) })}
                        />
                      </Field>
                      <Field
                        label={t(K + "maxGuestsPerBooking")}
                        hint={perBed ? t(K + "maxGuestsHintBed") : t(K + "maxGuestsHintRoom")}
                      >
                        <NexaSelect
                          variant="field"
                          value={String(perBed ? 1 : Math.min(15, Math.max(1, u.maxGuests)))}
                          options={perBed ? guestOptions.slice(0, 1) : guestOptions}
                          aria-label={t(K + "maxGuestsPerBooking")}
                          onChange={(value) => update(idx, { ...u, maxGuests: Number(value) })}
                        />
                      </Field>
                      <Field
                        id={`unitTypes.${u.id}.basePrice`}
                        label={priceLabel}
                        required
                        hint={t(K + "priceHint")}
                        error={priceErr}
                      >
                        <AdornedInput
                          adornment="MAD"
                          type="number"
                          min={1}
                          inputMode="decimal"
                          value={u.basePrice}
                          onChange={(e) => update(idx, { ...u, basePrice: e.target.value })}
                          placeholder="450"
                        />
                      </Field>
                      <Field label={t("hostListing.wizard.about.size")} hint={t(K + "optional")}>
                        <Input
                          value={u.sizeSqm}
                          inputMode="numeric"
                          onChange={(e) => update(idx, { ...u, sizeSqm: e.target.value })}
                        />
                      </Field>
                    </div>
                    {u.kind === "HOSTEL_DORM" && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-nexa-ink">{t(K + "dormGender")}</p>
                        <div className="flex flex-wrap gap-2">
                          {DORM_GENDER_OPTIONS.map((g) => (
                            <ToggleChip
                              key={g}
                              selected={(u.details.gender as string) === g}
                              onClick={() =>
                                update(idx, { ...u, details: { ...u.details, gender: g } })
                              }
                            >
                              {t(`${K}gender.${g}`)}
                            </ToggleChip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
          <Button type="button" variant="outline" onClick={addUnit}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function IconAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl text-nexa-ink-3 transition-colors duration-150 hover:bg-nexa-bg-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/30",
        danger && "hover:text-red-600",
      )}
    >
      {children}
    </button>
  );
}
