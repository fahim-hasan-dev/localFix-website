"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Ban,
  Bath,
  BedDouble,
  Broom,
  CalendarDays,
  CalendarSync,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Droplets,
  FileCheck2,
  FileText,
  Flame,
  Home,
  MapPin,
  MessageSquare,
  Package,
  PawPrint,
  ShieldCheck,
  Star,
  Trash2,
  Truck,
  User,
  Wrench,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";
import { QuoteCard } from "@/components/shared/quote-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkOrderReceipt } from "@/components/shared/work-order-receipt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, NativeSelect, TextArea, TextField } from "@/components/ui/field";
import { canHomeownerCancelBooking, checkoutUrlFrom, errorMessage } from "@/lib/booking-view";
import {
  cleanJobDescription,
  isSamePro,
  jobRequestFacts,
  normalizeProId,
  paymentMethodLabels,
  selectablePaymentMethods,
  selectBooking,
  selectChangeRequests,
  selectCompletion,
  selectJob,
  selectQuotesForJob,
  splitJobDescription,
} from "@/lib/marketplace";
import { toApiPaymentMethod } from "@/lib/marketplace-mappers";
import { useDeleteJobRequestMutation, useUpdateJobMutation } from "@/services/client/jobs-api";
import {
  useCancelBookingMutation,
  useCompleteBookingWorkMutation,
  useConfirmBookingCompletionMutation,
  useCreateReviewMutation,
  useMarkBookingOnTheWayMutation,
  useRescheduleBookingMutation,
  useStartBookingWorkMutation,
} from "@/services/client/marketplace-api";
import { useResolvedPro } from "@/hooks/use-resolved-pro";
import { cn } from "@/lib/cn";
import {
  deleteJob,
  proMarkComplete,
} from "@/redux/slices/marketplaceSlice";
import {
  addNotification,
  addReview,
  updateReview,
  replyToReview,
  setJobPhotos,
  setJobStatus,
} from "@/redux/slices/featuresSlice";
import type { DirectPaymentMethod } from "@/types";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getFactIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("time") || l.includes("timing") || l.includes("schedule") || l.includes("date") || l.includes("when")) {
    return CalendarDays;
  }
  if (l.includes("bed")) {
    return BedDouble;
  }
  if (l.includes("bath")) {
    return Bath;
  }
  if (l.includes("clean") || l.includes("maid") || l.includes("wash") || l.includes("mop")) {
    return Broom;
  }
  if (l.includes("freq") || l.includes("often") || l.includes("repeat") || l.includes("interval")) {
    return CalendarSync;
  }
  if (l.includes("pet") || l.includes("dog") || l.includes("cat") || l.includes("animal")) {
    return PawPrint;
  }
  if (l.includes("property") || l.includes("home") || l.includes("house") || l.includes("building") || l.includes("condo") || l.includes("apartment")) {
    return Home;
  }
  if (l.includes("budget") || l.includes("price") || l.includes("cost") || l.includes("fee")) {
    return CircleDollarSign;
  }
  if (l.includes("part") || l.includes("material") || l.includes("supply")) {
    return Package;
  }
  if (l.includes("water") || l.includes("plumb") || l.includes("leak") || l.includes("drain") || l.includes("pipe") || l.includes("faucet")) {
    return Droplets;
  }
  if (l.includes("electric") || l.includes("power") || l.includes("light") || l.includes("breaker") || l.includes("wiring")) {
    return Zap;
  }
  if (l.includes("heat") || l.includes("hvac") || l.includes("furnace") || l.includes("air")) {
    return Flame;
  }
  if (l.includes("tool") || l.includes("repair") || l.includes("handyman") || l.includes("install") || l.includes("fix") || l.includes("issue")) {
    return Wrench;
  }
  return CheckCircle2;
}

export function RequestDetail({
  id,
  backHref,
  backLabel,
  canHire = false,
  viewer = "homeowner",
}: {
  id: string;
  backHref: string;
  backLabel: string;
  inboxHref?: string;
  canHire?: boolean;
  viewer?: "homeowner" | "pro";
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const job = useAppSelector((state) => selectJob(state, id));
  const quotes = useAppSelector((state) => selectQuotesForJob(state, id));
  const booking = useAppSelector((state) => selectBooking(state, id));
  const changeRequests = useAppSelector((state) => selectChangeRequests(state, id));
  const completion = useAppSelector((state) => selectCompletion(state, id));
  const storedPhotos = useAppSelector((state) => state.features.jobPhotos[id] ?? []);
  const user = useAppSelector((state) => state.auth.user);
  const [deleteJobRequest] = useDeleteJobRequestMutation();
  const [updateJob, { isLoading: savingEdit }] = useUpdateJobMutation();
  const [cancelBooking] = useCancelBookingMutation();
  const [markOnTheWay] = useMarkBookingOnTheWayMutation();
  const [startWork] = useStartBookingWorkMutation();
  const [completeWork] = useCompleteBookingWorkMutation();
  const [rescheduleBooking] = useRescheduleBookingMutation();
  const [confirmCompletion] = useConfirmBookingCompletionMutation();
  const [createReview] = useCreateReviewMutation();
  const myProId = normalizeProId(user?.role === "pro" ? user?.id : "") || "";
  const isProView = viewer === "pro";
  const marketplaceReady = useAppSelector((state) => state.marketplace.hydrated);
  const hiredQuoteId = useAppSelector((state) => state.marketplace.hiredByJob[id]);
  const hiredQuote = quotes.find((quote) => quote.id === hiredQuoteId);
  const requestedPro = useResolvedPro(job?.requestedProId);
  const hiredPro = useResolvedPro(hiredQuote?.proId || booking?.proId);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [isEditingReview, setIsEditingReview] = useState(false);

  const isJobBooked = Boolean(
    job && ["hired", "scheduled", "en_route", "in_progress", "awaiting_confirm"].includes(job.status)
  );

  const bookingTarget = booking?.id || id;

  async function runWorkflow(action: () => Promise<unknown>, success: string) {
    setWorking(true);
    setWorkflowError("");
    try {
      const result = await action();
      setSavedMsg(success);
      return result;
    } catch (error) {
      setSavedMsg("");
      setWorkflowError(errorMessage(error, "That update could not be saved."));
      return null;
    } finally {
      setWorking(false);
    }
  }

  async function handleConfirmCancel() {
    if (!job || working) return;
    if (isJobBooked) {
      const result = await runWorkflow(
        () => cancelBooking(bookingTarget).unwrap(),
        "Booking cancelled.",
      );
      if (!result) return;
      dispatch(setJobStatus({ jobId: job.id, status: "cancelled" }));
      setShowCancelModal(false);
      return;
    }
    const result = await runWorkflow(
      () => deleteJobRequest(job.id).unwrap(),
      "Request deleted.",
    );
    if (!result) return;
    dispatch(deleteJob(job.id));
    dispatch(
      addNotification({
          title: "Request Deleted",
          body: `Your service request "${job.title}" has been deleted.`,
          href: "/account",
          createdAt: new Date().toISOString(),
          role: "homeowner",
        }),
      );
      router.push(backHref);
  }
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewBody, setReviewBody] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [workflowError, setWorkflowError] = useState("");
  const [working, setWorking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editZip, setEditZip] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editTimeframe, setEditTimeframe] = useState("");
  const [editErrors, setEditErrors] = useState<{ headline?: string; description?: string; zip?: string }>({});
  const [scheduleErrors, setScheduleErrors] = useState<{ date?: string; window?: string }>({});
  const [rescheduleDate, setRescheduleDate] = useState(() => booking?.scheduledDate ?? "");
  const [rescheduleWindow, setRescheduleWindow] = useState(
    () => booking?.arrivalWindow || booking?.scheduledTime || "10:00 AM – 12:00 PM (Late Morning)"
  );
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showProCompleteModal, setShowProCompleteModal] = useState(false);
  const [proCompletionNote, setProCompletionNote] = useState("");
  const [settlePaymentMethod, setSettlePaymentMethod] = useState("cash");
  const [arrangePay, setArrangePay] = useState<DirectPaymentMethod>(() => booking?.paymentArrangement ?? "cash");
  const existingReview = useAppSelector((state) =>
    state.features.reviews.find((item) => item.jobId === id)
  );
  const [proReplyDraft, setProReplyDraft] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const currentDisplayRating = hoverRating || reviewRating;
  const activeSentiment = useMemo(() => {
    switch (currentDisplayRating) {
      case 5:
        return {
          title: "★★★★★ 5.0 — Outstanding!",
          desc: "Exceeded all expectations, highly recommend!",
          badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
        };
      case 4:
        return {
          title: "★★★★☆ 4.0 — Very Good!",
          desc: "Quality craftsmanship & satisfied.",
          badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
        };
      case 3:
        return {
          title: "★★★☆☆ 3.0 — Satisfactory",
          desc: "Met basic job expectations.",
          badgeClass: "bg-blue-50 text-blue-800 border-blue-300",
        };
      case 2:
        return {
          title: "★★☆☆☆ 2.0 — Below Expectations",
          desc: "Issues with communication or work quality.",
          badgeClass: "bg-orange-50 text-orange-800 border-orange-300",
        };
      case 1:
        return {
          title: "★☆☆☆☆ 1.0 — Poor Experience",
          desc: "Unsatisfactory experience or unresolved issue.",
          badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
        };
      default:
        return {
          title: "Select your rating (1–5 stars)",
          desc: "Click a star above to rate your experience",
          badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  }, [currentDisplayRating]);

  async function handleSaveReview() {
    if (reviewRating === 0) return;
    const cleanBody =
      reviewBody.trim() ||
      "Great service, arrived on time and completed the work cleanly.";

    if (!existingReview) {
      const posted = await runWorkflow(
        () =>
          createReview({
            bookingId: bookingTarget,
            rating: reviewRating,
            feedback: cleanBody,
          }).unwrap(),
        "Review submitted.",
      );
      if (!posted) return;
    }

    if (existingReview) {
      dispatch(
        updateReview({
          id: existingReview.id,
          rating: reviewRating,
          body: cleanBody,
        }),
      );
      setSavedMsg("Verified review updated successfully!");
    } else {
      dispatch(
        addReview({
          jobId: id,
          proId: hiredQuote?.proId ?? myProId,
          author: job?.homeownerName ?? "Homeowner",
          rating: reviewRating,
          body: cleanBody || "Excellent professional service.",
          createdAt: "Just now",
        }),
      );
      dispatch(
        addNotification({
          title: `New ${reviewRating}-star verified review`,
          body: `${job?.homeownerName ?? "Homeowner"} submitted a review for ${job?.title ?? "your service"}. It is now visible on your public profile.`,
          href: `/pro/reviews`,
          createdAt: "Just now",
          role: "pro",
        }),
      );
      setSavedMsg("Review published on contractor's profile!");
    }

    setShowReviewModal(false);
    setIsEditingReview(false);
  }

  const sortedQuotes = useMemo(
    () =>
      [...quotes].sort((a, b) => {
        const rank = (s: string) =>
          s === "accepted" ? 0 : s === "pending" ? 1 : 2;
        return rank(a.status) - rank(b.status) || a.amount - b.amount;
      }),
    [quotes],
  );

  function openEdit() {
    if (!job) return;
    setEditTitle(job.title);
    setEditDescription(cleanJobDescription(job.description, job.intakeAnswers) || job.description);
    setEditBudget(job.budget || "");
    setEditZip(job.zip);
    setEditCity(job.city);
    setEditState(job.state);
    setEditStreet(job.street || "");
    setEditTimeframe(job.timeframeLabel || "");
    setEditing(true);
    setWorkflowError("");
  }

  async function saveEdit() {
    if (!job) return;
    const nextErrors: { headline?: string; description?: string; zip?: string } = {};
    if (!editTitle.trim()) nextErrors.headline = "Enter a headline.";
    if (!editDescription.trim()) nextErrors.description = "Enter a description.";
    if (!editZip.trim()) nextErrors.zip = "Enter the ZIP code.";
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const budget = Number(String(editBudget).replace(/[^0-9.]/g, ""));
    const result = await runWorkflow(
      () =>
        updateJob({
          id: job.id,
          data: {
            headline: editTitle.trim(),
            description: editDescription.trim(),
            timeframe: editTimeframe.trim() || undefined,
            ...(Number.isFinite(budget) && budget > 0 ? { estimatedBudget: budget } : {}),
            serviceLocation: {
              zipCode: editZip.trim(),
              address: editStreet.trim() || undefined,
              city: editCity.trim() || undefined,
              state: editState.trim() || undefined,
            },
          },
        }).unwrap(),
      "Request updated.",
    );
    if (result) setEditing(false);
  }

  if (!marketplaceReady) {
    return (
      <div className="rounded-[16px] border border-line bg-white p-6">
        <p className="text-sm text-muted">Loading request…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="inline-flex font-display text-sm font-semibold text-primary">
          ← {backLabel}
        </Link>
        <div className="rounded-[16px] border border-line bg-white p-6 md:p-8">
          <h1 className="text-[28px]">Request not found</h1>
          <p className="mt-2 text-[16px] leading-7 text-copy">
            This job is missing or was cleared from this browser. Posted requests stay on this device only in the demo.
          </p>
          <div className="mt-5">
            <Button href={backHref} size="sm">
              {backLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const photosForJob = storedPhotos.length ? storedPhotos : job.photos ?? [];

  const isHiredPro = Boolean(
    isProView &&
    (backHref?.includes("/pro/bookings") ||
      (booking && (isSamePro(booking.proId, myProId) || !booking.proId)) ||
      (hiredQuote && isSamePro(hiredQuote.proId, myProId)) ||
      (job && isSamePro(job.requestedProId, myProId)))
  );

  const workActive =
    job.status === "hired" ||
    job.status === "scheduled" ||
    job.status === "en_route" ||
    job.status === "in_progress" ||
    job.status === "awaiting_confirm";

  const arrivalWindowsList = [
    "8:00 AM – 10:00 AM (Early Morning)",
    "10:00 AM – 12:00 PM (Late Morning)",
    "1:00 PM – 3:00 PM (Early Afternoon)",
    "3:00 PM – 5:00 PM (Late Afternoon)",
    "Flexible (Anytime during business hours)",
  ];

  const requestFacts = jobRequestFacts(job);
  const cleanDescription = cleanJobDescription(job.description, job.intakeAnswers);

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4 - photosForJob.length);
    if (!files.length) return;
    const readUrls: string[] = [];
    let completed = 0;
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          readUrls.push(reader.result);
        }
        completed++;
        if (completed === files.length) {
          const updated = [...photosForJob, ...readUrls].slice(0, 6);
          dispatch(setJobPhotos({ jobId: id, photos: updated }));
          setSavedMsg("Photos updated successfully!");
        }
      };
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }

  const detailedWorkDescription = (() => {
    if (cleanDescription && cleanDescription.trim().length > 0) {
      return cleanDescription.trim();
    }
    const { text: rawText } = splitJobDescription(job.description || "");
    if (rawText && rawText.trim().length > 0) {
      return rawText.trim();
    }
    if (job.description && job.description.trim().length > 0) {
      return job.description.trim();
    }
    const locationBits = [job.city, job.state, job.zip].filter(Boolean).join(", ");
    return locationBits
      ? `${job.title} service requested for property in ${locationBits}.`
      : job.title;
  })();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex font-display text-sm font-semibold text-primary">
          ← {backLabel}
        </Link>
        <div className="flex items-center gap-2">
          {!isProView && photosForJob.length === 0 && (
            <label className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-smoke cursor-pointer shadow-2xs transition">
              <Camera className="h-3.5 w-3.5" />
              <span>+ Add photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handlePhotoUpload}
              />
            </label>
          )}
          {!isProView && !isJobBooked && job.status !== "completed" && job.status !== "cancelled" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => (editing ? setEditing(false) : openEdit())}
              className="rounded-full border border-line text-xs font-semibold"
            >
              {editing ? "Close edit" : "Edit request"}
            </Button>
          )}
          {!isProView && !isJobBooked && job.status !== "completed" && job.status !== "cancelled" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="rounded-full text-xs font-semibold text-muted hover:text-error hover:bg-error/10 gap-1.5 cursor-pointer px-3"
            >
              <Trash2 className="h-3.5 w-3.5 text-error" />
              <span className="text-error font-medium">Delete Request</span>
            </Button>
          ) : null}
          {isProView ? (
            <Button
              href={`/pro/messages?dm=${job.id}`}
              size="sm"
              variant="ghost"
              className="rounded-full text-xs font-semibold border border-line px-3.5"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1 text-primary" />
              Message {job.homeownerName}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-7 md:p-8 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted">
              {job.visibility === "direct" || job.requestedProId ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-title">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Direct request {requestedPro ? `to ${requestedPro.name}` : ""}
                </span>
              ) : (
                <span className="font-medium text-muted">Marketplace Request</span>
              )}
              {job.urgency === "asap" ? (
                <span className="inline-flex items-center gap-1 text-error font-semibold">
                  <Clock className="h-3.5 w-3.5 text-error" /> Urgent
                </span>
              ) : null}
            </div>
            <h1 className="font-display text-xl font-semibold text-title sm:text-2xl">{job.title}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
              {[job.street, job.city, job.state, job.zip].some(Boolean) ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-copy">
                  <MapPin className="h-3.5 w-3.5 text-muted shrink-0" />
                  <span>
                    {[job.street, [job.city, job.state].filter(Boolean).join(", "), job.zip]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              ) : null}
              {job.postedAt ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-copy">
                  <CalendarDays className="h-3.5 w-3.5 text-muted shrink-0" />
                  <span>
                    Posted{" "}
                    {Number.isNaN(Date.parse(job.postedAt))
                      ? job.postedAt
                      : new Date(job.postedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                  </span>
                </span>
              ) : null}
              {isProView ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-copy">
                  {job.homeownerAvatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={job.homeownerAvatar}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover border border-line/70"
                    />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted shrink-0" />
                  )}
                  <span>Client: {job.homeownerName}</span>
                </span>
              ) : null}
            </div>
          </div>
          {!isProView && (job.status === "getting_quotes" || job.status === "active") ? null : (
            <StatusBadge status={job.status} />
          )}
        </div>

        {/* Detailed Work Description - Clean, open typography (suppressed if identical to title) */}
        {detailedWorkDescription && detailedWorkDescription.trim().toLowerCase() !== job.title.trim().toLowerCase() && (
          <div className="mt-6 border-t border-line/50 pt-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-display text-sm font-semibold text-title">
                Detailed Work Description
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-copy leading-relaxed whitespace-pre-line">
              {detailedWorkDescription}
            </p>
          </div>
        )}

        {/* Structured Service Specifications - Clean open grid */}
        {requestFacts.length ? (
          <div className="mt-6 border-t border-line/50 pt-5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3.5">
              Service Details &amp; Requirements
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 sm:gap-y-5 gap-x-6 text-xs">
              {requestFacts.map((fact) => {
                const Icon = getFactIcon(fact.label);
                return (
                  <div key={fact.label} className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-smoke/80 border border-line/70 text-primary shadow-2xs">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-muted block leading-none font-normal">
                        {fact.label}
                      </span>
                      <strong className="font-semibold text-title text-xs sm:text-[13px] block mt-1 break-words leading-tight">
                        {fact.value}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Attached Photos & Site Documentation (Only shown when photos exist) */}
        {photosForJob.length > 0 && (
          <div className="mt-6 border-t border-line/50 pt-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Camera className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-display text-sm font-semibold text-title">
                  Attached Photos &amp; Site Media
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-surface text-muted border border-line/80 text-[10px] font-medium px-2.5 py-0.5">
                  {photosForJob.length} photo{photosForJob.length > 1 ? "s" : ""} attached
                </span>
                {!isProView && photosForJob.length < 6 && (
                  <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer">
                    + Add more
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5 sm:gap-4">
              {photosForJob.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPreviewPhoto(src)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface shadow-2xs hover:ring-2 hover:ring-primary/40 transition cursor-zoom-in text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Job photo ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                    <span className="text-[10px] font-medium text-white flex items-center gap-1">
                      <ZoomIn className="h-3 w-3" /> Zoom
                    </span>
                    <span className="text-[10px] font-semibold text-white/90">
                      #{idx + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {canHire && job.status === "cancelled" && !hiredQuoteId ? (
          <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
            <span className="text-xs font-medium text-muted">Request cancelled.</span>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              onClick={() => {
                void runWorkflow(async () => {
                  await updateJob({ id, data: { status: "awaiting_quotes" } }).unwrap();
                  dispatch(setJobStatus({ jobId: id, status: "getting_quotes" }));
                }, "Request reposted.");
              }}
            >
              Repost Request
            </button>
          </div>
        ) : null}
        {savedMsg ? <p className="mt-2 text-xs font-medium text-success">{savedMsg}</p> : null}
        {workflowError ? <p className="mt-2 text-xs font-medium text-error">{workflowError}</p> : null}
        {editing && !isProView ? (
          <Card className="mt-4 rounded-2xl border border-line/80 bg-white p-4 sm:p-5 space-y-3">
            <h2 className="font-display text-sm font-semibold text-title">Edit request</h2>
            <Field label="Headline *" error={editErrors.headline}>
              <TextField
                value={editTitle}
                aria-invalid={Boolean(editErrors.headline)}
                className={editErrors.headline ? "border-error focus:border-error" : undefined}
                onChange={(event) => {
                  setEditTitle(event.target.value);
                  setEditErrors((prev) => ({ ...prev, headline: undefined }));
                }}
              />
            </Field>
            <Field label="Description *" error={editErrors.description}>
              <TextArea
                value={editDescription}
                rows={4}
                aria-invalid={Boolean(editErrors.description)}
                className={editErrors.description ? "border-error focus:border-error" : undefined}
                onChange={(event) => {
                  setEditDescription(event.target.value);
                  setEditErrors((prev) => ({ ...prev, description: undefined }));
                }}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Timeframe">
                <TextField value={editTimeframe} onChange={(event) => setEditTimeframe(event.target.value)} />
              </Field>
              <Field label="Budget">
                <TextField value={editBudget} onChange={(event) => setEditBudget(event.target.value)} />
              </Field>
              <Field label="Street">
                <TextField value={editStreet} onChange={(event) => setEditStreet(event.target.value)} />
              </Field>
              <Field label="City">
                <TextField value={editCity} onChange={(event) => setEditCity(event.target.value)} />
              </Field>
              <Field label="State">
                <TextField value={editState} onChange={(event) => setEditState(event.target.value)} />
              </Field>
              <Field label="ZIP *" error={editErrors.zip}>
                <TextField
                  value={editZip}
                  aria-invalid={Boolean(editErrors.zip)}
                  className={editErrors.zip ? "border-error focus:border-error" : undefined}
                  onChange={(event) => {
                    setEditZip(event.target.value);
                    setEditErrors((prev) => ({ ...prev, zip: undefined }));
                  }}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" disabled={savingEdit || working} onClick={saveEdit}>
                {savingEdit || working ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      {/* LIVE OPERATIONAL STATUS CARDS (Only visible to Homeowner or the Assigned Hired Contractor) */}
      {(!isProView || isHiredPro) && job.status === "en_route" ? (
        <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-3.5">
          <Truck className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h3 className="font-display text-sm sm:text-base font-bold text-title">
              {isProView ? "You are en route" : `${hiredPro?.name ?? hiredPro?.businessName ?? "Contractor"} is en route`}
            </h3>
            <p className="text-xs text-muted">
              {isProView ? (
                "Homeowner has been notified that you are on the way to the service location."
              ) : (
                <>
                  Scheduled arrival window:{" "}
                  <strong className="text-title font-semibold">
                    {booking?.arrivalWindow || booking?.scheduledTime}
                  </strong>
                </>
              )}
            </p>
          </div>
        </div>
      ) : null}

      {(!isProView || isHiredPro) && job.status === "in_progress" ? (
        <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-3.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <h3 className="font-display text-sm sm:text-base font-bold text-title">
              Work in progress on-site
            </h3>
            <p className="text-xs text-muted">
              {isProView
                ? "Job is currently underway on-site. Once completed, mark work complete below."
                : "Contractor is currently executing the project. Any extra scope requires your approval."}
            </p>
          </div>
        </div>
      ) : null}

      {(!isProView || isHiredPro) && job.status === "awaiting_confirm" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="font-display text-sm sm:text-base font-bold text-title">
                {isProView ? "Work marked complete" : "Contractor marked work completed"}
              </h3>
              <p className="text-xs text-muted">
                {isProView
                  ? "Waiting for the homeowner to inspect and confirm satisfaction to settle directly."
                  : "Inspect the work and confirm satisfaction to settle directly with zero fees."}
              </p>
              {completion?.completionNotes ? (
                <p className="mt-1 text-xs text-stone-600 italic">
                  Note: &ldquo;{completion.completionNotes}&rdquo;
                </p>
              ) : null}
            </div>
          </div>
          {canHire ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setShowSettleModal(true)}
              className="shrink-0 rounded-full font-semibold text-xs"
            >
              Confirm &amp; Settle Direct ↗
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Booking panel (Private between Homeowner and the Assigned Contractor) */}
      {booking && (workActive || job.status === "completed" || job.status === "cancelled") && (!isProView || isHiredPro) ? (
        <Card className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-3">
            <h2 className="font-display text-base sm:text-lg font-bold text-title">Appointment &amp; Booking</h2>
            {job.status === "completed" ? (
              <span className="text-xs text-muted font-medium flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                Completed &amp; Settled
              </span>
            ) : job.status === "cancelled" ? (
              <span className="text-xs text-error font-medium flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5 text-error" />
                Booking Cancelled
              </span>
            ) : (
              <span className="text-xs text-muted font-medium">Direct pay</span>
            )}
          </div>

          {job.status === "cancelled" ? (
            <div className="mt-4 rounded-xl border border-error/20 bg-error/5 p-3.5 text-xs text-error flex items-center gap-2.5">
              <Ban className="h-4 w-4 shrink-0 text-error" />
              <span>This booking was cancelled. No charges or fees have been collected.</span>
            </div>
          ) : null}

          <dl className="mt-4 grid gap-3 text-sm text-copy sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted font-medium">Assigned Contractor</dt>
              <dd className="font-semibold text-title flex items-center gap-1.5 mt-0.5">
                <span>{hiredPro?.name ?? "Professional"}</span>
                {hiredPro?.clearance === "cleared" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted font-medium">Homeowner</dt>
              <dd className="font-semibold text-title flex items-center gap-1.5 mt-0.5">
                <span>{job.homeownerName}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted font-medium">Agreed Total Price</dt>
              <dd className="font-display text-lg font-bold text-title mt-0.5">${booking.agreedPrice}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted font-medium">Service Location</dt>
              <dd className="font-semibold text-title mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{job.city}, {job.state} {job.zip}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted font-medium">Appointment &amp; Arrival Window</dt>
              <dd className="font-semibold text-title mt-0.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {booking.scheduledDate
                  ? `${booking.scheduledDate} · ${booking.arrivalWindow || booking.scheduledTime}`
                  : "Schedule not confirmed yet"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted font-medium">Agreed payment method</dt>
              <dd className="text-xs text-muted mt-0.5">
                {booking.paidAt ? (
                  <span className="font-semibold text-title">
                    Paid directly via {paymentMethodLabels[booking.paymentMethod ?? booking.paymentArrangement ?? ""] ?? booking.paymentMethod}
                  </span>
                ) : booking.paymentArrangement || booking.paymentMethod ? (
                  <span className="font-semibold text-title">
                    {paymentMethodLabels[booking.paymentArrangement ?? booking.paymentMethod ?? ""] ?? booking.paymentArrangement} · pay the professional directly
                  </span>
                ) : (
                  "Agree how you will pay the professional directly."
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-4 pt-3.5 border-t border-line/60">
            <p className="text-xs font-semibold text-title">Agreed Scope:</p>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted">{booking.scopeSnapshot}</p>
            {booking.acceptedAt ? (
              <p className="mt-1 text-[11px] text-muted">Accepted {booking.acceptedAt.slice(0, 10)}</p>
            ) : null}
          </div>

          {hiredQuote?.notes ? (
            <div className="mt-2 text-xs text-muted leading-relaxed">
              <span className="font-semibold text-title">Site Notes:</span> {hiredQuote.notes}
            </div>
          ) : null}

          {(hiredQuote?.warranty || hiredQuote?.materialsIncluded !== undefined || hiredQuote?.exclusions) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 text-xs">
              {hiredQuote.warranty ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-smoke/80 text-title border border-line/70 px-2.5 py-1 text-xs font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Warranty: {hiredQuote.warranty}
                </span>
              ) : null}
              {hiredQuote.materialsIncluded !== undefined ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-smoke/80 text-title border border-line/70 px-2.5 py-1 text-xs font-medium">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  {hiredQuote.materialsIncluded ? "Parts & materials included" : "Labor only (parts extra)"}
                </span>
              ) : null}
              {hiredQuote.exclusions ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-smoke/80 text-title border border-line/70 px-2.5 py-1 text-xs font-medium">
                  <AlertCircle className="h-3.5 w-3.5 text-muted" />
                  Exclusions: {hiredQuote.exclusions}
                </span>
              ) : null}
            </div>
          ) : null}

          {job.status === "completed" ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3.5">
              <p className="text-xs text-muted">
                Receipt #{booking?.paymentReceiptNumber || completion?.receiptNumber || "LHF-REC-842911"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowReceiptModal(true)}
                  className="rounded-full text-xs font-semibold border border-line hover:border-primary/40 hover:text-primary"
                >
                  <FileCheck2 className="h-3.5 w-3.5 text-primary mr-1.5" />
                  View Itemized Receipt &amp; PDF
                </Button>
                {!existingReview && canHire ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const el = document.getElementById("rate-and-review");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      } else {
                        setShowReviewModal(true);
                      }
                    }}
                    className="rounded-full text-xs font-semibold"
                  >
                    Rate &amp; Review Pro
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {booking.priceHistory && booking.priceHistory.length > 1 ? (
            <ul className="mt-4 space-y-1 text-xs text-muted">
              {booking.priceHistory.map((row) => (
                <li key={row.id}>
                  ${row.previousAmount} → ${row.newAmount} · {row.reason}
                </li>
              ))}
            </ul>
          ) : null}

          {(canHire || isProView) &&
          job.status !== "en_route" &&
          job.status !== "in_progress" &&
          job.status !== "awaiting_confirm" &&
          job.status !== "completed" &&
          job.status !== "cancelled" ? (
            booking.scheduledDate && !showRescheduleForm ? (
              <div className="mt-4 pt-3.5 border-t border-line/60 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">
                  Need to adjust your arrival time or reschedule?
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRescheduleForm(true)}
                  className="rounded-full text-xs font-semibold border border-line hover:border-primary/40 hover:text-primary gap-1.5"
                >
                  <CalendarSync className="h-3.5 w-3.5 text-primary" />
                  Reschedule Appointment
                </Button>
              </div>
            ) : (
              <div className="mt-5 border-t border-line/60 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    {booking.scheduledDate ? "Change appointment time" : "Confirm appointment to lock the booking"}
                  </p>
                  {booking.scheduledDate ? (
                    <button
                      type="button"
                      onClick={() => setShowRescheduleForm(false)}
                      className="text-xs text-muted hover:text-title hover:underline font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label={booking.scheduledDate ? "New date *" : "Appointment date *"} error={scheduleErrors.date}>
                    <TextField
                      type="date"
                      value={rescheduleDate}
                      aria-invalid={Boolean(scheduleErrors.date)}
                      className={scheduleErrors.date ? "border-error focus:border-error" : undefined}
                      onChange={(e) => {
                        setRescheduleDate(e.target.value);
                        setScheduleErrors((prev) => ({ ...prev, date: undefined }));
                      }}
                    />
                  </Field>
                  <Field label="Arrival window *" error={scheduleErrors.window}>
                    <NativeSelect
                      value={rescheduleWindow}
                      aria-invalid={Boolean(scheduleErrors.window)}
                      className={scheduleErrors.window ? "border-error focus:border-error" : undefined}
                      onChange={(e) => {
                        setRescheduleWindow(e.target.value);
                        setScheduleErrors((prev) => ({ ...prev, window: undefined }));
                      }}
                    >
                      {arrivalWindowsList.map((win) => (
                        <option key={win} value={win}>
                          {win}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  {!booking.paidAt ? (
                    <Field label="Agreed payment method">
                      <NativeSelect
                        value={(booking.paymentArrangement ?? arrangePay) === "stripe" ? "stripe" : "cash"}
                        onChange={(e) => setArrangePay(e.target.value as DirectPaymentMethod)}
                      >
                        {selectablePaymentMethods.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  {booking.scheduledDate ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowRescheduleForm(false)}
                      className="rounded-full text-xs"
                    >
                      Cancel
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant={booking.scheduledDate ? "ghost" : undefined}
                    disabled={working}
                    onClick={() => {
                      const nextErrors: { date?: string; window?: string } = {};
                      if (!rescheduleDate) nextErrors.date = "Choose an appointment date.";
                      if (!rescheduleWindow.trim()) nextErrors.window = "Choose an arrival window.";
                      setScheduleErrors(nextErrors);
                      if (Object.keys(nextErrors).length) return;
                      const chosenPay = (booking.paymentArrangement ?? arrangePay) === "stripe" ? "stripe" : "cash";
                      void runWorkflow(async () => {
                        await rescheduleBooking({
                          id: bookingTarget,
                          appointmentDate: rescheduleDate,
                          arrivalTimeWindow: rescheduleWindow,
                          ...(chosenPay ? { paymentMethod: toApiPaymentMethod(chosenPay) } : {}),
                        }).unwrap();
                        setShowRescheduleForm(false);
                      }, "Appointment updated.");
                    }}
                    className="rounded-full border border-line"
                  >
                    {booking.scheduledDate ? "Update Schedule" : "Confirm Appointment & Schedule"}
                  </Button>
                </div>
              </div>
            )
          ) : null}

          {/* Pro & Customer Action Buttons */}
          <div className="mt-5 flex flex-wrap gap-2.5 border-t border-line/60 pt-4">
            {/* Pro Operational Actions */}
            {isProView && (job.status === "scheduled" || job.status === "hired") ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={working}
                  onClick={() => {
                    void runWorkflow(async () => {
                      await markOnTheWay(bookingTarget).unwrap();
                      dispatch(setJobStatus({ jobId: id, status: "en_route" }));
                    }, "Status updated: on the way.");
                  }}
                  className="rounded-full gap-1.5"
                >
                  <Truck className="h-4 w-4" />
                  On the way (En Route)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={working}
                  onClick={() => {
                    void runWorkflow(async () => {
                      await startWork(bookingTarget).unwrap();
                      dispatch(setJobStatus({ jobId: id, status: "in_progress" }));
                    }, "Work started.");
                  }}
                  className="rounded-full gap-1.5 border border-line"
                >
                  <Wrench className="h-4 w-4" />
                  Start work directly
                </Button>
              </>
            ) : null}

            {isProView && job.status === "en_route" ? (
              <Button
                type="button"
                size="sm"
                disabled={working}
                onClick={() => {
                  void runWorkflow(async () => {
                    await startWork(bookingTarget).unwrap();
                    dispatch(setJobStatus({ jobId: id, status: "in_progress" }));
                  }, "Work started.");
                }}
                className="rounded-full gap-1.5"
              >
                <Wrench className="h-4 w-4" />
                Arrived on-site (Start Work)
              </Button>
            ) : null}

            {isProView && (job.status === "in_progress" || job.status === "en_route") && !completion?.proMarkedAt ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowProCompleteModal(true)}
                className="rounded-full gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark work complete
              </Button>
            ) : null}

            {/* Homeowner Completion Action — opens the settlement modal. */}
            {canHire && (job.status === "awaiting_confirm" || Boolean(completion?.proMarkedAt && !completion.homeownerConfirmedAt)) ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowSettleModal(true)}
                className="rounded-full gap-1.5 font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" />
                Inspect &amp; Confirm Completion
              </Button>
            ) : null}

            {/* Cancel is only allowed while the booking is still scheduled. */}
            {canHire && isJobBooked && canHomeownerCancelBooking(job.status) && !completion?.proMarkedAt ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="rounded-full text-xs font-semibold text-muted hover:text-error hover:bg-error/10 gap-1.5 cursor-pointer ml-auto"
              >
                <Ban className="h-3.5 w-3.5 text-error" />
                Cancel Booking
              </Button>
            ) : null}
          </div>

          {completion?.proMarkedAt && !completion.homeownerConfirmedAt ? (
            <p className="mt-3 text-xs font-medium text-amber-800">
              Pro marked complete. Homeowner inspection &amp; confirmation unlocks the review and receipt.
            </p>
          ) : null}
        </Card>
      ) : null}



      {!isProView ? (
        <>
          <Card className="rounded-[16px] p-4 sm:p-5 hover:shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-title">Quotations</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {hiredQuoteId
                    ? "You confirmed one quotation."
                    : "Open a quote to review it, then accept one pro."}
                </p>
              </div>
              {sortedQuotes.length ? (
                <span className="text-xs text-muted">{sortedQuotes.length}</span>
              ) : null}
            </div>
            {sortedQuotes.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                {requestedPro
                  ? `Waiting for a quotation from ${requestedPro.name}.`
                  : "Quotes from matched pros will show here."}
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {sortedQuotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    href={`/account/jobs/${id}/quotes/${quote.id}`}
                  />
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}

      {/* Live reviews are submitted from the booking detail page (booking API id isn't kept in local state). */}
      {job.status === "completed" && canHire && !isProView && booking ? (
        <p className="text-xs text-muted">
          <Link href="/account/bookings" className="font-semibold text-primary hover:underline">
            Leave a review on your booking
          </Link>{" "}
          to submit it to the contractor&apos;s public profile.
        </p>
      ) : null}

      {/* COMPLETED STATUS: HOMEOWNER & PRO VERIFIED REVIEW REFLECTION */}
      {job.status === "completed" ? (
        canHire ? (
          existingReview && !isEditingReview ? (
            <Card className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-7 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base sm:text-lg font-bold text-title">
                      Your Verified Review
                    </h2>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      Published
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Submitted for {hiredPro?.name ?? "your contractor"} · {existingReview.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(existingReview.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-500" />
                    ))}
                    <span className="ml-1 text-xs font-bold text-title">
                      {existingReview.rating}.0 / 5.0
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReviewRating(existingReview.rating);
                      setReviewBody(existingReview.body);
                      setIsEditingReview(true);
                    }}
                    className="rounded-full text-xs font-semibold border border-line hover:border-primary/40 hover:text-primary"
                  >
                    Edit Review
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <p className="font-sans text-sm leading-relaxed text-copy">
                  {existingReview.body}
                </p>

                {existingReview.reply ? (
                  <div className="mt-3.5 pt-3 border-t border-line/60 pl-3 border-l-2 border-primary/50 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs font-bold text-title">
                        Response from {hiredPro?.name ?? "Contractor"}
                      </span>
                      <span className="text-[11px] text-muted font-medium">Verified Pro</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {existingReview.reply}
                    </p>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : (
            <Card id="rate-and-review" className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5">
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-title">
                    {existingReview ? `Edit Review for ${hiredPro?.name ?? "Your Contractor"}` : `Rate & Review ${hiredPro?.name ?? "Your Contractor"}`}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Share your experience to help local homeowners and update public ratings.
                  </p>
                </div>
                <span className="text-xs text-muted font-medium flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  Verified Hire
                </span>
              </div>

              {/* Standard Star Rating Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-title">
                  Your Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isLit = currentDisplayRating >= starVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setReviewRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform duration-150 hover:scale-115 active:scale-95 cursor-pointer focus:outline-none"
                        title={`Rate ${starVal} Star${starVal > 1 ? "s" : ""}`}
                        aria-label={`Rate ${starVal} Star${starVal > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 sm:h-8 sm:w-8 transition-colors",
                            isLit
                              ? "fill-amber-400 text-amber-500"
                              : "fill-transparent text-slate-300 hover:text-amber-300",
                          )}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs sm:text-sm font-semibold text-title">
                    {activeSentiment.title}
                  </span>
                </div>
              </div>

              {/* Review Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-title">
                  Your Review (optional)
                </label>
                <TextArea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder={`Describe your experience with ${hiredPro?.name ?? "this contractor"} (work quality, punctuality, pricing, communication)...`}
                  rows={3}
                  className="rounded-xl border-line/80 text-xs sm:text-sm focus:border-primary"
                />
              </div>

              {/* Submit / Cancel Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line/60">
                {existingReview && isEditingReview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingReview(false)}
                    className="rounded-full text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={reviewRating === 0}
                  onClick={handleSaveReview}
                  className="rounded-full px-5 text-xs font-semibold"
                >
                  {existingReview ? "Update Review" : "Submit Review"}
                </Button>
              </div>
            </Card>
          )
        ) : isProView && isHiredPro ? (
          existingReview ? (
            <Card className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-7 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-title">
                      Client Review Received
                    </h2>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Verified Client
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    From {existingReview.author} · {existingReview.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(existingReview.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-500" />
                  ))}
                  <span className="ml-1 text-xs font-bold text-title">
                    {existingReview.rating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <p className="font-sans text-sm leading-relaxed text-copy">
                  {existingReview.body}
                </p>

                {existingReview.reply ? (
                  <div className="rounded-xl border border-line border-l-4 border-l-primary bg-smoke/60 p-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs font-bold text-title">
                        Your Public Response
                      </span>
                      <span className="text-[11px] text-muted">· Visible on your profile</span>
                    </div>
                    <p className="text-xs text-copy/90 leading-relaxed">
                      {existingReview.reply}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-line/80 bg-smoke/40 p-4 space-y-3">
                    <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted">
                      Respond to {existingReview.author} (Public Response)
                    </p>
                    <TextArea
                      value={proReplyDraft}
                      onChange={(e) => setProReplyDraft(e.target.value)}
                      placeholder="Thank the client for their business and review…"
                      rows={2}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={proReplyDraft.trim().length < 3}
                      onClick={() => {
                        dispatch(
                          replyToReview({
                            id: existingReview.id,
                            reply: proReplyDraft.trim(),
                          }),
                        );
                        dispatch(
                          addNotification({
                            title: "Contractor replied to your review",
                            body: `${hiredPro?.name ?? "Your contractor"} replied to your review for ${job.title}.`,
                            href: `/account/jobs/${id}`,
                            createdAt: "Just now",
                            role: "homeowner",
                          }),
                        );
                        setProReplyDraft("");
                        setSavedMsg("Public response published to your profile!");
                      }}
                      className="rounded-full"
                    >
                      Post Response
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="rounded-[20px] border border-line/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-title">
                    Awaiting Homeowner Review
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    You have marked work complete and settled payment off-platform. Once {job.homeownerName} submits their review, it will be posted here and on your public profile.
                  </p>
                </div>
              </div>
            </Card>
          )
        ) : null
      ) : null}

      {/* MODAL 1: WORK ORDER & RECEIPT MODAL */}
      {showReceiptModal ? (
        <WorkOrderReceipt
          job={job}
          booking={booking}
          pro={hiredPro}
          completion={completion}
          changeRequests={changeRequests}
          onClose={() => setShowReceiptModal(false)}
        />
      ) : null}

      {/* MODAL 2: HOMEOWNER DIRECT SETTLEMENT MODAL */}
      {showSettleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] border border-line bg-white p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowSettleModal(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-smoke text-muted hover:text-title"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-title">Confirm Work Completion</h2>
                <p className="text-xs text-muted">Confirm the work. Local Fix does not collect or refund the repair payment.</p>
              </div>
            </div>

            <div className="mt-4 rounded-[14px] bg-smoke/80 p-4 border border-line/60 space-y-2 text-xs">
              <div className="flex justify-between items-center text-title">
                <span className="text-muted font-medium">Total direct settlement:</span>
                <span className="font-display text-lg font-bold text-title">${booking?.agreedPrice}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Assigned Contractor:</span>
                <span className="font-semibold text-title">{hiredPro?.name ?? "Professional"}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Field label="Payment method" hint="Optional. Defaults to cash if you leave the current choice.">
                <NativeSelect
                  value={settlePaymentMethod}
                  onChange={(e) => setSettlePaymentMethod(e.target.value)}
                >
                  {selectablePaymentMethods.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-line/60 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSettleModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={working}
                onClick={() => {
                  void runWorkflow(async () => {
                    const result = await confirmCompletion({
                      id: bookingTarget,
                      paymentMethod: toApiPaymentMethod(settlePaymentMethod),
                      isPaidDirectly: settlePaymentMethod !== "stripe",
                      isSatisfactionConfirmed: true,
                    }).unwrap();
                    const checkout = checkoutUrlFrom(result);
                    if (checkout) {
                      window.location.assign(checkout);
                      return result;
                    }
                    dispatch(setJobStatus({ jobId: id, status: "completed" }));
                    setShowSettleModal(false);
                    setShowReceiptModal(true);
                    return result;
                  }, settlePaymentMethod === "stripe" ? "Opening secure checkout…" : "Completion confirmed.");
                }}
                className="rounded-full font-semibold"
              >
                Confirm &amp; Generate Receipt
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL 3: PRO COMPLETION SUMMARY MODAL */}
      {showProCompleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[24px] border border-line bg-white p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowProCompleteModal(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-smoke text-muted hover:text-title"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-title">Mark Work Complete</h2>
                <p className="text-xs text-muted">Notify homeowner to inspect and confirm direct settlement</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Field
                label="Completion Summary &amp; Notes (optional)"
                hint="Describe what was executed, tested, and cleaned"
              >
                <TextArea
                  value={proCompletionNote}
                  onChange={(e) => setProCompletionNote(e.target.value)}
                  placeholder="e.g. Replaced shutoff valve, tested supply line under full pressure for 15 mins, zero leaks detected. Cleaned and swept workspace."
                  rows={3}
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-line/60 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowProCompleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={working}
                onClick={() => {
                  void runWorkflow(async () => {
                    await completeWork({
                      id: bookingTarget,
                      completionNote: proCompletionNote.trim(),
                    }).unwrap();
                    dispatch(
                      proMarkComplete({
                        jobId: id,
                        completionNotes: proCompletionNote.trim() || undefined,
                      }),
                    );
                    dispatch(setJobStatus({ jobId: id, status: "awaiting_confirm" }));
                    setShowProCompleteModal(false);
                  }, "Work marked complete. Waiting for the homeowner to confirm.");
                }}
                className="rounded-full font-semibold"
              >
                Send Completion Notice
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL 4: COMPACT STANDARD REVIEW MODAL */}
      {showReviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-white shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-title">
                  {existingReview ? "Edit Review" : `Review ${hiredPro?.name ?? "Contractor"}`}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Verified hire · {job.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="rounded-full p-1 text-muted hover:bg-smoke hover:text-title transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stars Section (Clean, centered, no outer box) */}
            <div className="text-center py-1 space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isLit = currentDisplayRating >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setReviewRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform duration-150 hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                      aria-label={`Rate ${starVal} Star${starVal > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          isLit
                            ? "fill-amber-400 text-amber-500"
                            : "fill-transparent text-slate-300 hover:text-amber-300",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-medium text-title">
                {activeSentiment.title}
              </p>
            </div>

            {/* Written review field */}
            <div className="space-y-1">
              <TextArea
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="Write a brief review (optional)..."
                rows={3}
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowReviewModal(false)}
                className="rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={reviewRating === 0}
                onClick={handleSaveReview}
                className="rounded-full text-xs font-semibold"
              >
                {existingReview ? "Save Changes" : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel Request Confirmation Modal */}
      {showCancelModal && job ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error/10 text-error">
                {isJobBooked ? <Ban className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-full p-1.5 text-muted hover:text-title hover:bg-smoke transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="font-display text-lg font-bold text-title mt-3">
              {isJobBooked ? "Cancel Booking?" : "Delete Request?"}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed">
              {isJobBooked
                ? `Are you sure you want to cancel this booking? The assigned pro will be notified.`
                : "Are you sure you want to delete this request? This cannot be undone."}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isJobBooked ? "Keep Booking" : "Cancel"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancel}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isJobBooked ? "Cancel Booking" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-3xl w-full overflow-hidden rounded-2xl bg-white p-3 sm:p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line/60">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-title">Attached Job Photo</h4>
                  <p className="text-[11px] text-muted">{job.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="rounded-full p-1.5 text-muted hover:text-title hover:bg-smoke transition cursor-pointer"
                aria-label="Close photo preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center bg-surface/50 rounded-xl overflow-hidden p-2 max-h-[72vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto}
                alt="Attached photo enlargement"
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
            <div className="mt-3 flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-muted">Click anywhere outside to dismiss</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="rounded-lg bg-smoke px-3.5 py-1.5 text-xs font-semibold text-title hover:bg-line transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
