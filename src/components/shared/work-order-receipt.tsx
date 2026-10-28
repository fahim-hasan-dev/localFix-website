"use client";

import {
  CheckCircle2,
  Printer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Booking, ChangeRequest, Job, JobCompletion, Professional } from "@/types";

interface WorkOrderReceiptProps {
  job: Job;
  booking?: Booking;
  pro?: Professional | null;
  completion?: JobCompletion;
  changeRequests?: ChangeRequest[];
  onClose?: () => void;
}

export function WorkOrderReceipt({
  job,
  booking,
  pro,
  completion,
  changeRequests = [],
  onClose,
}: WorkOrderReceiptProps) {
  const receiptNumber =
    booking?.paymentReceiptNumber ||
    completion?.receiptNumber ||
    `LHF-REC-${job.id.replace(/\D/g, "").slice(-6) || "842911"}`;

  const paymentMethod =
    booking?.paymentMethod || completion?.paymentMethod || "bank_transfer";

  const paymentLabels: Record<string, string> = {
    zelle: "Zelle",
    card: "Credit / Debit Card",
    cash: "Cash",
    check: "Check",
    bank_transfer: "Direct Bank Transfer (ACH)",
  };

  const basePrice = booking?.agreedPrice ?? 150;
  const approvedChanges = changeRequests.filter((cr) => cr.status === "approved");
  const changeTotal = approvedChanges.reduce((sum, cr) => sum + cr.amount, 0);
  const finalTotal = basePrice;

  const serviceDate =
    booking?.scheduledDate || completion?.proMarkedAt?.slice(0, 10) || job.postedAt;

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] border border-line/80 bg-white p-6 shadow-2xl">
        {/* 1. Clean Header */}
        <div className="flex items-start justify-between border-b border-line/70 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-title">
                Payment Receipt
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="h-3 w-3" /> Paid
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted">
              #{receiptNumber}
            </p>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="text-right">
              <span className="block text-[11px] font-medium text-muted leading-none">Date</span>
              <span className="block text-xs font-semibold text-title mt-1">{serviceDate}</span>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-stone-100 hover:text-title transition cursor-pointer -mr-1 -mt-0.5"
                aria-label="Close receipt"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* 2. Compact Metadata Strip (Professional, Homeowner, Method) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 py-4 border-b border-line/70 text-xs">
          <div>
            <span className="block text-[11px] font-medium text-muted">Professional</span>
            <p className="mt-0.5 font-semibold text-title truncate">
              {pro?.name ?? "Professional"}
            </p>
            <p className="text-[11px] text-muted truncate">
              {pro?.trade ?? "Contractor"}
            </p>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-muted">Customer</span>
            <p className="mt-0.5 font-semibold text-title truncate">
              {job.homeownerName}
            </p>
            <p className="text-[11px] text-muted truncate">
              {job.city}, {job.state}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="block text-[11px] font-medium text-muted">Payment</span>
            <p className="mt-0.5 font-semibold text-title truncate">
              {paymentLabels[paymentMethod] || paymentMethod}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Direct Settlement</p>
          </div>
        </div>

        {/* 3. Job Scope & Completion Note */}
        <div className="py-3.5 border-b border-line/70 text-xs">
          <span className="block text-[11px] font-medium text-muted">Service Scope</span>
          <p className="mt-0.5 font-semibold text-title text-sm">{job.title}</p>
          {booking?.scopeSnapshot || job.description ? (
            <p className="mt-1 text-xs text-stone-600 leading-relaxed line-clamp-2">
              {booking?.scopeSnapshot || job.description}
            </p>
          ) : null}
          {completion?.completionNotes ? (
            <p className="mt-2 text-[11px] text-stone-600 italic bg-stone-50 p-2 rounded-lg border border-line/50">
              Note: &ldquo;{completion.completionNotes}&rdquo;
            </p>
          ) : null}
        </div>

        {/* 4. Minimal Line Items & Total */}
        <div className="py-3.5 border-b border-line/70 space-y-2 text-xs">
          <div className="flex justify-between items-center text-copy">
            <span>Base Contract Scope</span>
            <span className="font-semibold text-title">
              ${changeTotal > 0 ? basePrice - changeTotal : basePrice}
            </span>
          </div>

          {approvedChanges.map((cr) => (
            <div key={cr.id} className="flex justify-between items-center text-copy">
              <span>Add-on: {cr.reason}</span>
              <span className="font-semibold text-title">+${cr.amount}</span>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2 border-t border-line/60">
            <span className="font-bold text-title text-sm">Total Paid</span>
            <span className="font-display font-bold text-lg text-title">
              ${finalTotal}
            </span>
          </div>
        </div>

        {/* 5. Minimal Clean Actions */}
        <div className="mt-4 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </Button>
          {onClose ? (
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="rounded-full text-xs font-semibold cursor-pointer px-5"
            >
              Close
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
