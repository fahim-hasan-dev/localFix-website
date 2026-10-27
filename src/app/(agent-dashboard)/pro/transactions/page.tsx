"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Percent,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/cn";

export default function TransactionsPage() {
  const items = useAppSelector((state) => state.features.invoices);
  const [filter, setFilter] = useState<"all" | "paid" | "upcoming">("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  function handleDownload(id: string) {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
    }, 1500);
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
              Official statement records and invoices for your LocalHomeFix Pro membership subscription.
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
        <Card className="rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Active Membership</p>
              <p className="text-base sm:text-lg font-bold text-title">Pro Monthly ($19.99/mo)</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Next Auto-Renew</p>
              <p className="text-base sm:text-lg font-bold text-title">Jan 10, 2027</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Job Take Rate</p>
              <p className="text-base sm:text-lg font-bold text-title">0% Fee (100% Kept)</p>
            </div>
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

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">No statements found in this filter.</div>
        ) : (
          <div className="divide-y divide-line/60">
            {filteredItems.map((item, idx) => {
              const isPaid = item.status === "paid";
              const invoiceNum = `INV-2026-${String(idx + 1).padStart(3, "0")}`;
              const isTrial = (item.description ?? "").toLowerCase().includes("trial");

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 hover:bg-stone-50/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-semibold shadow-2xs",
                        isPaid
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200",
                      )}
                    >
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold text-title">
                          {isTrial ? "Pro Membership — 30-Day Free Trial" : "Pro Monthly Membership"}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200",
                          )}
                        >
                          {isPaid ? "Paid" : "Scheduled"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                        <span className="font-mono text-[11px] text-muted">{invoiceNum}</span>
                        <span>·</span>
                        <span>{item.date}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> Visa ending in 4242
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/40">
                    <div className="text-left sm:text-right">
                      <p className="font-display text-base font-bold text-title">{item.amount}</p>
                      <p className="text-[11px] text-muted">
                        {isPaid ? "Charged to card" : "Pending renewal"}
                      </p>
                    </div>

                    {isPaid ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(item.id)}
                        className="rounded-full text-xs font-semibold gap-1.5 border border-line/70 bg-white hover:bg-stone-100"
                      >
                        {downloadingId === item.id ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 animate-in zoom-in" />
                            <span>Downloaded</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 text-muted" />
                            <span>Receipt</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted px-3 py-1 bg-stone-100 rounded-full">
                        <Clock className="h-3 w-3" /> Next cycle
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 4. Educational Zero-Commission Guarantee Banner */}
      <div className="rounded-2xl border border-line/80 bg-stone-50/70 p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldCheck className="h-5 w-5 text-title shrink-0 mt-0.5" />
        <div className="text-xs text-muted space-y-1">
          <p className="font-semibold text-title text-[13px]">
            Zero Transaction Fees on Client Repair Earnings
          </p>
          <p className="leading-relaxed">
            This billing history exclusively tracks your LocalHomeFix Pro software subscription ($19.99/mo).
            When Austin homeowners hire you and pay for repair work, 100% of the funds are paid directly to you.
            LocalHomeFix takes zero transaction cuts, per-job commissions, or deduction percentages.
          </p>
        </div>
      </div>
    </div>
  );
}
