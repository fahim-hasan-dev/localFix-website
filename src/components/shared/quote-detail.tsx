"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
  X,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, TextField } from "@/components/ui/field";
import { offerStatusLabels } from "@/Mockdata";
import { useResolvedPro } from "@/hooks/use-resolved-pro";
import { selectablePaymentMethods, selectJob, selectQuotesForJob } from "@/lib/marketplace";
import {
  confirmBooking,
  hireQuote,
  setOfferStatus,
  setPaymentArrangement,
} from "@/redux/slices/marketplaceSlice";
import { addNotification, setJobStatus } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { errorMessage } from "@/lib/booking-view";
import { mapLiveJob, mapQuotation, toApiPaymentMethod, unwrapJobRecord, type ApiQuotation } from "@/lib/marketplace-mappers";
import {
  useAcceptQuotationMutation,
  useDeclineQuotationMutation,
  useGetQuotationQuery,
} from "@/services/client/marketplace-api";
import { useGetJobQuery } from "@/services/client/jobs-api";
import type { DirectPaymentMethod, Quote } from "@/types";

function quotationRecord(data: unknown): ApiQuotation | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { quotation?: ApiQuotation; _id?: string };
  if (record.quotation && typeof record.quotation === "object" && record.quotation._id) return record.quotation;
  if (record._id) return record as ApiQuotation;
  return null;
}

const priceLabels: Record<string, string> = {
  fixed: "Fixed Price",
  estimate: "Estimate",
  hourly: "Hourly",
  time_and_materials: "Time & Materials",
};

function SpecBlockItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-title mt-0.5" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-title">{value}</p>
      </div>
    </div>
  );
}

export function QuoteDetail({
  jobId,
  quoteId,
  canHire = false,
}: {
  jobId: string;
  quoteId: string;
  canHire?: boolean;
}) {
  const dispatch = useAppDispatch();
  const job = useAppSelector((state) => selectJob(state, jobId));
  const quotes = useAppSelector((state) => selectQuotesForJob(state, jobId));
  const isLiveQuoteId = /^[0-9a-f]{24}$/i.test(quoteId);
  const quoteQuery = useGetQuotationQuery(quoteId, { skip: !isLiveQuoteId });
  const jobQuery = useGetJobQuery(jobId, { skip: !jobId });
  const liveQuote = useMemo(() => {
    const direct = quotationRecord(quoteQuery.data?.data);
    if (direct?._id) return mapQuotation(direct, jobId);
    const rawJob = unwrapJobRecord(jobQuery.data?.data);
    const fromJob = rawJob ? mapLiveJob(rawJob).quotes : [];
    return (
      fromJob.find((item) => item.id === quoteId) ??
      fromJob.find((item) => !item.id.startsWith("quote-local-")) ??
      null
    );
  }, [jobId, jobQuery.data, quoteId, quoteQuery.data]);
  const storedQuote = quotes.find((item) => item.id === quoteId && !item.id.startsWith("quote-local-"));
  const quote: Quote | undefined = liveQuote ?? storedQuote;
  const loadingQuote = !quote && (quoteQuery.isLoading || quoteQuery.isFetching || jobQuery.isLoading || jobQuery.isFetching);
  const hiredId = useAppSelector((state) => state.marketplace.hiredByJob[jobId]);
  const booking = useAppSelector((state) => state.marketplace.bookings[jobId]);
  const homeownerName = useAppSelector((state) => state.auth.user?.name);
  const [bookDate, setBookDate] = useState("");
  const [arrivalWindow, setArrivalWindow] = useState("10:00 AM – 12:00 PM (Late Morning)");
  const [payMethod, setPayMethod] = useState<DirectPaymentMethod>("cash");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [acceptQuotation] = useAcceptQuotationMutation();
  const [declineQuotation] = useDeclineQuotationMutation();
  const pro = useResolvedPro(quote?.proId);

  if (loadingQuote || (!job && jobQuery.isLoading)) {
    return <p className="text-sm text-muted">Loading quotation…</p>;
  }

  if (!quote || !job) {
    return (
      <div className="rounded-[16px] border border-line bg-white p-6">
        <p className="text-sm text-muted">Quotation not found.</p>
        <Link href={`/account/jobs/${jobId}`} className="mt-3 inline-flex text-sm font-semibold text-primary">
          ← Back to request
        </Link>
      </div>
    );
  }

  const hired = hiredId === quote.id;
  const closed = quote.status === "rejected" || quote.status === "withdrawn" || quote.status === "expired";
  const jobClosed = job.status === "cancelled" || job.status === "disputed";
  const price =
    quote.priceMax != null
      ? `$${quote.amount}–$${quote.priceMax}`
      : `$${quote.amount}${quote.priceType === "hourly" ? "/hr" : ""}`;

  async function accept() {
    if (!quote) return;
    if (!bookDate) {
      setMsg("Please choose an appointment date.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await acceptQuotation({
        id: quote.id,
        appointmentDate: bookDate,
        paymentMethod: toApiPaymentMethod(payMethod),
        arrivalTimeWindow: arrivalWindow,
      }).unwrap();
    } catch (err) {
      setMsg(errorMessage(err, "This quotation could not be accepted."));
      setBusy(false);
      return;
    }
    setBusy(false);
    dispatch(
      hireQuote({
        jobId,
        quoteId: quote.id,
        proId: quote.proId,
        agreedPrice: quote.amount,
        scopeSnapshot: quote.scope,
        homeownerName,
        paymentTerms: quote.paymentTerms,
        siblingQuoteIds: quotes.map((item) => item.id),
      }),
    );
    dispatch(setJobStatus({ jobId, status: "hired" }));
    dispatch(
      addNotification({
        title: "Quotation accepted",
        body: `${pro?.name ?? "The professional"} was selected. Confirm schedule and how you will pay them directly.`,
        href: `/account/jobs/${jobId}`,
        createdAt: "Just now",
        role: "homeowner",
      }),
    );
    dispatch(
      addNotification({
        title: "You were hired",
        body: `A homeowner accepted your $${quote.amount} quotation. Confirm the schedule on the job.`,
        href: `/pro/jobs/${jobId}`,
        createdAt: "Just now",
        role: "pro",
      }),
    );
    finishBooking();
  }

  async function decline() {
    if (!quote) return;
    setBusy(true);
    setMsg("");
    try {
      await declineQuotation(quote.id).unwrap();
    } catch (err) {
      setMsg(errorMessage(err, "This quotation could not be declined."));
      setBusy(false);
      return;
    }
    setBusy(false);
    dispatch(setOfferStatus({ quoteId: quote.id, status: "rejected" }));
    setMsg("Quote declined.");
  }

  function lockBooking() {
    if (!quote) return;
    if (!bookDate) {
      setMsg("Please choose an appointment date.");
      return;
    }
    finishBooking();
  }

  /** Local booking state (instant UI). The API accept call has already created the booking server-side. */
  function finishBooking() {
    if (!quote) return;
    dispatch(
      confirmBooking({
        jobId,
        quoteId: quote.id,
        proId: quote.proId,
        agreedPrice: quote.amount,
        scheduledDate: bookDate,
        scheduledTime: arrivalWindow,
        arrivalWindow,
        scopeSnapshot: quote.scope,
        paymentArrangement: payMethod,
        paymentTerms: quote.paymentTerms,
      }),
    );
    dispatch(setPaymentArrangement({ jobId, paymentArrangement: payMethod }));
    dispatch(setJobStatus({ jobId, status: "scheduled" }));
    dispatch(
      addNotification({
        title: "Booking confirmed",
        body: `${bookDate} · $${quote.amount}. Pay the professional directly — Local Fix does not collect this.`,
        href: `/account/jobs/${jobId}`,
        createdAt: "Just now",
        role: "homeowner",
      }),
    );
    dispatch(
      addNotification({
        title: "Booking confirmed",
        body: `Schedule locked for ${bookDate}. Payment is arranged off-platform.`,
        href: `/pro/jobs/${jobId}`,
        createdAt: "Just now",
        role: "pro",
      }),
    );
    setMsg("Booking confirmed. Pay the professional directly using the agreed method.");
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/account/jobs/${jobId}`}
        className="inline-flex items-center gap-1 font-display text-sm font-semibold text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to request
      </Link>

      <article className="overflow-hidden rounded-[16px] border border-line/80 bg-white shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {pro ? (
              <Link
                href={`/browse-pros/${pro.id}`}
                title={`View ${pro.name}'s profile`}
                className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line/80 bg-slate-100 transition hover:ring-2 hover:ring-primary/40 cursor-pointer shadow-2xs"
              >
                {pro.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={pro.avatar}
                    alt={pro.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-sm font-bold text-title">
                    {pro.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("") || "?"}
                  </span>
                )}
              </Link>
            ) : (
              <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line/80 bg-slate-100 shadow-2xs">
                <span className="font-display text-sm font-bold text-muted">?</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {pro ? (
                  <Link
                    href={`/browse-pros/${pro.id}`}
                    className="font-display text-lg font-semibold text-title hover:text-primary transition-colors hover:underline"
                  >
                    {pro.name}
                  </Link>
                ) : (
                  <span className="font-display text-lg font-semibold text-title">
                    Professional
                  </span>
                )}
                {pro?.clearance === "cleared" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : null}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                {pro?.rating ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-title">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    {pro.rating.toFixed(1)}
                    {pro.reviewCount ? <span className="font-normal text-muted">({pro.reviewCount})</span> : null}
                  </span>
                ) : null}
                {pro?.trade ? <span>{pro.trade}</span> : null}
                {pro?.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {pro.city}
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-line bg-smoke px-2.5 py-1 text-xs font-medium text-copy">
              {priceLabels[quote.priceType] ?? "Fixed Price"}
            </span>
            <Badge tone={hired ? "green" : quote.status === "rejected" ? "slate" : "amber"}>
              {hired ? "Hired" : quote.status === "rejected" ? "Declined" : offerStatusLabels[quote.status] ?? quote.status}
            </Badge>
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Quoted price</p>
              <p className="mt-0.5 font-display text-3xl font-bold tracking-tight text-title">{price}</p>
            </div>
            {quote.materialsIncluded != null ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                <Package className="h-3.5 w-3.5" />
                {quote.materialsIncluded ? "Parts included" : "Parts extra"}
              </span>
            ) : null}
          </div>
          {quote.scope ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Scope of Work</p>
              <p className="mt-1 text-sm leading-relaxed text-copy">{quote.scope}</p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-x-6 gap-y-4 border-t border-line/70 pt-4 sm:grid-cols-2">
            {quote.estimatedDuration ? (
              <SpecBlockItem icon={Clock} label="Estimated Duration" value={quote.estimatedDuration} />
            ) : null}
            {quote.proposedSchedule || quote.availability ? (
              <SpecBlockItem
                icon={Calendar}
                label="Availability & Arrival"
                value={quote.proposedSchedule || quote.availability}
              />
            ) : null}
            {quote.warranty ? <SpecBlockItem icon={ShieldCheck} label="Warranty Guarantee" value={quote.warranty} /> : null}
            {quote.paymentTerms ? <SpecBlockItem icon={Wallet} label="Direct Payment" value={quote.paymentTerms} /> : null}
            {quote.exclusions ? <SpecBlockItem icon={Ban} label="Not Included" value={quote.exclusions} /> : null}
            {quote.expiresAt ? <SpecBlockItem icon={Clock} label="Quote Valid Until" value={quote.expiresAt} /> : null}
          </div>

          {quote.notes ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-smoke/40 p-3.5 text-xs text-copy">
              <FileText className="h-4 w-4 shrink-0 text-title mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold uppercase tracking-wider text-[10px] text-muted">
                  Contractor Notes &amp; Site Prep
                </p>
                <p className="mt-0.5 leading-relaxed text-title font-medium">{quote.notes}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line/70 px-5 py-4 sm:px-6">
          <Button href={`/account/messages?dm=${quote.proId}`} size="sm" variant="ghost">
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>
          {pro ? (
            <Button href={`/browse-pros/${pro.id}`} size="sm" variant="ghost">
              <UserRound className="h-4 w-4" />
              View profile
            </Button>
          ) : null}
          {canHire && !hiredId && !closed && !jobClosed ? (
            <>
              <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={decline} className="sm:ml-auto">
                <X className="h-4 w-4" />
                Decline
              </Button>
              <Button type="button" size="sm" disabled={busy} onClick={() => setShowSchedule(true)}>
                <Check className="h-4 w-4" />
                Accept quote
              </Button>
            </>
          ) : null}
        </div>

        {canHire &&
        !booking?.scheduledDate &&
        !closed &&
        !jobClosed &&
        (hired || (!hiredId && showSchedule)) ? (
          <div className="mx-5 mb-5 space-y-3 rounded-2xl border border-primary/30 bg-smoke/80 p-4 sm:mx-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-title">
              <Calendar className="h-4 w-4 text-primary" />
              Confirm appointment
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date">
                <TextField type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
              </Field>
              <Field label="How you will pay the pro">
                <NativeSelect
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as DirectPaymentMethod)}
                >
                  {selectablePaymentMethods.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Arrival window">
                <NativeSelect value={arrivalWindow} onChange={(e) => setArrivalWindow(e.target.value)}>
                  <option value="8:00 AM – 10:00 AM (Early Morning)">8:00 AM – 10:00 AM</option>
                  <option value="10:00 AM – 12:00 PM (Late Morning)">10:00 AM – 12:00 PM</option>
                  <option value="1:00 PM – 3:00 PM (Early Afternoon)">1:00 PM – 3:00 PM</option>
                  <option value="3:00 PM – 5:00 PM (Late Afternoon)">3:00 PM – 5:00 PM</option>
                  <option value="Flexible (Anytime during business hours)">Flexible</option>
                </NativeSelect>
              </Field>
            </div>
            <Button type="button" size="sm" disabled={busy} onClick={hired ? lockBooking : accept}>
              {busy ? "Saving…" : hired ? "Confirm booking" : "Accept & confirm booking"}
            </Button>
          </div>
        ) : null}

        {hired && booking?.scheduledDate ? (
          <div className="mx-5 mb-5 rounded-xl border border-success/30 bg-success/[0.05] p-4 sm:mx-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" />
              Booked for {booking.scheduledDate} · {booking.scheduledTime}
            </p>
          </div>
        ) : null}

        {msg ? <p className="px-5 pb-4 text-xs font-medium text-primary sm:px-6">{msg}</p> : null}
      </article>
    </div>
  );
}
