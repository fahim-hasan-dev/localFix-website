"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { useVerifyBookingPaymentMutation } from "@/services/client/marketplace-api";

/** Stripe returns here (`/bookings/:id?payment=success`). Confirm, then open the right dashboard. */
export default function BookingPaymentReturnPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const role = useAppSelector((state) => state.auth.user?.role);
  const [verifyPayment] = useVerifyBookingPaymentMutation();

  useEffect(() => {
    if (!id || !hydrated) return;
    const destination = role === "pro" ? `/pro/bookings/${id}` : `/account/bookings/${id}`;
    void verifyPayment(id).finally(() => router.replace(destination));
  }, [hydrated, id, role, router, verifyPayment]);

  return (
    <p className="px-6 py-20 text-center text-sm text-muted">Confirming your payment…</p>
  );
}
