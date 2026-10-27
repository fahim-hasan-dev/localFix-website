"use client";

import { ProAnalytics } from "@/components/web-pages/pro-analytics";

export default function ProOverviewPage() {
  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="border-b border-line/70 pb-4 pt-1">
        <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight">
          Performance &amp; Analytics
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-muted">
          Real-time overview of your earnings, completed jobs, and client retention.
        </p>
      </div>

      {/* Senior Product Designer Executive Analytics Section with Standard Tabs */}
      <ProAnalytics />
    </div>
  );
}
