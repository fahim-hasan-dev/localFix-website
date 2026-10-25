"use client";

import { AdminHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/redux/hooks";

export default function AdminMembersPage() {
  const memberships = useAppSelector((state) => state.admin.memberships);
  const liveMembership = useAppSelector((state) => state.marketplace.membershipActive);
  const paused = useAppSelector((state) => state.features.membershipPaused);
  const cancelled = useAppSelector((state) => state.features.membershipCancelled);

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Memberships"
        hint="HomeFix revenue is professional subscriptions only. These rows are not repair invoices."
      />

      <div className="rounded-[16px] border border-line bg-white px-4 py-3 text-sm text-copy">
        Demo signed-in professional: membership {liveMembership ? "active" : "off"}
        {paused ? " · paused" : ""}
        {cancelled ? " · cancelled" : ""}. Quoting stays locked when membership is off.
      </div>

      <div className="overflow-hidden rounded-[16px] border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Professional</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">Renewal</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((item) => (
              <tr key={item.proId} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-semibold text-title">{item.businessName}</td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      item.state === "active" || item.state === "trial"
                        ? "green"
                        : item.state === "paused"
                          ? "amber"
                          : "slate"
                    }
                  >
                    {item.state}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-copy">
                  {item.renewal ?? "—"}
                  {item.trialDaysLeft != null ? ` · ${item.trialDaysLeft} trial days` : ""}
                </td>
                <td className="px-4 py-3 text-copy">{item.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
