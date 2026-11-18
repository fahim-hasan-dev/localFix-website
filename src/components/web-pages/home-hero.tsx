"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  MapPin,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, TextArea, TextField } from "@/components/ui/field";
import { EmergencyBanner } from "@/components/shared/emergency-banner";
import { photos } from "@/lib/media";
import { mapCategory } from "@/lib/api-mappers";
import { mediaUrl } from "@/utils/mediaUrl";
import { useGetBannersQuery, useGetCategoriesQuery } from "@/services/client/catalog-api";
import { useGetJobTabsCountQuery } from "@/services/client/jobs-api";
import type { Category } from "@/types";
import { saveDraft } from "@/redux/slices/intakeSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { postJobHref } from "@/lib/role-access";

const EMERGENCY_PATTERNS = [
  "gas leak",
  "smell gas",
  "gas odor",
  "electrical fire",
  "sparks",
  "sparking",
  "flames",
  "fire",
  "flooding",
  "burst pipe",
  "carbon monoxide",
  "co detector",
  "ceiling collapsing",
  "exposed live wire",
];

function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_PATTERNS.some((pattern) => lower.includes(pattern));
}

function guessServiceCategory(problem: string, categories: Category[]): string {
  const p = problem.toLowerCase();
  const keywordMap: Array<{ slug: string; words: string[] }> = [
    { slug: "plumbing", words: ["leak", "sink", "pipe", "faucet", "drain", "toilet", "water heater", "clog", "plumbing"] },
    { slug: "electrical", words: ["circuit", "breaker", "outlet", "wiring", "light", "switch", "power", "electrical", "electrician"] },
    { slug: "hvac", words: ["ac", "air condition", "furnace", "heat", "thermostat", "cooling", "hvac"] },
    { slug: "roofing", words: ["roof", "shingle", "gutter", "skylight", "roofing"] },
    { slug: "appliance-repair", words: ["fridge", "refrigerator", "washer", "dryer", "dishwasher", "oven", "stove", "appliance"] },
    { slug: "landscaping", words: ["tree", "lawn", "grass", "sprinkler", "yard", "landscap"] },
    { slug: "house-cleaning", words: ["clean", "maid", "housekeep", "cleaning"] },
    { slug: "handyman", words: ["paint", "drywall", "door", "deck", "shelf", "lock", "fence", "handyman"] },
  ];

  for (const entry of keywordMap) {
    if (!entry.words.some((word) => p.includes(word))) continue;
    const live = categories.find((item) => item.slug === entry.slug || item.name.toLowerCase().includes(entry.slug.split("-")[0]));
    if (live) return live.slug;
    if (categories.some((item) => item.slug === entry.slug)) return entry.slug;
  }

  for (const category of categories) {
    const name = category.name.toLowerCase();
    if (name.length >= 4 && p.includes(name)) return category.slug;
  }

  return "";
}

function resolveCategorySlug(
  selectedSlug: string,
  problem: string,
  categories: Category[],
): string {
  if (selectedSlug && categories.some((item) => item.slug === selectedSlug || item.id === selectedSlug)) {
    return selectedSlug;
  }
  return guessServiceCategory(problem, categories);
}

function buildDraft(problem: string, categorySlug: string, location: string, categories: Category[]) {
  const resolvedSlug = resolveCategorySlug(categorySlug, problem, categories);
  const match = categories.find((item) => item.slug === resolvedSlug || item.id === resolvedSlug);
  const zip = fiveDigitZip(location);
  return {
    problem,
    categorySlug: match?.slug || resolvedSlug,
    zip: zip || location.trim(),
    title: match?.name || "Home service request",
    summary: problem,
    followUps: [
      "What type of property is this?",
      "Are there access details the contractor should know?",
      "Which days or times work best for your schedule?",
      "Can you upload photos of the area?",
    ],
  };
}

function fiveDigitZip(value?: string) {
  const match = value?.trim().match(/\d{5}/);
  return match?.[0] ?? "";
}

export function HomeHero() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const addresses = useAppSelector((state) => state.features.addresses);
  const home = addresses.find((item) => item.label.toLowerCase() === "home") ?? addresses[0];
  const knownZip = fiveDigitZip(user?.zip) || fiveDigitZip(home?.zip);
  const [problem, setProblem] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [zip, setZip] = useState(knownZip);
  const [error, setError] = useState("");
  const [showEmergency, setShowEmergency] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: categoryResponse, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: bannerResponse } = useGetBannersQuery();
  const categories = useMemo(
    () => (categoryResponse?.data || []).map(mapCategory),
    [categoryResponse],
  );
  const banner = useMemo(() => {
    const raw = bannerResponse?.data;
    if (Array.isArray(raw)) return raw[0];
    return raw || null;
  }, [bannerResponse]);
  const heroImage = mediaUrl(banner?.image) || photos.hero;
  const heroHeadline = banner?.headline;
  const heroDescription = banner?.description;

  useEffect(() => {
    if (!zip && knownZip) setZip(knownZip);
  }, [knownZip, zip]);

  // Auto-suggest a trade while the user types, without overriding a manual choice.
  useEffect(() => {
    if (categorySlug || problem.trim().length < 8 || categories.length === 0) return;
    const guessed = guessServiceCategory(problem, categories);
    if (guessed) setCategorySlug(guessed);
  }, [problem, categories, categorySlug]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.slug === categorySlug || item.id === categorySlug),
    [categories, categorySlug],
  );

  function handleContinue() {
    if (detectEmergency(problem)) {
      setShowEmergency(true);
      return;
    }

    if (problem.trim().length < 8) {
      setError("Please describe the issue in a few words (e.g. 'pipe leaking under kitchen sink').");
      return;
    }

    if (zip.trim().length < 2) {
      setError("Please enter your ZIP code or city.");
      return;
    }

    if (categoriesLoading) {
      setError("Loading service categories… please try again in a moment.");
      return;
    }

    const draft = buildDraft(problem.trim(), categorySlug, zip.trim(), categories);
    if (!draft.categorySlug) {
      setError("Select a trade category so we can match the right pros.");
      return;
    }

    setError("");
    setSubmitting(true);
    setCategorySlug(draft.categorySlug);
    dispatch(saveDraft(draft));
    router.push(postJobHref(user));
  }

  const isPro = user?.role === "pro";
  const proProfile = useAppSelector((state) => state.features.proProfile);
  const { data: tabsCountData } = useGetJobTabsCountQuery(undefined, { skip: !isPro });
  const tabCounts = (tabsCountData?.data ?? {}) as { directRequests?: number; marketplaceLeads?: number };
  const openJobsCount = (tabCounts.directRequests || 0) + (tabCounts.marketplaceLeads || 0);
  const specialOffer = proProfile.specialOffer;
  const marketLabel = proProfile.city ? `${proProfile.city} Market Live` : "Market Live";

  return (
    <>
      {showEmergency ? (
        <EmergencyBanner onDismiss={() => setShowEmergency(false)} />
      ) : null}

      <section className="relative overflow-hidden bg-title text-white min-h-[600px] lg:h-[calc(100vh-139px)] lg:min-h-[580px]">
        <div
          className="absolute inset-0 bg-cover bg-[center_35%] md:bg-[85%_48%]"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="hero-wash absolute inset-0 z-[1]" />

        <div className="container-site relative z-[2] grid h-full min-h-[600px] lg:min-h-0 items-center gap-8 py-8 md:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-4">
          {isPro ? (
            <div className="relative z-[1] max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 font-display text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Verified Pro Contractor Portal
              </span>
              <h1 className="hero-title mt-4 text-white !text-white text-[38px] sm:text-[48px] lg:text-[62px] font-[500] leading-[1.08] lg:leading-[65px] tracking-[-1.8px] lg:tracking-[-3px]">
                Welcome back,{" "}
                <span className="text-secondary">{user.name.split(" ")[0]}</span>
              </h1>
              <p className="mt-4 max-w-[540px] font-['Inter_Display',Inter,sans-serif] text-[18px] font-normal leading-[25px] tracking-[-0.18px] text-white/85">
                {heroDescription ||
                  "New homeowner repair requests are waiting in your service area. Quote directly, chat with clients, and keep 100% of your earnings with zero job fees."}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button href="/pro/jobs" variant="white" size="lg" className="font-semibold text-sm">
                  View Available Jobs{openJobsCount > 0 ? ` (${openJobsCount})` : ""} ↗
                </Button>
                <Button href="/pro/profile" variant="ghost" size="lg" className="text-white hover:bg-white/10 border-white/30 text-sm">
                  My Storefront & Offers ↗
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative z-[1] max-w-xl">
              <h1 className="hero-title text-white !text-white text-[38px] sm:text-[46px] lg:text-[54px] xl:text-[62px] font-[500] leading-[1.08] lg:leading-[58px] xl:leading-[65px] tracking-[-1.8px] lg:tracking-[-2.6px]">
                {heroHeadline || (
                  <>
                    Find trusted local pros for{" "}
                    <span className="text-secondary">home repairs</span>
                  </>
                )}
              </h1>
              <p className="mt-3.5 max-w-[520px] font-['Inter_Display',Inter,sans-serif] text-[16px] sm:text-[17.5px] font-normal leading-[24px] tracking-[-0.18px] text-white/85">
                {heroDescription ||
                  "Compare upfront bids from background-checked local contractors. Pay them directly when the job is done — with zero platform fees."}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button href="/browse-pros" variant="white" size="lg" className="font-medium text-sm">
                  Browse Pros ↗
                </Button>
                <Button href="/how-it-works" variant="ghost" size="lg" className="text-white hover:bg-white/10 border-white/30 text-sm">
                  How it works ↗
                </Button>
              </div>
            </div>
          )}

          {isPro ? (
            <div className="relative z-10 rounded-[24px] border border-white/80 bg-white/95 p-6 text-title shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl md:p-7">
              <div className="flex items-center justify-between border-b border-line/60 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-geist text-[17px] sm:text-[19px] font-medium tracking-tight text-title">
                      Contractor Dispatch Hub
                    </h2>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {marketLabel}
                </span>
              </div>

              <div className="mt-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-line/80 bg-surface/50 p-3">
                    <span className="block text-[11px] font-medium text-muted uppercase tracking-wider">
                      Open Requests
                    </span>
                    <span className="mt-1 block font-display text-2xl font-bold text-title">
                      {openJobsCount} {openJobsCount === 1 ? "Job" : "Jobs"}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">Ready for bids</span>
                  </div>
                  <div className="rounded-xl border border-line/80 bg-surface/50 p-3">
                    <span className="block text-[11px] font-medium text-muted uppercase tracking-wider">
                      Platform Fee
                    </span>
                    <span className="mt-1 block font-display text-2xl font-bold text-title">
                      $0.00
                    </span>
                    <span className="text-[11px] text-muted">Keep 100% direct</span>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-bold text-title">
                      {specialOffer.active && specialOffer.discount
                        ? `Special Offer: ${specialOffer.discount} Active`
                        : "No special offer yet"}
                    </span>
                    <Link
                      href="/pro/profile"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {specialOffer.active ? "Edit Offer" : "Add Offer"}
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-[#757575]">
                    {specialOffer.active && specialOffer.title
                      ? specialOffer.title
                      : "Shown to homeowners when browsing your public storefront."}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    href="/pro/jobs"
                    size="md"
                    className="w-full justify-center shadow-xs"
                  >
                    Browse Available Jobs Board ↗
                  </Button>
                  <Button
                    href="/pro/messages"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                  >
                    Open Client Messages ↗
                  </Button>
                </div>

              </div>
            </div>
          ) : (
            <div className="relative z-10 rounded-[22px] border border-black/[0.04] bg-white p-5 sm:p-6 text-title shadow-[0_20px_50px_rgba(0,0,0,0.25)] md:p-6">
              {/* Minimal Header matching Figma */}
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-primary">
                  <Wrench className="h-3.5 w-3.5" />
                </span>
                <h2 className="font-geist text-[17px] sm:text-[18px] font-semibold tracking-tight text-title">
                  What needs fixing?
                </h2>
              </div>

              <div className="mt-3.5 space-y-2.5">
                <div>
                  <TextArea
                    value={problem}
                    onChange={(event) => {
                      setProblem(event.target.value);
                      if (detectEmergency(event.target.value)) {
                        setShowEmergency(true);
                      }
                    }}
                    placeholder="Describe your issue (e.g. water leaking under sink, AC blowing warm air upstairs...)"
                    className="min-h-[78px] resize-none text-[13.5px] sm:text-sm rounded-xl border border-line/80 bg-[#f9fafb] p-3 placeholder:text-muted/70 focus:border-primary focus:bg-white transition-colors"
                    rows={3}
                  />
                </div>

                <div className="relative">
                  <Wrench className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <NativeSelect
                    value={categorySlug}
                    onChange={(event) => setCategorySlug(event.target.value)}
                    className="pl-10 text-sm rounded-xl border-line/80 bg-[#f9fafb] focus:bg-white"
                  >
                    <option value="">
                      {categoriesLoading ? "Loading trades..." : "Select a trade (or keep our suggestion)"}
                    </option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <TextField
                    value={zip}
                    onChange={(event) => setZip(event.target.value)}
                    placeholder="Enter ZIP code or city (e.g. 78701)"
                    className="h-10 pl-9 text-[13.5px] sm:text-sm rounded-xl border border-line/80 bg-[#f9fafb] placeholder:text-muted/70 focus:border-primary focus:bg-white transition-colors"
                  />
                </div>

                <div className="pt-0.5 space-y-2">
                  <Button
                    type="button"
                    size="md"
                    onClick={handleContinue}
                    disabled={submitting}
                    className="w-full justify-center rounded-xl h-11 text-sm font-semibold shadow-xs"
                  >
                    {submitting
                      ? "Opening request…"
                      : user?.role === "homeowner"
                        ? "Continue to post request ↗"
                        : "Continue — sign in to post ↗"}
                  </Button>
                  {selectedCategory ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      href={`/browse-pros?category=${selectedCategory.slug}&location=${encodeURIComponent(zip.trim() || knownZip)}`}
                      className="w-full justify-center text-xs"
                    >
                      Or browse {selectedCategory.name} pros first ↗
                    </Button>
                  ) : null}
                </div>

                {error ? (
                  <p className="flex items-center gap-1.5 text-xs text-error font-medium" role="alert">
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </p>
                ) : (
                  <p className="text-center text-[11.5px] text-[#757575] pt-0.5">
                    100% Free to post • No spam sales calls • Direct to pro
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}