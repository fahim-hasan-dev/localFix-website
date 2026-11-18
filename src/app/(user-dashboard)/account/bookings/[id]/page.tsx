import { BookingLiveDetail } from "@/components/web-pages/booking-live-detail";

export default async function HomeownerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <BookingLiveDetail
      id={id}
      role="homeowner"
      backHref="/account/bookings"
      backLabel="My Bookings"
      messagesHref="/account/messages"
    />
  );
}
