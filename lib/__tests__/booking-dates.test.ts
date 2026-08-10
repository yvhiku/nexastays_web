import assert from "node:assert/strict";
import test from "node:test";
import { bookingNights, isValidBookingRange } from "../booking-dates";

test("bookingNights — 1 night", () => {
  assert.equal(bookingNights("2026-08-10", "2026-08-11"), 1);
});

test("bookingNights — 2 nights", () => {
  assert.equal(bookingNights("2026-08-10", "2026-08-12"), 2);
});

test("bookingNights — 7 nights", () => {
  assert.equal(bookingNights("2026-08-10", "2026-08-17"), 7);
});

test("bookingNights — same-day invalid", () => {
  assert.equal(bookingNights("2026-08-10", "2026-08-10"), 0);
  assert.equal(isValidBookingRange("2026-08-10", "2026-08-10"), false);
});

test("bookingNights — checkout before check-in", () => {
  assert.equal(bookingNights("2026-08-12", "2026-08-10"), -2);
  assert.equal(isValidBookingRange("2026-08-12", "2026-08-10"), false);
});

test("bookingNights — DST fall-back / spring-forward calendar nights", () => {
  assert.equal(bookingNights("2026-10-31", "2026-11-02"), 2);
  assert.equal(bookingNights("2026-03-07", "2026-03-09"), 2);
});
