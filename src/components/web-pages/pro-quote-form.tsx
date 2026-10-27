"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, NativeSelect, TextArea, TextField } from "@/components/ui/field";
import { useRoleAccess } from "@/hooks/use-role-access";
import { addQuote, acceptCounter, setOfferStatus } from "@/redux/slices/marketplaceSlice";
import { addNotification, setJobStatus } from "@/redux/slices/featuresSlice";
import { selectJob, selectQuotesForJob } from "@/lib/marketplace";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { QuotePriceType } from "@/types";

function getISODatePlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function ProQuoteForm({
  jobId,
  onPass,
}: {
  jobId: string;
  onPass?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { access } = useRoleAccess();
  const job = useAppSelector((state) => selectJob(state, jobId));
  const hiredQuoteId = useAppSelector((state) => state.marketplace.hiredByJob[jobId]);
  const quotes = useAppSelector((state) => selectQuotesForJob(state, jobId));
  const myQuote = quotes.find((q) => q.proId === "pro-1");
  const myCounters = quotes.filter((q) => q.proId === "pro-1" && q.status === "countered");
  const jobClosed = Boolean(hiredQuoteId) || ["hired", "scheduled", "cancelled", "completed", "disputed"].includes(job?.status ?? "");

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const locked = !access.canSubmitQuote;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) {
      setError(access.blockedReason ?? "Membership required to quote.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get("amount"));
    const priceType = String(data.get("priceType") ?? "estimate") as QuotePriceType;
    const scope = String(data.get("scope") ?? "").trim();
    const exclusions = String(data.get("exclusions") ?? "").trim();
    const materialsIncluded = data.get("materials") === "yes";
    const estimatedDuration = String(data.get("duration") ?? "").trim();
    const scheduledDate = String(data.get("scheduledDate") ?? "").trim();
    const arrivalWindow = String(data.get("arrivalWindow") ?? "").trim();
    const proposedSchedule = scheduledDate ? `${formatDisplayDate(scheduledDate)} (${arrivalWindow})` : "";
    const paymentSchedule = String(data.get("paymentSchedule") ?? "").trim();
    const paymentMethods = String(data.get("paymentMethods") ?? "").trim();
    const compiledPaymentTerms = `${paymentSchedule}${paymentMethods ? ` · Accepted: ${paymentMethods}` : ""}`;
    const warranty = String(data.get("warranty") ?? "").trim();
    const expiresAt = String(data.get("expires") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid quotation amount.");
      return;
    }
    if (scope.length < 8) {
      setError("Please describe the scope of work covered by this quote.");
      return;
    }
    if (!scheduledDate) {
      setError("Please select your earliest available arrival date.");
      return;
    }

    setError("");
    dispatch(
      addQuote({
        jobId,
        proId: "pro-1",
        priceType,
        amount,
        scope,
        exclusions: exclusions || undefined,
        availability: proposedSchedule,
        materialsIncluded,
        estimatedDuration: estimatedDuration || undefined,
        proposedSchedule: proposedSchedule || undefined,
        expiresAt: expiresAt || undefined,
        paymentTerms: compiledPaymentTerms,
        notes: notes || undefined,
        warranty: warranty || undefined,
      }),
    );
    dispatch(setJobStatus({ jobId, status: "quotes_in" }));
    dispatch(
      addNotification({
        title: "New quotation received",
        body: `A verified contractor sent a quotation for "${job?.title ?? "your request"}".`,
        href: `/account/jobs/${jobId}`,
        createdAt: "Just now",
        role: "homeowner",
      }),
    );
    setSaved(true);
    event.currentTarget.reset();
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

        {myQuote || jobClosed ? null : (
          <form className="mt-6 space-y-5" onSubmit={submit}>
            {/* 1. Price row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price Type">
                <NativeSelect name="priceType" defaultValue="estimate" disabled={locked} className="rounded-xl">
                  <option value="estimate">Estimate (Subject to on-site inspection)</option>
                  <option value="fixed">Fixed Price (Guaranteed flat rate)</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="time_and_materials">Time &amp; Materials</option>
                </NativeSelect>
              </Field>

              <Field label="Total / Rate ($)">
                <TextField
                  name="amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 180"
                  required
                  disabled={locked}
                  className="rounded-xl"
                />
              </Field>
            </div>

            {/* 2. Scope */}
            <Field label="Scope of Work & Coverage">
              <TextArea
                name="scope"
                rows={3}
                placeholder="Describe what repair, replacement, or diagnostic work you will perform on site..."
                required
                disabled={locked}
                className="rounded-xl"
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
              <Field label="Parts & Materials Included?">
                <NativeSelect name="materials" defaultValue="yes" disabled={locked} className="rounded-xl">
                  <option value="yes">Yes — all parts &amp; fittings included</option>
                  <option value="no">No — labor only (materials billed separately)</option>
                </NativeSelect>
              </Field>

              <Field label="Estimated Job Duration">
                <NativeSelect name="duration" defaultValue="1–2 hours" disabled={locked} className="rounded-xl">
                  <option value="1–2 hours">1–2 hours</option>
                  <option value="2–4 hours (Half day)">2–4 hours (Half day)</option>
                  <option value="4–8 hours (Full day)">4–8 hours (Full day)</option>
                  <option value="2+ days (Multi-day)">2+ days (Multi-day)</option>
                </NativeSelect>
              </Field>
            </div>

            {/* 4. Schedule & Arrival Window */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Earliest Available Date">
                <TextField
                  type="date"
                  name="scheduledDate"
                  min={getISODatePlus(0)}
                  defaultValue={getISODatePlus(1)}
                  required
                  disabled={locked}
                  className="rounded-xl"
                />
              </Field>

              <Field label="Arrival Time Window">
                <NativeSelect
                  name="arrivalWindow"
                  defaultValue="10:00 AM – 12:00 PM (Late Morning)"
                  disabled={locked}
                  className="rounded-xl"
                >
                  <option value="8:00 AM – 10:00 AM (Early Morning)">8:00 AM – 10:00 AM (Early Morning)</option>
                  <option value="10:00 AM – 12:00 PM (Late Morning)">10:00 AM – 12:00 PM (Late Morning)</option>
                  <option value="12:00 PM – 2:00 PM (Early Afternoon)">12:00 PM – 2:00 PM (Early Afternoon)</option>
                  <option value="2:00 PM – 4:00 PM (Late Afternoon)">2:00 PM – 4:00 PM (Late Afternoon)</option>
                  <option value="4:00 PM – 6:00 PM (Evening)">4:00 PM – 6:00 PM (Evening)</option>
                  <option value="Flexible All-Day (8:00 AM – 5:00 PM)">Flexible All-Day (8:00 AM – 5:00 PM)</option>
                </NativeSelect>
              </Field>
            </div>

            {/* 5. Payment Arrangement & Methods */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Schedule">
                <NativeSelect
                  name="paymentSchedule"
                  defaultValue="100% Upon Satisfactory Completion"
                  disabled={locked}
                  className="rounded-xl"
                >
                  <option value="100% Upon Satisfactory Completion">100% Upon Satisfactory Completion</option>
                  <option value="50% Upfront Deposit / 50% Upon Completion">50% Upfront Deposit / 50% Upon Completion</option>
                  <option value="Diagnostic Visit Fee Upfront + Balance Upon Completion">Diagnostic Visit Fee Upfront + Balance Upon Completion</option>
                  <option value="Net 15 Invoiced After Completion">Net 15 Invoiced After Completion</option>
                </NativeSelect>
              </Field>

              <Field label="Accepted Payment Methods">
                <TextField
                  name="paymentMethods"
                  defaultValue="Cash, Zelle, Card, or Check"
                  placeholder="e.g. Cash, Zelle, Card, or Check"
                  disabled={locked}
                  className="rounded-xl"
                />
              </Field>
            </div>

            {/* 6. Warranty & Expiration */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Warranty (Optional)">
                <TextField
                  name="warranty"
                  placeholder="e.g. 90-day workmanship guarantee"
                  disabled={locked}
                  className="rounded-xl"
                />
              </Field>

              <Field label="Offer Valid Until">
                <TextField
                  name="expires"
                  type="date"
                  min={getISODatePlus(1)}
                  defaultValue={getISODatePlus(7)}
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
              <Button type="submit" disabled={locked} className="font-semibold text-xs sm:text-sm px-6">
                {locked ? "Locked" : "Send Quotation ↗"}
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
        )}
      </Card>
    </div>
  );
}
