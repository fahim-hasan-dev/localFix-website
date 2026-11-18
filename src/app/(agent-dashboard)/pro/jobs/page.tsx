"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUrlTab } from "@/hooks/use-url-tab";
import {
  CalendarCheck,
  Clock,
  FileText,
  Filter,
  Globe,
  Inbox,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { mapCategory } from "@/lib/api-mappers";
import { jobCardSummary } from "@/lib/marketplace";
import {
  mapProposalItem,
  unwrapJobRecord,
  mapJobRequest,
  unwrapList,
} from "@/lib/marketplace-mappers";
import { useRoleAccess } from "@/hooks/use-role-access";
import { useGetMyBookingsQuery } from "@/services/client/marketplace-api";
import { useGetCategoriesQuery } from "@/services/client/catalog-api";
import {
  useGetDirectRequestsQuery,
  useGetJobTabsCountQuery,
  useGetMarketplaceLeadsQuery,
  useGetMyProposalsQuery,
  useRejectDirectRequestMutation,
  useRejectMarketplaceLeadMutation,
} from "@/services/client/jobs-api";
import { cn } from "@/lib/cn";
import type { Job, Quote } from "@/types";

type SortKey = "newest" | "budget-high" | "urgent";

const URGENCY_LABELS: Record<Job["urgency"], string> = {
  asap: "Urgent",
  this_week: "This week",
  two_weeks: "Within 2 weeks",
  flexible: "Flexible",
};

function clientInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProJobsPage() {
  const router = useRouter();
  const { access } = useRoleAccess();
  const [activeTab, setActiveTab] = useUrlTab(
    ["direct", "leads", "quoted"] as const,
    "direct",
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  const upcomingBookingsQuery = useGetMyBookingsQuery({ tab: "upcoming" });
  const activeBookingsQuery = useGetMyBookingsQuery({ tab: "active_on_site" });
  const activeBookingsCount =
    unwrapList<unknown>(upcomingBookingsQuery.data?.data).length +
    unwrapList<unknown>(activeBookingsQuery.data?.data).length;

  // Live categories for filter chips
  const { data: categoryResponse } = useGetCategoriesQuery();
  const categories = useMemo(
    () => (categoryResponse?.data || []).map(mapCategory),
    [categoryResponse],
  );
  const categoryBySlug = useMemo(
    () => new Map(categories.map((cat) => [cat.slug, cat])),
    [categories],
  );

  // Debounce search so the leads endpoint isn't hit on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const listParams = useMemo(
    () => ({
      searchTerm: debouncedSearch || undefined,
      category: selectedCategory !== "all" ? categoryBySlug.get(selectedCategory)?.id : undefined,
      sort:
        sortBy === "newest"
          ? "-createdAt"
          : sortBy === "budget-high"
            ? "-estimatedBudget"
            : sortBy === "urgent"
              ? "urgent"
              : undefined,
    }),
    [debouncedSearch, selectedCategory, sortBy, categoryBySlug],
  );

  const directQuery = useGetDirectRequestsQuery(listParams);
  const leadsQuery = useGetMarketplaceLeadsQuery(listParams);
  const proposalsQuery = useGetMyProposalsQuery(listParams);
  const tabsCountQuery = useGetJobTabsCountQuery();
  const [rejectDirectRequest] = useRejectDirectRequestMutation();
  const [rejectMarketplaceLead] = useRejectMarketplaceLeadMutation();

  const directJobs = useMemo(
    () =>
      unwrapList<unknown>(directQuery.data?.data).flatMap((item) => {
        const raw = unwrapJobRecord(item);
        return raw ? [mapJobRequest(raw)] : [];
      }),
    [directQuery.data],
  );
  const leadJobs = useMemo(
    () =>
      unwrapList<unknown>(leadsQuery.data?.data).flatMap((item) => {
        const raw = unwrapJobRecord(item);
        return raw ? [mapJobRequest(raw)] : [];
      }),
    [leadsQuery.data],
  );
  const proposals = useMemo(() => {
    const items = unwrapList<unknown>(proposalsQuery.data?.data).flatMap((item) => {
      const mapped = mapProposalItem(item);
      return mapped ? [mapped] : [];
    });
    const quoteByJob = new Map<string, Quote>();
    for (const { quotes } of items) {
      for (const quote of quotes) if (!quoteByJob.has(quote.jobId)) quoteByJob.set(quote.jobId, quote);
    }
    return { jobs: items.map((entry) => entry.job), quoteByJob };
  }, [proposalsQuery.data]);

  const quotedJobIds = proposals.quoteByJob;
  const openDirectJobs = useMemo(
    () => directJobs.filter((job) => !quotedJobIds.has(job.id)),
    [directJobs, quotedJobIds],
  );
  const openLeadJobs = useMemo(
    () => leadJobs.filter((job) => !quotedJobIds.has(job.id)),
    [leadJobs, quotedJobIds],
  );

  const counts = (tabsCountQuery.data?.data ?? {}) as {
    directRequests?: number;
    marketplaceLeads?: number;
    myProposals?: number;
  };
  const tabCounts = {
    direct: Math.max(0, (counts.directRequests ?? directJobs.length) - (directJobs.length - openDirectJobs.length)),
    leads: Math.max(0, (counts.marketplaceLeads ?? leadJobs.length) - (leadJobs.length - openLeadJobs.length)),
    quoted: counts.myProposals ?? proposals.jobs.length,
  };

  const activeQuery =
    activeTab === "direct" ? directQuery : activeTab === "leads" ? leadsQuery : proposalsQuery;
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const currentList = useMemo(() => {
    if (activeTab === "direct") return openDirectJobs;
    if (activeTab === "leads") return openLeadJobs;
    return proposals.jobs;
  }, [activeTab, openDirectJobs, openLeadJobs, proposals.jobs]);

  async function handlePass(jobId: string) {
    try {
      if (activeTab === "direct") await rejectDirectRequest(jobId).unwrap();
      else await rejectMarketplaceLead(jobId).unwrap();
      toast.success("Request passed");
    } catch {
      toast.error("Could not pass on this request. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* 1. Page Header with Title & Bookings Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight">
            Quote Requests
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Exclusive client requests from your storefront, local marketplace leads, and submitted quotations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            href="/pro/bookings"
            variant="ghost"
            size="sm"
            className="rounded-full border border-line text-xs font-semibold gap-1.5"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-primary" />
            My Bookings ({activeBookingsCount})
          </Button>
        </div>
      </div>

      {/* 2. Primary Segmented Pill Tab Switcher */}
      <div className="flex items-center overflow-x-auto no-scrollbar py-1 px-0.5">
        <div className="inline-flex items-center gap-1 rounded-2xl bg-stone-100/90 p-1 border border-line/60">
          {(
            [
              { id: "direct", label: "Direct Requests", count: tabCounts.direct, icon: Inbox },
              { id: "leads", label: "Marketplace Leads", count: tabCounts.leads, icon: Globe },
              { id: "quoted", label: "My Proposals", count: tabCounts.quoted, icon: FileText },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
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
                <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted")} />
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

      {/* 3. Search and Sort Filter Bar */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by title, neighborhood, client name…"
            className="w-full rounded-xl border border-line/80 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-title outline-none focus:border-primary shadow-2xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-line/80 bg-white py-2.5 pl-3.5 pr-10 text-xs sm:text-sm font-medium text-title outline-none focus:border-primary shadow-2xs cursor-pointer"
        >
          <option value="all">All Trade Categories</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-xl border border-line/80 bg-white py-2.5 pl-3.5 pr-10 text-xs sm:text-sm font-medium text-title outline-none focus:border-primary shadow-2xs cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="urgent">Most Urgent</option>
          <option value="budget-high">Highest Budget</option>
        </select>
      </div>

      {/* Banner when screening is pending to submit quotes, but browsing leads is always open */}
      {!access.canSubmitQuote && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/80 p-3.5 sm:p-4 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Clearance in review:</strong> You can browse all {tabCounts.leads} marketplace leads below. Background check clearance is required before submitting quotations to homeowners.
            </span>
          </div>
          <Button
            href="/pro/application"
            size="sm"
            className="rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shrink-0"
          >
            Complete Screening ↗
          </Button>
        </div>
      )}

      {/* 4. Main List Rendering */}
      {isLoading ? (
        <Card className="rounded-[22px] border border-line/80 bg-white p-10 text-center">
          <p className="text-sm text-muted">Loading requests…</p>
        </Card>
      ) : isError ? (
        <Card className="rounded-[22px] border border-line/80 bg-white p-10 text-center">
          <p className="font-display text-base font-bold text-title">
            We couldn&apos;t load your requests
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 rounded-full border border-line"
            onClick={() => activeQuery.refetch()}
          >
            Try again
          </Button>
        </Card>
      ) : currentList.length === 0 ? (
        <Card className="rounded-[22px] border border-line/80 bg-white p-10 text-center">
          <Filter className="mx-auto mb-3 h-8 w-8 text-muted/60" />
          <p className="font-display text-base font-bold text-title">
            {activeTab === "direct"
              ? "No direct requests waiting right now"
              : activeTab === "quoted"
              ? "No submitted proposals yet"
              : "No matching marketplace leads"}
          </p>
          <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
            {activeTab === "direct"
              ? "When homeowners view your business storefront and click 'Request Quote', their direct requests appear here with zero competition."
              : activeTab === "quoted"
              ? "When you submit quotes to leads, you can track proposal statuses here."
              : "Try adjusting your trade category or search query to find more leads in your area."}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 rounded-full border border-line"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentList.map((job) => {
            const isDirect = activeTab === "direct" || job.visibility === "direct";
            const myQuote = proposals.quoteByJob.get(job.id);
            const hasQuoted = Boolean(myQuote) || activeTab === "quoted";
            const category = categoryBySlug.get(job.categorySlug);

            const locationLine = [job.city, job.state, job.zip].filter(Boolean).join(", ");
            const categoryLine = [category?.name, locationLine].filter(Boolean).join(" · ");
            const timeframeDisplay = job.timeframeLabel || URGENCY_LABELS[job.urgency] || "";
            const propertyDisplay = job.propertyTypeLabel || job.propertyType?.replace(/_/g, " ") || "";
            const budgetDisplay = job.budget
              ? Number.isNaN(Number(job.budget))
                ? job.budget
                : `$${job.budget}`
              : "";
            const summary = jobCardSummary(job);
            const messageHref = job.homeownerId
              ? `/pro/messages?dm=${job.homeownerId}`
              : `/pro/messages?dm=${encodeURIComponent(job.homeownerName)}`;

            const accepted = Boolean(
              myQuote?.status === "accepted" ||
                ["hired", "scheduled", "en_route", "in_progress", "awaiting_confirm", "completed", "cancelled", "disputed"].includes(job.status),
            );
            const proposalHref = accepted
              ? `/pro/jobs/${job.id}`
              : `/pro/jobs/${job.id}/proposal${myQuote ? `?quoteId=${myQuote.id}` : ""}`;

            return (
              <Card
                key={job.id}
                onClick={() =>
                  router.push(hasQuoted ? proposalHref : `/pro/jobs/${job.id}`)
                }
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-white p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer",
                  isDirect && activeTab === "direct"
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-line/80",
                )}
              >
                {/* Header: Client Info + Badges */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line/80 bg-slate-100 shadow-2xs">
                      {job.homeownerAvatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={job.homeownerAvatar}
                          alt={job.homeownerName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-xs font-bold text-title/70">
                          {clientInitials(job.homeownerName) || "C"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-title group-hover:text-primary transition-colors truncate">
                          {job.homeownerName}
                        </span>
                        <span className="text-[11px] font-medium text-muted">Client</span>
                      </div>
                      {categoryLine ? (
                        <p className="text-xs text-muted truncate">{categoryLine}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasQuoted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
                        ✓ Quoted{myQuote ? ` ($${myQuote.amount})` : ""}
                      </span>
                    ) : null}
                    {job.urgency === "asap" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <Zap className="h-2.5 w-2.5 fill-red-500" /> Urgent
                      </span>
                    ) : null}
                    <StatusBadge status={job.status} />
                  </div>
                </div>

                {/* Body: Title, meta + actions */}
                <div className="mt-3.5 pt-3 border-t border-line/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-display text-sm sm:text-base font-semibold text-title group-hover:text-primary transition line-clamp-1">
                      {job.title}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                      {timeframeDisplay ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted" />
                          {timeframeDisplay}
                        </span>
                      ) : null}
                      {budgetDisplay ? (
                        <>
                          {timeframeDisplay ? <span>·</span> : null}
                          <span className="font-semibold text-title">Budget: {budgetDisplay}</span>
                        </>
                      ) : null}
                      {propertyDisplay ? (
                        <>
                          {timeframeDisplay || budgetDisplay ? <span>·</span> : null}
                          <span className="text-copy font-medium">{propertyDisplay}</span>
                        </>
                      ) : null}
                    </div>
                    {summary && summary !== job.description ? (
                      <p className="mt-1 text-xs text-muted line-clamp-1">{summary}</p>
                    ) : null}
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-wrap items-center gap-2 shrink-0"
                  >
                    <Button
                      href={messageHref}
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-xs font-semibold text-muted hover:text-title"
                    >
                      Message
                    </Button>

                    {hasQuoted ? (
                      <Button
                        href={proposalHref}
                        size="sm"
                        className="rounded-full text-xs font-semibold shadow-xs"
                      >
                        View Proposal ↗
                      </Button>
                    ) : (
                      <>
                        <Button
                          href={`/pro/jobs/${job.id}`}
                          size="sm"
                          className="rounded-full text-xs font-semibold shadow-xs"
                        >
                          Send Quote ↗
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handlePass(job.id)}
                          className="rounded-full text-xs text-muted hover:text-red-600"
                        >
                          Pass
                        </Button>
                      </>
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
