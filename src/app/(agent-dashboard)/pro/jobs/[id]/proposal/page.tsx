"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProProposalDetail } from "@/components/web-pages/pro-proposal-detail";

function ProposalPageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quoteId") || undefined;

  return <ProProposalDetail jobId={params.id} quoteId={quoteId || undefined} />;
}

export default function ProProposalPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading proposal…</p>}>
      <ProposalPageInner />
    </Suspense>
  );
}
