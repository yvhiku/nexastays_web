import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { defaultWizardForm } from "../host-listing-wizard/form-defaults";
import type { WizardPhoto } from "../host-listing-wizard/form-types";
import { getWizardSteps } from "../host-listing-wizard/step-config";
import {
  firstIncompleteStepIndex,
  getStepStatuses,
  reduceSaveState,
} from "../host-listing-wizard/step-status";
import { validateStep, validateStepFields } from "../host-listing-wizard/validators";
import { assertCanSubmit, listMissing } from "../host-listing-wizard/completion";

function uploaded(n: number): WizardPhoto[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    file: null,
    assetId: `a${i}`,
    preview: `blob:${i}`,
    category: "OTHER" as const,
    isCover: i === 0,
    uploadStatus: "uploaded" as const,
  }));
}

function completeApartment() {
  const form = defaultWizardForm();
  form.listingType = "APARTMENT";
  form.bookingModel = "ENTIRE_PROPERTY";
  form.city = "Marrakech";
  form.address = "12 Rue X";
  form.geoLat = 31.6;
  form.geoLng = -8.0;
  form.title = "Sunny flat";
  form.description = "A lovely bright apartment close to the medina.";
  form.basePrice = "500";
  form.photos = uploaded(5);
  return form;
}

test("wizard steps: apartment has no unit-types step, hotel does, amenities is optional", () => {
  const apt = getWizardSteps("APARTMENT", "ENTIRE_PROPERTY").map((s) => s.id);
  assert.deepEqual(apt, ["location", "about", "pricing", "media", "amenitiesRules", "submit"]);
  const hotel = getWizardSteps("HOTEL", "ROOM_TYPES").map((s) => s.id);
  assert.ok(hotel.includes("unitTypes"));
  assert.equal(getWizardSteps("HOTEL", "ROOM_TYPES").find((s) => s.id === "amenitiesRules")?.optional, true);
});

test("validateStepFields returns structured, field-keyed errors", () => {
  const form = defaultWizardForm();
  const errors = validateStepFields("location", form);
  assert.deepEqual(Object.keys(errors).sort(), ["address", "city", "map"]);
  assert.equal(errors.city.key, "hostListing.wizard.validation.cityRequired");

  form.title = "x".repeat(201);
  form.description = "short";
  const about = validateStepFields("about", form);
  assert.equal(about.title.key, "hostListing.wizard.validation.titleTooLong");
  assert.equal(about.title.vars?.max, 200);
  assert.equal(about.description.vars?.min, 20);
});

test("validateStep stays a nullable gate on top of field errors", () => {
  const form = completeApartment();
  assert.equal(validateStep("location", form), null);
  assert.equal(validateStep("about", form), null);
  assert.equal(validateStep("pricing", form), null);
  assert.equal(validateStep("media", form), null);
  form.photos = uploaded(3);
  assert.equal(validateStep("media", form)?.key, "hostListing.wizard.validation.photosMin");
});

test("media step: failed uploads block before the minimum count", () => {
  const form = completeApartment();
  form.photos = [...uploaded(5), { ...uploaded(1)[0], id: "bad", uploadStatus: "error", uploadError: "x" }];
  const errors = validateStepFields("media", form);
  assert.equal(errors.photos.key, "hostListing.wizard.validation.photosFailed");
  assert.equal(errors.photos.vars?.count, 1);
});

test("media step: unfinished uploads block Continue (pending does not count toward min)", () => {
  const form = completeApartment();
  form.photos = uploaded(5).map((p, i) =>
    i < 3 ? p : { ...p, uploadStatus: "pending" as const, assetId: undefined, file: new File([], "x.jpg") },
  );
  const errors = validateStepFields("media", form);
  assert.equal(errors.photos.key, "hostListing.wizard.validation.photosUploading");
  form.photos = uploaded(3).map((p) => ({
    ...p,
    uploadStatus: "uploading" as const,
  }));
  assert.equal(
    validateStepFields("media", form).photos.key,
    "hostListing.wizard.validation.photosUploading",
  );
});

test("unit types: per-unit errors are keyed by unit id", () => {
  const form = defaultWizardForm();
  form.listingType = "HOTEL";
  form.bookingModel = "ROOM_TYPES";
  form.unitTypes = [
    {
      id: "u1",
      kind: "HOTEL_ROOM",
      name: "",
      quantity: 2,
      maxGuests: 2,
      bedConfig: "",
      sizeSqm: "",
      amenities: [],
      pricingUnit: "ROOM_NIGHT",
      basePrice: "",
      details: {},
      isActive: true,
    },
  ];
  const errors = validateStepFields("unitTypes", form);
  assert.ok(errors["unitTypes.u1.name"]);
  assert.ok(errors["unitTypes.u1.basePrice"]);
  assert.equal(errors["unitTypes.u1.capacity"], undefined);
});

test("step statuses map to the shared vocabulary and never disable forward steps", () => {
  const form = completeApartment();
  form.title = "";
  const steps = getWizardSteps(form.listingType, form.bookingModel);
  const statuses = getStepStatuses(steps, form, 0);
  assert.equal(statuses[0], "current");
  assert.equal(statuses[1], "needsAttention"); // about (title missing)
  assert.equal(statuses[2], "ok"); // pricing
  assert.equal(statuses[3], "ok"); // media
  assert.equal(statuses[4], "ok"); // optional amenities never blocks
  assert.equal(statuses[5], "needsAttention"); // submit
});

test("resume lands on the first incomplete required step, else on submit", () => {
  const form = completeApartment();
  const steps = getWizardSteps(form.listingType, form.bookingModel);
  assert.equal(firstIncompleteStepIndex(steps, form), steps.length - 1);
  form.basePrice = "";
  assert.equal(steps[firstIncompleteStepIndex(steps, form)].id, "pricing");
  form.city = "";
  assert.equal(steps[firstIncompleteStepIndex(steps, form)].id, "location");
});

test("save state reducer maps to status tokens with retryable error", () => {
  let s = reduceSaveState({ status: "idle" }, { type: "start" });
  assert.equal(s.status, "busy");
  const at = new Date();
  s = reduceSaveState(s, { type: "success", at });
  assert.equal(s.status, "ok");
  assert.equal(s.at, at);
  s = reduceSaveState(s, { type: "failure", error: "boom" });
  assert.equal(s.status, "error");
  assert.equal(s.error, "boom");
  assert.equal(s.at, at); // last good save preserved for the footer label
});

test("submit gate and missing list are i18n references that point at owning steps", () => {
  const form = completeApartment();
  form.photos = uploaded(2);
  const flags = {
    location_complete: true,
    about_complete: true,
    pricing_complete: true,
    photos_complete: false,
    photos_quality_complete: false,
    rooms_complete: true,
    walkthrough_complete: false,
    amenities_complete: false,
    house_rules_complete: true,
  };
  const gate = assertCanSubmit(flags);
  assert.equal(gate?.key, "hostListing.wizard.submitGate.photos");
  assert.equal(gate?.vars?.min, 5);
  const missing = listMissing(flags);
  assert.equal(missing.find((m) => m.key === "photos")?.step, "media");
  assert.equal(missing.find((m) => m.key === "walkthrough")?.required, false);
});

// ---------------------------------------------------------------------------
// Photo persistence invariants (source-level; the hook needs a DOM to run)
// ---------------------------------------------------------------------------

const wizardHookSrc = readFileSync(
  path.join(__dirname, "..", "host-listing-wizard", "use-listing-wizard.ts"),
  "utf8",
);
const gallerySrc = readFileSync(
  path.join(__dirname, "..", "..", "components", "listing", "ListingHeroGallery.tsx"),
  "utf8",
);

test("runMediaSync never PUTs a partial photo set while any upload is unfinished", () => {
  const start = wizardHookSrc.indexOf("const runMediaSync");
  const end = wizardHookSrc.indexOf("const flushMediaSync");
  assert.ok(start > 0 && end > start);
  const body = wizardHookSrc.slice(start, end);
  // Guard must run before the dirty flag is cleared, and must not be weakened by
  // an "at least one uploaded" escape hatch (that is what allowed partial PUTs).
  const guardIdx = body.indexOf("if (hasUnfinishedUploads(current.photos))");
  const clearIdx = body.indexOf("mediaDirtyRef.current = false");
  assert.ok(guardIdx > 0, "guard present");
  assert.ok(clearIdx > guardIdx, "dirty flag cleared only after the guard");
  assert.ok(!body.includes('uploadStatus === "uploaded") &&'), "no partial-set escape hatch");
  // Both upload completion and failure re-arm the debounced flush.
  assert.match(wizardHookSrc, /markUploaded\(prev\.photos, id, asset_id\) \}\)\);\s*markMediaDirty\(\);/);
  assert.match(wizardHookSrc, /markFailed\([\s\S]*?if \(mediaDirtyRef\.current\) markMediaDirty\(\);/);
});

test("hero gallery loads API media unoptimized and never swaps failed slots to the shared placeholder", () => {
  assert.match(gallerySrc, /unoptimized=\{assetId !== "placeholder"\}/);
  // Placeholder only for the empty-media sentinel; errors must not resolve to it.
  assert.match(gallerySrc, /if \(assetId === "placeholder"\) return placeholder;/);
  assert.ok(!/imgErrors\[assetId\]\) return placeholder/.test(gallerySrc));
  assert.match(gallerySrc, /Photo unavailable/);
});

test("recently-viewed / saved snapshot images bypass the optimizer for API media", () => {
  const root = path.join(__dirname, "..", "..", "components");
  for (const rel of [
    "explore/feed/rails/ContinueBrowsingRail.tsx",
    "home/RecentlyViewedSection.tsx",
    "saved/SavedOnboardingSheet.tsx",
  ]) {
    const src = readFileSync(path.join(root, rel), "utf8");
    assert.match(src, /unoptimized=\{isListingMediaUrl\(/, rel);
    assert.ok(!src.includes('startsWith("http://")'), `${rel}: no http:// heuristic`);
  }
});
