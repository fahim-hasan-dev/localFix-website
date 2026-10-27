"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

export type YearlyMetrics = {
  totalRevenue: number;
  completedJobs: number;
  totalClients: number;
  repeatClients: number;
  avgTicket: number;
  growthRate: string;
  monthly: Array<{
    month: string;
    income: number;
    clients: number;
    jobs: number;
  }>;
};

export const yearlyData: Record<number, YearlyMetrics> = {
  2026: {
    totalRevenue: 38450,
    completedJobs: 45,
    totalClients: 38,
    repeatClients: 13,
    avgTicket: 854,
    growthRate: "+18.4%",
    monthly: [
      { month: "Jan", income: 2400, clients: 3, jobs: 3 },
      { month: "Feb", income: 2850, clients: 3, jobs: 4 },
      { month: "Mar", income: 3400, clients: 4, jobs: 4 },
      { month: "Apr", income: 3200, clients: 4, jobs: 4 },
      { month: "May", income: 4100, clients: 5, jobs: 5 },
      { month: "Jun", income: 4350, clients: 4, jobs: 5 },
      { month: "Jul", income: 4600, clients: 5, jobs: 5 },
      { month: "Aug", income: 5200, clients: 6, jobs: 6 },
      { month: "Sep", income: 3950, clients: 4, jobs: 4 },
      { month: "Oct", income: 3100, clients: 4, jobs: 3 },
      { month: "Nov", income: 1300, clients: 2, jobs: 2 },
      { month: "Dec", income: 0, clients: 0, jobs: 0 },
    ],
  },
  2025: {
    totalRevenue: 36200,
    completedJobs: 43,
    totalClients: 35,
    repeatClients: 10,
    avgTicket: 841,
    growthRate: "+24.8%",
    monthly: [
      { month: "Jan", income: 1900, clients: 2, jobs: 2 },
      { month: "Feb", income: 2200, clients: 3, jobs: 3 },
      { month: "Mar", income: 2700, clients: 3, jobs: 3 },
      { month: "Apr", income: 2800, clients: 3, jobs: 4 },
      { month: "May", income: 3400, clients: 4, jobs: 4 },
      { month: "Jun", income: 3900, clients: 4, jobs: 5 },
      { month: "Jul", income: 4200, clients: 5, jobs: 5 },
      { month: "Aug", income: 4500, clients: 5, jobs: 5 },
      { month: "Sep", income: 3300, clients: 3, jobs: 4 },
      { month: "Oct", income: 2800, clients: 3, jobs: 3 },
      { month: "Nov", income: 2400, clients: 3, jobs: 3 },
      { month: "Dec", income: 2100, clients: 2, jobs: 2 },
    ],
  },
  2024: {
    totalRevenue: 29000,
    completedJobs: 35,
    totalClients: 28,
    repeatClients: 6,
    avgTicket: 828,
    growthRate: "+31.2%",
    monthly: [
      { month: "Jan", income: 1200, clients: 2, jobs: 2 },
      { month: "Feb", income: 1500, clients: 2, jobs: 2 },
      { month: "Mar", income: 2100, clients: 2, jobs: 3 },
      { month: "Apr", income: 2300, clients: 3, jobs: 3 },
      { month: "May", income: 2800, clients: 3, jobs: 3 },
      { month: "Jun", income: 3200, clients: 4, jobs: 4 },
      { month: "Jul", income: 3600, clients: 4, jobs: 4 },
      { month: "Aug", income: 3900, clients: 4, jobs: 4 },
      { month: "Sep", income: 2700, clients: 3, jobs: 3 },
      { month: "Oct", income: 2200, clients: 3, jobs: 2 },
      { month: "Nov", income: 1800, clients: 2, jobs: 2 },
      { month: "Dec", income: 1700, clients: 2, jobs: 2 },
    ],
  },
};

export type PeriodOption = "this_month" | "this_year" | "all_time";

export const periodData: Record<PeriodOption, YearlyMetrics> = {
  this_month: {
    totalRevenue: 3100,
    completedJobs: 4,
    totalClients: 4,
    repeatClients: 2,
    avgTicket: 775,
    growthRate: "+12.4%",
    monthly: [
      { month: "Wk 1", income: 750, clients: 1, jobs: 1 },
      { month: "Wk 2", income: 950, clients: 1, jobs: 1 },
      { month: "Wk 3", income: 850, clients: 1, jobs: 1 },
      { month: "Wk 4", income: 550, clients: 1, jobs: 1 },
    ],
  },
  this_year: yearlyData[2026],
  all_time: {
    totalRevenue: 103650,
    completedJobs: 123,
    totalClients: 101,
    repeatClients: 29,
    avgTicket: 842,
    growthRate: "+28.5%",
    monthly: [
      { month: "2023", income: 18500, clients: 20, jobs: 24 },
      { month: "2024", income: 29000, clients: 28, jobs: 35 },
      { month: "2025", income: 36200, clients: 35, jobs: 43 },
      { month: "2026", income: 38450, clients: 38, jobs: 45 },
    ],
  },
};

const recentCompletedJobs = [
  { id: "comp-1", client: "Maya Chen", service: "Kitchen sink leak", date: "Oct 14, 2026", amount: "$280" },
  { id: "comp-2", client: "Jordan Hale", service: "Pipe diagnostics", date: "Sep 28, 2026", amount: "$450" },
  { id: "comp-3", client: "Elena Ruiz", service: "Supply line reseal", date: "Sep 15, 2026", amount: "$320" },
  { id: "comp-4", client: "Sam Okonkwo", service: "Water heater valve", date: "Aug 29, 2026", amount: "$520" },
  { id: "comp-5", client: "David Miller", service: "Garbage disposal", date: "Aug 12, 2026", amount: "$240" },
];

type AnalyticsTab = "overview" | "jobs";

export function ProAnalytics() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [period, setPeriod] = useState<PeriodOption>("this_year");
  const [hoveredIncomeMonth, setHoveredIncomeMonth] = useState<number | null>(null);
  const [hoveredClientsMonth, setHoveredClientsMonth] = useState<number | null>(null);

  const activeData = periodData[period] ?? periodData.this_year;

  const maxIncome = Math.max(...activeData.monthly.map((m) => m.income), 6000);
  const maxClients = Math.max(...activeData.monthly.map((m) => m.clients), 8);

  const activeIncomeItem =
    hoveredIncomeMonth !== null ? activeData.monthly[hoveredIncomeMonth] : null;
  const activeClientsItem =
    hoveredClientsMonth !== null ? activeData.monthly[hoveredClientsMonth] : null;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. STANDARD SEGMENTED CONTROL TABS + UNIFIED PERIOD SELECTOR             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/70 pb-3">
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "overview", label: "Overview" },
            { key: "jobs", label: "History" },
          ]}
        />

        {/* Unified Period Selector: This Month, This Year, All Time */}
        <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-line bg-white px-3 py-1.5 shadow-2xs">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted">Period:</span>
          <select
            aria-label="Filter analytics by period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            className="cursor-pointer bg-transparent text-xs font-bold text-title outline-none focus:text-primary pr-6"
          >
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI CARDS (Standardized, uncluttered, executive sizes)       */}
      {/* ========================================================================= */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex h-full min-h-0 flex-col justify-between rounded-xl border border-line/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted">
              Earnings
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <DollarSign className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="truncate font-display text-2xl font-bold tracking-tight text-title">
              ${activeData.totalRevenue.toLocaleString()}
            </span>
            <span className="inline-flex shrink-0 items-center text-xs font-semibold text-emerald-600">
              <TrendingUp className="mr-0.5 h-3 w-3" />
              {activeData.growthRate}
            </span>
          </div>
        </Card>

        <Card className="flex h-full min-h-0 flex-col justify-between rounded-xl border border-line/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted">
              Completed jobs
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-3 truncate font-display text-2xl font-bold tracking-tight text-title">
            {activeData.completedJobs}
          </p>
        </Card>

        <Card className="flex h-full min-h-0 flex-col justify-between rounded-xl border border-line/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted">
              Clients
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <Users className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-3 truncate font-display text-2xl font-bold tracking-tight text-title">
            {activeData.totalClients}
          </p>
        </Card>

        <Card className="flex h-full min-h-0 flex-col justify-between rounded-xl border border-line/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted">
              Rating
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="flex items-center gap-1 font-display text-2xl font-bold tracking-tight text-title">
              4.8
              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
            </span>
            <span className="shrink-0 text-xs text-muted">36 reviews</span>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: OVERVIEW (Dual Visual Trends + Recent Jobs Table)              */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Income Trend Chart */}
            <Card className="p-5 sm:p-6">
              <div className="border-b border-line/70 pb-3.5">
                <h2 className="font-display text-base font-bold text-title flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {period === "this_month"
                    ? "Weekly Income Overview"
                    : period === "all_time"
                    ? "Annual Income Overview"
                    : "Monthly Income Overview"}
                </h2>
              </div>

              {/* Chart Graphics */}
              <div className="mt-5">
                <div className="relative h-48 w-full">
                  {activeIncomeItem ? (
                    <div className="absolute top-0 right-0 z-10 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
                      <span>{activeIncomeItem.month}:</span>
                      <span>${activeIncomeItem.income.toLocaleString()}</span>
                      <span className="text-muted">•</span>
                      <span>{activeIncomeItem.jobs} jobs</span>
                    </div>
                  ) : null}

                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-b border-dashed border-line text-[10px] text-muted">$5,000</div>
                    <div className="border-b border-dashed border-line text-[10px] text-muted">$3,500</div>
                    <div className="border-b border-dashed border-line text-[10px] text-muted">$2,000</div>
                    <div className="border-b border-line text-[10px] text-muted">$0</div>
                  </div>

                  {/* Bars */}
                  <div className="absolute inset-x-0 bottom-0 top-5 flex items-end justify-between gap-1 sm:gap-2 px-1">
                    {activeData.monthly.map((item, idx) => {
                      const heightPercent = Math.max((item.income / maxIncome) * 100, 3);
                      const isHovered = hoveredIncomeMonth === idx;
                      const isPeak = item.income === Math.max(...activeData.monthly.map((m) => m.income));

                      return (
                        <div
                          key={item.month}
                          className="group relative flex h-full flex-1 flex-col items-center justify-end cursor-pointer"
                          onMouseEnter={() => setHoveredIncomeMonth(idx)}
                          onMouseLeave={() => setHoveredIncomeMonth(null)}
                        >
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={cn(
                              "w-full max-w-[24px] sm:max-w-[28px] rounded-t-lg transition-all duration-200",
                              isHovered
                                ? "bg-primary shadow-sm scale-y-105"
                                : isPeak
                                ? "bg-primary"
                                : item.income > 0
                                ? "bg-primary/80 hover:bg-primary"
                                : "bg-line/50"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-axis */}
                <div className="mt-3 flex justify-between px-1 text-[11px] font-medium text-muted">
                  {activeData.monthly.map((item, idx) => (
                    <span
                      key={item.month}
                      className={cn(
                        "flex-1 text-center transition-colors",
                        hoveredIncomeMonth === idx && "font-bold text-primary"
                      )}
                    >
                      {item.month}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Clients & Work Volume Chart */}
            <Card className="p-5 sm:p-6">
              <div className="border-b border-line/70 pb-3.5">
                <h2 className="font-display text-base font-bold text-title flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {period === "this_month"
                    ? "Weekly Work Volume"
                    : period === "all_time"
                    ? "Annual Work Volume"
                    : "Clients & Work Volume"}
                </h2>
              </div>

              {/* Chart Graphics */}
              <div className="mt-5">
                <div className="relative h-48 w-full">
                  {activeClientsItem ? (
                    <div className="absolute top-0 right-0 z-10 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      <span>{activeClientsItem.month}:</span>
                      <span>{activeClientsItem.clients} clients</span>
                      <span className="text-muted">•</span>
                      <span>{activeClientsItem.jobs} jobs</span>
                    </div>
                  ) : null}

                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-b border-dashed border-line text-[10px] text-muted">8 Clients</div>
                    <div className="border-b border-dashed border-line text-[10px] text-muted">5 Clients</div>
                    <div className="border-b border-dashed border-line text-[10px] text-muted">3 Clients</div>
                    <div className="border-b border-line text-[10px] text-muted">0</div>
                  </div>

                  {/* Bars */}
                  <div className="absolute inset-x-0 bottom-0 top-5 flex items-end justify-between gap-1 sm:gap-2 px-1">
                    {activeData.monthly.map((item, idx) => {
                      const heightPercent = Math.max((item.clients / maxClients) * 100, 3);
                      const isHovered = hoveredClientsMonth === idx;
                      const isPeak = item.clients === Math.max(...activeData.monthly.map((m) => m.clients));

                      return (
                        <div
                          key={item.month}
                          className="group relative flex h-full flex-1 flex-col items-center justify-end cursor-pointer"
                          onMouseEnter={() => setHoveredClientsMonth(idx)}
                          onMouseLeave={() => setHoveredClientsMonth(null)}
                        >
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={cn(
                              "w-full max-w-[24px] sm:max-w-[28px] rounded-t-lg transition-all duration-200",
                              isHovered
                                ? "bg-emerald-600 shadow-sm scale-y-105"
                                : isPeak
                                ? "bg-emerald-600"
                                : item.clients > 0
                                ? "bg-emerald-500/80 hover:bg-emerald-600"
                                : "bg-line/50"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-axis */}
                <div className="mt-3 flex justify-between px-1 text-[11px] font-medium text-muted">
                  {activeData.monthly.map((item, idx) => (
                    <span
                      key={item.month}
                      className={cn(
                        "flex-1 text-center transition-colors",
                        hoveredClientsMonth === idx && "font-bold text-emerald-700"
                      )}
                    >
                      {item.month}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </div>

        </div>
      )}



      {/* ========================================================================= */}
      {/* 5. TAB 3: JOBS & CLIENTS (Complete Job Ledger & Retention Analysis)      */}
      {/* ========================================================================= */}
      {activeTab === "jobs" && (
        <Card className="overflow-hidden rounded-xl p-0 hover:shadow-xs">
          <ul className="divide-y divide-line/70">
            {recentCompletedJobs.map((job) => (
              <li
                key={job.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_7rem_4.5rem]"
              >
                <p className="truncate text-sm font-semibold text-title">{job.client}</p>
                <p className="hidden truncate text-sm text-muted sm:block">{job.service}</p>
                <p className="hidden text-sm text-muted sm:block">{job.date}</p>
                <p className="text-right text-sm font-semibold text-title">{job.amount}</p>
                <p className="col-span-2 truncate text-sm text-muted sm:hidden">
                  {job.service} · {job.date}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
