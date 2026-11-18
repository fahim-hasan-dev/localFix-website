"use client";

import { useParams } from "next/navigation";
import { ProLiveJobDetail } from "@/components/web-pages/pro-live-job";
import { bookingJob, extractBooking } from "@/lib/booking-view";
import { useGetBookingQuery } from "@/services/client/marketplace-api";

export default function ProBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetBookingQuery(params.id);
  const raw = extractBooking(data?.data);
  const populated = raw ? bookingJob(raw) : null;
  const jobId = populated?._id || (typeof raw?.jobRequest === "string" ? raw.jobRequest : "");

  if (isLoading) return <p className="text-sm text-muted">Loading request…</p>;
  if (isError || !raw || !jobId) {
    return <p className="text-sm text-muted">This booking could not be found.</p>;
  }

  return (
    <ProLiveJobDetail jobId={jobId} backHref="/pro/bookings" backLabel="My Bookings" />
  );
}
