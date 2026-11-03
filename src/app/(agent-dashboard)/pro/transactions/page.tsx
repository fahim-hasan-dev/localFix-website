"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
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
            <span className="text-base sm:text-lg font-bold text-title">Pro Monthly</span>
            <span className="text-xs text-muted font-medium">($19.99/mo)</span>
          </div>
        </Card>

        <Card className="rounded-2xl border border-line/70 bg-white p-4 sm:p-5 shadow-2xs hover:border-line transition">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Next Auto-Renew</p>
          <p className="text-base sm:text-lg font-bold text-title">Jan 10, 2027</p>
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
                  className="flex items-center justify-between gap-4 p-4 sm:px-5 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-muted">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-title truncate">
                          {isTrial ? "Pro Membership — 30-Day Free Trial" : "Pro Monthly Membership"}
                        </span>
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
                        <span className="font-mono text-[11px]">{invoiceNum}</span>
                        <span>·</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-semibold text-title">{item.amount}</span>

                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(item.id)}
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
