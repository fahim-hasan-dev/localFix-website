"use client";

import { Suspense } from "react";
import { QuoteRequestFlow } from "@/components/web-pages/quote-request-flow";

export default function PostJobPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[20px] border border-line/80 bg-white p-8 text-center">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      }
    >
      <QuoteRequestFlow />
    </Suspense>
  );
}
