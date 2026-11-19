"use client";

import { resolveRoleAccess } from "@/lib/role-access";
import { unwrapRecord, str } from "@/lib/api-profile";
import { useAppSelector } from "@/redux/hooks";
import { useGetMySubscriptionQuery } from "@/services/client/engagement-api";
import { useGetProfessionalApplicationQuery } from "@/services/client/marketplace-api";

/** Reads `hasActiveSubscription` from the my-subscription payload; undefined when the API didn't say. */
function liveSubscriptionActive(data: unknown): boolean | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  if (typeof record.hasActiveSubscription === "boolean") return record.hasActiveSubscription;
  const nested = record.subscription;
  if (nested && typeof nested === "object") {
    const flag = (nested as Record<string, unknown>).hasActiveSubscription;
    if (typeof flag === "boolean") return flag;
  }
  return undefined;
}

type ApplicationStatusKey = "draft" | "submitted" | "needs_info" | "rejected" | "cleared";

function mapApiApplicationStatus(value: unknown): ApplicationStatusKey | null {
  const v = str(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (!v) return null;
  if (["approved", "cleared", "verified", "active", "accepted"].includes(v)) return "cleared";
  if (["pending", "submitted", "in_review", "under_review", "review", "processing"].includes(v)) {
    return "submitted";
  }
  if (["rejected", "declined", "denied"].includes(v)) return "rejected";
  if (["needs_info", "more_info", "info_required", "incomplete"].includes(v)) return "needs_info";
  if (v === "draft") return "draft";
  return null;
}

export function useRoleAccess() {
  const user = useAppSelector((state) => state.auth.user);
  const localApplicationStatus = useAppSelector((state) => state.features.applicationStatus);
  const sliceMembershipActive = useAppSelector((state) => state.marketplace.membershipActive);
  const membershipPaused = useAppSelector((state) => state.features.membershipPaused);
  const membershipCancelled = useAppSelector((state) => state.features.membershipCancelled);
  const subscriptionPlan = useAppSelector((state) => state.features.subscriptionPlan);
  const sliceContactUnlocked = useAppSelector((state) => state.features.contactUnlocked);

  // Logged-in pros follow the live subscription; everyone else (and API failures) use the marketplace slice.
  const { data: subscriptionResponse } = useGetMySubscriptionQuery(undefined, { skip: user?.role !== "pro" });
  const {
    data: applicationResponse,
    isSuccess: applicationLoaded,
    isError: applicationFailed,
  } = useGetProfessionalApplicationQuery(undefined, {
    skip: user?.role !== "pro",
  });
  const liveActive = user?.role === "pro" ? liveSubscriptionActive(subscriptionResponse?.data) : undefined;
  // Application payload uses `approvalStatus` (pending|approved|rejected) — prefer that over any nested status.
  const application = unwrapRecord(applicationResponse?.data);
  const liveApplicationStatus = mapApiApplicationStatus(
    application?.approvalStatus ?? application?.applicationStatus ?? application?.status,
  );
  const applicationStatus = liveApplicationStatus ?? localApplicationStatus;

  const membershipActive = liveActive ?? sliceMembershipActive;
  // An active live subscription unlocks contact without needing a visit to the pricing page first.
  const contactUnlocked = sliceContactUnlocked || liveActive === true;
  const isEffectivelyActive =
    liveActive !== undefined
      ? liveActive
      : membershipActive || (subscriptionPlan === "trial" && !membershipCancelled);

  const access = resolveRoleAccess(user, {
    applicationStatus,
    membershipActive: isEffectivelyActive,
    membershipPaused,
    membershipCancelled,
    contactUnlocked,
  });

  return {
    user,
    access,
    applicationStatus,
    applicationReady: user?.role !== "pro" || applicationLoaded || applicationFailed,
    membershipActive,
    membershipPaused,
    membershipCancelled,
    contactUnlocked,
  };
}
