"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Filter,
  Layers,
  MapPin,
  MessageCircle,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { categories, getCategory, getPro, urgencyLabels } from "@/Mockdata";
import {
  jobCardSummary,
  selectProBookingsGrouped,
  selectProJobsGrouped,
} from "@/lib/marketplace";
import { useRoleAccess } from "@/hooks/use-role-access";
import { setLeadAction } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/cn";
import type { Job } from "@/types";

type MainTab = "direct" | "leads" | "quoted";
type SortKey = "newest" | "budget-high" | "urgent";

export default function ProJobsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { access } = useRoleAccess();
  const myProId = "pro-1";

  const [activeTab, setActiveTab] = useState<MainTab>("direct");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  const state = useAppSelector((state) => state);
  const grouped = useMemo(() => selectProJobsGrouped(state, myProId), [state, myProId]);
  const bookingsGrouped = useMemo(() => selectProBookingsGrouped(state, myProId), [state, myProId]);

  const tabCounts = {
    direct: grouped.totalDirect,
    leads: grouped.totalLeads,
    quoted: grouped.quotedJobs.length,
  };

  const currentList = useMemo(() => {
    let list: Job[] = [];
    if (activeTab === "direct") list = grouped.directInquiries;
    else if (activeTab === "leads") list = grouped.marketplaceLeads;
    else if (activeTab === "quoted") list = grouped.quotedJobs;

    return list
      .filter((job) => {
        if (selectedCategory !== "all" && job.categorySlug !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const categoryName = getCategory(job.categorySlug)?.name.toLowerCase() ?? "";
          const haystack = `${job.title} ${job.description} ${job.city} ${job.zip} ${job.homeownerName} ${categoryName}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "urgent") {
          const order = { asap: 1, this_week: 2, two_weeks: 3, flexible: 4 };
          return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
        }
        if (sortBy === "budget-high") {
          const val = (budget?: string) => {
            if (!budget) return 0;
            if (budget.includes("3,000")) return 3000;
            if (budget.includes("1,000")) return 1000;
            if (budget.includes("500")) return 500;
            return 100;
          };
          return val(b.budget) - val(a.budget);
        }
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
  }, [activeTab, grouped, selectedCategory, searchQuery, sortBy]);

  function handlePass(jobId: string) {
    dispatch(setLeadAction({ jobId, action: "declined" }));
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* 1. Page Header with Title & Bookings Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight flex items-center gap-2.5">
            <ClipboardList className="h-6 w-6 text-primary" />
            Quote Requests &amp; Leads
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
            My Bookings ({bookingsGrouped.upcoming.length + bookingsGrouped.inProgress.length})
          </Button>
        </div>
      </div>

      {/* 2. Primary Segmented Pill Tab Switcher */}
      <div className="flex items-center overflow-x-auto no-scrollbar py-1">
        <div className="inline-flex items-center gap-1 rounded-2xl bg-stone-100/90 p-1 border border-line/60">
          {(
            [
              { id: "direct", label: "Direct Requests", count: tabCounts.direct, icon: Sparkles },
              { id: "leads", label: "Marketplace Leads", count: tabCounts.leads, icon: Layers },
              { id: "quoted", label: "My Proposals", count: tabCounts.quoted, icon: MessageSquare },
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
          className="rounded-xl border border-line/80 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-title outline-none focus:border-primary shadow-2xs"
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
          className="rounded-xl border border-line/80 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-title outline-none focus:border-primary shadow-2xs"
        >
          <option value="newest">Newest First</option>
          <option value="urgent">Most Urgent</option>
          <option value="budget-high">Highest Budget</option>
        </select>
      </div>

      {/* 4. Main List Rendering */}
      {!access.canSeeJobBoard ? (
        <EmptyState
          title="Clearance required"
          description="Finish application review to see the job board."
          actionLabel="Open application"
          href="/pro/application"
        />
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
              : "Try adjusting your trade category or search query to find more leads in Austin."}
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
            const isDirect = job.requestedProId === myProId || job.visibility === "direct";
            const category = getCategory(job.categorySlug);

            return (
              <Card
                key={job.id}
                onClick={() => router.push(`/pro/jobs/${job.id}`)}
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-white p-4 sm:p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer",
                  isDirect && activeTab === "direct"
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-line/80",
                )}
              >
                {/* Header: Client Info + Badges (matches homeowner card visual) */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-title text-sm font-semibold text-white">
                      {job.homeownerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-title group-hover:text-primary transition-colors truncate">
                          {job.homeownerName}
                        </span>
                        <span className="text-[11px] font-medium text-muted">Client</span>
                      </div>
                      <p className="text-xs text-muted truncate">
                        {category ? `${category.name} · ` : ""}{job.city}, {job.state} {job.zip}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDirect && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        <Sparkles className="h-3 w-3" /> Direct
                      </span>
                    )}
                    {job.urgency === "asap" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <Zap className="h-2.5 w-2.5 fill-red-500" /> Urgent
                      </span>
                    ) : null}
                    <StatusBadge status={job.status} />
                  </div>
                </div>

                {/* Body: Title, Urgency, Budget + Pro Action Buttons */}
                <div className="mt-3.5 pt-3 border-t border-line/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-display text-sm sm:text-base font-semibold text-title group-hover:text-primary transition line-clamp-1">
                      {job.title}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        {urgencyLabels[job.urgency] || job.urgency}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-title">
                        Budget: {job.budget || "Open estimate"}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <Button
                      href={`/pro/messages?dm=${job.homeownerName}`}
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-xs font-semibold text-muted hover:text-title"
                    >
                      Message
                    </Button>

                    {activeTab === "quoted" ? (
                      <Button
                        href={`/pro/jobs/${job.id}`}
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
                          {isDirect ? "Send Proposal ↗" : "Send Quote ↗"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePass(job.id)}
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
