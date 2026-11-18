"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUrlTab } from "@/hooks/use-url-tab";
import {
  Calendar,
  Receipt,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { mediaUrl } from "@/utils/mediaUrl";
import {
  bookingBadgeStatus,
  BOOKING_TAB_QUERY,
  bookingCategoryName,
  formatBookingDate,
  type BookingListTab,
} from "@/lib/booking-view";
import {
  bookingToJob,
  unwrapList,
  type ApiBooking,
} from "@/lib/marketplace-mappers";
import { useGetMyBookingsQuery } from "@/services/client/marketplace-api";
import { cn } from "@/lib/cn";

type BookingTab = BookingListTab;

function clientInitials(name: string) {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "C";
}

type BookingRow = {
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

export default function ProBookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useUrlTab(
    ["all", "upcoming", "inProgress", "history"] as const,
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [previewEmpty, setPreviewEmpty] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // One query per lifecycle tab so the tab counters stay accurate.
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
            Confirmed client contracts, scheduled arrival windows, on-site execution, and completion receipts.
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

      {/* 3. Search Filter */}
      {allTab.rows.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings by client name, job title, neighborhood…"
            className="w-full rounded-xl border border-line/80 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-title outline-none focus:border-primary shadow-2xs"
          />
        </div>
      )}

      {/* 4. Bookings List */}
      {current.isLoading ? (
        <p className="text-sm text-muted">Loading bookings...</p>
      ) : current.isError ? (
        <p className="text-sm text-error">Bookings could not be loaded.</p>
      ) : allTab.rows.length === 0 || previewEmpty ? (
        <div className="mt-4">
          <EmptyState
            title="No Confirmed Bookings"
            description="When a homeowner accepts your quote proposal or books a direct appointment, their booking will appear here."
            actionLabel="Browse Quote Requests"
            href="/pro/jobs"
          />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-[16px] border border-line/80 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-title">No bookings in this filter.</p>
          <p className="mt-1 text-xs text-muted">
            Try switching tabs or resetting your search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((row) => {
            const { raw, job } = row;
            const category = bookingCategoryName(raw);
            const status = bookingBadgeStatus(raw);
            const isCompleted = status === "completed";
            const detailHref = `/pro/bookings/${row.id}`;
            const homeowner = raw.homeowner;
            const homeownerId = homeowner?._id;
            const clientName = homeowner?.name?.trim() || job.homeownerName || "Client";
            const clientPhoto = mediaUrl(homeowner?.profileImage);
            const quote = typeof raw.quotation === "object" && raw.quotation ? raw.quotation : null;
            const agreedAmount = Number(raw.totalAmount || quote?.totalRate || 0);
            const place =
              [job.city, job.state, job.zip].filter(Boolean).join(", ") ||
              [homeowner?.city, homeowner?.state, homeowner?.zipCode].filter(Boolean).join(", ");
            const categoryLine = [category, place].filter(Boolean).join(" · ");

            return (
              <Card
                key={row.id}
                onClick={() => router.push(detailHref)}
                className="group overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                {/* Header: Client Info + Status Badge (matches homeowner pro visual) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line/80 bg-slate-100 shadow-2xs">
                      {clientPhoto ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={clientPhoto}
                          alt={clientName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-xs font-bold text-title/70">
                          {clientInitials(clientName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-title group-hover:text-primary transition-colors truncate">
                          {clientName}
                        </span>
                        <span className="text-[11px] font-medium text-muted">Client</span>
                      </div>
                      {categoryLine ? (
                        <p className="text-xs text-muted truncate">{categoryLine}</p>
                      ) : null}
                    </div>
                  </div>

                  <StatusBadge status={status} />
                </div>

                {/* Job Info + Meta + Operational Pro Actions */}
                <div className="mt-3.5 pt-3 border-t border-line/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-display text-sm sm:text-base font-semibold text-title group-hover:text-primary transition line-clamp-1">
                      {job.title}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted" />
                        {formatBookingDate(raw.appointmentDate, "Coordinated schedule")}
                        {raw.arrivalTimeWindow ? ` (${raw.arrivalTimeWindow})` : ""}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-title">
                        Agreed: ${agreedAmount}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-wrap items-center gap-2 shrink-0"
                  >
                    {homeownerId ? (
                      <Button
                        href={`/pro/messages?dm=${homeownerId}`}
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs font-semibold text-muted hover:text-title"
                      >
                        Message
                      </Button>
                    ) : null}

                    {isCompleted ? (
                      <Button
                        href={detailHref}
                        size="sm"
                        className="rounded-full text-xs font-semibold gap-1.5 shadow-xs"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        View Settlement ↗
                      </Button>
                    ) : (
                      <Button
                        href={detailHref}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        Details ↗
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
