"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Star,
  Trash2,
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
  selectAllJobs,
  selectAllQuotes,
} from "@/lib/marketplace";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { deleteJob } from "@/redux/slices/marketplaceSlice";
import { addNotification, setJobStatus } from "@/redux/slices/featuresSlice";
import { cn } from "@/lib/cn";
import type { Job } from "@/types";

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const allJobs = useAppSelector(selectAllJobs);
  const quotes = useAppSelector(selectAllQuotes);
  const bookings = useAppSelector((state) => state.marketplace.bookings);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  function confirmDeleteJob() {
    if (!jobToDelete) return;
    dispatch(deleteJob(jobToDelete.id));
    dispatch(setJobStatus({ jobId: jobToDelete.id, status: "cancelled" }));
    dispatch(
      addNotification({
        title: "Request Deleted",
        body: `Your request "${jobToDelete.title}" has been deleted.`,
        href: "/account",
        createdAt: new Date().toISOString(),
        role: "homeowner",
      }),
    );
    setJobToDelete(null);
  }

  const activeRequests = useMemo(() => {
    const name = user?.name ?? "Homeowner";
    const mine =
      !name || name === "Homeowner" || name === "Maya Chen"
        ? allJobs.filter((j) => j.homeownerName === "Maya Chen" || j.homeownerName === "Homeowner")
        : allJobs.filter((j) => j.homeownerName === name || j.homeownerName === "Maya Chen");
    return mine.filter((j) =>
      ["draft", "active", "getting_quotes", "quotes_in"].includes(j.status),
    );
  }, [allJobs, user?.name]);

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return activeRequests;
    const q = searchQuery.toLowerCase().trim();
    return activeRequests.filter((job) => {
      const cat = getCategory(job.categorySlug)?.name.toLowerCase() ?? "";
      const text = `${job.title} ${job.description} ${job.city} ${job.zip} ${cat}`.toLowerCase();
      return text.includes(q);
    });
  }, [activeRequests, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header with Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight flex items-center gap-2.5">
            <ClipboardList className="h-6 w-6 text-primary" />
            Service Requests
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Track your repair requests. Click to view incoming quotes and hire a pro.
          </p>
        </div>

        <Button
          href="/account/post-job"
          size="sm"
          className="rounded-full gap-1.5 shadow-xs font-semibold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* 2. Search Filter */}
      {activeRequests.length > 0 && (
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

      {/* 3. Request List */}
      {activeRequests.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No open repair requests"
            description="Post a request to receive upfront quotes from verified local contractors in your area."
            actionLabel="Post a Request"
            href="/account/post-job"
          />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="rounded-[20px] border border-line/80 bg-white p-8 text-center">
          <p className="font-display text-sm font-semibold text-title">No matching requests found.</p>
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
                onClick={() => router.push(isHired ? `/account/bookings/${job.id}` : `/account/jobs/${job.id}`)}
                className={cn(
                  "group relative rounded-[18px] border bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer",
                  job.status === "awaiting_confirm"
                    ? "border-emerald-400 bg-emerald-50/[0.12]"
                    : job.status === "in_progress" || job.status === "en_route"
                    ? "border-amber-300 bg-amber-50/[0.08]"
                    : "border-line/80",
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Clean Header Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-semibold text-title/80">
                        {getCategory(job.categorySlug)?.name}
                      </span>

                      {isDirect && requestedPro && (
                        <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-medium text-title/80">
                          To: {requestedPro.name}
                        </span>
                      )}

                      {!isHired ? (
                        jobQuotes.length > 0 ? (
                          <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                            {jobQuotes.length} Quote{jobQuotes.length > 1 ? "s" : ""} Received
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-muted">
                            Awaiting Quotes
                          </span>
                        )
                      ) : (
                        <StatusBadge status={job.status} />
                      )}

                      {job.status === "awaiting_confirm" && (
                        <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 animate-pulse">
                          Action Required: Inspect &amp; Settle
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <span className="block mt-1.5 font-display text-base sm:text-lg font-bold text-title group-hover:text-primary transition-colors">
                      {job.title}
                    </span>

                    {/* Clean Meta Details */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted" />
                        {job.city}, {job.state} {job.zip}
                      </span>
                      <span>•</span>
                      <span>{urgencyLabels[job.urgency]}</span>

                      {!isHired && job.budget ? (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-title">
                            Budget: {job.budget}
                          </span>
                        </>
                      ) : null}

                      {!isHired && job.propertyType ? (
                        <>
                          <span>•</span>
                          <span className="capitalize text-copy">
                            {job.propertyType.replace("_", " ")}
                          </span>
                        </>
                      ) : null}

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
                      ) : null}

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

                    {jobCardSummary(job) && jobCardSummary(job) !== job.description ? (
                      <p className="mt-1.5 text-xs text-muted line-clamp-1">
                        {jobCardSummary(job)}
                      </p>
                    ) : null}
                  </div>

                  {/* Contextual Action Button */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/50"
                  >
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
                    ) : jobQuotes.length > 0 ? (
                      <Button
                        href={`/account/jobs/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        View Quotes ({jobQuotes.length}) ↗
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

                    {!isHired && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJobToDelete(job);
                        }}
                        title="Delete Request"
                        className="p-2 ml-1 text-muted/60 hover:text-error hover:bg-error/10 rounded-full transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Request Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error/10 text-error">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-title mt-3">
              Delete Request?
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed">
              Are you sure you want to delete this request? This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJobToDelete(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDeleteJob}
                className="rounded-xl text-xs font-semibold bg-error hover:bg-error/90 text-white shadow-xs"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
