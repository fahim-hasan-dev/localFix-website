"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Play,
  Receipt,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { startMembership } from "@/redux/slices/marketplaceSlice";
import {
  setMembershipCancelled,
  setMembershipPaused,
  setSubscriptionPlan,
  unlockContact,
} from "@/redux/slices/featuresSlice";
import { useRoleAccess } from "@/hooks/use-role-access";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/cn";

export default function PricingPage() {
  const dispatch = useAppDispatch();
  const { applicationStatus } = useRoleAccess();
  const active = useAppSelector((state) => state.marketplace.membershipActive);
  const cancelled = useAppSelector((state) => state.features.membershipCancelled);
  const trialDaysLeft = useAppSelector((state) => state.features.trialDaysLeft ?? 30);
  const currentPlan = useAppSelector(
    (state) => state.features.subscriptionPlan ?? "trial"
  );
  const currentRenewalDate = useAppSelector(
    (state) => state.features.renewalDate ?? "Jan 10, 2027"
  );

  const [billingPreference, setBillingPreference] = useState<"annual" | "monthly">("annual");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isTrialActive = active && !cancelled && currentPlan === "trial";
  const isPaidActive = active && !cancelled && currentPlan !== "trial";
  const isCancelled = cancelled;
  const isCleared = applicationStatus === "cleared";

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  function handleStartTrial() {
    if (!isCleared) {
      showToast("Background check clearance required before activating your 30-Day Free Trial.");
      return;
    }
    dispatch(startMembership());
    dispatch(setMembershipPaused(false));
    dispatch(setMembershipCancelled(false));
    dispatch(
      setSubscriptionPlan({
        plan: "trial",
        billingCycle: billingPreference,
        renewalDate: "Jan 10, 2027",
      })
    );
    dispatch(unlockContact());
    showToast("30-Day Free Trial started successfully. Enjoy zero platform fees!");
  }

  function handleSelectPlan(plan: "monthly" | "annual", immediate = false) {
    dispatch(
      setSubscriptionPlan({
        plan,
        billingCycle: plan,
        renewalDate: immediate ? "Nov 20, 2026" : currentRenewalDate,
      })
    );
    if (immediate) {
      showToast(
        `Upgraded to Pro ${plan === "annual" ? "Annual" : "Monthly"}. Your subscription is active.`
      );
    } else {
      showToast(
        `Auto-renewal preference set to Pro ${
          plan === "annual" ? "Annual ($14.99/mo · Save 25%)" : "Monthly ($19.99/mo)"
        }. Your card will renew on ${currentRenewalDate}.`
      );
    }
  }

  function handleCancelAutoRenew() {
    dispatch(setMembershipCancelled(true));
    showToast("Auto-renewal cancelled. You will not be charged when your trial expires.");
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight">
            Subscription &amp; Billing
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Manage your membership tier, billing interval, and payment credentials.
          </p>
        </div>

        {/* Global Action indicator */}
        <div className="flex items-center gap-2">
          {isTrialActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Trial Active ({trialDaysLeft} days left)
            </span>
          ) : isPaidActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-title border border-line">
              <Check className="h-3.5 w-3.5" />
              Pro {currentPlan === "annual" ? "Annual" : "Monthly"} Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-smoke px-3 py-1 text-xs font-semibold text-muted border border-line">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Floating Interactive Toast */}
      {toastMessage && (
        <div className="rounded-[14px] bg-title text-white p-3.5 text-sm font-medium shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Clearance Prerequisite Alert if not yet cleared */}
      {!isCleared && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Background Verification Required
              </h3>
              <p className="mt-1 text-xs text-amber-800/90 leading-relaxed max-w-xl">
                Complete your background screening to activate your profile and start connecting with local homeowners.
              </p>
            </div>
          </div>
          <Link
            href="/pro/application"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 transition shrink-0 shadow-2xs"
          >
            <span>Complete Screening</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. CURRENT ACTIVE PLAN OVERVIEW (Standard Card Size & Layout) */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-xs">
        {/* Card Header Status & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-muted">
              Current Tier
            </span>
            <span className="text-muted/40">·</span>
            {isCancelled ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200/60">
                Cancelled
              </span>
            ) : isPaidActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-title border border-line">
                <Check className="h-3 w-3" />
                Pro {currentPlan === "annual" ? "Annual" : "Monthly"} Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-title border border-line/80">
                30-Day Free Trial
              </span>
            )}
          </div>

          {/* Quick Management Buttons */}
          <div className="flex items-center gap-2">
            {!active || cancelled ? (
              !isCleared ? (
                <Link
                  href="/pro/application"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                  title="Complete screening in application"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span>Verification Required</span>
                </Link>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartTrial}
                  className="h-8 font-semibold text-xs rounded-xl"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  <span>Start Free Trial</span>
                </Button>
              )
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelAutoRenew}
                className="h-8 text-xs font-medium text-muted hover:text-error hover:bg-red-50 rounded-xl"
              >
                Cancel auto-renewal
              </Button>
            )}
          </div>
        </div>

        {/* Plan Details & Pricing */}
        <div className="mt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-display text-lg sm:text-xl font-bold text-title tracking-tight">
              {isCancelled
                ? "Subscription Inactive"
                : isPaidActive
                ? currentPlan === "annual"
                  ? "Pro Annual"
                  : "Pro Monthly"
                : "Pro 30-Day Free Trial"}
            </h2>
            <p className="max-w-lg text-xs sm:text-[13px] text-muted leading-relaxed">
              {isCancelled
                ? "Subscription cancelled. Resubscribe to resume quoting leads."
                : isPaidActive
                ? `Active subscription · Next cycle renews on ${currentRenewalDate}.`
                : `Complimentary full access through ${currentRenewalDate}. No credit card charged during trial.`}
            </p>
          </div>

          <div className="md:text-right shrink-0">
            <div className="flex items-baseline md:justify-end gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold text-title tracking-tight">
                {isCancelled
                  ? "$19.99"
                  : isPaidActive
                  ? currentPlan === "annual"
                    ? "$14.99"
                    : "$19.99"
                  : "$0.00"}
              </span>
              <span className="text-xs font-medium text-muted">
                {isCancelled
                  ? "/ month"
                  : isPaidActive
                  ? currentPlan === "annual"
                    ? "/ mo ($179.88/yr)"
                    : "/ month"
                  : "/ month"}
              </span>
            </div>
          </div>
        </div>

        {/* Trial Days Progress Bar */}
        {isTrialActive && (
          <div className="mt-4 pt-3.5 border-t border-line/60">
            <div className="flex items-center justify-between text-xs font-medium text-title mb-1.5">
              <span className="flex items-center gap-1.5 text-muted text-[11px] sm:text-xs">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Trial Progress · Day {30 - trialDaysLeft} of 30
              </span>
              <span className="text-title font-semibold text-[11px] sm:text-xs">{trialDaysLeft} days remaining</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((30 - trialDaysLeft) / 30) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted">Zero charges incurred prior to {currentRenewalDate}.</p>
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/* 3. STANDARD PLAN SELECTION & BILLING INTERVAL               */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-title">
            {isTrialActive ? `Upcoming Plan Selection (Starts ${currentRenewalDate})` : "Subscription Tier"}
          </h2>
          <span className="text-xs text-muted">Switch or modify interval anytime</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {/* Annual Plan Card - Standard Selection Styling */}
          <div
            onClick={() => {
              setBillingPreference("annual");
              handleSelectPlan("annual", false);
            }}
            className={cn(
              "group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all",
              billingPreference === "annual" || currentPlan === "annual"
                ? "border-title bg-stone-50/60 shadow-xs ring-1 ring-title/15"
                : "border-line/80 bg-white hover:border-line hover:shadow-2xs",
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full border transition-all",
                      billingPreference === "annual" || currentPlan === "annual"
                        ? "border-title bg-title text-white"
                        : "border-line bg-white",
                    )}
                  >
                    {(billingPreference === "annual" || currentPlan === "annual") && (
                      <Check className="h-3 w-3 stroke-[3]" />
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold text-title">Pro Annual</h3>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Save 25%
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-bold text-title tracking-tight">
                  $14.99
                </span>
                <span className="text-xs font-medium text-muted">/ month</span>
                <span className="ml-1 text-xs text-muted/70">($179.88 billed yearly)</span>
              </div>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Best value for established service professionals. Priority badge on listings.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
              <span className={cn(
                "text-xs font-semibold flex items-center gap-1.5",
                billingPreference === "annual" || currentPlan === "annual"
                  ? "text-title"
                  : "text-muted group-hover:text-title",
              )}>
                {(billingPreference === "annual" || currentPlan === "annual") ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Selected Plan</span>
                  </>
                ) : (
                  <span>Select Plan</span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 text-muted group-hover:text-title transition-colors" />
            </div>
          </div>

          {/* Monthly Plan Card - Standard Selection Styling */}
          <div
            onClick={() => {
              setBillingPreference("monthly");
              handleSelectPlan("monthly", false);
            }}
            className={cn(
              "group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all",
              billingPreference === "monthly" && currentPlan !== "annual"
                ? "border-title bg-stone-50/60 shadow-xs ring-1 ring-title/15"
                : "border-line/80 bg-white hover:border-line hover:shadow-2xs",
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full border transition-all",
                      billingPreference === "monthly" && currentPlan !== "annual"
                        ? "border-title bg-title text-white"
                        : "border-line bg-white",
                    )}
                  >
                    {billingPreference === "monthly" && currentPlan !== "annual" && (
                      <Check className="h-3 w-3 stroke-[3]" />
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold text-title">Pro Monthly</h3>
                </div>
                <span className="rounded-full bg-slate-100 border border-line px-2 py-0.5 text-[11px] font-semibold text-muted">
                  Flexible
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-bold text-title tracking-tight">
                  $19.99
                </span>
                <span className="text-xs font-medium text-muted">/ month</span>
                <span className="ml-1 text-xs text-muted/70">(Billed each month)</span>
              </div>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Standard monthly flex plan. Cancel or pause subscription anytime without penalty.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
              <span className={cn(
                "text-xs font-semibold flex items-center gap-1.5",
                billingPreference === "monthly" && currentPlan !== "annual"
                  ? "text-title"
                  : "text-muted group-hover:text-title",
              )}>
                {(billingPreference === "monthly" && currentPlan !== "annual") ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Selected Plan</span>
                  </>
                ) : (
                  <span>Select Plan</span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 text-muted group-hover:text-title transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. BILLING STATEMENTS & INVOICES                             */}
      {/* ============================================================ */}
      <Link
        href="/pro/transactions"
        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line/80 bg-white p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition"
      >
        <div className="flex items-center gap-3.5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-sm sm:text-base font-bold text-title block">
              Subscription Invoices &amp; Statements
            </span>
            <span className="text-xs text-muted block mt-0.5">
              Access past invoices, tax receipts, and monthly membership statements for your business records.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline shrink-0">
          <span>View Invoices</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </Link>

    </div>
  );
}
