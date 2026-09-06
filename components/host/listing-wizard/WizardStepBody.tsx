"use client";

import type {
  WizardFieldErrors,
  WizardStepId,
} from "@/lib/host-listing-wizard/form-types";
import type { StaysFeeRates } from "@/lib/stays-fees";
import { AboutStep } from "./steps/AboutStep";
import { AmenitiesRulesStep } from "./steps/AmenitiesRulesStep";
import { LocationStep } from "./steps/LocationStep";
import { MediaStep, type MediaStepProps } from "./steps/MediaStep";
import { PricingStep } from "./steps/PricingStep";
import { SubmitStep } from "./steps/SubmitStep";
import { UnitTypesStep } from "./steps/UnitTypesStep";
import type { StepProps } from "./steps/step-props";

export type { StepProps };

/** Thin switch over the active step ids; each step owns its own UI. */
export function WizardStepBody({
  stepId,
  form,
  patch,
  errors,
  feeRates,
  photoActions,
  listingStatus,
  onJump,
}: StepProps & {
  stepId: WizardStepId;
  feeRates?: StaysFeeRates;
  photoActions: MediaStepProps["photoActions"];
  listingStatus: string | null;
  onJump: (stepId: WizardStepId) => void;
}) {
  const shared = { form, patch, errors: errors as WizardFieldErrors };
  switch (stepId) {
    case "location":
      return <LocationStep {...shared} />;
    case "about":
      return <AboutStep {...shared} />;
    case "unitTypes":
      return <UnitTypesStep {...shared} />;
    case "pricing":
      return <PricingStep {...shared} feeRates={feeRates} />;
    case "media":
      return <MediaStep {...shared} photoActions={photoActions} />;
    case "amenitiesRules":
      return <AmenitiesRulesStep {...shared} />;
    case "submit":
      return <SubmitStep form={form} listingStatus={listingStatus} onJump={onJump} />;
    default:
      return null;
  }
}
