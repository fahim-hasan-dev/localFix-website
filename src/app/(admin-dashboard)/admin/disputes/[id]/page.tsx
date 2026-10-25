"use client";

import { use, useState } from "react";
import Link from "next/link";
import { DisputeBadge } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, NativeSelect, TextArea } from "@/components/ui/field";
import { selectBooking, selectChangeRequests, selectQuotesForJob, selectJob } from "@/lib/marketplace";
import { addDisputeNote, updateDispute } from "@/redux/slices/adminSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { DisputeStatus } from "@/lib/admin-data";

export default function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const dispatch = useAppDispatch();
  const dispute = useAppSelector((state) => state.admin.disputes.find((item) => item.id === id));
  const job = useAppSelector((state) => (dispute ? selectJob(state, dispute.jobId) : undefined));
  const quotes = useAppSelector((state) => (dispute ? selectQuotesForJob(state, dispute.jobId) : []));
  const booking = useAppSelector((state) => (dispute ? selectBooking(state, dispute.jobId) : undefined));
  const changes = useAppSelector((state) => (dispute ? selectChangeRequests(state, dispute.jobId) : []));
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [nextStatus, setNextStatus] = useState<DisputeStatus>("in_review");
  const [saved, setSaved] = useState("");

  if (!dispute) {
    return (
      <div className="space-y-3">
        <Link href="/admin/disputes" className="text-sm font-semibold text-primary">
          ← Disputes
        </Link>
        <p className="text-sm text-copy">Dispute not found.</p>
      </div>
    );
  }

  const accepted = quotes.find((quote) => quote.id === (booking?.quoteId ?? dispute.quoteId));

  return (
    <div className="space-y-5">
      <Link href="/admin/disputes" className="text-sm font-semibold text-primary">
        ← Disputes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-title">{dispute.jobTitle}</h1>
          <p className="mt-1 text-sm text-muted">
            {dispute.homeownerName} · {dispute.proName} · opened {dispute.openedAt}
          </p>
        </div>
        <DisputeBadge status={dispute.status} />
      </div>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-title">Complaint</h2>
        <p className="mt-2 text-sm leading-6 text-copy">{dispute.reason}</p>
        <p className="mt-3 text-xs text-muted">
          Operations review only. Do not collect repair funds or mark an off-platform payment as verified without evidence from both parties.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold text-title">Job record</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Status</dt>
              <dd className="font-medium text-title">{job?.status ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Agreed job value</dt>
              <dd className="font-medium text-title">${booking?.agreedPrice ?? dispute.agreedPrice ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Accepted quotation</dt>
              <dd className="font-medium text-title">{accepted ? `$${accepted.amount}` : "None recorded"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Payment arrangement</dt>
              <dd className="font-medium text-title">
                {booking?.paymentArrangement ?? booking?.paymentMethod ?? "Not recorded"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Payment recorded</dt>
              <dd className="font-medium text-title">{booking?.paidAt ?? "No"}</dd>
            </div>
          </dl>
          {accepted?.scope ? <p className="mt-3 text-sm text-copy">{accepted.scope}</p> : null}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base font-semibold text-title">Price changes</h2>
          {changes.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No change requests on this job.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {changes.map((item) => (
                <li key={item.id}>
                  +${item.amount} · {item.reason} · {item.status}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-title">Investigation notes</h2>
        <Field label="Add a note">
          <TextArea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="What you reviewed and what is still missing." />
        </Field>
        <Button
          type="button"
          size="sm"
          className="mt-3"
          disabled={note.trim().length < 6}
          onClick={() => {
            dispatch(addDisputeNote({ id: dispute.id, body: note.trim() }));
            setNote("");
            setSaved("Note added to the audit trail.");
          }}
        >
          Save note
        </Button>
        <ul className="mt-4 space-y-3">
          {(dispute.notes ?? []).map((item) => (
            <li key={item.id} className="rounded-xl border border-line px-3 py-2 text-sm">
              <p className="text-xs text-muted">
                {item.at} · {item.by}
              </p>
              <p className="mt-1 text-copy">{item.body}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-title">Decision</h2>
        <p className="mt-1 text-sm text-muted">
          Record a human review. Do not auto-close based on quotation amount or an unverified payment claim.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <NativeSelect value={nextStatus} onChange={(event) => setNextStatus(event.target.value as DisputeStatus)}>
              <option value="in_review">In review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="open">Re-open</option>
            </NativeSelect>
          </Field>
        </div>
        <Field label="Resolution note">
          <TextArea
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            rows={3}
            placeholder="Decision and what each party should do next."
          />
        </Field>
        <Button
          type="button"
          size="sm"
          className="mt-3"
          disabled={resolution.trim().length < 8}
          onClick={() => {
            dispatch(updateDispute({ id: dispute.id, status: nextStatus, resolution: resolution.trim() }));
            setSaved("Decision recorded on the dispute trail.");
          }}
        >
          Record decision
        </Button>
        {dispute.resolution ? <p className="mt-3 text-sm text-copy">Last resolution: {dispute.resolution}</p> : null}
        {saved ? <p className="mt-3 text-sm text-success">{saved}</p> : null}
      </Card>
    </div>
  );
}
