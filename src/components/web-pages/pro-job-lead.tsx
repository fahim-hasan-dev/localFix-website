"use client";

import { useRouter } from "next/navigation";
import { RequestDetail } from "@/components/web-pages/request-detail";
import { ProQuoteForm } from "@/components/web-pages/pro-quote-form";
import { Button } from "@/components/ui/button";
import { isSamePro, normalizeProId, selectBooking, selectJob, selectQuotesForJob } from "@/lib/marketplace";
import { useRoleAccess } from "@/hooks/use-role-access";
import { setLeadAction } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import {
  Calendar,
  Clock,
  Package,
  ShieldCheck,
  CalendarDays,
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
  const booking = useAppSelector((state) => selectBooking(state, jobId));
  const leadAction = useAppSelector((state) => state.features.leadActions[jobId] ?? "open");
  const hiredQuoteId = useAppSelector((state) => state.marketplace.hiredByJob[jobId]);
  const user = useAppSelector((state) => state.auth.user);
  const myProId = normalizeProId(user?.role === "pro" && user?.id ? user.id : "pro-1");
  const quotes = useAppSelector((state) => selectQuotesForJob(state, jobId));
  const myQuote = quotes.find((quote) => isSamePro(quote.proId, myProId));
  const alreadyQuoted = Boolean(myQuote);

  const isBooked = Boolean(
    job && ["hired", "scheduled", "en_route", "in_progress", "awaiting_confirm", "completed"].includes(job.status)
  );

  const resolvedBackHref = backHref ?? (isBooked ? "/pro/bookings" : "/pro/jobs");
  const resolvedBackLabel = backLabel ?? (isBooked ? "My Bookings" : "Available jobs");

  const isFromBookings = resolvedBackHref === "/pro/bookings" || backHref === "/pro/bookings";

  const isMyBooking = Boolean(
    isFromBookings ||
    (booking && (isSamePro(booking.proId, myProId) || !booking.proId)) ||
    (myQuote && hiredQuoteId === myQuote.id) ||
    (job && isSamePro(job.requestedProId, myProId) && isBooked)
  );

  const forSomeoneElse = Boolean(!isMyBooking && job?.requestedProId && !isSamePro(job.requestedProId, myProId));
  const hiredElsewhere = Boolean(
    !isMyBooking &&
    isBooked &&
    ((booking && !isSamePro(booking.proId, myProId)) || (hiredQuoteId && (!myQuote || hiredQuoteId !== myQuote.id)))
  );
  const passed = leadAction === "declined";

  function accept() {
    dispatch(setLeadAction({ jobId, action: "accepted" }));
  }

  function pass() {
    dispatch(setLeadAction({ jobId, action: "declined" }));
    router.push(resolvedBackHref);
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <RequestDetail
        id={jobId}
        backHref={resolvedBackHref}
        backLabel={resolvedBackLabel}
        inboxHref="/pro/messages"
        viewer="pro"
      />

      {isMyBooking && isBooked ? null : forSomeoneElse ? (
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
        <div className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-7 md:p-8 shadow-xs space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/60 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
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
              <p className="mt-1 text-xs text-muted">
                Sent to {job?.homeownerName ?? "Homeowner"} · Direct payment upon completion
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="font-display text-2xl font-bold text-title">
                ${myQuote.amount}
              </span>
              <span className="text-xs text-muted block capitalize">
                {myQuote.priceType === "hourly" ? "/hr" : myQuote.priceType}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            {/* Scope of Work */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Scope of Work
              </h4>
              <p className="text-xs sm:text-sm text-copy leading-relaxed">
                {!myQuote.scope || /^(veniam|elit|rerum|occaecat|lorem|ipsum)/i.test(myQuote.scope)
                  ? "Full diagnostic inspection, specialized repair according to homeowner requirements, professional labor, and safety testing."
                  : myQuote.scope}
              </p>
            </div>

            {/* Specifications in Unified Clean Grid (No separate awkward boxes) */}
            <div className="pt-4 border-t border-line/50">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3.5">
                Quotation Terms &amp; Timeline
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 sm:gap-y-5 gap-x-6 text-xs">
                {myQuote.proposedSchedule || myQuote.availability ? (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-muted block leading-none font-normal">
                        Schedule
                      </span>
                      <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
                        {(myQuote.proposedSchedule || myQuote.availability || "").replace(/\(\((.*?)\)\)/g, "($1)").replace(/\((.*?)\s*\((.*?)\)\)/g, "$1 · $2")}
                      </strong>
                    </div>
                  </div>
                ) : null}

                {myQuote.estimatedDuration ? (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-muted block leading-none font-normal">
                        Duration
                      </span>
                      <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
                        {myQuote.estimatedDuration}
                      </strong>
                    </div>
                  </div>
                ) : null}

                {myQuote.materialsIncluded != null ? (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-muted block leading-none font-normal">
                        Parts &amp; Materials
                      </span>
                      <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
                        {myQuote.materialsIncluded ? "All parts & fittings included" : "Labor only (parts extra)"}
                      </strong>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-muted block leading-none font-normal">
                      Warranty
                    </span>
                    <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
                      {!myQuote.warranty || /^(veniam|elit|rerum|occaecat)/i.test(myQuote.warranty)
                        ? "1-Year Workmanship Warranty"
                        : myQuote.warranty}
                    </strong>
                  </div>
                </div>

                {myQuote.paymentTerms ? (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-muted block leading-none font-normal">
                        Payment Terms
                      </span>
                      <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
                        {/^(veniam|elit|rerum|occaecat)/i.test(myQuote.paymentTerms)
                          ? "Direct payment upon 100% completion (Card, Transfer, or Cash)"
                          : myQuote.paymentTerms.replace(/Accepted:\s*(veniam|rerum|elit).*$/i, "Accepted: Card, Bank Transfer, Cash")}
                      </strong>
                    </div>
                  </div>
                ) : null}

                {myQuote.expiresAt ? (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-muted block leading-none font-normal">
                        Valid Until
                      </span>
                      <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
                        {myQuote.expiresAt}
                      </strong>
                    </div>
                  </div>
                ) : null}

                {myQuote.notes && !/^(veniam|elit|rerum|occaecat)/i.test(myQuote.notes) ? (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-muted block leading-none font-normal">
                        Contractor Notes
                      </span>
                      <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
                        {myQuote.notes}
                      </strong>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ProQuoteForm jobId={jobId} onPass={pass} />
      )}
    </div>
  );
}
