"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  MapPin,
  MessageCircle,
  Receipt,
  Search,
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
  selectAllQuotes,
  selectProBookingsGrouped,
} from "@/lib/marketplace";
import { addNotification, setJobStatus } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/cn";
import type { Job } from "@/types";

type BookingTab = "all" | "upcoming" | "inProgress" | "history";

export default function ProBookingsPage() {
  const dispatch = useAppDispatch();
  const myProId = "pro-1";
  const state = useAppSelector((state) => state);
  const grouped = useMemo(
    () => selectProBookingsGrouped(state, myProId),
    [state, myProId],
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
      const text = `${job.title} ${job.description} ${job.city} ${job.zip} ${job.homeownerName} ${cat}`.toLowerCase();
      return text.includes(q);
    });
  }, [activeTab, grouped, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header */}
      <div className="border-b border-line/70 pb-4 pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="h-6 w-6 text-primary" />
            My Bookings
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Confirmed client contracts, scheduled arrival windows, on-site execution, and completion receipts.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary shadow-2xs self-start sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>Austin Metro Operational Area</span>
        </div>
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
            placeholder="Search bookings by client name, job title, neighborhood…"
            className="w-full rounded-xl border border-line/80 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-title outline-none focus:border-primary shadow-2xs"
          />
        </div>
      )}

      {/* 4. Bookings List */}
      {grouped.all.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No Confirmed Bookings"
            description="When a homeowner accepts your quote proposal or books a direct appointment, their booking will appear here."
            actionLabel="Browse Quote Requests & Leads"
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
          {filteredBookings.map((job) => {
            const booking = bookings[job.id];
            const hiredQuoteId = hiredByJob[job.id];
            const hiredQuote = quotes.find((quote) => quote.id === hiredQuoteId);
            const review = reviews.find((r) => r.jobId === job.id);
            const category = getCategory(job.categorySlug);

            const isUpcoming = ["hired", "scheduled"].includes(job.status);
            const isInProgress = ["en_route", "in_progress", "awaiting_confirm"].includes(job.status);
            const isCompleted = job.status === "completed";

            return (
              <Card
                key={job.id}
                className="overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs hover:border-line hover:shadow-sm transition-all duration-200"
              >
                {/* Header: Client Info + Status Badge (matches homeowner pro visual) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-title text-sm font-semibold text-white">
                      {job.homeownerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-title truncate">
                          {job.homeownerName}
                        </span>
                        <span className="text-[11px] font-medium text-muted">Client</span>
                      </div>
                      <p className="text-xs text-muted truncate">
                        {category ? `${category.name} · ` : ""}{job.city}, {job.state} {job.zip}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={job.status} />
                </div>

                {/* Job Info + Meta + Operational Pro Actions */}
                <div className="mt-3.5 pt-3 border-t border-line/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/pro/jobs/${job.id}`}
                      className="font-display text-sm sm:text-base font-semibold text-title hover:text-primary transition line-clamp-1"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted" />
                        {booking?.scheduledDate || hiredQuote?.proposedSchedule || "Coordinated schedule"}
                        {booking?.arrivalWindow ? ` (${booking.arrivalWindow})` : ""}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-title">
                        Agreed: ${booking?.agreedPrice || hiredQuote?.amount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      href={`/pro/messages?dm=${job.homeownerName}`}
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-xs font-semibold text-muted hover:text-title"
                    >
                      Message
                    </Button>

                    {/* Operational Dispatch Actions */}
                    {job.status === "scheduled" || job.status === "hired" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          dispatch(setJobStatus({ jobId: job.id, status: "en_route" }));
                          dispatch(
                            addNotification({
                              title: "Contractor en route",
                              body: `You marked en route for "${job.title}". Homeowner notified.`,
                              href: `/pro/jobs/${job.id}`,
                              createdAt: "Just now",
                              role: "pro",
                            }),
                          );
                        }}
                        className="rounded-full gap-1.5 text-xs font-semibold shadow-xs"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        Depart (En Route)
                      </Button>
                    ) : job.status === "en_route" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          dispatch(setJobStatus({ jobId: job.id, status: "in_progress" }));
                          dispatch(
                            addNotification({
                              title: "Work started on-site",
                              body: `You began work on "${job.title}". Homeowner notified.`,
                              href: `/pro/jobs/${job.id}`,
                              createdAt: "Just now",
                              role: "pro",
                            }),
                          );
                        }}
                        className="rounded-full gap-1.5 text-xs font-semibold shadow-xs bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        Start Work (On-Site)
                      </Button>
                    ) : job.status === "in_progress" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          dispatch(setJobStatus({ jobId: job.id, status: "awaiting_confirm" }));
                          dispatch(
                            addNotification({
                              title: "Work completed, awaiting settlement",
                              body: `Job "${job.title}" marked complete. Client prompted to release payment.`,
                              href: `/pro/jobs/${job.id}`,
                              createdAt: "Just now",
                              role: "pro",
                            }),
                          );
                        }}
                        className="rounded-full gap-1.5 text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete &amp; Settle
                      </Button>
                    ) : job.status === "awaiting_confirm" ? (
                      <Button
                        href={`/pro/jobs/${job.id}`}
                        size="sm"
                        variant="ghost"
                        className="rounded-full border border-emerald-300 text-xs font-semibold text-emerald-700"
                      >
                        Awaiting Confirmation ↗
                      </Button>
                    ) : isCompleted ? (
                      <Button
                        href={`/pro/jobs/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold gap-1.5 shadow-xs"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        View Settlement ↗
                      </Button>
                    ) : (
                      <Button
                        href={`/pro/jobs/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        Manage Booking ↗
                      </Button>
                    )}
                  </div>
                </div>

                {/* Review feedback line if completed */}
                {isCompleted && review ? (
                  <div className="mt-3 pt-2.5 border-t border-line/40 text-xs flex items-center justify-between gap-2 text-muted">
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-500">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-500" />
                        ))}
                      </div>
                      <span className="font-medium text-title">
                        {review.rating}.0 Client Review received: &ldquo;{review.body}&rdquo;
                      </span>
                    </div>
                    <Link
                      href={`/pro/reviews`}
                      className="text-primary font-medium hover:underline text-[11px]"
                    >
                      View in Reviews →
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
