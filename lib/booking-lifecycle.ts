import type { StaysBooking, BookingLifecycle } from "./stays-types";

const CANCELLED_STATUSES = ["CANCELLED_BY_GUEST", "CANCELLED_BY_HOST"];
const PAID_STAY_STATUSES = ["CONFIRMED", "CHECKED_IN", "COMPLETED"];
const PAYMENT_PENDING_TTL_MINUTES = 60;

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parseDateOnly(value: string | Date): Date {
  return startOfDay(new Date(value));
}

export function getPaymentExpiresAt(createdAt: string | Date): Date {
  const created = new Date(createdAt);
  return new Date(created.getTime() + PAYMENT_PENDING_TTL_MINUTES * 60 * 1000);
}

export function resolveBookingLifecycle(booking: StaysBooking): BookingLifecycle {
  if (booking.booking_lifecycle) {
    return booking.booking_lifecycle;
  }

  const now = new Date();
  const today = startOfDay(now);
  const checkin = parseDateOnly(booking.checkin_date);
  const checkout = parseDateOnly(booking.checkout_date);

  if (booking.status === "EXPIRED") return "EXPIRED";
  if (CANCELLED_STATUSES.includes(booking.status)) return "CANCELLED";

  if (booking.status === "PAYMENT_PENDING" || booking.status === "INITIATED") {
    if (booking.created_at && getPaymentExpiresAt(booking.created_at) <= now) {
      return "EXPIRED";
    }
    return "PENDING_PAYMENT";
  }

  if (booking.status === "COMPLETED") return "COMPLETED";

  if (PAID_STAY_STATUSES.includes(booking.status)) {
    if (today >= checkout) return "COMPLETED";
    if (today >= checkin && today < checkout) return "ACTIVE";
    if (today < checkin) return "UPCOMING";
  }

  return "CANCELLED";
}

export type BookingTabId =
  | "upcoming"
  | "current"
  | "pending"
  | "completed"
  | "cancelled"
  | "all";

export function lifecycleToTab(lifecycle: BookingLifecycle): BookingTabId | null {
  switch (lifecycle) {
    case "UPCOMING":
      return "upcoming";
    case "ACTIVE":
      return "current";
    case "PENDING_PAYMENT":
      return "pending";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
    case "EXPIRED":
      return "cancelled";
    default:
      return null;
  }
}

export function lifecycleBadgeClasses(lifecycle: BookingLifecycle): string {
  switch (lifecycle) {
    case "UPCOMING":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDING_PAYMENT":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "COMPLETED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "CANCELLED":
    case "EXPIRED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function canCancelBooking(booking: StaysBooking): boolean {
  if (booking.can_cancel != null) return booking.can_cancel;
  const lifecycle = resolveBookingLifecycle(booking);
  return lifecycle === "PENDING_PAYMENT" || lifecycle === "UPCOMING";
}

export function canComplainBooking(booking: StaysBooking): boolean {
  if (booking.can_complain != null) return booking.can_complain;
  const lifecycle = resolveBookingLifecycle(booking);
  return lifecycle === "ACTIVE" || lifecycle === "COMPLETED";
}

export function canReviewBooking(booking: StaysBooking): boolean {
  if (booking.can_review != null) return booking.can_review;
  return resolveBookingLifecycle(booking) === "COMPLETED";
}

export type SortOption =
  | "newest"
  | "oldest"
  | "checkin"
  | "price"
  | "guests";

export interface BookingFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  city: string;
  priceMin: string;
  priceMax: string;
  sort: SortOption;
}

export const DEFAULT_BOOKING_FILTERS: BookingFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  status: "all",
  city: "all",
  priceMin: "",
  priceMax: "",
  sort: "newest",
};

export function filterAndSortBookings(
  bookings: StaysBooking[],
  tab: BookingTabId,
  filters: BookingFilters,
): StaysBooking[] {
  let result = bookings.filter((b) => {
    const lifecycle = resolveBookingLifecycle(b);
    const bookingTab = lifecycleToTab(lifecycle);
    if (tab !== "all" && bookingTab !== tab) return false;

    if (filters.status !== "all" && lifecycle !== filters.status) return false;

    if (filters.city !== "all") {
      const city = b.listing?.city?.toLowerCase() ?? "";
      if (city !== filters.city.toLowerCase()) return false;
    }

    if (filters.dateFrom) {
      const from = parseDateOnly(filters.dateFrom);
      if (parseDateOnly(b.checkout_date) < from) return false;
    }
    if (filters.dateTo) {
      const to = parseDateOnly(filters.dateTo);
      if (parseDateOnly(b.checkin_date) > to) return false;
    }

    const price = b.total_paid ?? b.total_subtotal;
    if (filters.priceMin && price < Number(filters.priceMin)) return false;
    if (filters.priceMax && price > Number(filters.priceMax)) return false;

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const title = b.listing?.title?.toLowerCase() ?? "";
      const city = b.listing?.city?.toLowerCase() ?? "";
      const id = b.id.toLowerCase();
      if (!title.includes(q) && !city.includes(q) && !id.includes(q)) {
        return false;
      }
    }

    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return (
          new Date(a.created_at ?? a.checkin_date).getTime() -
          new Date(b.created_at ?? b.checkin_date).getTime()
        );
      case "checkin":
        return new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime();
      case "price": {
        const pa = a.total_paid ?? a.total_subtotal;
        const pb = b.total_paid ?? b.total_subtotal;
        return pb - pa;
      }
      case "guests":
        return b.guest_count - a.guest_count;
      case "newest":
      default:
        return (
          new Date(b.created_at ?? b.checkin_date).getTime() -
          new Date(a.created_at ?? a.checkin_date).getTime()
        );
    }
  });

  return result;
}

export function countByTab(bookings: StaysBooking[]): Record<BookingTabId, number> {
  const counts: Record<BookingTabId, number> = {
    upcoming: 0,
    current: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    all: bookings.length,
  };

  for (const b of bookings) {
    const tab = lifecycleToTab(resolveBookingLifecycle(b));
    if (tab && tab !== "all") counts[tab] += 1;
  }

  return counts;
}

export function uniqueCities(bookings: StaysBooking[]): string[] {
  const set = new Set<string>();
  for (const b of bookings) {
    const city = b.listing?.city?.trim();
    if (city) set.add(city);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
