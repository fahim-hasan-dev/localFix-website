"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Receipt,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { urgencyLabels } from "@/Mockdata";
import { jobCardSummary } from "@/lib/marketplace";
import { mapCategory } from "@/lib/api-mappers";
import { mapBooking, mapJobRequest, unwrapList, type ApiJobRequest } from "@/lib/marketplace-mappers";
import { useGetCategoriesQuery } from "@/services/client/catalog-api";
import { useDeleteJobRequestMutation, useGetMyJobRequestsQuery } from "@/services/client/jobs-api";
import { apiErrorMessage } from "@/services/client/form-data";
import { useAppDispatch } from "@/redux/hooks";
import { addNotification } from "@/redux/slices/featuresSlice";
import { cn } from "@/lib/cn";
import type { Booking, Job } from "@/types";

type JobRow = {
  job: Job;
  quotesCount: number;
  requestedProName?: string;
  booking?: Booking;
  hiredProName?: string;
};

function formatBudget(budget?: string) {
  if (!budget) return "";
  return /^\d+(\.\d+)?$/.test(budget) ? `$${budget}` : budget;
}

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, refetch } = useGetMyJobRequestsQuery(
    debouncedSearch ? { searchTerm: debouncedSearch } : undefined,
  );
  const { data: categoryResponse } = useGetCategoriesQuery();
  const [deleteJobRequest, { isLoading: isDeleting }] = useDeleteJobRequestMutation();

  const categoryNames = useMemo(() => {
    const map = new Map<string, string>();
    (categoryResponse?.data || []).map(mapCategory).forEach((item) => map.set(item.slug, item.name));
    return map;
  }, [categoryResponse]);

  function categoryLabel(slug: string) {
    return (
      categoryNames.get(slug) ||
      slug
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    );
  }

  async function confirmDeleteJob() {
    if (!jobToDelete) return;
    setDeleteError("");
    try {
      await deleteJobRequest(jobToDelete.id).unwrap();
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
    } catch (err) {
      setDeleteError(apiErrorMessage(err, "Could not delete this request."));
    }
  }

  const activeRequests = useMemo<JobRow[]>(() => {
    return unwrapList<ApiJobRequest>(data?.data)
      .map((raw) => {
        const job = mapJobRequest(raw);
        const requestedPro =
          raw.professional && typeof raw.professional === "object" ? raw.professional : null;
        return {
          job,
          quotesCount: raw.quotesCount ?? raw.quotations?.length ?? 0,
          requestedProName: requestedPro?.companyName || requestedPro?.name,
          booking: raw.booking ? mapBooking(raw.booking) : undefined,
          hiredProName: raw.booking?.professional?.companyName || raw.booking?.professional?.name,
        };
      })
      .filter(({ job }) => ["draft", "active", "getting_quotes", "quotes_in"].includes(job.status));
  }, [data]);

  const filteredJobs = activeRequests;

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* 1. Header with Title */}
      <div className="border-b border-line/70 pb-4 pt-1">
        <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight">
          Service Requests
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted">
          Track your repair requests. Click to view incoming quotes and hire a pro.
        </p>
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
      {isLoading ? (
        <Card className="rounded-[20px] border border-line/80 bg-white p-8 text-center">
          <p className="text-sm text-muted">Loading your requests…</p>
        </Card>
      ) : isError ? (
        <Card className="rounded-[20px] border border-line/80 bg-white p-8 text-center">
          <p className="font-display text-sm font-semibold text-title">
            We couldn&apos;t load your requests.
          </p>
          <p className="mt-1 text-xs text-muted">Please check your connection and try again.</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            className="mt-4 rounded-full border border-line text-xs font-semibold"
          >
            Try again
          </Button>
        </Card>
      ) : activeRequests.length === 0 ? (
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
        <div className="space-y-4">
          {filteredJobs.map(({ job, quotesCount, requestedProName, booking, hiredProName }) => {
            const isDirect = job.visibility === "direct" || Boolean(job.requestedProId);
            const isHired = job.status === "hired" || job.status === "scheduled" || Boolean(booking?.agreedPrice);
            const bookingHref = booking?.id ? `/account/bookings/${booking.id}` : "/account/bookings";
            const categoryName = categoryLabel(job.categorySlug);
            const displayTitle =
              categoryName && job.title.toLowerCase().startsWith(categoryName.toLowerCase())
                ? job.title.slice(categoryName.length).replace(/^[\s·•-]+/, "")
                : job.title;

            return (
              <Card
                key={job.id}
                onClick={() =>
                  router.push(
                    isHired && booking?.id ? `/account/bookings/${booking.id}` : `/account/jobs/${job.id}`,
                  )
                }
                className={cn(
                  "group relative rounded-[20px] border bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer",
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
                        {categoryName}
                      </span>

                      {isDirect && requestedProName && (
                        <span className="rounded-md bg-smoke px-2 py-0.5 text-[11px] font-medium text-title/80">
                          To: {requestedProName}
                        </span>
                      )}

                      {/* Status / Awaiting Quotes Badge (no duplicate quote count since the CTA button clearly displays it) */}
                      {!isHired ? (
                        quotesCount === 0 ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-muted">
                            Awaiting Quotes
                          </span>
                        ) : null
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
                      {displayTitle || job.title}
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
                            Budget: {formatBudget(job.budget)}
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

                      {isHired && hiredProName && booking ? (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-title">
                            Pro: {hiredProName}
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
                        href={bookingHref}
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-line text-xs font-semibold text-muted hover:text-title"
                      >
                        <Receipt className="h-3.5 w-3.5 mr-1" />
                        View in Bookings ↗
                      </Button>
                    ) : job.status === "in_progress" || job.status === "en_route" ? (
                      <Button
                        href={bookingHref}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        Track in Bookings ↗
                      </Button>
                    ) : isHired ? (
                      <Button
                        href={bookingHref}
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs font-semibold border-primary/40 text-primary hover:bg-primary/5"
                      >
                        View in Bookings ↗
                      </Button>
                    ) : quotesCount > 0 ? (
                      <Button
                        href={`/account/jobs/${job.id}`}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        View Quotes ({quotesCount}) ↗
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
            {deleteError ? (
              <p className="mt-2 text-xs font-medium text-error">{deleteError}</p>
            ) : null}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setJobToDelete(null);
                  setDeleteError("");
                }}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDeleteJob}
                disabled={isDeleting}
                className="rounded-xl text-xs font-semibold bg-error hover:bg-error/90 text-white shadow-xs"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
