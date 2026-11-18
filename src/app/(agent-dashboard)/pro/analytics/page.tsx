"use client";

import { Card } from "@/components/ui/card";
import { useGetProfessionalAnalyticsQuery } from "@/services/client/marketplace-api";

type AnalyticsStats = {
  earnings?: number;
  completedJobs?: number;
  clients?: number;
  rating?: number;
};

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useGetProfessionalAnalyticsQuery();

  const payload = data?.data as { stats?: AnalyticsStats } | AnalyticsStats | undefined;
  const stats: AnalyticsStats =
    (payload && "stats" in payload ? payload.stats : (payload as AnalyticsStats | undefined)) ?? {};

  const rows = [
    { label: "Earnings", value: `$${Number(stats.earnings ?? 0).toLocaleString()}` },
    { label: "Completed jobs", value: String(stats.completedJobs ?? 0) },
    { label: "Clients", value: String(stats.clients ?? 0) },
    { label: "Rating", value: stats.rating ? Number(stats.rating).toFixed(1) : "—" },
  ];

  return (
    <div className="w-full max-w-5xl space-y-6">
      <h1 className="text-[28px]">Activity</h1>
      <p className="mt-1 text-sm text-copy">Live totals from your completed bookings and reviews.</p>
      {isLoading ? <p className="text-sm text-muted">Loading analytics...</p> : null}
      {isError ? <p className="text-sm text-error">Analytics could not be loaded.</p> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <Card key={row.label}>
            <p className="text-sm text-muted">{row.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-title">{row.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
