"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUrlTab } from "@/hooks/use-url-tab";
import {
  Ban,
  Calendar,
  CheckCircle2,
  FileCheck2,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  bookingBadgeStatus,
  canHomeownerCancelBooking,
  BOOKING_TAB_QUERY,
  bookingCategoryName,
  errorMessage,
  formatBookingDate,
  type BookingListTab,
} from "@/lib/booking-view";
import {
  bookingToJob,
  unwrapList,
  type ApiBooking,
} from "@/lib/marketplace-mappers";
import {
  useCancelBookingMutation,
  useGetMyBookingsQuery,
} from "@/services/client/marketplace-api";
import { mediaUrl } from "@/utils/mediaUrl";
import { cn } from "@/lib/cn";

type BookingTab = BookingListTab;

type BookingRow = {
  /** Booking document id (use for API calls and detail links). */
  id: string;
  raw: ApiBooking;
  job: ReturnType<typeof bookingToJob>;
};

function useBookingRows(tab: BookingTab, searchTerm?: string) {
  const query = useGetMyBookingsQuery({
    tab: BOOKING_TAB_QUERY[tab],
    ...(searchTerm ? { searchTerm } : {}),
  });
  const rows = useMemo<BookingRow[]>(
    () =>
      unwrapList<ApiBooking>(query.data?.data).map((raw) => ({
        id: raw._id,
        raw,
        job: bookingToJob(raw),
      })),
    [query.data],
  );
  return { rows, isLoading: query.isLoading, isError: query.isError };
}

export default function MyBookingsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useUrlTab(
    ["all", "upcoming", "inProgress", "history"] as const,
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cancellingBooking, setCancellingBooking] = useState<BookingRow | null>(null);
  const [cancelReason, setCancelReason] = useState("Change of plans");
  const [cancelError, setCancelError] = useState("");
  const [previewEmpty, setPreviewEmpty] = useState(false);

  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // One query per lifecycle tab so the tab counters stay accurate.
  // Counters use unfiltered lists; the active tab applies searchTerm against the API.
  const allTab = useBookingRows("all");
  const upcomingTab = useBookingRows("upcoming");
  const inProgressTab = useBookingRows("inProgress");
  const historyTab = useBookingRows("history");
  const activeSearchTab = useBookingRows(activeTab, debouncedSearch || undefined);
  const tabData = {
    all: allTab,
    upcoming: upcomingTab,
    inProgress: inProgressTab,
    history: historyTab,
  } satisfies Record<BookingTab, ReturnType<typeof useBookingRows>>;
  const current = debouncedSearch ? activeSearchTab : tabData[activeTab];

  async function handleConfirmCancel() {
    if (!cancellingBooking) return;
    setCancelError("");
    try {
      await cancelBooking(cancellingBooking.id).unwrap();
      setCancellingBooking(null);
    } catch (error) {
      setCancelError(errorMessage(error, "This booking could not be cancelled."));
    }
  }

  const tabCounts = {
    all: allTab.rows.length,
    upcoming: upcomingTab.rows.length,
    inProgress: inProgressTab.rows.length,
    history: historyTab.rows.length,
  };

  const filteredBookings = current.rows;

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight">
            My Bookings
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Confirmed appointments, scheduled arrivals, on-site repairs, and verified completion records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreviewEmpty((prev) => !prev)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted hover:text-primary hover:border-primary/40 transition shadow-2xs cursor-pointer"
          title="Toggle empty state view"
        >
          <span>{previewEmpty ? "← View Live Data" : "Preview Empty State"}</span>
        </button>
      </div>

      {/* 2. Lifecycle Tab Navigation */}
      <div className="flex items-center overflow-x-auto no-scrollbar py-1">
        <div className="inline-flex items-center gap-1 rounded-2xl bg-stone-100/90 p-1 border border-line/60">
          {(
            [
              { id: "all", label: "All Bookings", count: tabCounts.all },
              { id: "upcoming", label: "Upcoming", count: tabCounts.upcoming },
              { id: "inProgress", label: "Active & On-Site", count: tabCounts.inProgress },
              { id: "history", label: "History", count: tabCounts.history },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap",
                  active
                    ? "bg-white text-title shadow-xs font-bold"
                    : "text-muted hover:text-title font-medium",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors",
                    active
                      ? "bg-stone-100 text-title"
                      : "bg-white/80 text-muted",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search Filter — keep visible while searching even with zero matches */}
      {(allTab.rows.length > 0 || Boolean(searchQuery.trim())) && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings by contractor name, service, city…"
            className="w-full rounded-xl border border-line/80 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-title outline-none focus:border-primary shadow-2xs"
          />
        </div>
      )}

      {/* 4. Bookings List */}
      {current.isLoading ? (
        <p className="text-sm text-muted">Loading bookings...</p>
      ) : current.isError ? (
        <p className="text-sm text-error">Bookings could not be loaded.</p>
      ) : (allTab.rows.length === 0 || previewEmpty) && !searchQuery.trim() ? (
        <div className="mt-4">
          <EmptyState
            title="No Bookings Yet"
            description="When you and a local pro agree on a quotation and confirm a schedule, your active booking will appear here."
            actionLabel="View Open Service Requests"
            href="/account"
          />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-[16px] border border-line/80 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-title">
            {searchQuery.trim() ? "No matching bookings found." : "No bookings in this category."}
          </p>
          <p className="mt-1 text-xs text-muted">
            Try switching tabs or adjusting your search query.
          </p>
          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Clear search
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((row) => {
            const { raw, job } = row;
            const pro = raw.professional;
            const proName = pro?.name || pro?.companyName || "";
            const category = bookingCategoryName(raw);
            const status = bookingBadgeStatus(raw);
            const isCompleted = status === "completed";
            const detailHref = `/account/bookings/${row.id}`;

            return (
              <Card
                key={row.id}
                onClick={() => router.push(detailHref)}
                className="group overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                {/* Header: Pro Info + Status Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {pro?._id ? (
                      <Link
                        href={`/browse-pros/${pro._id}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`View ${proName}'s profile`}
                        className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line/80 bg-slate-100 transition hover:ring-2 hover:ring-primary/40 cursor-pointer shadow-2xs"
                      >
                        {mediaUrl(pro.profileImage) ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={mediaUrl(pro.profileImage)}
                            alt={proName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-display text-xs font-bold text-title">
                            {proName
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase() ?? "")
                              .join("") || "?"}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line/80 bg-slate-100 shadow-2xs">
                        <span className="font-display text-xs font-bold text-muted">?</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {pro?._id ? (
                          <Link
                            href={`/browse-pros/${pro._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-display text-sm font-bold text-title group-hover:text-primary transition-colors hover:underline truncate"
                          >
                            {proName}
                          </Link>
                        ) : (
                          <h2 className="font-display text-sm font-bold text-title truncate">
                            Contractor Assigned
                          </h2>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate">
                        {category ? `${category} · ` : ""}{job.city}{job.state ? `, ${job.state}` : ""}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={status} />
                </div>

                {/* Job Info + Meta + Actions in clean single row */}
                <div className="mt-3.5 pt-3 border-t border-line/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-display text-sm sm:text-base font-semibold text-title group-hover:text-primary transition line-clamp-1">
                      {job.title}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted" />
                        {formatBookingDate(raw.appointmentDate)}
                        {raw.arrivalTimeWindow ? ` (${raw.arrivalTimeWindow})` : ""}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-title">
                        ${Number(raw.totalAmount || 0)}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 shrink-0"
                  >
                    {canHomeownerCancelBooking(status) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCancelError("");
                          setCancellingBooking(row);
                        }}
                        className="rounded-full text-xs font-semibold text-muted hover:text-error hover:bg-error/10 cursor-pointer"
                      >
                        Cancel
                      </Button>
                    ) : null}
                    {pro?._id ? (
                      <Button
                        href={`/account/messages?dm=${pro._id}`}
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs font-semibold text-muted hover:text-title"
                      >
                        Message
                      </Button>
                    ) : null}
                    {status === "awaiting_confirm" ? (
                      <Button
                        href={detailHref}
                        size="sm"
                        className="rounded-full text-xs font-semibold gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Inspect &amp; Settle ↗
                      </Button>
                    ) : isCompleted ? (
                      raw.hasReviewed || raw.review ? (
                        <Button
                          href={detailHref}
                          size="sm"
                          className="rounded-full text-xs font-semibold gap-1.5 shadow-xs"
                        >
                          View ↗
                        </Button>
                      ) : (
                        <Button
                          href={`${detailHref}#review`}
                          size="sm"
                          className="rounded-full text-xs font-semibold gap-1.5 shadow-xs"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          Review Pending ↗
                        </Button>
                      )
                    ) : status === "cancelled" ? (
                      <Button
                        href={detailHref}
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs font-semibold border border-line text-muted hover:text-title"
                      >
                        View Details ↗
                      </Button>
                    ) : (
                      <Button
                        href={detailHref}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        Manage Booking ↗
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {cancellingBooking ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setCancellingBooking(null)}
        >
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error/10 text-error">
                <Ban className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="rounded-full p-1.5 text-muted hover:text-title hover:bg-smoke transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-display text-lg font-bold text-title mt-3">
              Cancel Booking?
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed">
              Are you sure you want to cancel your booking for <span className="font-semibold text-title">&ldquo;{cancellingBooking.job.title}&rdquo;</span>?
              No cancellation penalty will be applied, and your pro will be notified.
            </p>

            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-title">Reason for cancellation (optional)</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface/50 px-3 py-2 text-xs text-title outline-none focus:border-primary focus:bg-white"
              >
                <option value="Change of plans">Change of plans / No longer needed</option>
                <option value="Scheduling conflict">Scheduling conflict</option>
                <option value="Found alternative solution">Found alternative solution</option>
                <option value="Price or budget reconsideration">Price or budget reconsideration</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {cancelError ? <p className="mt-3 text-xs text-error">{cancelError}</p> : null}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancellingBooking(null)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                {cancelling ? "Cancelling…" : "Cancel Booking"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
