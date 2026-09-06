/**
 * Mobile chrome path helpers — host portal vs immersive booking/messaging.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isBookingDetailPath,
  isHostPortalPath,
  isImmersiveMobilePath,
  stripLocalePath,
} from "../nav/mobile-chrome";

describe("mobile-chrome helpers", () => {
  it("strips locale prefixes", () => {
    assert.equal(stripLocalePath("/en/host/dashboard"), "/host/dashboard");
    assert.equal(stripLocalePath("/fr/bookings/abc"), "/bookings/abc");
    assert.equal(stripLocalePath("/host/dashboard"), "/host/dashboard");
  });

  it("detects host portal routes", () => {
    assert.equal(isHostPortalPath("/host/dashboard"), true);
    assert.equal(isHostPortalPath("/en/host/dashboard"), true);
    assert.equal(isHostPortalPath("/host/bookings"), true);
    assert.equal(isHostPortalPath("/host/listings"), true);
    assert.equal(isHostPortalPath("/host/inbox"), true);
    assert.equal(isHostPortalPath("/host/inbox/cid"), true);
    assert.equal(isHostPortalPath("/host/analytics"), true);
    assert.equal(isHostPortalPath("/host/reviews"), true);
  });

  it("excludes bare /host apply and listing wizard/edit from portal", () => {
    assert.equal(isHostPortalPath("/host"), false);
    assert.equal(isHostPortalPath("/en/host"), false);
    assert.equal(isHostPortalPath("/host/listings/new"), false);
    assert.equal(isHostPortalPath("/en/host/listings/new"), false);
    assert.equal(isHostPortalPath("/host/listings/abc/edit"), false);
  });

  it("detects booking detail only", () => {
    assert.equal(isBookingDetailPath("/bookings/123"), true);
    assert.equal(isBookingDetailPath("/bookings/abc-def"), true);
    assert.equal(isBookingDetailPath("/en/bookings/abc-def"), true);
    assert.equal(isBookingDetailPath("/bookings"), false);
    assert.equal(isBookingDetailPath("/bookings/"), false);
    assert.equal(isBookingDetailPath("/my-bookings"), false);
    assert.equal(isBookingDetailPath("/en/my-bookings"), false);
  });

  it("marks messaging threads and booking detail as immersive", () => {
    assert.equal(isImmersiveMobilePath("/en/inbox/cid"), true);
    assert.equal(isImmersiveMobilePath("/en/host/inbox/cid"), true);
    assert.equal(isImmersiveMobilePath("/bookings/xyz"), true);
    assert.equal(isImmersiveMobilePath("/en/listings"), false);
    assert.equal(isImmersiveMobilePath("/en/host/dashboard"), false);
    assert.equal(isImmersiveMobilePath("/en/host"), false);
    assert.equal(isImmersiveMobilePath("/en/inbox"), false);
  });
});
