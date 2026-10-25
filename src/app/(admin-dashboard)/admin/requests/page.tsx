"use client";

import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/shared/status-badge";
import { selectAllJobs, selectAllQuotes } from "@/lib/marketplace";
import { getPro } from "@/Mockdata";
import { useAppSelector } from "@/redux/hooks";

export default function AdminRequestsPage() {
  const jobs = useAppSelector(selectAllJobs);
  const quotes = useAppSelector(selectAllQuotes);
  const bookings = useAppSelector((state) => state.marketplace.bookings);

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Requests"
        count={jobs.length}
        hint="Monitor jobs, quotations, and bookings. Agreed job value is a marketplace record — not HomeFix revenue."
      />

      <div className="overflow-hidden rounded-[16px] border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Quotes</th>
              <th className="px-4 py-3 font-medium">Agreed value</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const jobQuotes = quotes.filter((quote) => quote.jobId === job.id);
              const booking = bookings[job.id];
              const hired = jobQuotes.find((quote) => quote.id === booking?.quoteId);
              return (
                <tr key={job.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-title">{job.title}</p>
                    <p className="text-xs text-muted">
                      {job.homeownerName} · {job.city} {job.zip}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-copy">
                    {job.visibility === "direct" || job.requestedProId ? "Direct" : "Open job"}
                  </td>
                  <td className="px-4 py-3 text-copy">
                    {jobQuotes.length}
                    {hired ? (
                      <span className="block text-xs text-muted">
                        Hired {getPro(hired.proId)?.name ?? hired.proId}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-copy">
                    {booking?.agreedPrice != null ? `$${booking.agreedPrice}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        HomeFix subscription revenue is tracked under Memberships. Repair payments stay between the homeowner and professional.
      </p>
      <Link href="/admin/members" className="text-sm font-semibold text-primary">
        View memberships
      </Link>
    </div>
  );
}
