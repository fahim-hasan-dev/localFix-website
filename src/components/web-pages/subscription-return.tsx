"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { str, type ApiRecord } from "@/lib/api-profile";
import { useAppSelector } from "@/redux/hooks";
import { useGetMySubscriptionQuery } from "@/services/client/engagement-api";

function toRecord(value: unknown): ApiRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ApiRecord;
}

function formatDate(value: unknown) {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SubscriptionReturn() {
  const search = useSearchParams();
  const router = useRouter();
  const succeeded = search.get("subscription") === "success";
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const user = useAppSelector((state) => state.auth.user);
  const canLoadPlan = succeeded && hydrated && !!user;
  const [stoppedWaiting, setStoppedWaiting] = useState(false);

  const { data, refetch } = useGetMySubscriptionQuery(undefined, { skip: !canLoadPlan });
  const root = toRecord(data?.data);
  const subscription = toRecord(root?.subscription);
  const plan = toRecord(subscription?.package);
  const active = root?.hasActiveSubscription === true;
  const planName = str(plan?.name);
  const planType = str(subscription?.planType).toLowerCase();
  const interval = planType === "yearly" ? "Yearly" : planType === "monthly" ? "Monthly" : "";
  const isTrial = subscription?.isTrial === true;
  const renewsOn = formatDate(isTrial ? subscription?.trialEndsAt : subscription?.currentPeriodEnd);

  useEffect(() => {
    if (!hydrated || succeeded) return;
    router.replace(user?.role === "homeowner" ? "/account" : "/pro");
  }, [hydrated, router, succeeded, user?.role]);

  useEffect(() => {
    if (!canLoadPlan || active) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (attempts >= 8) {
        window.clearInterval(timer);
        setStoppedWaiting(true);
        return;
      }
      void refetch();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [active, canLoadPlan, refetch]);

  if (!succeeded) {
    return <p className="px-6 py-20 text-center text-sm text-muted">Taking you to your dashboard…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-16 sm:py-24">
      <Card className="w-full text-center hover:shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-[26px] font-bold tracking-tight text-title">
          Payment successful
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {active && planName
            ? `${planName}${interval ? ` · ${interval}` : ""} is on your account.`
            : "Stripe accepted the payment. Your plan appears here as soon as it is confirmed."}
        </p>

        {active && (
          <dl className="mt-6 space-y-2 rounded-2xl border border-line/80 bg-smoke/50 px-4 py-3 text-left text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Status</dt>
              <dd className="font-semibold text-title">{isTrial ? "Free trial" : "Active"}</dd>
            </div>
            {renewsOn && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">{isTrial ? "Trial ends" : "Renews"}</dt>
                <dd className="font-semibold text-title">{renewsOn}</dd>
              </div>
            )}
          </dl>
        )}

        {!active && !stoppedWaiting && canLoadPlan && (
          <p className="mt-4 text-xs text-muted">Confirming your plan…</p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href="/pro">Go to dashboard</Button>
          <Button href="/pro/pricing" variant="ghost">
            View subscription
          </Button>
        </div>
      </Card>
    </div>
  );
}
