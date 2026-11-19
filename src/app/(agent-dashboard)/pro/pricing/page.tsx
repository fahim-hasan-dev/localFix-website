"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
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
import { useAppDispatch } from "@/redux/hooks";
import { cn } from "@/lib/cn";
import { useGetPackagesQuery, type PackageItem } from "@/services/client/catalog-api";
import {
  useCancelSubscriptionMutation,
  useCancelUpcomingPlanMutation,
  useCheckoutSubscriptionMutation,
  useGetMySubscriptionQuery,
  useOpenBillingPortalMutation,
  useUpdateSubscriptionPlanMutation,
} from "@/services/client/engagement-api";
import { apiErrorMessage } from "@/services/client/form-data";
import { refId, str, type ApiRecord } from "@/lib/api-profile";

type PlanType = "monthly" | "yearly";

const DAY_MS = 24 * 60 * 60 * 1000;

function money(value?: number) {
  return `$${(value ?? 0).toFixed(2)}`;
}

function normalizePlanType(value: unknown): PlanType | "" {
  const v = str(value).toLowerCase();
  if (v === "yearly" || v === "annual" || v === "year") return "yearly";
  if (v === "monthly" || v === "month") return "monthly";
  return "";
}

function formatDate(value: unknown) {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toRecord(value: unknown): ApiRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ApiRecord;
}

export default function PricingPage() {
  const dispatch = useAppDispatch();
  const { applicationStatus, applicationReady } = useRoleAccess();
  const isCleared = applicationStatus === "cleared";

  const { data: packageResponse, isLoading: packagesLoading, isError: packagesError } = useGetPackagesQuery();
  const {
    data: subscriptionResponse,
    isLoading: subscriptionLoading,
    isUninitialized: subscriptionUninitialized,
  } = useGetMySubscriptionQuery();
  const subscriptionPending = subscriptionLoading || subscriptionUninitialized;
  const [checkoutSubscription, { isLoading: checkingOut }] = useCheckoutSubscriptionMutation();
  const [updateSubscriptionPlan, { isLoading: updatingPlan }] = useUpdateSubscriptionPlanMutation();
  const [cancelSubscription, { isLoading: cancelling }] = useCancelSubscriptionMutation();
  const [cancelUpcomingPlan, { isLoading: cancellingUpcoming }] = useCancelUpcomingPlanMutation();
  const [openBillingPortal, { isLoading: openingPortal }] = useOpenBillingPortalMutation();

  const packages: PackageItem[] = (packageResponse?.data ?? []).filter((pkg) => pkg.isActive !== false);

  // ---- Live subscription (shape-tolerant) ----
  const rawSub = toRecord(subscriptionResponse?.data);
  const sub = rawSub ? (toRecord(rawSub.subscription) ?? rawSub) : null;
  const hasSub = Boolean(sub && (sub._id || sub.status || sub.planType || sub.package));
  const subStatus = str(sub?.status).toLowerCase();
  const currentPlanType = normalizePlanType(sub?.planType ?? sub?.billingCycle ?? sub?.interval);
  const currentPackageId = refId(sub?.package ?? sub?.packageId);
  const periodEndRaw = sub?.currentPeriodEnd ?? sub?.endDate ?? sub?.renewalDate ?? sub?.nextBillingDate ?? sub?.expiresAt;
  const renewalDate = formatDate(periodEndRaw);
  const isCancelled =
    hasSub &&
    (["canceled", "cancelled", "expired", "inactive"].includes(subStatus) ||
      Boolean(sub?.cancelAtPeriodEnd) ||
      Boolean(sub?.cancelledAt));
  const isTrialActive =
    hasSub && !isCancelled && (["trialing", "trial"].includes(subStatus) || sub?.isTrial === true);
  const isPaidActive = hasSub && !isCancelled && !isTrialActive;
  const isActive = isTrialActive || isPaidActive;

  const upcomingRecord = toRecord(rawSub?.upcomingPlan);
  const upcomingPackage = toRecord(upcomingRecord?.package);
  const upcomingPackageId = upcomingRecord ? refId(upcomingRecord.package ?? upcomingRecord.packageId) : "";
  const upcomingPackageName = str(upcomingPackage?.name);
  const upcomingStarts = formatDate(upcomingRecord?.effectiveDate);
  const hasUpcoming = str(upcomingRecord?.status).toLowerCase() === "scheduled";

  const currentPackage =
    packages.find((p) => p._id === currentPackageId) ||
    (() => {
      const embedded = toRecord(sub?.package);
      if (!embedded) return undefined;
      return {
        _id: currentPackageId || str(embedded._id),
        name: str(embedded.name),
        description: str(embedded.description) || undefined,
        monthlyPrice: Number(embedded.monthlyPrice ?? embedded.price) || undefined,
        yearlyPrice: Number(embedded.yearlyPrice) || undefined,
        features: Array.isArray(embedded.features)
          ? embedded.features.map((f) => str(f)).filter(Boolean)
          : undefined,
        hasTrial: Boolean(embedded.hasTrial),
        trialDays: Number(embedded.trialDays) || undefined,
        isActive: true,
      } satisfies PackageItem;
    })();

  const [now] = useState(() => Date.now());
  const trialEndRaw = isTrialActive ? (sub?.trialEndsAt ?? periodEndRaw) : periodEndRaw;
  const trialEndLabel = formatDate(trialEndRaw);
  const trialEndMs = trialEndRaw ? new Date(str(trialEndRaw)).getTime() : NaN;
  const trialTotalDays =
    Number(sub?.trialDays) ||
    Number(toRecord(sub?.package)?.trialDays) ||
    currentPackage?.trialDays ||
    0;
  const trialDaysLeft = Number.isNaN(trialEndMs)
    ? trialTotalDays
    : Math.max(0, Math.ceil((trialEndMs - now) / DAY_MS));
  const limits = toRecord(rawSub?.limits);
  const quoteLimit = Number(limits?.leadLimit);
  const quotesUsed = Number(limits?.usedQuotations);
  const quotesUnlimited = limits?.isUnlimited === true;

  // Keep legacy app-wide membership gating (role access) in sync with the live subscription.
  useEffect(() => {
    if (!hasSub) return;
    dispatch(
      setSubscriptionPlan({
        plan: isTrialActive ? "trial" : currentPlanType === "yearly" ? "annual" : "monthly",
        billingCycle: currentPlanType === "yearly" ? "annual" : "monthly",
        renewalDate: renewalDate || undefined,
      }),
    );
    if (isActive) {
      dispatch(startMembership());
      dispatch(setMembershipPaused(false));
      dispatch(setMembershipCancelled(false));
      dispatch(unlockContact());
    } else if (isCancelled) {
      dispatch(setMembershipCancelled(true));
    }
  }, [dispatch, hasSub, isActive, isCancelled, isTrialActive, currentPlanType, renewalDate]);

  // ---- Selection ----
  const [selection, setSelection] = useState<{ packageId: string; planType: PlanType } | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const defaultPackage =
    packages.find((p) => p._id === currentPackageId) ??
    packages.find((p) => p.isPopular) ??
    packages[0];
  const selected = selection ?? (isActive
    ? null
    : defaultPackage
      ? {
          packageId: defaultPackage._id,
          planType: defaultPlanType(defaultPackage, currentPlanType),
        }
      : null);
  const selectedPackage = packages.find((p) => p._id === selected?.packageId);
  const isCurrentSelection =
    isActive &&
    !!selected &&
    selected.packageId === (currentPackage?._id ?? "") &&
    selected.planType === (currentPlanType || selected.planType);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  function priceOf(pkg: PackageItem | undefined, planType: PlanType | "") {
    if (!pkg) return 0;
    if (planType === "yearly") return pkg.yearlyPrice ?? 0;
    if (planType === "monthly") return pkg.monthlyPrice ?? pkg.price ?? 0;
    return pkg.monthlyPrice ?? pkg.price ?? pkg.yearlyPrice ?? 0;
  }

  function defaultPlanType(pkg: PackageItem, preferred: PlanType | "" = ""): PlanType {
    const monthly = pkg.monthlyPrice ?? pkg.price ?? 0;
    const yearly = pkg.yearlyPrice ?? 0;
    if (preferred === "yearly" && yearly > 0) return "yearly";
    if (preferred === "monthly" && monthly > 0) return "monthly";
    if (monthly > 0) return "monthly";
    if (yearly > 0) return "yearly";
    return "monthly";
  }

  async function handleSubscribe() {
    if (!selectedPackage || !selected) return;
    if (!isCleared) {
      showToast("Background check clearance required before activating your subscription.");
      return;
    }
    try {
      if (isActive) {
        const res = await updateSubscriptionPlan({
          packageId: selectedPackage._id,
          planType: selected.planType,
        }).unwrap();
        setShowPlans(false);
        setSelection(null);
        showToast(res.message || `Plan change to ${selectedPackage.name} scheduled.`);
        return;
      }
      const res = await checkoutSubscription({
        packageId: selectedPackage._id,
        planType: selected.planType,
      }).unwrap();
      const payload = toRecord(res?.data);
      const url = str(payload?.url ?? payload?.checkoutUrl ?? payload?.sessionUrl ?? payload?.paymentUrl);
      if (url) {
        window.location.assign(url);
        return;
      }
      showToast("Subscription started. Your plan is being activated.");
    } catch (err) {
      showToast(apiErrorMessage(err, "Could not update your subscription. Please try again."));
    }
  }

  async function handleCancelSubscription() {
    try {
      const res = await cancelSubscription().unwrap();
      setConfirmCancel(false);
      setShowPlans(false);
      setSelection(null);
      showToast(res.message || "Subscription canceled.");
    } catch (err) {
      showToast(apiErrorMessage(err, "Could not cancel your subscription. Please try again."));
    }
  }

  async function handleCancelUpcoming() {
    try {
      const res = await cancelUpcomingPlan().unwrap();
      showToast(res.message || "Upcoming plan change cancelled.");
    } catch (err) {
      showToast(apiErrorMessage(err, "Could not cancel the upcoming plan. Please try again."));
    }
  }

  async function handleBillingPortal() {
    try {
      const res = await openBillingPortal().unwrap();
      const payload = toRecord(res?.data);
      const url = str(payload?.url);
      if (url) {
        window.location.assign(url);
        return;
      }
      showToast("Billing portal is unavailable right now.");
    } catch (err) {
      showToast(apiErrorMessage(err, "Could not open billing. Please try again."));
    }
  }

  const currentPlanLabel = currentPackage?.name
    ? currentPackage.name
    : hasSub
      ? "Active membership"
      : "No plan selected";
  const currentPrice = priceOf(currentPackage, currentPlanType);

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight">
            Subscription &amp; Billing
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Manage your membership tier and payment credentials.
          </p>
        </div>

        {/* Global Action indicator */}
        <div className="flex items-center gap-2">
          {subscriptionPending ? (
            <span className="inline-flex h-7 w-36 animate-pulse rounded-full bg-smoke" />
          ) : isTrialActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Trial Active ({trialDaysLeft} days left)
            </span>
          ) : isPaidActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-title border border-line">
              <Check className="h-3.5 w-3.5" />
              {currentPlanLabel} Active
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
      {applicationReady && !isCleared && (
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

      {subscriptionPending ? (
        <Card className="rounded-xl border border-line/80 bg-white p-4 sm:p-4.5 shadow-xs">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-smoke" />
            <div className="h-6 w-40 rounded bg-smoke" />
            <div className="h-3 w-full max-w-md rounded bg-smoke" />
            <div className="h-2 w-full rounded-full bg-smoke" />
          </div>
        </Card>
      ) : (
      <>
      {/* ============================================================ */}
      {/* 2. CURRENT ACTIVE PLAN OVERVIEW (Minimal & Clean)            */}
      {/* ============================================================ */}
      <Card className="rounded-xl border border-line/80 bg-white p-4 sm:p-4.5 shadow-xs space-y-3">
        {/* Card Header Status & Controls */}
        <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted">
              Current Tier
            </span>
            <span className="text-muted/40">·</span>
            {isCancelled ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200/60">
                Cancelled
              </span>
            ) : isPaidActive ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-title border border-line">
                <Check className="h-3 w-3" />
                {currentPlanLabel} Active
              </span>
            ) : isTrialActive ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-title border border-line/80">
                Free Trial
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-muted border border-line/80">
                No active plan
              </span>
            )}
          </div>

          {/* Quick Management Buttons */}
          <div className="flex items-center gap-2">
            {!isActive ? (
              !isCleared ? (
                <Link
                  href="/pro/application"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                  title="Complete screening in application"
                >
                  <ShieldCheck className="h-3 w-3 text-amber-700 shrink-0" />
                  <span>Verification Required</span>
                </Link>
              ) : null
            ) : confirmCancel ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-red-600 bg-red-600 px-3 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelling ? "Canceling..." : "Confirm cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line bg-white px-3 text-[11px] font-semibold text-title transition hover:bg-smoke"
                >
                  Keep plan
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlans((open) => !open);
                    setSelection(null);
                  }}
                  className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-title px-3 text-[11px] font-semibold text-white shadow-xs transition hover:bg-primary"
                >
                  {showPlans ? "Close plans" : "Change plan"}
                </button>
                <button
                  type="button"
                  onClick={handleBillingPortal}
                  disabled={openingPortal}
                  className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line bg-white px-3 text-[11px] font-semibold text-title shadow-xs transition hover:border-title hover:bg-smoke disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openingPortal ? "Opening..." : "Payment method"}
                </button>
                {hasUpcoming ? (
                  <button
                    type="button"
                    onClick={handleCancelUpcoming}
                    disabled={cancellingUpcoming}
                    className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-amber-300 bg-amber-50 px-3 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel upcoming change
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                >
                  Cancel subscription
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Plan Details & Pricing */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="font-display text-base sm:text-lg font-bold text-title tracking-tight">
              {isCancelled
                ? "Subscription Inactive"
                : isActive && currentPackage?.name
                ? currentPackage.name
                : isPaidActive
                ? currentPlanLabel
                : "No Active Subscription"}
            </h2>
            <p className="max-w-lg text-xs text-muted leading-relaxed">
              {isCancelled
                ? "Subscription canceled. Choose a plan to start quoting leads again."
                : isTrialActive
                ? `Free trial of the ${currentPackage?.name || "current"} plan${trialEndLabel ? ` through ${trialEndLabel}` : ""}. Billing starts after the trial.`
                : isPaidActive
                ? `Active plan${renewalDate ? ` · Renews ${renewalDate}` : ""}.`
                : "Choose a plan below to start receiving and quoting local leads."}
            </p>
            {isActive && (quotesUnlimited || (Number.isFinite(quoteLimit) && quoteLimit > 0)) ? (
              <p className="text-[11px] font-medium text-title">
                {quotesUnlimited
                  ? "Unlimited quotes this period."
                  : `${Number.isFinite(quotesUsed) ? quotesUsed : 0} of ${quoteLimit} quotes used this period.`}
              </p>
            ) : null}
            {hasUpcoming ? (
              <p className="text-[11px] font-medium text-primary">
                Changes to {upcomingPackageName || packages.find((p) => p._id === upcomingPackageId)?.name || "the selected plan"}
                {upcomingStarts ? ` on ${upcomingStarts}` : ""}.
              </p>
            ) : null}
          </div>

          <div className="sm:text-right shrink-0">
            {hasSub && currentPrice > 0 ? (
              <div>
                <div className="flex items-baseline sm:justify-end gap-1">
                  <span className="font-display text-xl sm:text-2xl font-bold text-title tracking-tight">
                    {money(currentPrice)}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {currentPlanType === "yearly" ? "/yr" : currentPlanType === "monthly" ? "/mo" : ""}
                  </span>
                </div>
                {isTrialActive ? (
                  <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">Free during trial</p>
                ) : null}
              </div>
            ) : (
              <span className="font-display text-xl font-bold text-muted">—</span>
            )}
          </div>
        </div>

        {/* Trial Days Progress Bar */}
        {isTrialActive && (trialTotalDays > 0 || trialDaysLeft > 0) ? (
          <div className="pt-2 border-t border-line/50 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary" />
                {trialTotalDays > 0
                  ? `Trial · Day ${Math.min(trialTotalDays, Math.max(1, trialTotalDays - trialDaysLeft))} of ${trialTotalDays}`
                  : "Free trial"}
              </span>
              <span className="text-title font-semibold">{trialDaysLeft} days remaining</span>
            </div>
            {trialTotalDays > 0 ? (
              <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, Math.round(((trialTotalDays - trialDaysLeft) / trialTotalDays) * 100)))}%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* ============================================================ */}
      {/* 3. PLAN SELECTION (packages as returned from the API)        */}
      {/* ============================================================ */}
      {!isActive || showPlans ? (
      <div className="space-y-2.5">
        <div>
          <h3 className="font-display text-[11px] font-bold uppercase tracking-wider text-muted">
            {isActive ? "Change plan" : "Subscription tier"}
          </h3>
          {isActive ? (
            <p className="mt-1 text-[11px] text-muted">
              The new plan starts after the current period{trialEndLabel || renewalDate ? ` on ${isTrialActive ? trialEndLabel : renewalDate}` : ""}.
            </p>
          ) : null}
        </div>

        {packagesLoading ? (
          <p className="text-xs text-muted">Loading plans...</p>
        ) : packagesError ? (
          <p className="text-xs text-error">Could not load plans. Please refresh and try again.</p>
        ) : packages.length === 0 ? (
          <p className="text-xs text-muted">No plans are available right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const monthly = pkg.monthlyPrice ?? pkg.price ?? 0;
              const yearly = pkg.yearlyPrice ?? 0;
              const planType = defaultPlanType(pkg, currentPlanType);
              const displayTotal = planType === "yearly" ? yearly || monthly : monthly || yearly;
              const isSelected = selected?.packageId === pkg._id;
              const isCurrent = isActive && currentPackage?._id === pkg._id;
              return (
                <div
                  key={pkg._id}
                  onClick={() => setSelection({ packageId: pkg._id, planType })}
                  className={cn(
                    "group relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 sm:p-4 transition-all",
                    isSelected
                      ? "border-title bg-stone-50/70 shadow-xs ring-1 ring-title/15"
                      : "border-line/80 bg-white hover:border-line hover:shadow-2xs",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "grid h-4 w-4 place-items-center rounded-full border transition-all",
                            isSelected ? "border-title bg-title text-white" : "border-line bg-white",
                          )}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <h4 className="font-display text-sm font-bold text-title">{pkg.name}</h4>
                      </div>
                      {pkg.isPopular ? (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Popular
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      {monthly > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-lg sm:text-xl font-bold text-title tracking-tight">
                            {money(monthly)}
                          </span>
                          <span className="text-xs font-medium text-muted">/mo</span>
                        </div>
                      ) : displayTotal > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-lg sm:text-xl font-bold text-title tracking-tight">
                            {money(displayTotal)}
                          </span>
                          <span className="text-xs font-medium text-muted">
                            {planType === "yearly" ? "/yr" : "/mo"}
                          </span>
                        </div>
                      ) : (
                        <span className="font-display text-lg font-bold text-muted">—</span>
                      )}
                      {monthly > 0 && yearly > 0 ? (
                        <span className="text-xs text-muted">or {money(yearly)}/yr</span>
                      ) : null}
                    </div>
                    {pkg.description ? (
                      <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                        {pkg.description}
                      </p>
                    ) : null}
                    {pkg.features && pkg.features.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {pkg.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5 text-xs text-title/80">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-line/50 flex items-center justify-between text-xs font-semibold">
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        isSelected ? "text-title" : "text-muted group-hover:text-title",
                      )}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Current Plan</span>
                        </>
                      ) : isSelected ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Selected Plan</span>
                        </>
                      ) : (
                        <span>Select Plan</span>
                      )}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted group-hover:text-title transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {packages.length > 0 && isCleared && !isCurrentSelection ? (
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleSubscribe}
              disabled={!selectedPackage || checkingOut || updatingPlan}
              className="rounded-lg text-xs font-semibold px-4"
            >
              {checkingOut || updatingPlan
                ? "Processing..."
                : isActive
                ? "Schedule plan change"
                : "Continue to checkout"}
            </Button>
          </div>
        ) : null}
      </div>
      ) : null}
      </>
      )}

      {/* ============================================================ */}
      {/* 4. BILLING STATEMENTS & INVOICES (Minimal)                   */}
      {/* ============================================================ */}
      <Link
        href="/pro/transactions"
        className="group flex items-center justify-between gap-3 rounded-xl border border-line/80 bg-white p-3 sm:p-3.5 shadow-xs hover:border-line hover:shadow-2xs transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-smoke/80 text-primary shrink-0 border border-line/60">
            <Receipt className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="font-display text-xs sm:text-[13px] font-bold text-title block truncate">
              Subscription Invoices &amp; Statements
            </span>
            <span className="text-[11px] text-muted block truncate">
              Access past invoices, tax receipts, and monthly membership statements.
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
