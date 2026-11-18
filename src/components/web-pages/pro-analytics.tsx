"use client";

import { useMemo, useState } from "react";
import { useUrlTab } from "@/hooks/use-url-tab";
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
import {
  useGetProfessionalAnalyticsQuery,
  useGetProfessionalHistoryQuery,
} from "@/services/client/marketplace-api";

export type MonthlyPoint = {
  month: string;
  income: number;
  clients: number;
  jobs: number;
};

export type AnalyticsMetrics = {
  totalRevenue: number;
  completedJobs: number;
  totalClients: number;
  rating: number;
  reviewCount: number;
  growthRate: string;
  monthly: MonthlyPoint[];
};

export type PeriodOption = "this_month" | "this_year" | "all_time";

type ApiRecord = Record<string, unknown>;

type HistoryRow = {
  id: string;
  client: string;
  service: string;
  date: string;
  amount: string;
};

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : null;
}

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function str(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function firstNumber(record: ApiRecord, keys: string[]): number {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return num(record[key]);
  }
  return 0;
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  if (/^\d{1,2}$/.test(raw)) return MONTH_ABBR[Number(raw) - 1] ?? raw;
  return raw.length > 5 && !Number.isNaN(Date.parse(raw))
    ? new Date(raw).toLocaleDateString("en-US", { month: "short" })
    : raw;
}

function mapMonthly(source: unknown): MonthlyPoint[] {
  let entries: Array<[string, unknown]> = [];
  if (Array.isArray(source)) {
    entries = source.map((item, index) => [String(index), item]);
  } else if (asRecord(source)) {
    entries = Object.entries(source as ApiRecord);
  }
  return entries
    .map(([key, item]): MonthlyPoint | null => {
      const record = asRecord(item);
      if (!record) {
        // `{ Jan: 1200 }` style maps
        return typeof item === "number" ? { month: monthLabel(key), income: item, clients: 0, jobs: 0 } : null;
      }
      const month = monthLabel(record.month ?? record.label ?? record.name ?? record.period ?? key);
      return {
        month,
        income: firstNumber(record, ["income", "earnings", "amount", "revenue", "total"]),
        clients: firstNumber(record, ["clients", "clientCount", "totalClients"]),
        jobs: firstNumber(record, ["jobs", "completedJobs", "jobCount", "bookings"]),
      };
    })
    .filter((item): item is MonthlyPoint => Boolean(item && item.month));
}

function mapAnalytics(data: unknown): AnalyticsMetrics {
  const payload = asRecord(data) ?? {};
  const stats = asRecord(payload.stats) ?? payload;
  const growth = stats.growthRate ?? stats.growth ?? payload.growthRate;
  const growthText = typeof growth === "number" ? `${growth >= 0 ? "+" : ""}${growth}%` : str(growth);
  return {
    totalRevenue: firstNumber(stats, ["earnings", "totalEarnings", "totalRevenue"]),
    completedJobs: firstNumber(stats, ["completedJobs", "jobsCompleted"]),
    totalClients: firstNumber(stats, ["clients", "totalClients"]),
    rating: firstNumber(stats, ["rating", "averageRating", "avgRating"]),
    reviewCount: firstNumber(stats, ["reviewsCount", "totalReviews", "reviewCount", "reviews"]),
    growthRate: growthText,
    monthly: mapMonthly(
      payload.monthlyIncomeOverview ?? stats.monthlyIncomeOverview ?? payload.monthlyIncome ?? stats.monthlyIncome,
    ),
  };
}

function formatHistoryDate(value: unknown) {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime())
    ? raw
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function mapHistory(data: unknown): HistoryRow[] {
  let list: unknown[] = [];
  if (Array.isArray(data)) list = data;
  else {
    const record = asRecord(data);
    if (record) {
      for (const key of ["history", "items", "jobs", "bookings", "data", "results"]) {
        if (Array.isArray(record[key])) {
          list = record[key] as unknown[];
          break;
        }
      }
    }
  }
  return list
    .map((item, index): HistoryRow | null => {
      const record = asRecord(item);
      if (!record) return null;
      const job = asRecord(record.jobRequest) ?? asRecord(record.job);
      const homeowner = asRecord(record.homeowner) ?? asRecord(record.client);
      const amount = firstNumber(record, ["totalAmount", "amount", "earnings", "income", "price"]);
      return {
        id: str(record._id || record.id) || String(index),
        client: str(homeowner?.name || record.clientName || record.client) || "Client",
        service: str(job?.title || record.title || record.service || record.serviceName) || "Completed job",
        date: formatHistoryDate(record.completedAt ?? record.homeownerCompletedAt ?? record.date ?? record.updatedAt ?? record.createdAt),
        amount: `$${amount.toLocaleString()}`,
      };
    })
    .filter((item): item is HistoryRow => Boolean(item));
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

export function ProAnalytics() {
  const [activeTab, setActiveTab] = useUrlTab(["overview", "jobs"] as const, "overview");
  const [period, setPeriod] = useState<PeriodOption>("this_year");
  const [hoveredIncomeMonth, setHoveredIncomeMonth] = useState<number | null>(null);
  const [hoveredClientsMonth, setHoveredClientsMonth] = useState<number | null>(null);

  const analyticsQuery = useGetProfessionalAnalyticsQuery({ period });
  const historyQuery = useGetProfessionalHistoryQuery({ period });

  const activeData = useMemo(() => mapAnalytics(analyticsQuery.data?.data), [analyticsQuery.data]);
  const history = useMemo(() => mapHistory(historyQuery.data?.data), [historyQuery.data]);

  const incomeMax = niceMax(Math.max(...activeData.monthly.map((m) => m.income), 0));
  const clientsMax = Math.max(Math.ceil(Math.max(...activeData.monthly.map((m) => m.clients), 0)), 1);
  const maxIncome = incomeMax;
  const maxClients = clientsMax;
  const peakIncome = Math.max(...activeData.monthly.map((m) => m.income), 0);
  const peakClients = Math.max(...activeData.monthly.map((m) => m.clients), 0);

  const activeIncomeItem =
    hoveredIncomeMonth !== null ? activeData.monthly[hoveredIncomeMonth] ?? null : null;
  const activeClientsItem =
    hoveredClientsMonth !== null ? activeData.monthly[hoveredClientsMonth] ?? null : null;
  const hasMonthly = activeData.monthly.length > 0;

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

      {analyticsQuery.isLoading ? <p className="text-sm text-muted">Loading analytics...</p> : null}
      {analyticsQuery.isError ? <p className="text-sm text-error">Analytics could not be loaded.</p> : null}

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
            {activeData.growthRate ? (
              <span className="inline-flex shrink-0 items-center text-xs font-semibold text-emerald-600">
                <TrendingUp className="mr-0.5 h-3 w-3" />
                {activeData.growthRate}
              </span>
            ) : null}
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
              {activeData.rating ? activeData.rating.toFixed(1) : "—"}
              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
            </span>
            {activeData.reviewCount ? (
              <span className="shrink-0 text-xs text-muted">
                {activeData.reviewCount} review{activeData.reviewCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: OVERVIEW (Dual Visual Trends + Recent Jobs Table)              */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!analyticsQuery.isLoading && !analyticsQuery.isError && !hasMonthly ? (
            <p className="text-xs text-muted">No income data for this period yet.</p>
          ) : null}
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
                    <div className="border-b border-dashed border-line text-[10px] text-muted">${maxIncome.toLocaleString()}</div>
                    <div className="border-b border-dashed border-line text-[10px] text-muted">${Math.round((maxIncome * 2) / 3).toLocaleString()}</div>
                    <div className="border-b border-dashed border-line text-[10px] text-muted">${Math.round(maxIncome / 3).toLocaleString()}</div>
                    <div className="border-b border-line text-[10px] text-muted">$0</div>
                  </div>

                  {/* Bars */}
                  <div className="absolute inset-x-0 bottom-0 top-5 flex items-end justify-between gap-1 sm:gap-2 px-1">
                    {activeData.monthly.map((item, idx) => {
                      const heightPercent = Math.max((item.income / maxIncome) * 100, 3);
                      const isHovered = hoveredIncomeMonth === idx;
                      const isPeak = item.income > 0 && item.income === peakIncome;

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
                    <div className="border-b border-dashed border-line text-[10px] text-muted">{maxClients} Clients</div>
                    <div className="border-b border-dashed border-line text-[10px] text-muted">{Math.round((maxClients * 2) / 3)} Clients</div>
                    <div className="border-b border-dashed border-line text-[10px] text-muted">{Math.round(maxClients / 3)} Clients</div>
                    <div className="border-b border-line text-[10px] text-muted">0</div>
                  </div>

                  {/* Bars */}
                  <div className="absolute inset-x-0 bottom-0 top-5 flex items-end justify-between gap-1 sm:gap-2 px-1">
                    {activeData.monthly.map((item, idx) => {
                      const heightPercent = Math.max((item.clients / maxClients) * 100, 3);
                      const isHovered = hoveredClientsMonth === idx;
                      const isPeak = item.clients > 0 && item.clients === peakClients;

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
          {historyQuery.isLoading ? <p className="px-6 py-4 text-sm text-muted">Loading history...</p> : null}
          {historyQuery.isError ? <p className="px-6 py-4 text-sm text-error">History could not be loaded.</p> : null}
          {!historyQuery.isLoading && !historyQuery.isError && history.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted">No completed jobs for this period yet.</p>
          ) : null}
          <ul className="divide-y divide-line/70">
            {history.map((job) => (
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
