"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, NativeSelect, TextArea, TextField } from "@/components/ui/field";
import { useRoleAccess } from "@/hooks/use-role-access";
import { acceptCounter, setOfferStatus } from "@/redux/slices/marketplaceSlice";
import { addNotification, setJobStatus } from "@/redux/slices/featuresSlice";
import { errorMessage } from "@/lib/booking-view";
import { toApiPriceType } from "@/lib/marketplace-mappers";
import { useSendQuotationMutation } from "@/services/client/marketplace-api";
import { isSamePro, normalizeProId, selectJob, selectQuotesForJob } from "@/lib/marketplace";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { QuotePriceType } from "@/types";

type QuoteField = "amount" | "scope" | "duration" | "date" | "window";

function getISODatePlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function ProQuoteForm({
  jobId,
  onPass,
  onSubmitted,
  embedded = false,
}: {
  jobId: string;
  onPass?: () => void;
  onSubmitted?: () => void;
  /** Drop outer card chrome when rendered inside a modal. */
  embedded?: boolean;
}) {
  const dispatch = useAppDispatch();
  const { access } = useRoleAccess();
  const job = useAppSelector((state) => selectJob(state, jobId));
  const hiredQuoteId = useAppSelector((state) => state.marketplace.hiredByJob[jobId]);
  const quotes = useAppSelector((state) => selectQuotesForJob(state, jobId));
  const user = useAppSelector((state) => state.auth.user);
  const myProId = user?.id ? normalizeProId(user.id) : "";
  const myQuote = quotes.find((q) => isSamePro(q.proId, myProId));
  const myCounters = quotes.filter((q) => isSamePro(q.proId, myProId) && q.status === "countered");
  const jobClosed = Boolean(hiredQuoteId) || ["hired", "scheduled", "cancelled", "completed", "disputed"].includes(job?.status ?? "");

  const [sendQuotation, { isLoading: sending }] = useSendQuotationMutation();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<QuoteField, string>>>({});
  const locked = !access.canSubmitQuote;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) {
      setError(access.blockedReason ?? "Membership required to quote.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const priceType = String(data.get("priceType") ?? "estimate") as QuotePriceType;
    const scope = String(data.get("scope") ?? "").trim();
    const exclusions = String(data.get("exclusions") ?? "").trim();
    const materialsIncluded = data.get("materials") === "yes";
    const estimatedDuration = String(data.get("duration") ?? "").trim();
    const scheduledDate = String(data.get("scheduledDate") ?? "").trim();
    const arrivalWindow = String(data.get("arrivalWindow") ?? "").trim();
    const warranty = String(data.get("warranty") ?? "").trim();
    const expiresAt = String(data.get("expires") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();

    const nextErrors: Partial<Record<QuoteField, string>> = {};
    if (!String(data.get("amount") ?? "").trim() || !Number.isFinite(amount) || amount < 0) {
      nextErrors.amount = "Enter the total or rate.";
    }
    if (!scope) nextErrors.scope = "Describe the scope of work.";
    if (!estimatedDuration) nextErrors.duration = "Enter the estimated duration.";
    if (!scheduledDate) nextErrors.date = "Choose the earliest available date.";
    if (!arrivalWindow) nextErrors.window = "Enter the arrival time window.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => {
        document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setError("");
    setSaved(false);
    try {
      // Mutation invalidates the Jobs/Quotes tags, so the job refetches and re-hydrates the store.
      await sendQuotation({
        jobRequest: jobId,
        priceType: toApiPriceType(priceType),
        totalRate: amount,
        scopeOfWork: scope,
        exclusions: exclusions || undefined,
        partsAndMaterialsIncluded: materialsIncluded
          ? "yes_all_parts_and_fittings_included"
          : "no_labour_only",
        estimatedDuration: estimatedDuration || undefined,
        earliestAvailableDate: scheduledDate,
        arrivalTimeWindow: arrivalWindow || undefined,
        warranty: warranty || undefined,
        offerValidUntil: expiresAt || undefined,
        additionalNotes: notes || undefined,
      }).unwrap();
      setSaved(true);
      form.reset();
      onSubmitted?.();
    } catch (err) {
      setError(errorMessage(err, "Your quotation could not be sent. Please try again."));
    }
  }

  const formBody = myQuote || jobClosed ? null : (
          <form className={embedded ? "space-y-5" : "mt-6 space-y-5"} noValidate onSubmit={submit}>
            {/* 1. Price row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price type *">
                <NativeSelect name="priceType" defaultValue="estimate" disabled={locked} className="rounded-xl">
                  <option value="estimate">Estimate (Subject to on-site inspection)</option>
                  <option value="fixed">Fixed Price (Guaranteed flat rate)</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="time_and_materials">Time &amp; Materials</option>
                </NativeSelect>
              </Field>

              <Field label="Total / rate ($) *" error={fieldErrors.amount}>
                <TextField
                  name="amount"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 180"
                  disabled={locked}
                  aria-invalid={Boolean(fieldErrors.amount)}
                  className={fieldErrors.amount ? "rounded-xl border-error focus:border-error" : "rounded-xl"}
                />
              </Field>
            </div>

            {/* 2. Scope */}
            <Field label="Scope of work *" error={fieldErrors.scope}>
              <TextArea
                name="scope"
                rows={3}
                placeholder="Describe what repair, replacement, or diagnostic work you will perform on site..."
                disabled={locked}
                aria-invalid={Boolean(fieldErrors.scope)}
                className={fieldErrors.scope ? "rounded-xl border-error focus:border-error" : "rounded-xl"}
              />
            </Field>

            <Field label="Exclusions (Optional)">
              <TextField
                name="exclusions"
                placeholder="e.g. Drywall patching or deep structural pipe replacement not included"
                disabled={locked}
                className="rounded-xl"
              />
            </Field>

            {/* 3. Materials & Duration */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Parts and materials *">
                <NativeSelect name="materials" defaultValue="yes" disabled={locked} className="rounded-xl">
                  <option value="yes">Yes — all parts &amp; fittings included</option>
                  <option value="no">No — labor only (materials billed separately)</option>
                </NativeSelect>
              </Field>

              <Field label="Estimated duration *" error={fieldErrors.duration}>
                <TextField
                  name="duration"
                  placeholder="e.g. 1–2 hours, 4 hours, or 2 days"
                  disabled={locked}
                  aria-invalid={Boolean(fieldErrors.duration)}
                  className={fieldErrors.duration ? "rounded-xl border-error focus:border-error" : "rounded-xl"}
                />
              </Field>
            </div>

            {/* 4. Schedule & Arrival Window */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Earliest available date *" error={fieldErrors.date}>
                <TextField
                  type="date"
                  name="scheduledDate"
                  min={getISODatePlus(0)}
                  disabled={locked}
                  aria-invalid={Boolean(fieldErrors.date)}
                  className={fieldErrors.date ? "rounded-xl border-error focus:border-error" : "rounded-xl"}
                />
              </Field>

              <Field label="Arrival time window *" error={fieldErrors.window}>
                <TextField
                  name="arrivalWindow"
                  placeholder="e.g. 10:00 AM – 12:00 PM, or Morning"
                  disabled={locked}
                  aria-invalid={Boolean(fieldErrors.window)}
                  className={fieldErrors.window ? "rounded-xl border-error focus:border-error" : "rounded-xl"}
                />
              </Field>
            </div>

            {/* 5. Warranty & Expiration */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Warranty (Optional)">
                <TextField
                  name="warranty"
                  placeholder="e.g. 90-day workmanship guarantee"
                  disabled={locked}
                  className="rounded-xl"
                />
              </Field>

              <Field label="Offer valid until (optional)">
                <TextField
                  name="expires"
                  type="date"
                  min={getISODatePlus(1)}
                  disabled={locked}
                  className="rounded-xl"
                />
              </Field>
            </div>

            {/* 7. Additional Notes (No clutter or suggestion chips) */}
            <Field label="Additional Contractor Notes & Site Prep (Optional)">
              <TextArea
                name="notes"
                rows={2}
                placeholder="e.g. Please ensure 3ft clear workspace around the repair area before arrival."
                disabled={locked}
                className="rounded-xl"
              />
            </Field>

            {error ? <p className="text-sm font-medium text-error">{error}</p> : null}
            {saved ? <p className="text-sm font-medium text-emerald-600">Quotation sent to homeowner.</p> : null}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-line/60">
              <Button type="submit" disabled={locked || sending} className="font-semibold text-xs sm:text-sm px-6">
                {locked ? "Locked" : sending ? "Sending…" : "Send Quotation"}
              </Button>
              {onPass && !saved && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onPass}
                  className="rounded-full text-xs font-semibold text-muted hover:text-title border-line/80"
                >
                  Pass on this request
                </Button>
              )}
            </div>
          </form>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        {myCounters.map((quote) => (
          <Card key={quote.id} className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5 shadow-xs">
            <h2 className="text-base font-bold text-title">Homeowner Counter Offer</h2>
            <p className="mt-1 text-sm text-copy">
              They proposed <span className="font-semibold text-title">${quote.counterAmount}</span>
              {quote.counterNote ? ` — “${quote.counterNote}”` : ""}. Your original quote was ${quote.amount}.
            </p>
          </Card>
        ))}
        {myQuote ? (
          <p className="text-sm text-muted">
            Your quotation (${myQuote.amount}) is already submitted and waiting for review.
          </p>
        ) : jobClosed ? (
          <p className="text-sm text-muted">This request is no longer open for new quotations.</p>
        ) : locked ? (
          <p className="text-sm text-muted">
            {access.blockedReason}{" "}
            <Link href="/pro/pricing" className="font-semibold text-primary hover:underline">
              View Membership
            </Link>
          </p>
        ) : null}
        {formBody}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {myCounters.map((quote) => (
        <Card key={quote.id} className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5 shadow-xs">
          <h2 className="text-base font-bold text-title">Homeowner Counter Offer</h2>
          <p className="mt-1 text-sm text-copy">
            They proposed <span className="font-semibold text-title">${quote.counterAmount}</span>
            {quote.counterNote ? ` — “${quote.counterNote}”` : ""}. Your original quote was ${quote.amount}.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                dispatch(acceptCounter({ quoteId: quote.id, jobId }));
                dispatch(setJobStatus({ jobId, status: "hired" }));
                dispatch(
                  addNotification({
                    title: "Counter accepted",
                    body: "The contractor accepted your counter offer.",
                    href: `/account/jobs/${jobId}`,
                    createdAt: "Just now",
                    role: "homeowner",
                  }),
                );
              }}
              className="rounded-full text-xs font-semibold"
            >
              Accept Counter
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => dispatch(setOfferStatus({ quoteId: quote.id, status: "rejected" }))}
              className="rounded-full text-xs font-semibold text-muted hover:text-title"
            >
              Decline
            </Button>
          </div>
        </Card>
      ))}

      <Card className="rounded-2xl border border-line/80 bg-white p-6 sm:p-7 shadow-xs">
        <div className="border-b border-line/70 pb-4">
          <h2 className="font-display text-lg sm:text-xl font-bold text-title">
            Send a Quotation
          </h2>
          {myQuote ? (
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Your quotation (${myQuote.amount}) is currently submitted and waiting for homeowner review.
            </p>
          ) : jobClosed ? (
            <p className="mt-1 text-xs sm:text-sm text-muted">This request is no longer open for new quotations.</p>
          ) : locked ? (
            <p className="mt-1 text-xs sm:text-sm text-muted">
              {access.blockedReason}{" "}
              <Link href="/pro/pricing" className="font-semibold text-primary hover:underline">
                View Membership
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Specify your pricing and earliest available arrival window. The client pays you directly with zero commission fee.
            </p>
          )}
        </div>

        {formBody}
      </Card>
    </div>
  );
}
