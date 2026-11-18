import { Suspense } from "react";
import type { Metadata } from "next";
import { SubscriptionReturn } from "@/components/web-pages/subscription-return";

export const metadata: Metadata = {
  title: "Subscription",
};

export default function SubscriptionReturnPage() {
  return (
    <Suspense fallback={<p className="px-6 py-20 text-center text-sm text-muted">Loading…</p>}>
      <SubscriptionReturn />
    </Suspense>
  );
}
