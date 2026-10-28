"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Home,
  ImagePlus,
  MapPin,
  Package,
  Pencil,
  Send,
  Star,
  Truck,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, NativeSelect, TextArea, TextField } from "@/components/ui/field";
import { categories, getPro, professionals } from "@/Mockdata";
import { matchEligiblePros } from "@/lib/matching";
import { questionsForCategory, type IntakeQuestion, type IntakeChoice } from "@/lib/intake-questions";
import { cleanFactLabel } from "@/lib/marketplace";
import { loginAs } from "@/redux/slices/authSlice";
import { clearDraft } from "@/redux/slices/intakeSlice";
import { addJob, addQuote } from "@/redux/slices/marketplaceSlice";
import { addNotification, invitePro, setJobPhotos, setJobStatus } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { JobVisibility, PropertyType, Urgency } from "@/types";
import { cn } from "@/lib/cn";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const STEPS = [
  { id: 1, label: "Job Details", shortLabel: "Details" },
  { id: 2, label: "Category Specifics", shortLabel: "Specifications" },
  { id: 3, label: "When & Where", shortLabel: "Schedule" },
  { id: 4, label: "Review & Submit", shortLabel: "Review" },
];

const MATERIAL_OPTIONS = [
  {
    id: "contractor",
    title: "Pro brings parts",
    desc: "They supply fittings and hardware",
    icon: Truck,
  },
  {
    id: "on_site",
    title: "I have parts",
    desc: "Replacement pieces are already here",
    icon: Package,
  },
  {
    id: "diagnostic",
    title: "Inspect first",
    desc: "Diagnose before buying parts",
    icon: Wrench,
  },
] as const;

type MaterialsStatus = (typeof MATERIAL_OPTIONS)[number]["id"];

export default function PostJobPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[20px] border border-line/80 bg-white p-8 text-center">
          <p className="text-sm text-muted">Loading booking flow…</p>
        </div>
      }
    >
      <BookingFlow />
    </Suspense>
  );
}

function createJobId() {
  return `job-local-${Date.now()}`;
}

function headlineFromDraft(problem: string, title: string, categoryName?: string) {
  const fromProblem = problem.split(/[.!\n]/)[0]?.trim() || problem.trim();
  if (fromProblem.length >= 4) return fromProblem.slice(0, 72);
  if (title && title !== categoryName) return title;
  return title || "";
}

function BookingFlow() {
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("invite");
  const invitedPro = inviteId ? getPro(inviteId) : null;

  const draft = useAppSelector((state) => state.intake.draft);
  const intakeReady = useAppSelector((state) => state.intake.hydrated);
  const user = useAppSelector((state) => state.auth.user);
  const addresses = useAppSelector((state) => state.features.addresses);
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);

  // 3-Step Streamlined Flow
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

  // Form State
  const startingCategory = invitedPro?.categorySlug || draft.categorySlug || "plumbing";
  const startingCategoryName = categories.find((item) => item.slug === startingCategory)?.name;
  const cameFromHome = Boolean(draft.problem || draft.categorySlug || draft.zip);
  const [categorySlug, setCategorySlug] = useState(startingCategory);
  const [titleInput, setTitleInput] = useState(
    headlineFromDraft(draft.problem || draft.summary || "", draft.title || "", startingCategoryName),
  );
  const [descriptionInput, setDescriptionInput] = useState(draft.problem || draft.summary || "");
  const [urgency, setUrgency] = useState<Urgency>("this_week");
  const [timeWindow, setTimeWindow] = useState("anytime");
  const [propertyType, setPropertyType] = useState<PropertyType>("single_family");
  const [materialsStatus, setMaterialsStatus] = useState<MaterialsStatus>("contractor");
  const [budget, setBudget] = useState("");
  const [zipInput, setZipInput] = useState(() => {
    const raw = draft.zip || user?.zip || "78701";
    const clean = raw.replace(/\D/g, "").slice(0, 5);
    return clean || "78701";
  });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [categoryAnswers, setCategoryAnswers] = useState<Record<string, string>>({});
  const appliedDraftRef = useRef(false);

  const categoryQuestions = useMemo(() => {
    const list = questionsForCategory(categorySlug);
    return list.filter((q: IntakeQuestion) => q.id !== "when");
  }, [categorySlug]);

  useEffect(() => {
    if (!intakeReady || appliedDraftRef.current) return;
    if (!(draft.problem || draft.summary || draft.categorySlug)) return;
    appliedDraftRef.current = true;
    queueMicrotask(() => {
      const nextCategory = invitedPro?.categorySlug || draft.categorySlug || startingCategory;
      const nextCategoryName = categories.find((item) => item.slug === nextCategory)?.name;
      setCategorySlug(nextCategory);
      setTitleInput(
        headlineFromDraft(draft.problem || draft.summary || "", draft.title || "", nextCategoryName),
      );
      setDescriptionInput(draft.problem || draft.summary || "");
      if (draft.zip) {
        const cleanZip = draft.zip.replace(/\D/g, "").slice(0, 5);
        if (cleanZip) setZipInput(cleanZip);
      }
    });
  }, [draft, intakeReady, invitedPro, startingCategory]);

  const selectedCategory = categories.find((c) => c.slug === categorySlug) ?? categories[0];
  const activeAddress = addresses.find((a) => a.label?.toLowerCase() === "home") ?? addresses[0];
  const displayLocation = activeAddress?.street
    ? `${activeAddress.street}, ${activeAddress.city || "Austin"}, ${activeAddress.state || "TX"} ${zipInput}`
    : `Austin, TX ${zipInput}`;

  // Simple Step Validations
  function validateStep(currentStep: number): boolean {
    setError("");
    if (currentStep === 1) {
      if (titleInput.trim().length < 4) {
        setError("Please enter a short project headline (at least 4 characters).");
        return false;
      }
      if (descriptionInput.trim().length < 10) {
        setError("Please add a brief description of what you need (at least 10 characters).");
        return false;
      }
    }
    // Step 2 is Category Specifics - completely optional and skippable
    if (currentStep === 3) {
      if (!/^\d{5}$/.test(zipInput.trim())) {
        setError("Please enter a valid 5-digit ZIP code.");
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  }

  function handleSkipCategory() {
    setError("");
    setStep(3);
  }

  function handleBack() {
    setError("");
    setStep((prev) => Math.max(prev - 1, 1));
  }

  function onPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, 4 - photoUrls.length);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotoUrls((prev) => [...prev, reader.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFinalSubmit() {
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    if (!validateStep(3)) {
      setStep(3);
      return;
    }

    const jobId = createJobId();
    const timeLabel =
      timeWindow === "morning"
        ? "Morning (8 AM – 12 PM)"
        : timeWindow === "afternoon"
          ? "Afternoon (12 PM – 5 PM)"
          : timeWindow === "evening"
            ? "Evening (5 PM – 8 PM)"
            : "Flexible / Anytime";

    const enhancedDescription = descriptionInput.trim();
    const visibility: JobVisibility = invitedPro ? "direct" : "open";
    const matches = matchEligiblePros(
      {
        categorySlug,
        zip: zipInput.trim(),
        city: activeAddress?.city || user?.city || "Austin",
      },
      professionals,
    );
    const matchedIds = invitedPro ? [invitedPro.id] : matches.map((item) => item.id);

    if (!user) {
      dispatch(loginAs("homeowner"));
    }

    // Only include category answers that were actually chosen by the user
    const dynamicAnswers = Object.entries(categoryAnswers)
      .map(([qId, val]) => {
        const q = categoryQuestions.find((item: IntakeQuestion) => item.id === qId);
        if (!q || !val) return null;
        const opt = q.options.find((o: IntakeChoice) => o.value === val);
        return {
          id: q.id,
          label: cleanFactLabel(q.prompt),
          value: opt?.label ?? val,
        };
      })
      .filter((a): a is { id: string; label: string; value: string } => Boolean(a));

    dispatch(
      addJob({
        id: jobId,
        title: titleInput.trim(),
        categorySlug,
        description: enhancedDescription,
        zip: zipInput.trim(),
        city: activeAddress?.city || user?.city || "Austin",
        state: activeAddress?.state || user?.state || "TX",
        urgency,
        budget: budget || undefined,
        propertyType,
        intakeAnswers: [
          ...dynamicAnswers,
          {
            id: "materials",
            label: "Parts & materials",
            value: MATERIAL_OPTIONS.find((item) => item.id === materialsStatus)?.title ?? "Pro brings parts",
          },
          {
            id: "timing",
            label: "Timing",
            value: timeLabel,
          },
        ],
        homeownerName: user?.name ?? "Homeowner",
        requestedProId: invitedPro?.id,
        visibility,
        photos: photoUrls,
        matchedProIds: matchedIds,
      }),
    );

    if (photoUrls.length) {
      dispatch(setJobPhotos({ jobId, photos: photoUrls }));
    }

    if (!invitedPro) {
      dispatch(setJobStatus({ jobId, status: "active" }));
    }

    if (invitedPro) {
      dispatch(invitePro({ jobId, proId: invitedPro.id }));
      dispatch(setJobStatus({ jobId, status: "active" }));
      dispatch(
        addNotification({
          title: "Direct quote request received",
          body: `${user?.name ?? "A homeowner"} asked you to quote "${titleInput.trim()}" in ${zipInput.trim()}.`,
          href: `/pro/jobs/${jobId}`,
          createdAt: "Just now",
          role: "pro",
        }),
      );
    } else if (matchedIds.includes("pro-1")) {
      dispatch(
        addNotification({
          title: "New matching job",
          body: `${titleInput.trim()} was posted in ${zipInput.trim()}. Review and send a quotation.`,
          href: `/pro/jobs/${jobId}`,
          createdAt: "Just now",
          role: "pro",
        }),
      );
    }

    dispatch(
      addNotification({
        title: invitedPro ? "Request sent" : "Job published",
        body: invitedPro
          ? `${invitedPro.name} has your details and can send a quotation. Hiring is not confirmed until you accept it.`
          : `${matchedIds.length} matching professional${matchedIds.length === 1 ? "" : "s"} can now send quotations.`,
        href: `/account/jobs/${jobId}`,
        createdAt: "Just now",
        role: "homeowner",
      }),
    );

    dispatch(clearDraft());
    setSubmittedJobId(jobId);
  }

  // Confirmation View
  if (submittedJobId) {
    return (
      <Card className="rounded-[24px] border border-line/80 bg-white p-6 sm:p-10 shadow-sm max-w-xl mx-auto text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs mb-5">
          <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200/80">
          Request Sent
        </span>

        <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-title">
          {invitedPro ? `Request Sent to ${invitedPro.name}!` : "Your Request is Live!"}
        </h1>

        <p className="mt-2 text-sm text-[#555] max-w-md mx-auto leading-relaxed">
          {invitedPro
            ? `${invitedPro.name} has your details and can send a quotation. Viewing a profile or sending this request is not a booking.`
            : "Matching professionals can review this job and send quotations. You hire only after you accept one."}
        </p>

        {/* Work Order Receipt Box */}
        <div className="mt-6 rounded-2xl border border-line/80 bg-surface/50 p-4 sm:p-5 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <span className="text-xs font-medium text-muted">Request Reference</span>
            <span className="font-mono text-xs font-bold text-title">
              #{submittedJobId.replace("job-local-", "HF-")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted block">Service</span>
              <span className="font-semibold text-title truncate block">{titleInput}</span>
            </div>
            <div>
              <span className="text-muted block">Location</span>
              <span className="font-semibold text-title">
                {zipInput} (Austin, TX)
              </span>
            </div>
            <div>
              <span className="text-muted block">Timeframe</span>
              <span className="font-semibold text-title capitalize">
                {urgency === "asap" ? "Emergency / ASAP" : urgency.replace("_", " ")}
              </span>
            </div>
            <div>
              <span className="text-muted block">Status</span>
              <span className="font-semibold text-emerald-700">
                {invitedPro ? "Waiting for a quote" : "Quotations in"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            href="/account"
            size="lg"
            className="w-full sm:w-auto font-semibold rounded-full shadow-xs px-6"
          >
            View my requests
          </Button>
          <Button
            href={`/account/jobs/${submittedJobId}?posted=1`}
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto rounded-full text-xs font-semibold"
          >
            Open this request
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* 1. Invited Pro Banner (If directly booking) */}
      {invitedPro ? (
        <Card className="rounded-[20px] border border-primary/30 bg-gradient-to-r from-primary/5 via-blue-50/20 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 font-display text-lg font-bold text-white shadow-xs">
                {initials(invitedPro.name)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    Direct Request
                  </span>
                </div>
                <h2 className="font-display text-lg font-bold text-title mt-0.5">
                  {invitedPro.name}
                </h2>
                <p className="text-xs text-muted">
                  ★ {invitedPro.rating.toFixed(1)} ({invitedPro.reviewCount} reviews) • Starting at ${invitedPro.startingPrice}
                </p>
              </div>
            </div>

            <Link
              href={`/browse-pros/${invitedPro.id}`}
              className="text-xs font-semibold text-primary hover:underline shrink-0"
            >
              View Profile ↗
            </Link>
          </div>
        </Card>
      ) : null}

      {/* 2. Streamlined 4-Step Progress Indicator */}
      <div className="rounded-[20px] border border-line/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 text-xs">
          <span className="font-display font-bold text-title text-sm sm:text-base">
            Step {step} of 4: <span className="text-primary">{STEPS[step - 1].label}</span>
          </span>
          <span className="font-medium text-muted">{Math.round((step / 4) * 100)}% Completed</span>
        </div>

        {/* Animated Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-smoke">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Step Tabs with responsive touch targets */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const isCompleted = s.id < step;
            const isCurrent = s.id === step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < step) setStep(s.id);
                }}
                disabled={s.id > step}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-xs font-semibold transition-all min-h-[42px]",
                  isCurrent && "bg-primary text-white shadow-xs font-bold",
                  isCompleted && "bg-smoke text-title hover:bg-smoke/80 cursor-pointer",
                  !isCurrent && !isCompleted && "bg-transparent text-muted/60 opacity-60 cursor-not-allowed",
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                ) : (
                  <span className="text-[11px] opacity-70">{s.id}.</span>
                )}
                <span>{s.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Layout: Focused Wizard Form */}
      <div className="w-full">
        <Card className="rounded-[24px] border border-line/80 bg-white p-5 sm:p-8 md:p-10 shadow-xs">
          {/* STEP 1: JOB DETAILS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-line/60 pb-3">
                <h2 className="font-display text-xl font-bold text-title">
                  What do you need help with?
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {cameFromHome || invitedPro
                    ? "Review and edit your project details before posting."
                    : "Tell us about your project so we can match you with the right specialist."}
                </p>
              </div>

              <Field label="Trade Category *">
                <NativeSelect
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="rounded-xl"
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field label="Project Headline *">
                <TextField
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Leaking kitchen faucet"
                  required
                  className="rounded-xl"
                />
              </Field>

              <Field label="Detailed Work Description *">
                <TextArea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Describe what needs to be fixed or installed, any symptoms, and any specific requests..."
                  className="min-h-[110px] rounded-xl text-sm"
                  rows={4}
                  required
                />
              </Field>

                {/* Inline Photo Upload (Convenient & frictionless) */}
                <div className="space-y-2.5 pt-2 border-t border-line/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm sm:text-[15px] font-semibold text-title">
                        Project Photos <span className="text-xs font-normal text-muted">(Optional)</span>
                      </label>
                      <p className="text-xs text-muted mt-0.5">
                        Add clear pictures of the repair area to get more accurate bids.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted bg-smoke px-2.5 py-1 rounded-md shrink-0">
                      {photoUrls.length} / 4 attached
                    </span>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={onPhotos}
                    className="sr-only"
                  />

                  <div className="flex flex-wrap items-center gap-2.5">
                    {photoUrls.map((src, index) => (
                      <div
                        key={src.slice(0, 48)}
                        className="relative h-20 w-20 overflow-hidden rounded-xl border border-line shadow-xs group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="Uploaded site photo" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => removePhoto(index)}
                          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-title/80 text-white transition hover:bg-error"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {photoUrls.length < 4 && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-smoke/40 text-muted transition hover:border-primary hover:text-primary hover:bg-primary/[0.02] cursor-pointer"
                      >
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-[11px] font-semibold">+ Add Photos</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CATEGORY SPECIFICS (DEDICATED STEP WITH SKIP OPTION) */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-line/60 pb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold text-title">
                      {selectedCategory.name} Specifications
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      Common details to help contractors give accurate upfront estimates. Answer or skip.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSkipCategory}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer rounded-lg bg-primary/5 px-3 py-1.5"
                  >
                    Skip this step ↗
                  </button>
                </div>

                {categoryQuestions.length > 0 ? (
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {categoryQuestions.map((q: IntakeQuestion, qIndex: number) => {
                      const activeVal = categoryAnswers[q.id];
                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border border-line/70 bg-white p-4 shadow-2xs space-y-3 transition hover:border-line"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-title flex items-center gap-1.5">
                              <span className="grid h-4.5 w-4.5 place-items-center rounded bg-smoke text-[10px] font-bold text-muted">
                                Q{qIndex + 1}
                              </span>
                              <span>{q.prompt.replace(/\?$/, "")}</span>
                            </label>
                            {activeVal ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md shrink-0">
                                Selected
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted shrink-0">Optional</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt: IntakeChoice) => {
                              const isSelected = activeVal === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    setCategoryAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: isSelected ? "" : opt.value,
                                    }))
                                  }
                                  className={cn(
                                    "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer min-h-[34px]",
                                    isSelected
                                      ? "border-primary bg-primary text-white shadow-2xs font-semibold"
                                      : "border-line bg-white text-title hover:bg-smoke hover:border-slate-300"
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3 mr-1.5 stroke-[2.5]" />}
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-line/80 bg-surface/30 p-8 text-center space-y-2">
                    <p className="text-sm font-medium text-title">
                      No additional specifications required for {selectedCategory.name}.
                    </p>
                    <p className="text-xs text-muted">
                      You can click Continue or Skip to set your schedule and location.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: WHEN & WHERE */}
            {step === 3 && (
              <div className="space-y-7 animate-in fade-in duration-150">
                <div className="border-b border-line/60 pb-3">
                  <h2 className="font-display text-xl font-bold text-title">
                    When and where do you need service?
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Choose your timeframe, arrival preferences, and service location.
                  </p>
                </div>

                {/* 1. Primary Decision: Urgency / Timeframe (Visual Hero) */}
                <div className="space-y-2.5">
                  <label className="block text-sm font-semibold text-title">
                    When would you like this done?
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        id: "asap",
                        title: "ASAP / Emergency",
                        desc: "Immediate or same-day service",
                        icon: Zap,
                      },
                      {
                        id: "this_week",
                        title: "Within a few days",
                        desc: "Next 1–3 business days",
                        icon: Calendar,
                      },
                      {
                        id: "flexible",
                        title: "Flexible",
                        desc: "Planning ahead / no rush",
                        icon: Clock,
                      },
                    ].map((item) => {
                      const active = urgency === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setUrgency(item.id as Urgency)}
                          className={cn(
                            "group relative flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer min-h-[68px]",
                            active
                              ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-xs"
                              : "border-line bg-white hover:border-line/90 hover:bg-slate-50/60",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn(
                                "grid h-9 w-9 place-items-center rounded-xl shrink-0 transition-colors",
                                active ? "bg-primary text-white shadow-2xs" : "bg-smoke text-primary group-hover:bg-primary/10",
                              )}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </span>
                            <div className="min-w-0">
                              <span className="font-display text-sm font-semibold text-title block leading-snug">
                                {item.title}
                              </span>
                              <span className="text-[11px] text-muted block mt-0.5 leading-snug">
                                {item.desc}
                              </span>
                            </div>
                          </div>
                          {active && (
                            <Check className="h-4 w-4 text-primary shrink-0 ml-1.5 stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Balanced 2-Column Row: Timing & Location */}
                <div className="grid gap-5 sm:grid-cols-2 pt-2">
                  {/* Service Location */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-title">
                      Service Location <span className="text-xs font-normal text-muted">(ZIP Code)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                      <input
                        type="text"
                        value={zipInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                          setZipInput(val);
                        }}
                        placeholder="e.g. 78701"
                        maxLength={5}
                        required
                        className="w-full h-11 rounded-xl border border-line bg-white pl-10 pr-3 font-mono text-sm font-semibold tracking-wider text-title outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-1.5 focus:ring-primary/20 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Preferred Arrival Window (Dropdown) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-title">
                      Preferred Arrival Window <span className="text-xs font-normal text-muted">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                      <select
                        value={timeWindow}
                        onChange={(e) => setTimeWindow(e.target.value)}
                        className="w-full h-11 rounded-xl border border-line bg-white pl-10 pr-9 text-sm font-medium text-title outline-none transition-colors appearance-none cursor-pointer focus:border-primary focus:ring-1.5 focus:ring-primary/20 shadow-2xs"
                      >
                        <option value="anytime">Anytime (Flexible arrival)</option>
                        <option value="morning">Morning (8:00 AM – 12:00 PM)</option>
                        <option value="afternoon">Afternoon (12:00 PM – 5:00 PM)</option>
                        <option value="evening">Evening (5:00 PM – 8:00 PM)</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 3. Balanced 2-Column Row: Property & Materials */}
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Property Type (Dropdown) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-title">
                      Property Type
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                        className="w-full h-11 rounded-xl border border-line bg-white pl-10 pr-9 text-sm font-medium text-title outline-none transition-colors appearance-none cursor-pointer focus:border-primary focus:ring-1.5 focus:ring-primary/20 shadow-2xs"
                      >
                        <option value="single_family">Single-Family Home</option>
                        <option value="condo">Condo / HOA / Townhome</option>
                        <option value="apartment">Apartment / Multi-Family</option>
                        <option value="commercial">Commercial / Office Space</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Parts & Materials (Dropdown) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-title">
                      Parts &amp; Materials
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                      <select
                        value={materialsStatus}
                        onChange={(e) => setMaterialsStatus(e.target.value as MaterialsStatus)}
                        className="w-full h-11 rounded-xl border border-line bg-white pl-10 pr-9 text-sm font-medium text-title outline-none transition-colors appearance-none cursor-pointer focus:border-primary focus:ring-1.5 focus:ring-primary/20 shadow-2xs"
                      >
                        <option value="contractor">Pro supplies parts (Fittings &amp; hardware)</option>
                        <option value="on_site">I have parts (Pieces already on-site)</option>
                        <option value="diagnostic">Inspect first (Diagnose before buying parts)</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* 4. Estimated Budget (Typeable Input) */}
                <div className="space-y-2 pt-2 border-t border-line/40">
                  <div className="flex items-center justify-between max-w-sm">
                    <label className="block text-sm font-semibold text-title">
                      Estimated Budget <span className="text-xs font-normal text-muted">(Optional)</span>
                    </label>
                    <span className="text-xs text-muted">Type amount or range</span>
                  </div>
                  <div className="relative max-w-sm">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted select-none pointer-events-none">
                      $
                    </span>
                    <input
                      type="text"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 250, 350–500, or flexible"
                      className="w-full h-11 rounded-xl border border-line bg-white pl-8 pr-3.5 text-sm font-medium text-title outline-none transition-colors focus:border-primary focus:ring-1.5 focus:ring-primary/20 shadow-2xs placeholder:text-muted/60"
                    />
                  </div>
                  <p className="text-[11px] text-muted">
                    Enter target amount or range. Leave blank if open to contractor estimates.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-line/60 pb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold text-title">
                      Review &amp; Submit
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      Check your request details before we notify local pros.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full shrink-0">
                    Ready to post
                  </span>
                </div>

                {/* Direct Pro Invitation Banner (if directed to specific pro) */}
                {invitedPro && (
                  <div className="flex items-center justify-between gap-3.5 rounded-xl border border-line/80 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-title text-white font-display text-sm font-bold shadow-xs">
                        {initials(invitedPro.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                          Direct Request to Pro
                        </span>
                        <h3 className="font-display text-sm font-bold text-title truncate mt-0.5">
                          {invitedPro.name}
                        </h3>
                        <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                          <span>{invitedPro.trade}</span>
                          <span className="text-stone-300">•</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-title">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                            {invitedPro.rating.toFixed(1)}
                            <span className="font-normal text-muted">({invitedPro.reviewCount})</span>
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-smoke/80 border border-line/70 px-2.5 py-1 text-xs text-stone-700 font-medium shrink-0">
                      <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                      Replies {invitedPro.responseTime}
                    </div>
                  </div>
                )}

                {/* Unified, Compact Review Slab (No nested box-in-box) */}
                <div className="rounded-xl border border-line/70 bg-surface/30 p-5 sm:p-6 space-y-5">
                  {/* Category, Title & Edit Action */}
                  <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-white border border-line/70 px-2.5 py-0.5 text-xs font-semibold text-title/80 shadow-2xs">
                          {selectedCategory.name}
                        </span>
                        {photoUrls.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                            <Camera className="h-3 w-3 text-muted" />
                            {photoUrls.length} photo{photoUrls.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-title mt-1.5 tracking-tight truncate">
                        {titleInput}
                      </h3>
                      {descriptionInput.trim() && descriptionInput.trim() !== titleInput.trim() ? (
                        <p className="mt-1 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {descriptionInput}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0 pt-0.5 cursor-pointer"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit Details
                    </button>
                  </div>

                  {/* Clean Specification Grid without nested boxed tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-5 text-xs">
                    {/* Timeframe */}
                    <div className="flex items-start gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-muted block leading-none">Timeframe</span>
                        <span className="font-semibold text-title capitalize truncate block mt-1">
                          {urgency === "asap" ? "Emergency / ASAP" : urgency.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Arrival Window */}
                    <div className="flex items-start gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-muted block leading-none">Arrival Window</span>
                        <span className="font-semibold text-title block mt-1 capitalize truncate">
                          {timeWindow}
                        </span>
                      </div>
                    </div>

                    {/* Service Location */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-muted block leading-none">Location</span>
                        <span className="font-semibold text-title block mt-1 truncate">
                          {displayLocation}
                        </span>
                      </div>
                    </div>

                    {/* Property Type */}
                    <div className="flex items-start gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-muted block leading-none">Property</span>
                        <span className="font-semibold text-title capitalize block mt-1 truncate">
                          {propertyType.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Parts & Materials */}
                    <div className="flex items-start gap-2">
                      <Package className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] text-muted block leading-none">Materials</span>
                        <span className="font-semibold text-title block mt-1 truncate">
                          {MATERIAL_OPTIONS.find((item) => item.id === materialsStatus)?.title ?? "Pro supplies parts"}
                        </span>
                      </div>
                    </div>

                    {/* Budget (if provided) */}
                    {budget ? (
                      <div className="flex items-start gap-2">
                        <Wallet className="h-3.5 w-3.5 text-muted shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[11px] text-muted block leading-none">Est. Budget</span>
                          <span className="font-semibold text-title block mt-1 truncate">
                            {budget.startsWith("$") || budget.toLowerCase().startsWith("under") || budget.toLowerCase().startsWith("flex") ? budget : `$${budget}`}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Answered Category Specifics (Only rendered if user answered) */}
                  {Object.keys(categoryAnswers).some((k) => categoryAnswers[k]) ? (
                    <div className="border-t border-line/60 pt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted mr-1">
                        Specifics:
                      </span>
                      {categoryQuestions
                        .filter((q: IntakeQuestion) => categoryAnswers[q.id])
                        .map((q: IntakeQuestion) => {
                          const selectedVal = categoryAnswers[q.id];
                          const opt = q.options.find((o: IntakeChoice) => o.value === selectedVal);
                          return (
                            <span
                              key={q.id}
                              className="inline-flex items-center gap-1 rounded-md bg-white border border-line/80 px-2.5 py-1 text-xs text-title font-medium shadow-2xs"
                            >
                              <span className="text-muted">{cleanFactLabel(q.prompt)}:</span>
                              <span className="font-semibold">{opt?.label ?? selectedVal}</span>
                            </span>
                          );
                        })}
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-xs font-semibold text-primary hover:underline ml-auto cursor-pointer"
                      >
                        Edit specs
                      </button>
                    </div>
                  ) : null}

                  {/* Attached Photos (Only rendered if user attached photos) */}
                  {photoUrls.length > 0 && (
                    <div className="border-t border-line/60 pt-3">
                      <div className="flex items-center justify-between text-xs mb-2.5">
                        <span className="font-semibold text-title flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5 text-primary" />
                          Attached Photos ({photoUrls.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Edit photos
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {photoUrls.map((src, index) => (
                          <div
                            key={src.slice(0, 48)}
                            className="h-16 w-16 overflow-hidden rounded-xl border border-line shadow-2xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Site photo ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Strip */}
                  <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs text-muted">
                    <span>
                      {invitedPro
                        ? `Direct request will be sent to ${invitedPro.name}`
                        : "Quotes from top matching pros will arrive directly in your dashboard"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Edit schedule &amp; address
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-medium text-error border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-line/60 pt-6">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleBack}
                  className="rounded-full gap-1.5 cursor-pointer px-5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <Button
                  href="/account"
                  variant="ghost"
                  size="md"
                  className="rounded-full text-muted cursor-pointer px-5"
                >
                  Cancel
                </Button>
              )}

              <div className="flex items-center gap-2.5">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={handleSkipCategory}
                    className="rounded-full text-xs font-semibold text-muted hover:text-title cursor-pointer px-4"
                  >
                    Skip this step ↗
                  </Button>
                )}

                {step < 4 ? (
                  <Button
                    type="button"
                    size="md"
                    onClick={handleNext}
                    className="rounded-full gap-1.5 font-semibold shadow-xs cursor-pointer px-6"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="md"
                    onClick={handleFinalSubmit}
                    className="rounded-full gap-2 font-semibold shadow-sm bg-primary hover:bg-primary-hover px-7 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    {invitedPro
                      ? `Send Request to ${invitedPro.name}`
                      : "Post Request & Get Quotes"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}
