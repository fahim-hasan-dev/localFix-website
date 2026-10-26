"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Layers,
  MapPin,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCategory, getPro, urgencyLabels } from "@/Mockdata";
import {
  jobCardSummary,
  selectAllQuotes,
  selectHomeownerJobsGrouped,
} from "@/lib/marketplace";
import { useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/cn";
import type { Job } from "@/types";

type HomeownerTab = "open" | "quotes" | "all" | "booked";

export default function AccountPage() {
  const user = useAppSelector((state) => state.auth.user);
  const state = useAppSelector((state) => state);
  const grouped = useMemo(
    () => selectHomeownerJobsGrouped(state, user?.name ?? "Homeowner"),
    [state, user?.name],
  );
  const quotes = useAppSelector(selectAllQuotes);
  const bookings = state.marketplace.bookings;
  const completions = state.marketplace.completions;

  const [activeTab, setActiveTab] = useState<HomeownerTab>("open");
  const [searchQuery, setSearchQuery] = useState("");

  const openRequests = grouped.awaitingQuotes;
  const quotesReadyRequests = useMemo(
    () => grouped.awaitingQuotes.filter((j) => quotes.some((q) => q.jobId === j.id)),
    [grouped.awaitingQuotes, quotes],
  );
  const bookedJobs = useMemo(
    () => [...grouped.active, ...grouped.completed],
    [grouped.active, grouped.completed],
  );

  const tabCounts = {
    open: openRequests.length,
    quotes: quotesReadyRequests.length,
    all: grouped.all.length,
    booked: bookedJobs.length,
  };

  const filteredJobs = useMemo(() => {
    let list: Job[] = [];
    if (activeTab === "open") list = openRequests;
    else if (activeTab === "quotes") list = quotesReadyRequests;
    else if (activeTab === "booked") list = bookedJobs;
    else list = grouped.all;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((job) => {
      const cat = getCategory(job.categorySlug)?.name.toLowerCase() ?? "";
      const text = `${job.title} ${job.description} ${job.city} ${job.zip} ${cat}`.toLowerCase();
      return text.includes(q);
    });
  }, [activeTab, openRequests, quotesReadyRequests, bookedJobs, grouped.all, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header with Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight flex items-center gap-2.5">
            <ClipboardList className="h-6 w-6 text-primary" />
            Service Requests &amp; Quotes
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Track incoming proposals from verified local contractors, compare itemized pricing, and confirm bookings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            href="/account/bookings"
            variant="ghost"
            size="sm"
            className="rounded-full text-xs font-semibold border border-line hover:border-primary/40 hover:text-primary"
          >
            My Bookings ↗
          </Button>
          <Button
            href="/account/post-job"
            size="sm"
            className="rounded-full gap-1.5 shadow-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* 2. Top Alert Banner for Active Bookings */}
      {bookedJobs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-title">
                You have {bookedJobs.length} confirmed booking{bookedJobs.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted">
                Track arrival schedules, on-site repairs, and direct settlement receipts in My Bookings.
              </p>
            </div>
          </div>
          <Button
            href="/account/bookings"
            size="sm"
            className="rounded-full text-xs font-semibold shadow-xs"
          >
            Go to My Bookings →
          </Button>
        </div>
      )}

      {/* 3. Lifecycle Tab Bar */}
      <div className="border-b border-line/70">
        <nav className="flex space-x-1 sm:space-x-3" aria-label="Requests lifecycle">
          {(
            [
              { id: "open", label: "Open Requests", count: tabCounts.open },
              { id: "quotes", label: "Quotes Ready", count: tabCounts.quotes },
              { id: "all", label: "All Requests", count: tabCounts.all },
              { id: "booked", label: "Booked Pros", count: tabCounts.booked },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-title",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.2 text-[11px] font-bold",
                  activeTab === tab.id ? "bg-primary text-white" : "bg-smoke text-muted",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* 3. Search Filter */}
      {grouped.all.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your requests by title, problem, city…"
            className="w-full rounded-xl border border-line/80 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-title outline-none focus:border-primary shadow-2xs"
          />
        </div>
      )}

      {/* 4. Request List */}
      {grouped.all.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No repair requests yet"
            description="Post a project request to start receiving itemized quotes from verified local contractors with zero middleman markup."
            actionLabel="Post a Request"
            href="/account/post-job"
          />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="rounded-[20px] border border-line/80 bg-white p-8 text-center">
          <p className="font-display text-sm font-semibold text-title">No requests in this tab.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 rounded-full border border-line"
            onClick={() => {
              setActiveTab("all");
              setSearchQuery("");
            }}
          >
            Show All Requests
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const jobQuotes = quotes.filter((q) => q.jobId === job.id);
            const booking = bookings[job.id];
            const hiredPro = booking?.proId ? getPro(booking.proId) : null;
            const isDirect = job.visibility === "direct" || Boolean(job.requestedProId);
            const requestedPro = job.requestedProId ? getPro(job.requestedProId) : null;
            const isHired = job.status === "hired" || job.status === "scheduled" || Boolean(booking?.agreedPrice);

            return (
              <Card
                key={job.id}
                className={cn(
                  "group relative rounded-[18px] border bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-sm",
                  job.status === "awaiting_confirm"
                    ? "border-emerald-400 bg-emerald-50/[0.12]"
                    : job.status === "in_progress" || job.status === "en_route"
                    ? "border-amber-300 bg-amber-50/[0.08]"
                    : "border-line/80",
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Header Badges: Only Category, Status, and Direct if applicable */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-semibold text-title/80">
                        {getCategory(job.categorySlug)?.name}
                      </span>

                      {isDirect && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          <Sparkles className="h-3 w-3" />
                          Direct {requestedPro ? `to ${requestedPro.name}` : "Request"}
                        </span>
                      )}

                      <StatusBadge status={job.status} />

                      {job.status === "awaiting_confirm" && (
                        <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 animate-pulse">
                          Action Required: Inspect &amp; Settle
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <Link
                      href={`/account/jobs/${job.id}`}
                      className="block mt-1.5 font-display text-base sm:text-lg font-bold text-title hover:text-primary transition-colors"
                    >
                      {job.title}
                    </Link>

                    {/* Clean Meta Details */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted" />
                        {job.city}, {job.state} {job.zip}
                      </span>
                      <span>•</span>
                      <span>{urgencyLabels[job.urgency]}</span>

                      {isHired && hiredPro && booking ? (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-title">
                            Pro: {hiredPro.name}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-emerald-700">
                            ${booking.agreedPrice} agreed
                          </span>
                        </>
                      ) : jobQuotes.length > 0 ? (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-primary">
                            {jobQuotes.length} quote{jobQuotes.length === 1 ? "" : "s"} received
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-muted">Awaiting quotes</span>
                        </>
                      )}

                      {booking?.scheduledDate ? (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-title font-medium">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {booking.scheduledDate} ({booking.arrivalWindow || booking.scheduledTime})
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Contextual Action Button */}
                  <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/50">
                    {job.status === "awaiting_confirm" ? (
                      <Button
                        href={`/account/jobs/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        Inspect &amp; Settle ↗
                      </Button>
                    ) : job.status === "completed" ? (
                      <Button
                        href="/account/bookings"
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-line text-xs font-semibold text-muted hover:text-title"
                      >
                        <Receipt className="h-3.5 w-3.5 mr-1" />
                        View in Bookings ↗
                      </Button>
                    ) : job.status === "in_progress" || job.status === "en_route" ? (
                      <Button
                        href="/account/bookings"
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        Track in Bookings ↗
                      </Button>
                    ) : isHired ? (
                      <Button
                        href="/account/bookings"
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs font-semibold border-primary/40 text-primary hover:bg-primary/5"
                      >
                        View in Bookings ↗
                      </Button>
                    ) : jobQuotes.length >= 2 ? (
                      <Button
                        href={`/account/jobs/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        Compare Quotes ({jobQuotes.length}) ↗
                      </Button>
                    ) : jobQuotes.length === 1 ? (
                      <Button
                        href={`/account/jobs/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        Review Quote ↗
                      </Button>
                    ) : (
                      <Button
                        href={`/account/jobs/${job.id}`}
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-line text-xs font-medium text-muted hover:text-title hover:border-line/90"
                      >
                        View Request ↗
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
