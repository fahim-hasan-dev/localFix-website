"use client";

import { useRouter } from "next/navigation";
import { RequestDetail } from "@/components/web-pages/request-detail";
import { ProQuoteForm } from "@/components/web-pages/pro-quote-form";
import { Button } from "@/components/ui/button";
import { selectJob, selectQuotesForJob } from "@/lib/marketplace";
import { useRoleAccess } from "@/hooks/use-role-access";
import { setLeadAction } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export function ProJobLead({ jobId }: { jobId: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { access } = useRoleAccess();
  const job = useAppSelector((state) => selectJob(state, jobId));
  const leadAction = useAppSelector((state) => state.features.leadActions[jobId] ?? "open");
  const hiredQuoteId = useAppSelector((state) => state.marketplace.hiredByJob[jobId]);
  const quotes = useAppSelector((state) => selectQuotesForJob(state, jobId));
  const alreadyQuoted = quotes.some((quote) => quote.proId === "pro-1");
  const forSomeoneElse = Boolean(job?.requestedProId && job.requestedProId !== "pro-1");
  const hiredElsewhere = Boolean(hiredQuoteId && !quotes.some((quote) => quote.id === hiredQuoteId && quote.proId === "pro-1"));
  const accepted = leadAction === "accepted" || alreadyQuoted;
  const passed = leadAction === "declined";

  function accept() {
    dispatch(setLeadAction({ jobId, action: "accepted" }));
  }

  function pass() {
    dispatch(setLeadAction({ jobId, action: "declined" }));
    router.push("/pro/jobs");
  }

  return (
    <div className="w-full max-w-5xl space-y-5">
      <RequestDetail
        id={jobId}
        backHref="/pro/jobs"
        backLabel="Available jobs"
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
      ) : alreadyQuoted ? (
        <div className="rounded-2xl border border-line/80 bg-white p-5 shadow-xs">
          <p className="text-sm text-muted">
            Your quotation is linked to this job. The homeowner compares quotations here and must accept one before a booking is confirmed.
          </p>
        </div>
      ) : (
        <ProQuoteForm jobId={jobId} onPass={pass} />
      )}
    </div>
  );
}
