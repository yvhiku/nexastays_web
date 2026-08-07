import assert from "node:assert/strict";
import test from "node:test";

import { defaultWizardForm } from "../host-listing-wizard/form-defaults";
import {
  buildCreateHostListingBody,
  buildUpdateHostListingBody,
} from "../host-listing-wizard/map-to-api";
import { validateStep } from "../host-listing-wizard/validators";

test("draft autosave omits an unset base price", () => {
  const body = buildUpdateHostListingBody(defaultWizardForm());

  assert.equal(body.rate_plan?.base_price, undefined);
  assert.equal(body.rate_plan?.currency, "MAD");
});

test("draft autosave includes a valid base price", () => {
  const form = defaultWizardForm();
  form.basePrice = "450";

  const body = buildUpdateHostListingBody(form);

  assert.equal(body.rate_plan?.base_price, 450);
});

test("location accepts a hydrated Morocco country name", () => {
  const form = defaultWizardForm();
  form.country = "Morocco";
  form.city = "Casablanca";
  form.address = "Boulevard Mohammed V";
  form.geoLat = 33.5731;
  form.geoLng = -7.5898;

  assert.equal(validateStep("location", form), null);
});

test("full listing payload normalizes Morocco to MA", () => {
  const form = defaultWizardForm();
  form.listingType = "APARTMENT";
  form.bookingModel = "ENTIRE_PROPERTY";
  form.country = "Morocco";
  form.basePrice = "500";

  const body = buildCreateHostListingBody(form, []);

  assert.equal(body.country, "MA");
});
