import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HostBooking } from "../stays-types";
import {
  addCalendarDaysYmd,
  casablancaYmd,
  classifyHostBookingUrgency,
  exportStatusForBookingFilter,
  filterHostBookings,
  matchesHostBookingFilter,
  matchesHostBookingSearch,
  sortHostBookingsForOps,
  toBookingDateYmd,
} from "../host-booking-center";

function booking(partial: Partial<HostBooking> & Pick<HostBooking, "id" | "status">): HostBooking {
  return {
    listing_id: "l1",
    checkin_date: "2026-08-11",
    checkout_date: "2026-08-14",
    guest_count: 2,
    total_subtotal: 1000,
    total_paid: 1100,
    currency: "MAD",
    guest_name: "Amine",
    listing: { id: "l1", title: "Riad Medina", city: "Marrakech" },
    ...partial,
  };
}

describe("host-booking-center", () => {
  const today = "2026-08-11";
  const tomorrow = "2026-08-12";

  it("toBookingDateYmd strips to calendar date", () => {
    assert.equal(toBookingDateYmd("2026-08-11"), "2026-08-11");
    assert.equal(toBookingDateYmd("2026-08-11T00:00:00.000Z"), "2026-08-11");
  });

  it("addCalendarDaysYmd advances YYYY-MM-DD", () => {
    assert.equal(addCalendarDaysYmd("2026-08-11", 1), "2026-08-12");
    assert.equal(addCalendarDaysYmd("2026-08-31", 1), "2026-09-01");
  });

  it("casablancaYmd returns YYYY-MM-DD", () => {
    const ymd = casablancaYmd(new Date("2026-08-10T23:30:00.000Z"));
    assert.match(ymd, /^\d{4}-\d{2}-\d{2}$/);
    // 23:30 UTC Aug 10 = 00:30 Aug 11 Casablanca (UTC+1)
    assert.equal(ymd, "2026-08-11");
  });

  it("classifies check-in / check-out today and payment pending", () => {
    assert.equal(
      classifyHostBookingUrgency(
        booking({ id: "1", status: "CONFIRMED", checkin_date: today, checkout_date: "2026-08-14" }),
        today,
        tomorrow,
      ),
      "checkin_today",
    );
    assert.equal(
      classifyHostBookingUrgency(
        booking({
          id: "2",
          status: "CHECKED_IN",
          checkin_date: "2026-08-08",
          checkout_date: today,
        }),
        today,
        tomorrow,
      ),
      "checkout_today",
    );
    assert.equal(
      classifyHostBookingUrgency(
        booking({ id: "3", status: "PAYMENT_PENDING", checkin_date: "2026-08-20" }),
        today,
        tomorrow,
      ),
      "awaiting_payment",
    );
    assert.equal(
      classifyHostBookingUrgency(
        booking({
          id: "4",
          status: "CONFIRMED",
          checkin_date: tomorrow,
          checkout_date: "2026-08-15",
        }),
        today,
        tomorrow,
      ),
      "checkin_tomorrow",
    );
  });

  it("filters today / upcoming / cancelled correctly", () => {
    const rows = [
      booking({ id: "cin", status: "CONFIRMED", checkin_date: today, checkout_date: "2026-08-14" }),
      booking({
        id: "up",
        status: "CONFIRMED",
        checkin_date: "2026-08-20",
        checkout_date: "2026-08-22",
      }),
      booking({
        id: "cx",
        status: "CANCELLED_BY_GUEST",
        checkin_date: "2026-08-01",
        checkout_date: "2026-08-03",
      }),
      booking({ id: "pay", status: "INITIATED", checkin_date: "2026-08-25" }),
    ];
    assert.equal(
      filterHostBookings({ bookings: rows, filter: "today", todayYmd: today }).map((b) => b.id).join(),
      "cin",
    );
    assert.equal(
      filterHostBookings({ bookings: rows, filter: "upcoming", todayYmd: today }).map((b) => b.id).join(),
      "up",
    );
    assert.equal(
      filterHostBookings({ bookings: rows, filter: "cancelled", todayYmd: today }).map((b) => b.id).join(),
      "cx",
    );
    assert.equal(
      filterHostBookings({ bookings: rows, filter: "awaiting_payment", todayYmd: today }).map((b) => b.id).join(),
      "pay",
    );
    assert.equal(
      matchesHostBookingFilter(rows[0], "checkin_today", today, tomorrow),
      true,
    );
  });

  it("search matches guest, listing, id", () => {
    const b = booking({ id: "abc-uuid", status: "CONFIRMED", guest_name: "Nora Ben" });
    assert.equal(matchesHostBookingSearch(b, "nora"), true);
    assert.equal(matchesHostBookingSearch(b, "riad"), true);
    assert.equal(matchesHostBookingSearch(b, "abc-uuid"), true);
    assert.equal(matchesHostBookingSearch(b, "zzzz"), false);
  });

  it("sorts by urgency priority", () => {
    const rows = [
      booking({ id: "up", status: "CONFIRMED", checkin_date: "2026-08-20", checkout_date: "2026-08-22" }),
      booking({
        id: "out",
        status: "CHECKED_IN",
        checkin_date: "2026-08-08",
        checkout_date: today,
      }),
      booking({ id: "in", status: "CONFIRMED", checkin_date: today, checkout_date: "2026-08-14" }),
    ];
    assert.deepEqual(
      sortHostBookingsForOps(rows, today, tomorrow).map((b) => b.id),
      ["out", "in", "up"],
    );
  });

  it("maps export status only for unambiguous filters", () => {
    assert.equal(exportStatusForBookingFilter("completed"), "COMPLETED");
    assert.equal(exportStatusForBookingFilter("awaiting_payment"), "PAYMENT_PENDING");
    assert.equal(exportStatusForBookingFilter("today"), undefined);
    assert.equal(exportStatusForBookingFilter("cancelled"), undefined);
  });
});
