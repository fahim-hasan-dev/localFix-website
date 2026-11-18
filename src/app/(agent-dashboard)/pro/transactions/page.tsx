"use client";

import { useState } from "react";
import Link from "next/link";
import { useUrlTab } from "@/hooks/use-url-tab";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { num, refId, str, type ApiRecord } from "@/lib/api-profile";
import { useGetPackagesQuery } from "@/services/client/catalog-api";
import { useGetMySubscriptionQuery } from "@/services/client/engagement-api";

type PlanType = "monthly" | "yearly" | "";

type StatementRow = {
  id: string;
  number: string;
  title: string;
  date: string;
  amount: string;
  status: "paid" | "upcoming";
  receiptUrl: string;
};

function toRecord(value: unknown): ApiRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ApiRecord;
}

function normalizePlanType(value: unknown): PlanType {
  const v = str(value).toLowerCase();
  if (v === "yearly" || v === "annual" || v === "year") return "yearly";
  if (v === "monthly" || v === "month") return "monthly";
  return "";
}

function formatDate(value: unknown) {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(value: unknown, currency?: unknown) {
  const amount = num(value, Number.NaN);
  if (Number.isNaN(amount)) return str(value);
  const code = str(currency, "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export default function TransactionsPage() {
  const { data: subscriptionResponse, isLoading } = useGetMySubscriptionQuery();
  const { data: packageResponse } = useGetPackagesQuery();
  const [filter, setFilter] = useUrlTab(["all", "paid", "upcoming"] as const, "all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const rawSub = toRecord(subscriptionResponse?.data);
  const sub = rawSub ? (toRecord(rawSub.subscription) ?? rawSub) : null;
  const hasSub = Boolean(sub && (sub._id || sub.status || sub.planType || sub.package));
  const subStatus = str(sub?.status).toLowerCase();
  const planType = normalizePlanType(sub?.planType ?? sub?.billingCycle ?? sub?.interval);
  const cancelAtPeriodEnd = Boolean(sub?.cancelAtPeriodEnd);
  const isEnded = ["canceled", "cancelled", "expired", "inactive"].includes(subStatus);
  const renewalDate = formatDate(
    sub?.currentPeriodEnd ?? sub?.endDate ?? sub?.renewalDate ?? sub?.nextBillingDate ?? sub?.expiresAt,
  );

  const packageRef = sub?.package ?? sub?.packageId;
  const embeddedPackage = toRecord(packageRef);
  const packageId = refId(packageRef);
  const catalogPackage = (packageResponse?.data ?? []).find((p) => p._id === packageId);
  const packageName = str(embeddedPackage?.name) || catalogPackage?.name || "";
  const monthlyPrice = num(embeddedPackage?.monthlyPrice, catalogPackage?.monthlyPrice ?? 0);
  const yearlyPrice = num(embeddedPackage?.yearlyPrice, catalogPackage?.yearlyPrice ?? 0);
  const planPrice =
    num(sub?.price, 0) || num(sub?.amount, 0) || (planType === "yearly" ? yearlyPrice : monthlyPrice);
  const planLabel = hasSub
    ? `${packageName || "Pro"} ${planType === "yearly" ? "Yearly" : planType === "monthly" ? "Monthly" : "Membership"}`
    : "No active plan";
  const priceSuffix = planType === "yearly" ? "/yr" : "/mo";

  // Only use billing records if the subscription payload actually includes them.
  const items: StatementRow[] = (() => {
    const source = sub?.invoices ?? sub?.payments ?? sub?.transactions;
    if (!Array.isArray(source)) return [];
    return source.flatMap((entry, idx) => {
      const rec = toRecord(entry);
      if (!rec) return [];
      const status = str(rec.status).toLowerCase();
      const upcoming = ["upcoming", "scheduled", "pending", "draft", "open"].includes(status);
      const id = str(rec._id) || str(rec.id) || `statement-${idx}`;
      return [
        {
          id,
          number: str(rec.invoiceNumber) || str(rec.number) || id,
          title: str(rec.description) || str(rec.title) || `${packageName || "Pro"} Membership`,
          date: formatDate(rec.paidAt ?? rec.date ?? rec.createdAt ?? rec.dueDate),
          amount: formatMoney(rec.amount ?? rec.total ?? rec.amountPaid, rec.currency),
          status: upcoming ? "upcoming" : "paid",
          receiptUrl: str(rec.receiptUrl) || str(rec.invoiceUrl) || str(rec.hostedInvoiceUrl) || str(rec.invoicePdf),
        },
      ];
    });
  })();

  const filteredItems = filter === "all" ? items : items.filter((item) => item.status === filter);

  function handleDownload(item: StatementRow) {
    if (item.receiptUrl) {
      window.open(item.receiptUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setDownloadingId(item.id);
    setTimeout(() => setDownloadingId(null), 1500);
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* 1. Header with Breadcrumb & Context */}
      <div className="border-b border-line/70 pb-4 pt-1">
        <Link
          href="/pro/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Subscription Plans
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight">
              Subscription Billing History
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted">
              Official statement records and invoices for your Local Fix Pro membership subscription.
            </p>
          </div>
          <Button
            href="/pro/pricing"
            size="sm"
            variant="ghost"
            className="rounded-full text-xs font-semibold border-line/80 self-start sm:self-auto"
          >
            Manage Plan
          </Button>
        </div>
      </div>

      {/* 2. Key Subscription Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="rounded-2xl border border-line/70 bg-white p-4 sm:p-5 shadow-2xs hover:border-line transition">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Active Membership</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-title">
              {isLoading ? "Loading…" : planLabel}
            </span>
            {hasSub && planPrice > 0 ? (
              <span className="text-xs text-muted font-medium">
                ({formatMoney(planPrice)}
                {priceSuffix})
              </span>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-2xl border border-line/70 bg-white p-4 sm:p-5 shadow-2xs hover:border-line transition">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
            {cancelAtPeriodEnd || isEnded ? "Access Ends" : "Next Auto-Renew"}
          </p>
          <p className="text-base sm:text-lg font-bold text-title">
            {isLoading ? "Loading…" : hasSub && renewalDate ? renewalDate : "—"}
          </p>
          {hasSub && cancelAtPeriodEnd ? (
            <p className="mt-0.5 text-[11px] text-amber-700 font-medium">Auto-renew cancelled</p>
          ) : null}
        </Card>

        <Card className="rounded-2xl border border-line/70 bg-white p-4 sm:p-5 shadow-2xs hover:border-line transition">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Platform Take Rate</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-emerald-700">0% Fee</span>
            <span className="text-xs text-muted font-medium">(100% Direct to Pro)</span>
          </div>
        </Card>
      </div>

      {/* 3. Transaction Filter & Table */}
      <Card className="overflow-hidden rounded-2xl border border-line/80 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/70 p-4 sm:p-5">
          <div>
            <h2 className="font-display text-base font-bold text-title">Invoices &amp; Receipts</h2>
            <p className="text-xs text-muted">Showing all automated billing cycles for your Pro account.</p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl bg-stone-100/90 p-1 border border-line/60 self-start sm:self-auto">
            {(
              [
                { id: "all", label: "All Statements" },
                { id: "paid", label: "Settled / Paid" },
                { id: "upcoming", label: "Upcoming" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  filter === t.id
                    ? "bg-white text-title shadow-xs font-bold"
                    : "text-muted hover:text-title",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">No billing statements yet</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">No statements found in this filter.</div>
        ) : (
          <div className="divide-y divide-line/60">
            {filteredItems.map((item) => {
              const isPaid = item.status === "paid";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 sm:px-5 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-muted">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-title truncate">{item.title}</span>
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                            isPaid
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700",
                          )}
                        >
                          {isPaid ? "Paid" : "Scheduled"}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <span className="font-mono text-[11px]">{item.number}</span>
                        {item.date ? (
                          <>
                            <span>·</span>
                            <span>{item.date}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-semibold text-title">{item.amount}</span>

                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 px-2.5 py-1 text-xs font-medium text-copy hover:bg-stone-50 hover:text-title transition cursor-pointer"
                      >
                        {downloadingId === item.id ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 text-muted" />
                            <span>Receipt</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-muted font-medium">Upcoming</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
