"use client";

import { useRouter } from "next/navigation";
import { RequestDetail } from "@/components/web-pages/request-detail";
import { ProQuoteForm } from "@/components/web-pages/pro-quote-form";
import { Button } from "@/components/ui/button";
import { selectJob, selectQuotesForJob } from "@/lib/marketplace";
import { useRoleAccess } from "@/hooks/use-role-access";
import { setLeadAction } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import {
  Calendar,
  Clock,
  Package,
  ShieldCheck,
  CalendarDays,
  AlertCircle,
  CreditCard,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/cn";

export function ProJobLead({
  jobId,
  backHref,
  backLabel,
}: {
  jobId: string;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { access } = useRoleAccess();
  const job = useAppSelector((state) => selectJob(state, jobId));
  const leadAction = useAppSelector((state) => state.features.leadActions[jobId] ?? "open");
  const hiredQuoteId = useAppSelector((state) => state.marketplace.hiredByJob[jobId]);
  const quotes = useAppSelector((state) => selectQuotesForJob(state, jobId));
  const myQuote = quotes.find((quote) => quote.proId === "pro-1");
  const alreadyQuoted = Boolean(myQuote);
  const forSomeoneElse = Boolean(job?.requestedProId && job.requestedProId !== "pro-1");
  const hiredElsewhere = Boolean(hiredQuoteId && !quotes.some((quote) => quote.id === hiredQuoteId && quote.proId === "pro-1"));
  const passed = leadAction === "declined";

  const isBooked = job && ["hired", "scheduled", "en_route", "in_progress", "awaiting_confirm", "completed"].includes(job.status);
  const resolvedBackHref = backHref ?? (isBooked ? "/pro/bookings" : "/pro/jobs");
  const resolvedBackLabel = backLabel ?? (isBooked ? "My Bookings" : "Available jobs");

  function accept() {
    dispatch(setLeadAction({ jobId, action: "accepted" }));
  }

  function pass() {
    dispatch(setLeadAction({ jobId, action: "declined" }));
    router.push(resolvedBackHref);
  }

  return (
    <div className="w-full max-w-5xl space-y-5">
      <RequestDetail
        id={jobId}
        backHref={resolvedBackHref}
        backLabel={resolvedBackLabel}
        inboxHref="/pro/messages"
        viewer="pro"
      />

      {forSomeoneElse ? (
        <div className="rounded-xl border border-line/80 bg-white px-6 py-4">
          <p className="text-sm text-muted">This quote request was sent to another professional.</p>
        </div>
      ) : hiredElsewhere ? (
        <div className="rounded-xl border border-line/80 bg-white px-6 py-4">
          <p className="text-sm text-muted">The homeowner already accepted another quotation for this job.</p>
        </div>
      ) : !access.canSubmitQuote ? (
        <div className="rounded-xl border border-line/80 bg-white px-6 py-4">
          <p className="text-sm text-muted">
            {access.blockedReason ?? "An active professional subscription is required to send quotations."}
          </p>
          <Button href="/pro/pricing" size="sm" className="mt-3">
            Membership
          </Button>
        </div>
      ) : passed ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/80 bg-white p-5 shadow-xs">
          <p className="text-sm text-muted">You passed on this request.</p>
          <Button type="button" size="sm" variant="ghost" onClick={accept} className="rounded-full">
            Undo
          </Button>
        </div>
      ) : alreadyQuoted && myQuote ? (
        <div className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-title">
                  Your Submitted Quotation
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    myQuote.status === "accepted" || hiredQuoteId === myQuote.id
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : myQuote.status === "rejected"
                      ? "bg-smoke text-muted border border-line"
                      : "bg-blue-50 text-primary border border-blue-200",
                  )}
                >
                  {myQuote.status === "accepted" || hiredQuoteId === myQuote.id
                    ? "✓ Accepted by Homeowner"
                    : myQuote.status === "rejected"
                    ? "Declined"
                    : "Sent · Awaiting Homeowner Review"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                Sent to {job?.homeownerName ?? "Homeowner"} · Direct payment upon completion ($0 HomeFix fee)
              </p>
            </div>

            <div className="text-right">
              <span className="font-display text-2xl font-bold text-title">
                ${myQuote.amount}
              </span>
              <span className="text-xs text-muted block capitalize">
                {myQuote.priceType === "hourly" ? "/hr" : myQuote.priceType}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">Scope of Work</h4>
              <p className="mt-1 text-xs sm:text-sm text-copy leading-relaxed">{myQuote.scope}</p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 pt-3 border-t border-line/60 text-xs">
              {myQuote.proposedSchedule || myQuote.availability ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-smoke/40 border border-line/60 px-3 py-2">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-medium text-muted block leading-none">Schedule</span>
                    <strong className="text-title font-semibold text-xs truncate block mt-0.5">
                      {myQuote.proposedSchedule || myQuote.availability}
                    </strong>
                  </div>
                </div>
              ) : null}

              {myQuote.estimatedDuration ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-smoke/40 border border-line/60 px-3 py-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-medium text-muted block leading-none">Duration</span>
                    <strong className="text-title font-semibold text-xs truncate block mt-0.5">
                      {myQuote.estimatedDuration}
                    </strong>
                  </div>
                </div>
              ) : null}

              {myQuote.materialsIncluded != null ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-smoke/40 border border-line/60 px-3 py-2">
                  <Package className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-medium text-muted block leading-none">Parts &amp; Materials</span>
                    <strong className="text-title font-semibold text-xs truncate block mt-0.5">
                      {myQuote.materialsIncluded ? "All parts & fittings included" : "Labor only (parts extra)"}
                    </strong>
                  </div>
                </div>
              ) : null}

              {myQuote.warranty ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-medium text-emerald-700/80 block leading-none">Warranty</span>
                    <strong className="text-emerald-950 font-semibold text-xs truncate block mt-0.5">
                      {myQuote.warranty}
                    </strong>
                  </div>
                </div>
              ) : null}

              {myQuote.expiresAt ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-smoke/40 border border-line/60 px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-muted shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-medium text-muted block leading-none">Valid Until</span>
                    <strong className="text-title font-semibold text-xs truncate block mt-0.5">
                      {myQuote.expiresAt}
                    </strong>
                  </div>
                </div>
              ) : null}

              {myQuote.exclusions ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-medium text-amber-700/80 block leading-none">Exclusions</span>
                    <strong className="text-amber-950 font-semibold text-xs truncate block mt-0.5">
                      {myQuote.exclusions}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>

            {myQuote.paymentTerms ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-smoke/40 p-3 border border-line/60 text-xs text-copy">
                <CreditCard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-title">Payment Terms: </span>
                  <span>{myQuote.paymentTerms}</span>
                </div>
              </div>
            ) : null}

            {myQuote.notes ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-smoke/40 p-3 border border-line/60 text-xs text-copy">
                <FileText className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-title">Contractor Notes: </span>
                  <span>{myQuote.notes}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <ProQuoteForm jobId={jobId} onPass={pass} />
      )}
    </div>
  );
}
