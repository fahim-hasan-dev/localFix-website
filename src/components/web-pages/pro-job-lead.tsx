"use client";

import { useRouter } from "next/navigation";
import { RequestDetail } from "@/components/web-pages/request-detail";
import { ProQuoteForm } from "@/components/web-pages/pro-quote-form";
import { Button } from "@/components/ui/button";
import { selectJob, selectQuotesForJob } from "@/lib/marketplace";
import { setLeadAction } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export function ProJobLead({ jobId }: { jobId: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const job = useAppSelector((state) => selectJob(state, jobId));
  const leadAction = useAppSelector((state) => state.features.leadActions[jobId] ?? "open");
  const quotes = useAppSelector((state) => selectQuotesForJob(state, jobId));
  const alreadyQuoted = quotes.some((quote) => quote.proId === "pro-1");
  const forSomeoneElse = Boolean(job?.requestedProId && job.requestedProId !== "pro-1");
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
          <p className="text-sm text-muted">This quote request was sent to another pro.</p>
        </div>
      ) : passed ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/80 bg-white px-6 py-4">
          <p className="text-sm text-muted">You passed on this request.</p>
          <Button type="button" size="sm" variant="ghost" onClick={accept}>
            Undo
          </Button>
        </div>
      ) : accepted ? (
        <ProQuoteForm jobId={jobId} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/80 bg-white px-6 py-4">
          <p className="text-sm text-muted">
            {job?.intakeAnswers?.length
              ? "Review their answers, then send a quote or pass."
              : "Accept to send a quote, or pass."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={pass}>
              Pass
            </Button>
            <Button type="button" size="sm" onClick={accept}>
              Accept
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
