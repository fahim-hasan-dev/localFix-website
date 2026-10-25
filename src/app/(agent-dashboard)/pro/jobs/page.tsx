"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Filter, Layers, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCard } from "@/components/shared/job-card";
import { categories, getCategory } from "@/Mockdata";
import { selectAllJobs } from "@/lib/marketplace";
import { useRoleAccess } from "@/hooks/use-role-access";
import { useAppSelector } from "@/redux/hooks";

type TabKey = "all" | "urgent" | "matches";
type SortKey = "newest" | "budget-high" | "urgent";

export default function ProJobsPage() {
  const { access } = useRoleAccess();
  const leadActions = useAppSelector((state) => state.features.leadActions);
  const invitedPros = useAppSelector((state) => state.features.invitedPros);
  const allJobsRaw = useAppSelector(selectAllJobs);
  const myProId = "pro-1";

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  const myTradeSlug = "plumbing";

  const openJobs = useMemo(
    () =>
      allJobsRaw.filter((job) => {
        const closed = [
          "completed",
          "cancelled",
          "hired",
          "scheduled",
          "in_progress",
          "awaiting_confirm",
          "disputed",
          "draft",
        ].includes(job.status);
        if (closed) return false;

        const invited = invitedPros[job.id] ?? [];
        if (job.requestedProId) {
          return job.requestedProId === myProId || invited.includes(myProId);
        }
        if (invited.length) return invited.includes(myProId);
        return true;
      }),
    [allJobsRaw, invitedPros, myProId],
  );

  const visibleJobs = useMemo(
    () => openJobs.filter((job) => leadActions[job.id] !== "declined"),
    [openJobs, leadActions],
  );

  const counts = useMemo(
    () => ({
      all: visibleJobs.length,
      urgent: visibleJobs.filter((job) => job.urgency === "asap").length,
      matches: visibleJobs.filter((job) => job.categorySlug === myTradeSlug).length,
    }),
    [visibleJobs, myTradeSlug],
  );

  const filteredJobs = useMemo(() => {
    return visibleJobs
      .filter((job) => {
        if (activeTab === "urgent" && job.urgency !== "asap") return false;
        if (activeTab === "matches" && job.categorySlug !== myTradeSlug) return false;
        if (selectedCategory !== "all" && job.categorySlug !== selectedCategory) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const categoryName = getCategory(job.categorySlug)?.name.toLowerCase() ?? "";
          const haystack = `${job.title} ${job.description} ${job.city} ${job.zip} ${categoryName}`.toLowerCase();
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
          const value = (budget?: string) => {
            if (!budget) return 0;
            if (budget.includes("5,000")) return 5000;
            if (budget.includes("1,000")) return 1000;
            if (budget.includes("500")) return 500;
            return 100;
          };
          return value(b.budget) - value(a.budget);
        }
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
  }, [visibleJobs, activeTab, selectedCategory, searchQuery, sortBy, myTradeSlug]);

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="border-b border-line/70 pb-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-title">
          Available jobs
        </h1>
        <p className="mt-1 text-sm text-muted">
          Open a request to review answers, then accept or pass.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "all", label: "All", count: counts.all, icon: Layers },
          { key: "matches", label: "Matches", count: counts.matches, icon: CheckCircle2 },
          { key: "urgent", label: "Urgent", count: counts.urgent, icon: Zap },
        ]}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search jobs"
            className="w-full rounded-xl border border-line/80 bg-white py-2 pl-9 pr-3 text-sm text-title outline-none focus:border-primary"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="rounded-xl border border-line/80 bg-white px-3 py-2 text-sm text-title outline-none"
        >
          <option value="all">All trades</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortKey)}
          className="rounded-xl border border-line/80 bg-white px-3 py-2 text-sm text-title outline-none"
        >
          <option value="newest">Newest</option>
          <option value="urgent">Urgent first</option>
          <option value="budget-high">Highest budget</option>
        </select>
      </div>

      {!access.canSeeJobBoard ? (
        <EmptyState
          title="Clearance required"
          description="Finish application review to see the job board."
          actionLabel="Open application"
          href="/pro/application"
        />
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-line/80 bg-white p-10 text-center">
          <Filter className="mx-auto mb-3 h-6 w-6 text-muted" />
          <p className="text-sm font-semibold text-title">No jobs match.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => {
              setActiveTab("all");
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            Reset
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              href={`/pro/jobs/${job.id}`}
              actionLabel={job.requestedProId === myProId ? "Review request" : "View details"}
              viewer="pro"
            />
          ))}
        </div>
      )}
    </div>
  );
}
