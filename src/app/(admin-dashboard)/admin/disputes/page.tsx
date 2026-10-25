"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminHeader, DisputeBadge } from "@/components/admin/admin-ui";
import { disputeStatusLabel, type DisputeStatus } from "@/lib/admin-data";
import { useAppSelector } from "@/redux/hooks";

const filters: { id: "all" | DisputeStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_review", label: "In review" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

export default function AdminDisputesPage() {
  const disputes = useAppSelector((state) => state.admin.disputes);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const list = useMemo(
    () => (filter === "all" ? disputes : disputes.filter((item) => item.status === filter)),
    [disputes, filter],
  );

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Disputes"
        count={disputes.filter((item) => item.status === "open" || item.status === "in_review").length}
        hint="Review job history, the accepted quotation, and messages. HomeFix does not collect or refund repair payments."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filter === item.id ? "border-primary bg-primary text-white" : "border-line bg-white text-title"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[16px] border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Parties</th>
              <th className="px-4 py-3 font-medium">Agreed value</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/disputes/${item.id}`} className="font-semibold text-title hover:text-primary">
                    {item.jobTitle}
                  </Link>
                  <p className="text-xs text-muted">{item.openedAt}</p>
                </td>
                <td className="px-4 py-3 text-copy">
                  {item.homeownerName} · {item.proName}
                </td>
                <td className="px-4 py-3 text-copy">
                  {item.agreedPrice != null ? `$${item.agreedPrice}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <DisputeBadge status={item.status} />
                  <span className="sr-only">{disputeStatusLabel[item.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
