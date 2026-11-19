"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { TextArea } from "@/components/ui/field";
import {
  bookingBadgeStatus,
  canHomeownerCancelBooking,
  bookingCategoryName,
  bookingJob,
  checkoutUrlFrom,
  errorMessage,
  extractBooking,
  formatBookingDate,
  formatBookingDateTime,
} from "@/lib/booking-view";
import { bookingToJob, toApiPaymentMethod } from "@/lib/marketplace-mappers";
import {
  useCancelBookingMutation,
  useCompleteBookingWorkMutation,
  useConfirmBookingCompletionMutation,
  useCreateReviewMutation,
  useGetBookingQuery,
  useMarkBookingOnTheWayMutation,
  useRescheduleBookingMutation,
  useStartBookingWorkMutation,
  useVerifyBookingPaymentMutation,
} from "@/services/client/marketplace-api";
import { cn } from "@/lib/cn";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "stripe", label: "Stripe" },
];

const ARRIVAL_WINDOWS = [
  "8:00 AM – 10:00 AM (Early Morning)",
  "10:00 AM – 12:00 PM (Late Morning)",
  "1:00 PM – 3:00 PM (Early Afternoon)",
  "3:00 PM – 5:00 PM (Late Afternoon)",
  "Flexible (Anytime during business hours)",
];

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function BookingLiveDetail({
  id,
  role,
  backHref,
  backLabel,
  messagesHref,
}: {
  id: string;
  role: "homeowner" | "pro";
  backHref: string;
  backLabel: string;
  messagesHref: string;
}) {
  const { data, isLoading, isError, refetch } = useGetBookingQuery(id);
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation();
  const [markOnTheWay, { isLoading: movingOnTheWay }] = useMarkBookingOnTheWayMutation();
  const [startWork, { isLoading: starting }] = useStartBookingWorkMutation();
  const [completeWork, { isLoading: completing }] = useCompleteBookingWorkMutation();
  const [confirmCompletion, { isLoading: confirming }] = useConfirmBookingCompletionMutation();
  const [createReview, { isLoading: reviewing }] = useCreateReviewMutation();
  const [rescheduleBooking, { isLoading: rescheduling }] = useRescheduleBookingMutation();
  const [verifyPayment] = useVerifyBookingPaymentMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    void verifyPayment(id);
  }, [id, verifyPayment]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#review") return;
    const el = document.getElementById("review");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [data]);

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleWindow, setRescheduleWindow] = useState("");
  const [reschedulePayment, setReschedulePayment] = useState("");
  const [rescheduleSaved, setRescheduleSaved] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const [scheduleErrors, setScheduleErrors] = useState<{ date?: string; window?: string }>({});

  const raw = extractBooking(data?.data);

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-muted">Loading booking...</p>;
  }

  if (isError || !raw) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted">This booking is not available.</p>
        <Link href={backHref} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
          Back to {backLabel}
        </Link>
      </div>
    );
  }

  const bookingId = raw._id;
  const job = bookingToJob(raw);
  const status = bookingBadgeStatus(raw);
  const category = bookingCategoryName(raw);
  const requestRaw = bookingJob(raw);
  const quote = typeof raw.quotation === "object" && raw.quotation ? raw.quotation : null;
  const other = role === "pro" ? raw.homeowner : raw.professional;
  const otherName =
    role === "pro"
      ? raw.homeowner?.name || "Homeowner"
      : raw.professional?.companyName || raw.professional?.name || "Contractor";
  const scope = quote?.scopeOfWork || requestRaw?.description || "";
  const location = [requestRaw?.serviceLocation?.address, requestRaw?.serviceLocation?.city, requestRaw?.serviceLocation?.state, requestRaw?.serviceLocation?.zipCode]
    .filter(Boolean)
    .join(", ");

  const closed = status === "completed" || status === "cancelled" || status === "disputed";
  const effectivePayment = paymentMethod || raw.settledPaymentMethod || raw.paymentMethod || "cash";
  const canReschedule = role === "homeowner" && status === "scheduled" && !closed;
  const rescheduleDateValue = rescheduleDate || toDateInput(raw.appointmentDate);
  const rescheduleWindowValue = rescheduleWindow || raw.arrivalTimeWindow || ARRIVAL_WINDOWS[1];
  const rescheduleWindowOptions = Array.from(new Set([rescheduleWindowValue, ...ARRIVAL_WINDOWS]));

  async function run(action: () => Promise<unknown>, fallback: string) {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(errorMessage(error, fallback));
    }
  }

  const timeline = [
    { label: "Booked", value: raw.createdAt },
    { label: "On the way", value: raw.onTheWayAt },
    { label: "Work started", value: raw.workStartedAt },
    { label: "Marked complete by pro", value: raw.contractorCompletedAt },
    { label: "Confirmed by homeowner", value: raw.homeownerCompletedAt },
  ].filter((item) => item.value);

  return (
    <div className="w-full max-w-4xl space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      <Card className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-tight text-title">
              {job.title}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted">
              {role === "pro" ? "Client" : "Contractor"}: {otherName}
              {category ? ` · ${category}` : ""}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-4 grid gap-3 text-xs sm:text-sm text-muted sm:grid-cols-3">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatBookingDate(raw.appointmentDate, "Date coordinated")}
            {raw.arrivalTimeWindow ? ` (${raw.arrivalTimeWindow})` : ""}
          </span>
          <span className="font-semibold text-title">Agreed price: ${Number(raw.totalAmount || quote?.totalRate || 0)}</span>
          <span>Payment: {raw.settledPaymentMethod || raw.paymentMethod || "To be arranged"}</span>
        </div>

        {location ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted">
            <MapPin className="h-4 w-4" />
            {location}
          </p>
        ) : null}

        {scope ? (
          <div className="mt-4 border-t border-line/60 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Scope of work</p>
            <p className="mt-1 text-sm leading-relaxed text-copy">{scope}</p>
          </div>
        ) : null}

        {raw.contractorCompletionNote ? (
          <div className="mt-4 border-t border-line/60 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Contractor completion note</p>
            <p className="mt-1 text-sm leading-relaxed text-copy">{raw.contractorCompletionNote}</p>
          </div>
        ) : null}
      </Card>

      {timeline.length ? (
        <Card className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-xs">
          <p className="font-display text-sm font-bold text-title">Progress</p>
          <ul className="mt-3 space-y-2 text-xs sm:text-sm">
            {timeline.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-copy">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {item.label}
                </span>
                <span className="text-muted">{formatBookingDateTime(item.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-xs">
        <p className="font-display text-sm font-bold text-title">Actions</p>

        {/* Pro lifecycle actions */}
        {role === "pro" && !closed ? (
          <div className="mt-3 space-y-3">
            {status === "scheduled" || status === "hired" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={movingOnTheWay}
                  onClick={() => run(() => markOnTheWay(bookingId).unwrap(), "Could not update booking.")}
                >
                  {movingOnTheWay ? "Updating…" : "I'm on the way"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={starting}
                  onClick={() => run(() => startWork(bookingId).unwrap(), "Could not start work.")}
                >
                  {starting ? "Starting…" : "Start work"}
                </Button>
              </div>
            ) : null}
            {status === "en_route" ? (
              <Button
                type="button"
                size="sm"
                disabled={starting}
                onClick={() => run(() => startWork(bookingId).unwrap(), "Could not start work.")}
              >
                {starting ? "Starting…" : "Start work"}
              </Button>
            ) : null}
            {status === "in_progress" ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-title">
                  Completion note <span className="font-normal text-muted">(optional)</span>
                </label>
                <TextArea
                  value={completionNote}
                  onChange={(event) => setCompletionNote(event.target.value)}
                  placeholder="Describe the completed work for the homeowner…"
                  className="min-h-[85px] bg-white text-xs sm:text-sm rounded-lg"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={completing}
                  onClick={() =>
                    run(
                      () => completeWork({ id: bookingId, completionNote: completionNote.trim() }).unwrap(),
                      "Could not mark the work complete.",
                    )
                  }
                >
                  {completing ? "Submitting…" : "Mark work complete"}
                </Button>
              </div>
            ) : null}
            {status === "awaiting_confirm" ? (
              <p className="text-xs text-muted">Waiting for the homeowner to confirm completion.</p>
            ) : null}
          </div>
        ) : null}

        {/* Homeowner confirmation */}
        {role === "homeowner" && status === "awaiting_confirm" ? (
          <div className="mt-3 space-y-3 text-xs sm:text-sm">
            <label className="block space-y-1.5">
              <span className="font-semibold text-title">Payment method (optional)</span>
              <select
                value={effectivePayment === "stripe" ? "stripe" : "cash"}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-title outline-none focus:border-primary"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={confirming}
                onClick={() =>
                  run(async () => {
                    const result = await confirmCompletion({
                      id: bookingId,
                      paymentMethod: toApiPaymentMethod(effectivePayment),
                      isPaidDirectly: effectivePayment !== "stripe",
                      isSatisfactionConfirmed: true,
                    }).unwrap();
                    const checkout = checkoutUrlFrom(result);
                    if (checkout) window.location.assign(checkout);
                  }, "Could not confirm completion.")
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {confirming ? "Confirming…" : "Confirm completion"}
              </Button>
              {other?._id ? (
                <Button href={`${messagesHref}?dm=${other._id}`} size="sm" variant="ghost">
                  Message contractor
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Homeowner reschedule (only before the pro is on the way) */}
        {canReschedule ? (
          <div className="mt-4 space-y-3 text-xs sm:text-sm">
            {rescheduleSaved && !showReschedule ? (
              <p className="text-xs text-emerald-700">Appointment updated.</p>
            ) : null}
            {showReschedule ? (
              <div className="space-y-3 rounded-xl border border-line/80 bg-smoke/50 p-4">
                <p className="font-semibold text-title">Reschedule appointment</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="font-semibold text-title">
                      Date <span className="text-error">*</span>
                    </span>
                    <input
                      type="date"
                      value={rescheduleDateValue}
                      aria-invalid={Boolean(scheduleErrors.date)}
                      onChange={(event) => {
                        setRescheduleDate(event.target.value);
                        setScheduleErrors((prev) => ({ ...prev, date: undefined }));
                      }}
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-title outline-none ${
                        scheduleErrors.date ? "border-error" : "border-line focus:border-primary"
                      }`}
                    />
                    {scheduleErrors.date ? (
                      <span data-field-error="" className="block text-xs font-medium text-error">
                        {scheduleErrors.date}
                      </span>
                    ) : null}
                  </label>
                  <label className="block space-y-1.5">
                    <span className="font-semibold text-title">
                      Arrival window <span className="text-error">*</span>
                    </span>
                    <select
                      value={rescheduleWindowValue}
                      aria-invalid={Boolean(scheduleErrors.window)}
                      onChange={(event) => {
                        setRescheduleWindow(event.target.value);
                        setScheduleErrors((prev) => ({ ...prev, window: undefined }));
                      }}
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-title outline-none ${
                        scheduleErrors.window ? "border-error" : "border-line focus:border-primary"
                      }`}
                    >
                      {rescheduleWindowOptions.map((window) => (
                        <option key={window} value={window}>
                          {window}
                        </option>
                      ))}
                    </select>
                    {scheduleErrors.window ? (
                      <span data-field-error="" className="block text-xs font-medium text-error">
                        {scheduleErrors.window}
                      </span>
                    ) : null}
                  </label>
                  <label className="block space-y-1.5 sm:col-span-2">
                    <span className="font-semibold text-title">Payment method (optional)</span>
                    <select
                      value={reschedulePayment}
                      onChange={(event) => setReschedulePayment(event.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-title outline-none focus:border-primary"
                    >
                      <option value="">Keep current</option>
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={rescheduling}
                    onClick={() => {
                      const nextErrors: { date?: string; window?: string } = {};
                      if (!rescheduleDateValue) nextErrors.date = "Choose an appointment date.";
                      if (!rescheduleWindowValue.trim()) nextErrors.window = "Choose an arrival window.";
                      setScheduleErrors(nextErrors);
                      if (Object.keys(nextErrors).length) return;
                      void run(async () => {
                        await rescheduleBooking({
                          id: bookingId,
                          appointmentDate: rescheduleDateValue,
                          arrivalTimeWindow: rescheduleWindowValue,
                          ...(reschedulePayment ? { paymentMethod: toApiPaymentMethod(reschedulePayment) } : {}),
                        }).unwrap();
                        setRescheduleSaved(true);
                        setShowReschedule(false);
                      }, "Could not reschedule this booking.");
                    }}
                  >
                    {rescheduling ? "Saving…" : "Save new time"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowReschedule(false)}>
                    Keep current time
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRescheduleSaved(false);
                  setShowReschedule(true);
                }}
              >
                Reschedule
              </Button>
            )}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {other?._id && !(role === "homeowner" && status === "awaiting_confirm") ? (
            <Button href={`${messagesHref}?dm=${other._id}`} size="sm" variant="ghost">
              Message {role === "pro" ? "client" : "contractor"}
            </Button>
          ) : null}
          {role === "homeowner" && canHomeownerCancelBooking(status) ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={cancelling}
              onClick={() => {
                if (typeof window !== "undefined" && !window.confirm("Cancel this booking?")) return;
                void run(() => cancelBooking(bookingId).unwrap(), "This booking could not be cancelled.");
              }}
            >
              {cancelling ? "Cancelling…" : "Cancel booking"}
            </Button>
          ) : null}
        </div>

        {status === "completed" && (role === "homeowner" || raw.review) ? (
          <div id="review" className="mt-4 space-y-3 border-t border-line/70 pt-4 scroll-mt-24">
            {raw.hasReviewed || raw.review ? (
              <div className="space-y-3 rounded-2xl border border-line/80 bg-smoke/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-title">
                    {role === "homeowner" ? "Your review" : "Client review"}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= (raw.review?.rating || 0)
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-300",
                        )}
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-title">
                      {(raw.review?.rating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
                {raw.review?.feedback ? (
                  <p className="text-sm leading-relaxed text-title/90">{raw.review.feedback}</p>
                ) : null}
                {raw.review?.createdAt ? (
                  <p className="text-[11px] text-muted">
                    Submitted {formatBookingDate(raw.review.createdAt)}
                  </p>
                ) : null}
                {raw.review?.reply ? (
                  <div className="rounded-xl border border-line/70 bg-white p-3">
                    <p className="text-[11px] font-semibold text-muted">
                      Response from {raw.professional?.companyName || raw.professional?.name || "Contractor"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-title">{raw.review.reply}</p>
                  </div>
                ) : null}
              </div>
            ) : role === "homeowner" ? (
              <>
                <p className="text-sm font-semibold text-title">Leave a review</p>
                <label className="block space-y-1.5 text-xs sm:text-sm">
                  <span className="font-semibold text-title">Rating</span>
                  <select
                    value={reviewRating}
                    onChange={(event) => setReviewRating(Number(event.target.value))}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-title outline-none focus:border-primary"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} star{value === 1 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </label>
                <TextArea
                  value={reviewFeedback}
                  onChange={(event) => setReviewFeedback(event.target.value)}
                  rows={3}
                  placeholder="How did the job go?"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={reviewing || reviewFeedback.trim().length < 4}
                  onClick={() =>
                    run(async () => {
                      await createReview({
                        bookingId,
                        rating: reviewRating,
                        feedback: reviewFeedback.trim(),
                      }).unwrap();
                      setReviewFeedback("");
                      await refetch();
                    }, "Could not submit review.")
                  }
                >
                  {reviewing ? "Submitting…" : "Submit review"}
                </Button>
              </>
            ) : null}
          </div>
        ) : null}

        {actionError ? <p className="mt-3 text-xs text-error">{actionError}</p> : null}
      </Card>
    </div>
  );
}
