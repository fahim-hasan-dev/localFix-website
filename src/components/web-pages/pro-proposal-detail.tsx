"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProLiveJobDetail } from "@/components/web-pages/pro-live-job";
import { isSamePro, normalizeProId, selectJob, selectQuotesForJob } from "@/lib/marketplace";
import { mapJobRequest, mapLiveJob, mapQuotation, unwrapJobRecord } from "@/lib/marketplace-mappers";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { upsertLiveJob } from "@/redux/slices/marketplaceSlice";
import {
  useGetDirectRequestQuery,
  useGetJobQuery,
  useGetMarketplaceLeadQuery,
} from "@/services/client/jobs-api";
import { useGetQuotationQuery } from "@/services/client/marketplace-api";
import { cn } from "@/lib/cn";
import type { JobStatus, Quote } from "@/types";

const ACCEPTED_STAGES: JobStatus[] = [
  "hired",
  "scheduled",
  "en_route",
  "in_progress",
  "awaiting_confirm",
  "completed",
  "cancelled",
  "disputed",
];

export function ProProposalDetail({
  jobId,
  quoteId,
}: {
  jobId: string;
  quoteId?: string;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const myProId = user?.id ? normalizeProId(user.id) : "";
  const storeJob = useAppSelector((state) => selectJob(state, jobId));
  const storeQuotes = useAppSelector((state) => selectQuotesForJob(state, jobId));
  const hiredQuoteId = useAppSelector((state) => state.marketplace.hiredByJob[jobId]);

  const lead = useGetMarketplaceLeadQuery(jobId);
  const direct = useGetDirectRequestQuery(jobId, { skip: !lead.isError });
  const jobQuery = useGetJobQuery(jobId, { skip: !lead.isError || !direct.isError });
  const hiredJob = useGetJobQuery(jobId);
  const quoteQuery = useGetQuotationQuery(quoteId || "", { skip: !quoteId });

  const hired = useMemo(() => {
    const raw = unwrapJobRecord(hiredJob.data?.data);
    return raw ? mapLiveJob(raw) : null;
  }, [hiredJob.data]);
  const accepted = Boolean(
    hired &&
      (ACCEPTED_STAGES.includes(hired.job.status) ||
        hired.quotes.some(
          (quote) => quote.status === "accepted" && (!quoteId || quote.id === quoteId),
        )),
  );

  const live = lead.data ?? direct.data ?? jobQuery.data;
  const mapped = useMemo(() => {
    const raw = unwrapJobRecord(live?.data);
    if (!raw) return null;
    return {
      job: mapJobRequest(raw),
      quotes: (raw.quotations || []).map((quote) => mapQuotation(quote, raw._id)),
    };
  }, [live]);

  const apiQuote = useMemo((): Quote | null => {
    const rawQuote = quoteQuery.data?.data;
    if (!rawQuote || typeof rawQuote !== "object") return null;
    return mapQuotation(rawQuote as Parameters<typeof mapQuotation>[0], jobId);
  }, [quoteQuery.data, jobId]);

  // Hydrate store once per job/quote payload — avoid dispatch loops.
  const hydratedKey = useRef("");
  useEffect(() => {
    if (!mapped || accepted) return;
    const key = `${mapped.job.id}:${apiQuote?.id || mapped.quotes.map((q) => q.id).join(",")}`;
    if (hydratedKey.current === key) return;
    hydratedKey.current = key;
    const quotes = apiQuote
      ? [apiQuote, ...mapped.quotes.filter((q) => q.id !== apiQuote.id)]
      : mapped.quotes;
    dispatch(upsertLiveJob({ job: mapped.job, quotes }));
  }, [accepted, apiQuote, dispatch, mapped]);

  const job = storeJob || mapped?.job;
  const quotes = storeQuotes.length
    ? storeQuotes
    : [
        ...(apiQuote ? [apiQuote] : []),
        ...(mapped?.quotes || []).filter((q) => !apiQuote || q.id !== apiQuote.id),
      ];
  const myQuote =
    (quoteId ? quotes.find((q) => q.id === quoteId) : undefined) ||
    (apiQuote && (!quoteId || apiQuote.id === quoteId) ? apiQuote : undefined) ||
    quotes.find((q) => isSamePro(q.proId, myProId)) ||
    quotes[0];

  if (hiredJob.isLoading) {
    return <p className="text-sm text-muted">Loading proposal…</p>;
  }
  if (accepted) {
    return <ProLiveJobDetail jobId={jobId} />;
  }

  const loading =
    (!job || !myQuote) &&
    (lead.isFetching || direct.isFetching || jobQuery.isFetching || Boolean(quoteId && quoteQuery.isFetching));

  if (loading) {
    return <p className="text-sm text-muted">Loading proposal…</p>;
  }

  if (!job || !myQuote) {
    return (
      <div className="rounded-xl border border-line/80 bg-white p-6 space-y-3">
        <p className="text-sm text-muted">Proposal could not be found.</p>
        <Button href={`/pro/jobs/${jobId}`} size="sm" variant="ghost">
          Back to request
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/pro/jobs?tab=quoted"
          className="inline-flex font-display text-sm font-semibold text-primary"
        >
          ← My proposals
        </Link>
        <Button href={`/pro/jobs/${jobId}`} size="sm" variant="ghost" className="rounded-full text-xs">
          View request details
        </Button>
      </div>

      <div className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/60 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-title">
                Your Proposal
              </h1>
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
            <p className="mt-1.5 text-sm text-muted">
              For <span className="font-semibold text-title">{job.title}</span>
              {job.homeownerName ? ` · ${job.homeownerName}` : ""}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="font-display text-2xl font-bold text-title">${myQuote.amount}</span>
            <span className="text-xs text-muted block capitalize">
              {myQuote.priceType === "hourly" ? "/hr" : myQuote.priceType}
            </span>
          </div>
        </div>

        {myQuote.scope ? (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
              Scope of Work
            </h2>
            <p className="text-sm text-copy leading-relaxed whitespace-pre-line">{myQuote.scope}</p>
          </div>
        ) : null}

        <div className="pt-4 border-t border-line/50">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3.5">
            Quotation Terms &amp; Timeline
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 sm:gap-y-5 gap-x-6 text-xs">
            {myQuote.proposedSchedule || myQuote.availability ? (
              <Fact icon={Calendar} label="Schedule" value={myQuote.proposedSchedule || myQuote.availability || ""} />
            ) : null}
            {myQuote.estimatedDuration ? (
              <Fact icon={Clock} label="Duration" value={myQuote.estimatedDuration} />
            ) : null}
            {myQuote.materialsIncluded != null ? (
              <Fact
                icon={Package}
                label="Parts & Materials"
                value={myQuote.materialsIncluded ? "All parts & fittings included" : "Labor only (parts extra)"}
              />
            ) : null}
            {myQuote.warranty ? <Fact icon={ShieldCheck} label="Warranty" value={myQuote.warranty} /> : null}
            {myQuote.paymentTerms ? (
              <Fact icon={CreditCard} label="Payment Terms" value={myQuote.paymentTerms} />
            ) : null}
            {myQuote.expiresAt ? <Fact icon={CalendarDays} label="Valid Until" value={myQuote.expiresAt} /> : null}
          </div>

          {myQuote.notes ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-line/80 bg-smoke/40 p-3.5 text-xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-line text-primary shadow-2xs mt-0.5">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block leading-none">
                  Contractor Notes &amp; Site Prep
                </span>
                <p className="mt-1.5 text-xs sm:text-sm text-title leading-relaxed font-medium">
                  {myQuote.notes}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] text-muted block leading-none font-normal">{label}</span>
        <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
          {value}
        </strong>
      </div>
    </div>
  );
}
