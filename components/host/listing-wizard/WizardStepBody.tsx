"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPE_COPY, bookingModelOptions } from "@/lib/host-listing-wizard/step-config";
import { PROPERTY_TYPE_ICONS } from "@/components/host/listing-wizard/icons/PropertyTypeIcons";
import { AMENITY_OPTIONS } from "@/lib/host-listing-constants";
import { newBedroom, newUnitType } from "@/lib/host-listing-wizard/form-defaults";
import type {
  BookingModel,
  ListingType,
  ListingWizardFormState,
  MediaCategory,
  UnitTypeDraft,
  WizardStepId,
} from "@/lib/host-listing-wizard/form-types";
import { isMultiUnitFlow } from "@/lib/host-listing-wizard/step-config";
import {
  DEFAULT_FEE_RATES,
  calculateBookingFees,
  type StaysFeeRates,
} from "@/lib/stays-fees";
import {
  CheckRow,
  ChoiceCard,
  Field,
  SectionCard,
  SoftTip,
  StepHeader,
  ToggleChip,
  selectClassName,
  textareaClassName,
} from "@/components/host/listing-wizard/wizard-ui";
import { HostLocationMapPicker } from "@/components/host/listing-wizard/HostLocationMapPicker";

const TYPES: ListingType[] = ["APARTMENT", "VILLA", "RIAD", "HOTEL", "HOSTEL"];

const MEDIA_CATEGORIES: Array<{ id: MediaCategory; label: string; hint: string }> = [
  { id: "EXTERIOR", label: "Exterior / facade", hint: "Outside of the building" },
  { id: "ENTRANCE", label: "Entrance", hint: "Door, lobby, or gate" },
  { id: "LIVING", label: "Living room", hint: "Main shared living space" },
  { id: "BEDROOM", label: "Bedroom", hint: "Sleeping areas" },
  { id: "BATHROOM", label: "Bathroom", hint: "Toilet / shower" },
  { id: "KITCHEN", label: "Kitchen", hint: "Cooking area" },
  { id: "BALCONY", label: "Balcony / terrace", hint: "Outdoor private space" },
  { id: "OUTDOOR", label: "Garden / outdoor", hint: "Yard, pool, patio" },
  { id: "COMMON", label: "Common area", hint: "Shared lounge or courtyard" },
  { id: "RECEPTION", label: "Reception", hint: "Front desk / welcome area" },
  { id: "ROOM", label: "Room type", hint: "Example of a bookable room" },
  { id: "DORM", label: "Dorm", hint: "Shared dorm interior" },
  { id: "FACILITIES", label: "Facilities", hint: "Gym, laundry, coworking…" },
  { id: "OTHER", label: "Other", hint: "Anything else useful" },
];

const VILLA_FEATURES: Array<{ key: string; label: string }> = [
  { key: "garden", label: "Private garden" },
  { key: "pool", label: "Swimming pool" },
  { key: "terrace", label: "Terrace" },
  { key: "parking", label: "On-site parking" },
  { key: "barbecue", label: "Barbecue" },
  { key: "gated", label: "Gated / secure compound" },
];

const SHARED_FEATURES: Array<{ key: string; label: string }> = [
  { key: "courtyard", label: "Courtyard" },
  { key: "rooftop", label: "Rooftop terrace" },
  { key: "breakfast", label: "Breakfast available" },
  { key: "hammam", label: "Hammam / spa" },
  { key: "reception", label: "Reception / front desk" },
  { key: "laundry", label: "Laundry" },
  { key: "lockers", label: "Lockers" },
  { key: "coworking", label: "Coworking / workspace" },
];

const SAFETY_LABELS: Record<string, string> = {
  smoke_detector: "Smoke detector",
  co_detector: "Carbon monoxide detector",
  fire_extinguisher: "Fire extinguisher",
  first_aid: "First-aid kit",
  emergency_exit: "Marked emergency exit",
  security_cameras: "Exterior security cameras",
};

const UNIT_KIND_LABEL: Record<UnitTypeDraft["kind"], string> = {
  APARTMENT_UNIT: "Apartment unit",
  VILLA_UNIT: "Villa unit",
  HOTEL_ROOM: "Hotel room type",
  RIAD_ROOM: "Riad room type",
  HOSTEL_DORM: "Dorm (shared)",
  HOSTEL_PRIVATE: "Private room",
};

const BOOKING_MODEL_LABEL: Record<string, string> = {
  ENTIRE_PROPERTY: "Entire place",
  PRIVATE_ROOM: "Private room",
  MULTI_UNIT: "Several similar units",
  ROOM_TYPES: "Individual rooms",
  DORM_BEDS: "Dorm beds",
  PRIVATE_ROOMS: "Private rooms",
  DORM_AND_PRIVATE: "Dorms + private rooms",
  BOTH: "Entire place + rooms",
};

function detailsCopy(type: ListingType | null) {
  switch (type) {
    case "HOTEL":
      return {
        eyebrow: "Hotel details",
        title: "Tell guests about your hotel",
        description:
          "A short story of the property, capacity, and what makes it feel like Nexa Stays — not a generic hotel form.",
      };
    case "HOSTEL":
      return {
        eyebrow: "Hostel details",
        title: "Describe the hostel vibe",
        description:
          "Share the atmosphere, shared spaces, and who it’s best for. Room and dorm inventory comes next.",
      };
    case "VILLA":
      return {
        eyebrow: "Villa layout",
        title: "How is the villa laid out?",
        description:
          "Bedrooms, capacity, and outdoor features help guests know if this is the right private house for them.",
      };
    case "RIAD":
      return {
        eyebrow: "Riad details",
        title: "Describe your riad",
        description:
          "Highlight courtyard, rooftop, and services. If you sell rooms, you’ll add room types on the next step.",
      };
    default:
      return {
        eyebrow: "Apartment details",
        title: "Describe the space guests will book",
        description:
          "Clear layout and capacity reduce questions later. Guests see this before they reserve.",
      };
  }
}

export function WizardStepBody({
  stepId,
  form,
  patch,
  feeRates = DEFAULT_FEE_RATES,
  onSelectListingType,
}: {
  stepId: WizardStepId;
  form: ListingWizardFormState;
  patch: (partial: Partial<ListingWizardFormState>) => void;
  feeRates?: StaysFeeRates;
  onSelectListingType?: (type: ListingType) => void;
}) {
  if (stepId === "propertyType") {
    return (
      <div>
        <StepHeader
          eyebrow="Step 1 · Property type"
          title="What are you listing on Nexa Stays?"
          description="Pick the category that matches how guests will stay. This unlocks the right questions next — apartments stay simple; hotels and hostels add room or bed types."
          tip="Not sure? Apartment or villa = one bookable home. Hotel / hostel = you manage several rooms or beds."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((type) => {
            const Icon = PROPERTY_TYPE_ICONS[type];
            const copy = PROPERTY_TYPE_COPY[type];
            return (
              <ChoiceCard
                key={type}
                selected={form.listingType === type}
                onClick={() => {
                  if (onSelectListingType) {
                    onSelectListingType(type);
                    return;
                  }
                  const models = bookingModelOptions(type);
                  patch({
                    listingType: type,
                    bookingModel: models.length === 1 ? models[0].id : null,
                    unitTypes: [],
                  });
                }}
                title={copy.label}
                support={copy.support}
                icon={<Icon className="h-8 w-8 text-nexa-primary" />}
              />
            );
          })}
        </div>
        {form.listingType && (
          <div className="mt-5">
            <SoftTip>{PROPERTY_TYPE_COPY[form.listingType].selected}</SoftTip>
          </div>
        )}
      </div>
    );
  }

  if (stepId === "bookingModel" && form.listingType) {
    const options = bookingModelOptions(form.listingType);
    return (
      <div>
        <StepHeader
          eyebrow="Step 2 · How guests book"
          title="How should guests reserve this place?"
          description="This is not a technical setting — it simply tells Nexa Stays whether guests book one full home, a room, or choose from room/bed types you manage."
          tip={
            form.listingType === "HOTEL"
              ? "Hotels always use room types (e.g. 10 Standard Doubles). Confirm to continue."
              : "You can change this later only by starting over — choose the option that matches how you actually sell stays."
          }
        />
        <div className="space-y-3">
          {options.map((opt) => (
            <ChoiceCard
              key={opt.id}
              selected={form.bookingModel === opt.id}
              onClick={() =>
                patch({ bookingModel: opt.id as BookingModel, unitTypes: [] })
              }
              title={opt.label}
              support={opt.support}
            />
          ))}
        </div>
      </div>
    );
  }

  if (stepId === "location") {
    return (
      <div className="space-y-6">
        <StepHeader
          eyebrow="Location"
          title="Where will guests stay?"
          description="Add a clear title and address. Guests only see the exact street address after a booking is confirmed."
          tip="Public pages show city and neighborhood. Exact address stays private until reservation is confirmed."
        />
        <SectionCard
          title="Listing title"
          description="This is the name guests see in search — keep it short and inviting."
        >
          <Field
            label="Title"
            required
            hint="Example: Sunny loft near the medina · 2BR with rooftop"
          >
            <Input
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Sunny loft near the medina"
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Address"
          description="Help guests find the area. Exact pin details stay protected."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Country" hint="ISO code is fine (MA for Morocco).">
              <Input
                value={form.country}
                onChange={(e) => patch({ country: e.target.value })}
                placeholder="MA"
              />
            </Field>
            <Field label="City" required hint="The city shown on the listing card.">
              <Input
                value={form.city}
                onChange={(e) => patch({ city: e.target.value })}
                placeholder="Marrakech"
              />
            </Field>
            <Field
              label="Neighborhood"
              hint="Shown publicly to help guests choose the right area."
            >
              <Input
                value={form.neighborhood}
                onChange={(e) => patch({ neighborhood: e.target.value })}
                placeholder="Medina / Gueliz /…"
              />
            </Field>
            <Field label="Postal code">
              <Input
                value={form.postalCode}
                onChange={(e) => patch({ postalCode: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4 space-y-4">
            <Field
              label="Full street address"
              required
              hint="Shared only with confirmed guests — not on the public page."
            >
              <Input
                value={form.address}
                onChange={(e) => patch({ address: e.target.value })}
                placeholder="Street, building number, floor…"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Building name" hint="Optional — useful for large complexes.">
                <Input
                  value={form.buildingName}
                  onChange={(e) => patch({ buildingName: e.target.value })}
                />
              </Field>
              <Field
                label="Nearby landmark"
                hint="Optional — e.g. “2 min from Jemaa el-Fna”."
              >
                <Input
                  value={form.landmark}
                  onChange={(e) => patch({ landmark: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4">
              <HostLocationMapPicker
                city={form.city}
                neighborhood={form.neighborhood}
                address={form.address}
                latitude={form.geoLat}
                longitude={form.geoLng}
                onCoordinatesChange={({ lat, lng }) =>
                  patch({ geoLat: lat, geoLng: lng })
                }
              />
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (stepId === "details") {
    const copy = detailsCopy(form.listingType);
    const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
    return (
      <div className="space-y-6">
        <StepHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
        />

        <SectionCard
          title="About the property"
          description="Write like you’re talking to a guest — what they’ll notice first, and why they’ll love staying."
        >
          <Field
            label="Description"
            required
            hint="At least 20 characters. Mention light, views, quiet, or location highlights."
          >
            <textarea
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={5}
              className={textareaClassName}
              placeholder="Describe the space, highlights, and what guests will love…"
            />
          </Field>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Maximum guests"
              hint={
                multi
                  ? "Overall property capacity. Each room type also has its own guest limit."
                  : "Total people this listing can host."
              }
            >
              <Input
                type="number"
                min={1}
                value={form.maxGuests}
                onChange={(e) => patch({ maxGuests: Number(e.target.value) || 1 })}
              />
            </Field>
            <Field label="Size (m²)" hint="Optional — living space size.">
              <Input
                value={form.sizeSqm}
                onChange={(e) => patch({ sizeSqm: e.target.value })}
                placeholder="85"
              />
            </Field>
            {(form.listingType === "HOTEL" || form.listingType === "HOSTEL") && (
              <Field label="Total rooms" hint="Approximate number of bookable rooms.">
                <Input
                  value={String(form.propertyDetails.total_rooms ?? "")}
                  onChange={(e) =>
                    patch({
                      propertyDetails: {
                        ...form.propertyDetails,
                        total_rooms: e.target.value,
                      },
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
            title="Bedrooms"
            description="List each sleeping room so guests know beds and bathroom access."
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  patch({
                    bedrooms: [...form.bedrooms, newBedroom(form.bedrooms.length + 1)],
                  })
                }
              >
                Add bedroom
              </Button>
            }
          >
            <div className="space-y-3">
              {form.bedrooms.map((b, idx) => (
                <div
                  key={b.id}
                  className="rounded-xl border-2 border-nexa-line bg-nexa-bg p-4"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-nexa-primary">
                    Bedroom {idx + 1}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Name">
                      <Input
                        value={b.label}
                        onChange={(e) => {
                          const next = [...form.bedrooms];
                          next[idx] = { ...b, label: e.target.value };
                          patch({ bedrooms: next });
                        }}
                        placeholder="Master bedroom"
                      />
                    </Field>
                    <Field label="Beds" hint='e.g. "1 queen bed" or "2 singles".'>
                      <Input
                        value={b.bedSummary}
                        onChange={(e) => {
                          const next = [...form.bedrooms];
                          next[idx] = { ...b, bedSummary: e.target.value };
                          patch({ bedrooms: next });
                        }}
                        placeholder="1 queen bed"
                      />
                    </Field>
                    <Field label="Sleeps" hint="How many people this room can sleep.">
                      <Input
                        type="number"
                        min={1}
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
                        label="Private bathroom"
                        hint="Ensuite or dedicated to this room"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {form.listingType === "VILLA" && (
          <SectionCard
            title="Outdoor & villa features"
            description="Tap everything guests will find on the property."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {VILLA_FEATURES.map((f) => (
                <CheckRow
                  key={f.key}
                  checked={Boolean(form.propertyDetails[f.key])}
                  onChange={(checked) =>
                    patch({
                      propertyDetails: {
                        ...form.propertyDetails,
                        [f.key]: checked,
                      },
                    })
                  }
                  label={f.label}
                />
              ))}
            </div>
          </SectionCard>
        )}

        {(form.listingType === "RIAD" ||
          form.listingType === "HOTEL" ||
          form.listingType === "HOSTEL") && (
          <SectionCard
            title="Property features"
            description="Shared spaces and services guests care about."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SHARED_FEATURES.map((f) => (
                <CheckRow
                  key={f.key}
                  checked={Boolean(form.propertyDetails[f.key])}
                  onChange={(checked) =>
                    patch({
                      propertyDetails: {
                        ...form.propertyDetails,
                        [f.key]: checked,
                      },
                    })
                  }
                  label={f.label}
                />
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    );
  }

  if (stepId === "unitTypes") {
    const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
    if (!multi) {
      return (
        <SoftTip>
          This listing is a single bookable place — no room/bed inventory step needed.
        </SoftTip>
      );
    }
    const addKind = (): UnitTypeDraft["kind"] => {
      if (form.listingType === "HOSTEL") {
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
    const isHostel = form.listingType === "HOSTEL";

    return (
      <div className="space-y-6">
        <StepHeader
          eyebrow={isHostel ? "Beds & rooms" : "Room types"}
          title={
            isHostel
              ? "What can guests book — beds or private rooms?"
              : "Add the room types you sell"
          }
          description={
            isHostel
              ? "Create each dorm or private-room category once. Quantity = how many beds or rooms of that type. Prices are clearly per bed or per room."
              : "You don’t list every door — you list categories (e.g. Deluxe Double × 8). Guests pick a type; inventory by date comes later."
          }
          tip="Example: “Standard Double” × 6 rooms at 650 MAD / room / night."
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const kind = addKind();
            patch({ unitTypes: [...form.unitTypes, newUnitType(kind, pricingUnit(kind))] });
          }}
        >
          {isHostel ? "Add dorm or private room type" : "Add room type"}
        </Button>

        {form.unitTypes.length === 0 && (
          <SoftTip>Add at least one type to continue. Start with your most common room or dorm.</SoftTip>
        )}

        <div className="space-y-4">
          {form.unitTypes.map((u, idx) => {
            const perBed = u.pricingUnit === "BED_NIGHT";
            return (
              <SectionCard
                key={u.id}
                title={`${UNIT_KIND_LABEL[u.kind]}${u.name ? ` · ${u.name}` : ""}`}
                description={
                  perBed
                    ? "Price is per bed, per night (shared dorm)."
                    : "Price is per room, per night."
                }
                action={
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        patch({
                          unitTypes: [
                            ...form.unitTypes,
                            {
                              ...u,
                              id: crypto.randomUUID(),
                              name: `${u.name || "Type"} copy`,
                            },
                          ],
                        })
                      }
                    >
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        patch({
                          unitTypes: form.unitTypes.filter((x) => x.id !== u.id),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Display name"
                    required
                    hint='What guests see — e.g. "6-bed mixed dorm" or "Deluxe Double".'
                  >
                    <Input
                      value={u.name}
                      onChange={(e) => {
                        const next = [...form.unitTypes];
                        next[idx] = { ...u, name: e.target.value };
                        patch({ unitTypes: next });
                      }}
                      placeholder={perBed ? "6-bed mixed dorm" : "Deluxe Double"}
                    />
                  </Field>
                  <Field
                    label="Beds in this type"
                    hint='e.g. "6 bunk beds" or "1 king bed".'
                  >
                    <Input
                      value={u.bedConfig}
                      onChange={(e) => {
                        const next = [...form.unitTypes];
                        next[idx] = { ...u, bedConfig: e.target.value };
                        patch({ unitTypes: next });
                      }}
                      placeholder={perBed ? "6 bunk beds" : "1 king bed"}
                    />
                  </Field>
                  <Field
                    label={perBed ? "How many beds?" : "How many rooms of this type?"}
                    hint="Total inventory of this category."
                  >
                    <Input
                      type="number"
                      min={1}
                      value={u.quantity}
                      onChange={(e) => {
                        const next = [...form.unitTypes];
                        next[idx] = { ...u, quantity: Number(e.target.value) || 1 };
                        patch({ unitTypes: next });
                      }}
                    />
                  </Field>
                  <Field
                    label="Max guests per booking"
                    hint={
                      perBed
                        ? "Usually 1 (one bed)."
                        : "How many people fit in one room of this type."
                    }
                  >
                    <Input
                      type="number"
                      min={1}
                      value={u.maxGuests}
                      onChange={(e) => {
                        const next = [...form.unitTypes];
                        next[idx] = { ...u, maxGuests: Number(e.target.value) || 1 };
                        patch({ unitTypes: next });
                      }}
                    />
                  </Field>
                  <Field
                    label={perBed ? "Price per bed / night (MAD)" : "Price per room / night (MAD)"}
                    required
                    hint="This is what guests pay before Nexa service fees."
                  >
                    <Input
                      type="number"
                      min={0}
                      value={u.basePrice}
                      onChange={(e) => {
                        const next = [...form.unitTypes];
                        next[idx] = { ...u, basePrice: e.target.value };
                        patch({ unitTypes: next });
                      }}
                      placeholder="450"
                    />
                  </Field>
                  <Field label="Size (m²)" hint="Optional.">
                    <Input
                      value={u.sizeSqm}
                      onChange={(e) => {
                        const next = [...form.unitTypes];
                        next[idx] = { ...u, sizeSqm: e.target.value };
                        patch({ unitTypes: next });
                      }}
                    />
                  </Field>
                </div>
                {u.kind === "HOSTEL_DORM" && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-nexa-ink">Dorm gender</p>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ["mixed", "Mixed"],
                          ["female", "Female only"],
                          ["male", "Male only"],
                        ] as const
                      ).map(([g, label]) => (
                        <ToggleChip
                          key={g}
                          selected={(u.details.gender as string) === g}
                          onClick={() => {
                            const next = [...form.unitTypes];
                            next[idx] = {
                              ...u,
                              details: { ...u.details, gender: g },
                            };
                            patch({ unitTypes: next });
                          }}
                        >
                          {label}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            );
          })}
        </div>
      </div>
    );
  }

  if (stepId === "amenities") {
    return (
      <div>
        <StepHeader
          eyebrow="Amenities"
          title="What can guests use during their stay?"
          description="Select everything that is truly available. Honest amenities build trust on Nexa Stays."
          tip="You can add more later when you edit the listing."
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITY_OPTIONS.map((a) => {
            const on = form.amenities.includes(a.tag);
            return (
              <ToggleChip
                key={a.tag}
                selected={on}
                onClick={() =>
                  patch({
                    amenities: on
                      ? form.amenities.filter((t) => t !== a.tag)
                      : [...form.amenities, a.tag],
                  })
                }
              >
                {a.label}
              </ToggleChip>
            );
          })}
        </div>
        {form.amenities.length > 0 && (
          <p className="mt-4 text-sm text-nexa-ink-3">
            {form.amenities.length} selected
          </p>
        )}
      </div>
    );
  }

  if (stepId === "policies") {
    return (
      <div className="space-y-6">
        <StepHeader
          eyebrow="House rules & check-in"
          title="Set clear expectations before booking"
          description="Guests see these rules on the listing. Clear policies reduce messages and disputes."
        />

        <SectionCard
          title="House rules"
          description="What is allowed during the stay?"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pets" hint="Shown on the listing before booking.">
              <select
                className={selectClassName}
                value={form.petsPolicy}
                onChange={(e) =>
                  patch({
                    petsPolicy: e.target.value as ListingWizardFormState["petsPolicy"],
                  })
                }
              >
                <option value="NO">Not allowed</option>
                <option value="DOGS_CATS">Dogs & cats only</option>
                <option value="ALLOWED">All pets allowed</option>
              </select>
            </Field>
            <Field label="Smoking">
              <select
                className={selectClassName}
                value={form.smokingPolicy}
                onChange={(e) =>
                  patch({
                    smokingPolicy: e.target
                      .value as ListingWizardFormState["smokingPolicy"],
                  })
                }
              >
                <option value="NOT_ALLOWED">Not allowed indoors</option>
                <option value="ALLOWED">Allowed (or designated areas)</option>
              </select>
            </Field>
            <Field
              label="Cancellation policy"
              hint="Flexible = easier for guests. Strict = more protection for you."
            >
              <select
                className={selectClassName}
                value={form.cancellationPolicy}
                onChange={(e) =>
                  patch({
                    cancellationPolicy: e.target
                      .value as ListingWizardFormState["cancellationPolicy"],
                  })
                }
              >
                <option value="FLEXIBLE">Flexible</option>
                <option value="MODERATE">Moderate</option>
                <option value="STRICT">Strict</option>
              </select>
            </Field>
            <Field
              label="How do guests check in?"
              hint="Who greets them or how they get keys."
            >
              <select
                className={selectClassName}
                value={form.checkinMethod}
                onChange={(e) =>
                  patch({
                    checkinMethod: e.target
                      .value as ListingWizardFormState["checkinMethod"],
                  })
                }
              >
                <option value="IN_PERSON">Host meets them in person</option>
                <option value="SELF">Self check-in (lockbox / code)</option>
                <option value="RECEPTION">Reception / front desk</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <CheckRow
              checked={form.quietHours}
              onChange={(v) => patch({ quietHours: v })}
              label="Quiet hours"
              hint="Ask guests to keep noise down at night"
            />
            <CheckRow
              checked={form.couplesWelcome}
              onChange={(v) => patch({ couplesWelcome: v })}
              label="Couples welcome"
            />
            <CheckRow
              checked={form.childrenAllowed}
              onChange={(v) => patch({ childrenAllowed: v })}
              label="Children welcome"
            />
            <CheckRow
              checked={form.visitorsAllowed}
              onChange={(v) => patch({ visitorsAllowed: v })}
              label="Day visitors allowed"
            />
            <CheckRow
              checked={form.partiesAllowed}
              onChange={(v) => patch({ partiesAllowed: v })}
              label="Parties / events allowed"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Safety equipment"
          description="Mark what is installed on the property."
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.keys(form.safety).map((key) => (
              <CheckRow
                key={key}
                checked={form.safety[key]}
                onChange={(checked) =>
                  patch({ safety: { ...form.safety, [key]: checked } })
                }
                label={SAFETY_LABELS[key] ?? key.replace(/_/g, " ")}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Arrival contact"
          description="Who guests call or message for check-in. Shared after booking is confirmed."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Check-in time">
              <Input
                type="time"
                value={form.checkinTime}
                onChange={(e) => patch({ checkinTime: e.target.value })}
              />
            </Field>
            <Field label="Check-out time">
              <Input
                type="time"
                value={form.checkoutTime}
                onChange={(e) => patch({ checkoutTime: e.target.value })}
              />
            </Field>
            <Field label="Contact name" required>
              <Input
                value={form.contactName}
                onChange={(e) => patch({ contactName: e.target.value })}
                placeholder="Full name"
              />
            </Field>
            <Field label="Contact phone" required hint="Include country code if possible.">
              <Input
                value={form.contactPhone}
                onChange={(e) => patch({ contactPhone: e.target.value })}
                placeholder="+212…"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field
              label="Access instructions"
              hint="Optional now — building codes, parking tip, who to ask for. Shown to confirmed guests."
            >
              <textarea
                rows={3}
                className={textareaClassName}
                value={form.accessInstructions}
                onChange={(e) => patch({ accessInstructions: e.target.value })}
                placeholder="Ring apartment 4B. Lockbox code sent after confirmation…"
              />
            </Field>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (stepId === "pricing") {
    const multi = isMultiUnitFlow(form.listingType, form.bookingModel);
    const unitPrices = form.unitTypes
      .map((u) => Number(u.basePrice) || 0)
      .filter((n) => n > 0);
    const previewBase = multi
      ? unitPrices.length
        ? Math.min(...unitPrices)
        : 0
      : Number(form.basePrice) || 0;
    const fees = calculateBookingFees(previewBase, feeRates);

    return (
      <div className="space-y-6">
        <StepHeader
          eyebrow="Pricing"
          title={multi ? "Fees for this property" : "Set your nightly price"}
          description={
            multi
              ? "Room and dorm prices were set on each type. Here you only set property-level fees like cleaning."
              : "Enter what you want to earn per night. We’ll show what guests pay after the Nexa Stays service fee."
          }
          tip="Prices are in MAD. You can adjust later after the listing is approved."
        />

        {!multi && (
          <SectionCard title="Nightly rates" description="Base rate guests see first.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Price per night" required hint="Weeknight starting price.">
                <Input
                  type="number"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) => patch({ basePrice: e.target.value })}
                  placeholder="650"
                />
              </Field>
              <Field label="Weekend price" hint="Optional higher Fri–Sat rate.">
                <Input
                  type="number"
                  min={0}
                  value={form.weekendPrice}
                  onChange={(e) => patch({ weekendPrice: e.target.value })}
                  placeholder="750"
                />
              </Field>
              <Field label="Cleaning fee" hint="One-time fee per stay, if any.">
                <Input
                  type="number"
                  min={0}
                  value={form.cleaningFee}
                  onChange={(e) => patch({ cleaningFee: e.target.value })}
                  placeholder="0"
                />
              </Field>
            </div>
          </SectionCard>
        )}

        {multi && (
          <SectionCard
            title="Cleaning fee"
            description="Charged once per booking, on top of the room or bed rate."
          >
            <Field label="Cleaning fee (MAD)">
              <Input
                type="number"
                min={0}
                value={form.cleaningFee}
                onChange={(e) => patch({ cleaningFee: e.target.value })}
                placeholder="0"
              />
            </Field>
          </SectionCard>
        )}

        {previewBase > 0 && (
          <div className="overflow-hidden rounded-2xl border-2 border-nexa-primary/20 bg-gradient-to-br from-nexa-primary-soft to-white p-5 shadow-nexa-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-nexa-primary">
              Fee preview
            </p>
            <p className="mt-2 font-sans text-lg font-semibold text-nexa-ink">
              Based on MAD {previewBase.toFixed(0)}
              {multi ? " (lowest room/bed type)" : " / night"}
            </p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-nexa-ink-3">Guest pays (with service fee)</dt>
                <dd className="font-semibold text-nexa-ink">
                  MAD {fees.totalGuestPays.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-nexa-ink-3">
                  Nexa guest fee ({feeRates.guest_fee_percent}%)
                </dt>
                <dd className="text-nexa-ink-2">MAD {fees.guestFee.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-nexa-line pt-2">
                <dt className="text-nexa-ink-3">Your payout (after host fee)</dt>
                <dd className="font-semibold text-nexa-primary">
                  MAD {Math.max(fees.hostPayout, 0).toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    );
  }

  if (stepId === "media") {
    const recommended = 15;
    const minRequired = 12;
    const hasExterior = form.photos.some(
      (p) => p.category === "EXTERIOR" || p.category === "ENTRANCE",
    );
    return (
      <div className="space-y-6">
        <StepHeader
          eyebrow="Photos & video"
          title="Show the real place"
          description="Upload clear photos and one continuous walkthrough video. Label each photo so guests know what they’re looking at."
          tip={`Required to submit: at least ${minRequired} photos (including exterior or entrance) + one walkthrough video. Aim for ${recommended} photos.`}
        />

        <SectionCard
          title="Photo checklist"
          description="Progress toward a complete gallery."
        >
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-nexa-bg-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-nexa-primary to-nexa-primary-light transition-all"
              style={{
                width: `${Math.min(100, (form.photos.length / recommended) * 100)}%`,
              }}
            />
          </div>
          <ul className="space-y-1.5 text-sm text-nexa-ink-2">
            <li className={cn(form.photos.length >= minRequired && "text-nexa-primary")}>
              {form.photos.length >= minRequired ? "✓" : "○"} {form.photos.length} /{" "}
              {minRequired} photos minimum ({recommended} recommended)
            </li>
            <li className={cn(hasExterior && "text-nexa-primary")}>
              {hasExterior ? "✓" : "○"} At least one exterior or entrance photo
            </li>
            <li className={cn(form.walkthrough && "text-nexa-primary")}>
              {form.walkthrough ? "✓" : "○"} Walkthrough video
            </li>
          </ul>
        </SectionCard>

        <SectionCard
          title="Upload photos"
          description="Select multiple images at once. Then choose a category for each."
        >
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-nexa-primary/40 bg-nexa-primary-soft/50 px-4 py-8 text-center transition-colors hover:border-nexa-primary hover:bg-nexa-primary-soft">
            <span className="font-sans text-sm font-semibold text-nexa-primary">
              Choose photos
            </span>
            <span className="mt-1 text-xs text-nexa-ink-4">JPG or PNG · multiple files OK</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                const added = files.map((file) => ({
                  id: crypto.randomUUID(),
                  file,
                  preview: URL.createObjectURL(file),
                  category: "OTHER" as MediaCategory,
                  isCover: form.photos.length === 0,
                }));
                patch({ photos: [...form.photos, ...added] });
                e.target.value = "";
              }}
            />
          </label>

          {form.photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.photos.map((p, idx) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-xl border-2 border-nexa-line bg-white shadow-nexa-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="h-28 w-full object-cover" />
                  <div className="space-y-2 p-2.5">
                    <select
                      className={cn(selectClassName, "h-9 min-h-0 py-1 text-xs")}
                      value={p.category}
                      onChange={(e) => {
                        const next = [...form.photos];
                        next[idx] = {
                          ...p,
                          category: e.target.value as MediaCategory,
                        };
                        patch({ photos: next });
                      }}
                    >
                      {MEDIA_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-nexa-primary"
                        onClick={() =>
                          patch({
                            photos: form.photos.map((x) => ({
                              ...x,
                              isCover: x.id === p.id,
                            })),
                          })
                        }
                      >
                        {p.isCover ? "★ Cover photo" : "Set as cover"}
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600"
                        onClick={() => {
                          URL.revokeObjectURL(p.preview);
                          patch({
                            photos: form.photos.filter((x) => x.id !== p.id),
                          });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Walkthrough video"
          description="One continuous clip from the entrance through the main rooms. No IDs, faces of strangers, or sensitive documents."
        >
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-nexa-line bg-nexa-bg px-4 py-8 text-center transition-colors hover:border-nexa-primary/50">
            <span className="font-sans text-sm font-semibold text-nexa-ink">
              {form.walkthrough ? "Replace video" : "Upload walkthrough video"}
            </span>
            <span className="mt-1 text-xs text-nexa-ink-4">MP4 or similar · required</span>
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (form.walkthroughPreview) URL.revokeObjectURL(form.walkthroughPreview);
                patch({
                  walkthrough: file,
                  walkthroughPreview: file ? URL.createObjectURL(file) : null,
                });
              }}
            />
          </label>
          {form.walkthrough && (
            <p className="mt-3 rounded-lg bg-nexa-primary-soft px-3 py-2 text-sm text-nexa-ink-2">
              ✓ {form.walkthrough.name}
            </p>
          )}
        </SectionCard>
      </div>
    );
  }

  if (stepId === "review") {
    const typeLabel = form.listingType
      ? PROPERTY_TYPE_COPY[form.listingType].label
      : "—";
    const modelLabel = form.bookingModel
      ? BOOKING_MODEL_LABEL[form.bookingModel] ?? form.bookingModel
      : "—";
    return (
      <div className="space-y-6">
        <StepHeader
          eyebrow="Almost done"
          title="Review and submit for Nexa review"
          description="We’ll check your details, photos, and walkthrough before the listing goes live. You can edit after approval."
          tip="Make sure the title, city, photos, and pricing look right — those are what guests see first."
        />
        <SectionCard title="Listing summary">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["Property type", typeLabel],
              ["How guests book", modelLabel],
              ["Title", form.title || "—"],
              ["City", form.city || "—"],
              ["Photos", String(form.photos.length)],
              [
                "Rooms / beds",
                form.unitTypes.length
                  ? `${form.unitTypes.length} type(s)`
                  : "Single place",
              ],
              [
                "Nightly from",
                (() => {
                  if (form.unitTypes.length) {
                    const prices = form.unitTypes
                      .map((u) => Number(u.basePrice) || 0)
                      .filter((n) => n > 0);
                    return prices.length ? `MAD ${Math.min(...prices)}` : "—";
                  }
                  return form.basePrice ? `MAD ${form.basePrice}` : "—";
                })(),
              ],
              ["Walkthrough", form.walkthrough ? "Added" : "Missing"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-nexa-line bg-nexa-bg px-3 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">
                  {label}
                </dt>
                <dd className="mt-1 font-sans text-sm font-semibold text-nexa-ink">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      </div>
    );
  }

  return null;
}
