"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Truck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCategory, getPro } from "@/Mockdata";
import {
  jobCardSummary,
  paymentMethodLabels,
  selectAllQuotes,
  selectHomeownerBookingsGrouped,
} from "@/lib/marketplace";
import { useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/cn";
import type { Job } from "@/types";

type BookingTab = "all" | "upcoming" | "inProgress" | "history";

export default function MyBookingsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const state = useAppSelector((state) => state);
  const grouped = useMemo(
    () => selectHomeownerBookingsGrouped(state, user?.name ?? "Homeowner"),
    [state, user?.name],
  );
  const quotes = useAppSelector(selectAllQuotes);
  const bookings = state.marketplace.bookings;
  const hiredByJob = state.marketplace.hiredByJob;
  const reviews = state.features.reviews;

  const [activeTab, setActiveTab] = useState<BookingTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabCounts = {
    all: grouped.all.length,
    upcoming: grouped.upcoming.length,
    inProgress: grouped.inProgress.length,
    history: grouped.history.length,
  };

  const filteredBookings = useMemo(() => {
    let list: Job[] = [];
    if (activeTab === "all") list = grouped.all;
    else if (activeTab === "upcoming") list = grouped.upcoming;
    else if (activeTab === "inProgress") list = grouped.inProgress;
    else if (activeTab === "history") list = grouped.history;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((job) => {
      const cat = getCategory(job.categorySlug)?.name.toLowerCase() ?? "";
      const booking = bookings[job.id];
      const hiredQuoteId = hiredByJob[job.id];
      const hiredQuote = quotes.find((quote) => quote.id === hiredQuoteId);
      const pro = hiredQuote ? getPro(hiredQuote.proId) : booking?.proId ? getPro(booking.proId) : null;
      const proName = pro?.name.toLowerCase() ?? "";
      const text = `${job.title} ${job.description} ${job.city} ${job.zip} ${cat} ${proName}`.toLowerCase();
      return text.includes(q);
    });
  }, [activeTab, grouped, searchQuery, bookings, hiredByJob, quotes]);

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* 1. Header */}
      <div className="border-b border-line/70 pb-4 pt-1">
        <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight flex items-center gap-2.5">
          <CalendarCheck className="h-6 w-6 text-primary" />
          My Bookings
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted">
          Confirmed appointments, scheduled arrivals, on-site repairs, and verified completion records.
        </p>
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
      {grouped.all.length > 0 && (
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
      {grouped.all.length === 0 ? (
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
          <p className="text-sm font-semibold text-title">No bookings in this category.</p>
          <p className="mt-1 text-xs text-muted">
            Try switching tabs or adjusting your search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((job) => {
            const booking = bookings[job.id];
            const hiredQuoteId = hiredByJob[job.id];
            const hiredQuote = quotes.find((quote) => quote.id === hiredQuoteId);
            const pro = hiredQuote
              ? getPro(hiredQuote.proId)
              : booking?.proId
              ? getPro(booking.proId)
              : null;
            const category = getCategory(job.categorySlug);
            const review = reviews.find((r) => r.jobId === job.id);
            const summary = jobCardSummary(job);

            const isUpcoming = ["hired", "scheduled"].includes(job.status);
            const isInProgress = ["en_route", "in_progress", "awaiting_confirm"].includes(job.status);
            const isCompleted = job.status === "completed";

            return (
              <Card
                key={job.id}
                onClick={() => router.push(`/account/bookings/${job.id}`)}
                className="group overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                {/* Header: Pro Info + Status Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {pro ? (
                      <Link
                        href={`/browse-pros/${pro.id}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`View ${pro.name}'s profile`}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-title text-sm font-semibold text-white transition hover:ring-2 hover:ring-primary/40 cursor-pointer"
                      >
                        {pro.name.charAt(0)}
                      </Link>
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-title text-sm font-semibold text-white">
                        P
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {pro ? (
                          <Link
                            href={`/browse-pros/${pro.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-display text-sm font-bold text-title group-hover:text-primary transition-colors hover:underline truncate"
                          >
                            {pro.name}
                          </Link>
                        ) : (
                          <h2 className="font-display text-sm font-bold text-title truncate">
                            Contractor Assigned
                          </h2>
                        )}
                        {pro?.clearance === "cleared" ? (
                          <span className="text-[11px] font-medium text-muted">Verified</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted truncate">
                        {pro?.trade ? `${pro.trade} · ` : ""}{job.city}, {job.state}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={job.status} />
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
                        {booking?.scheduledDate || hiredQuote?.proposedSchedule || "Date coordinated"}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-title">
                        ${booking?.agreedPrice || hiredQuote?.amount || 0}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 shrink-0"
                  >
                    {pro ? (
                      <Button
                        href={`/account/messages?dm=${pro.id}`}
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs font-semibold text-muted hover:text-title"
                      >
                        Message
                      </Button>
                    ) : null}
                    {job.status === "awaiting_confirm" ? (
                      <Button
                        href={`/account/bookings/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Inspect &amp; Settle ↗
                      </Button>
                    ) : isCompleted ? (
                      <Button
                        href={`/account/bookings/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold gap-1.5 shadow-xs"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Receipt &amp; Review ↗
                      </Button>
                    ) : (
                      <Button
                        href={`/account/bookings/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        Manage Booking ↗
                      </Button>
                    )}
                  </div>
                </div>

                {/* Review line if completed */}
                {isCompleted && review ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 pt-2.5 border-t border-line/40 text-xs flex items-center justify-between gap-2 text-muted"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-500">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-500" />
                        ))}
                      </div>
                      <span className="font-medium text-title">
                        {review.rating}.0 Verified Review submitted
                      </span>
                    </div>
                    <Link
                      href={`/account/bookings/${job.id}`}
                      className="text-primary font-medium hover:underline text-[11px]"
                    >
                      View on profile →
                    </Link>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
