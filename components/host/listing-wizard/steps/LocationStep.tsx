"use client";

import { Input } from "@/components/ui/input";
import { NexaSelect } from "@/components/ui/NexaSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import { Field, SectionCard, StepHeader } from "../wizard-ui";
import { HostLocationMapPicker } from "../HostLocationMapPicker";
import { resolveMessage } from "../WizardErrorSummary";
import type { StepProps } from "./step-props";

const K = "hostListing.wizard.location.";

export function LocationStep({ form, patch, errors }: StepProps) {
  const { t, tf } = useLanguage();
  const err = (id: string) => (errors[id] ? resolveMessage(tf, errors[id]) : null);

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow={t(K + "eyebrow")}
        title={t(K + "title")}
        description={t(K + "description")}
        tip={t(K + "tip")}
      />

      <SectionCard title={t(K + "addressTitle")} description={t(K + "addressDesc")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="country" label={t(K + "country")} hint={t(K + "countryHint")} error={err("country")}>
            <NexaSelect
              variant="field"
              value="MA"
              onChange={() => patch({ country: "MA" })}
              options={[{ value: "MA", label: t(K + "morocco") }]}
              aria-label={t(K + "country")}
            />
          </Field>
          <Field id="city" label={t(K + "city")} required hint={t(K + "cityHint")} error={err("city")}>
            <Input
              value={form.city}
              onChange={(e) => patch({ city: e.target.value })}
              placeholder={t(K + "cityPlaceholder")}
              autoComplete="address-level2"
            />
          </Field>
          <Field id="neighborhood" label={t(K + "neighborhood")} hint={t(K + "neighborhoodHint")}>
            <Input
              value={form.neighborhood}
              onChange={(e) => patch({ neighborhood: e.target.value })}
              placeholder={t(K + "neighborhoodPlaceholder")}
            />
          </Field>
          <Field id="postalCode" label={t(K + "postalCode")}>
            <Input
              value={form.postalCode}
              onChange={(e) => patch({ postalCode: e.target.value })}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field
            id="address"
            label={t(K + "address")}
            required
            hint={t(K + "addressHint")}
            error={err("address")}
          >
            <Input
              value={form.address}
              onChange={(e) => patch({ address: e.target.value })}
              placeholder={t(K + "addressPlaceholder")}
              autoComplete="street-address"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="buildingName" label={t(K + "buildingName")} hint={t(K + "buildingNameHint")}>
              <Input
                value={form.buildingName}
                onChange={(e) => patch({ buildingName: e.target.value })}
              />
            </Field>
            <Field id="landmark" label={t(K + "landmark")} hint={t(K + "landmarkHint")}>
              <Input
                value={form.landmark}
                onChange={(e) => patch({ landmark: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4" data-wizard-field="map">
            <HostLocationMapPicker
              city={form.city}
              neighborhood={form.neighborhood}
              address={form.address}
              latitude={form.geoLat}
              longitude={form.geoLng}
              onCoordinatesChange={({ lat, lng }) => patch({ geoLat: lat, geoLng: lng })}
            />
            {err("map") && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600">
                {err("map")}
              </p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
