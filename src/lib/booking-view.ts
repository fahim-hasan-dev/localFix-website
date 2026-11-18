import { mapJobStatus, type ApiBooking, type ApiJobRequest } from "@/lib/marketplace-mappers";
import type { JobStatus } from "@/types";

export function bookingBadgeStatus(raw: ApiBooking): JobStatus {
  return mapJobStatus(raw.status);
}

/**
 * Homeowner cancel is rejected once the pro is on site, and after the booking
 * is completed or already cancelled. Scheduled (and disputed) bookings can be cancelled.
 */
export function canHomeownerCancelBooking(status: JobStatus) {
  return status === "scheduled" || status === "hired" || status === "disputed";
}

/** UI tab ids on the bookings lists mapped to the `tab` query param of my-bookings. */
export type BookingListTab = "all" | "upcoming" | "inProgress" | "history";

export const BOOKING_TAB_QUERY: Record<BookingListTab, "all" | "upcoming" | "active_on_site" | "history"> = {
  all: "all",
  upcoming: "upcoming",
  inProgress: "active_on_site",
  history: "history",
};

export function formatBookingDate(value?: string | null, fallback = "Date coordinated") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatBookingDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function bookingJob(raw: ApiBooking): ApiJobRequest | null {
  return typeof raw.jobRequest === "object" && raw.jobRequest ? raw.jobRequest : null;
}

export function bookingCategoryName(raw: ApiBooking): string {
  const category = bookingJob(raw)?.category;
  if (!category) return "";
  return typeof category === "string" ? "" : category.name || "";
}

/** The booking detail endpoint may return the booking directly or wrapped in `{ booking }`. */
export function extractBooking(data: unknown): ApiBooking | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (record.booking && typeof record.booking === "object") return record.booking as ApiBooking;
  if (typeof record._id === "string") return record as unknown as ApiBooking;
  return null;
}

/** Stripe checkout URL returned when the homeowner confirms with card payment. */
export function checkoutUrlFrom(result: unknown): string | null {
  const seen = new Set<unknown>();
  function walk(node: unknown, depth: number): string | null {
    if (!node || typeof node !== "object" || depth > 5 || seen.has(node)) return null;
    seen.add(node);
    const record = node as Record<string, unknown>;
    for (const key of ["paymentUrl", "checkoutUrl", "stripePaymentUrl"]) {
      const value = record[key];
      if (typeof value === "string" && value.startsWith("http")) return value;
    }
    for (const value of Object.values(record)) {
      const found = walk(value, depth + 1);
      if (found) return found;
    }
    return null;
  }
  return walk(result, 0);
}

export function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const record = error as { data?: { message?: string }; message?: string };
    if (record.data?.message) return record.data.message;
    if (record.message) return record.message;
  }
  return fallback;
}
