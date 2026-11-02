"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Heart,
  MapPin,
  Maximize2,
  MessageSquare,
  Share2,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { photos } from "@/lib/media";
import { getAvatar } from "@/lib/avatars";
import {
  serviceLines,
  tradeDefaultServices,
  tradeDefaultReviews,
  getProGallery,
} from "@/lib/pro-extras";
import { loginHref } from "@/lib/role-access";
import { toggleFavorite } from "@/redux/slices/featuresSlice";
import { useRoleAccess } from "@/hooks/use-role-access";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { Professional } from "@/types";
import { cn } from "@/lib/cn";
import {
  defaultWeeklyHours,
  groupWeeklyHours,
  normalizeWeeklyHours,
  todayWeekday,
} from "@/lib/business-hours";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProProfileContent({ pro }: { pro: Professional }) {
  // Listing sections: about, services, photos, reviews. No FAQ list.
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { access, applicationStatus, membershipActive, membershipCancelled, membershipPaused, user } = useRoleAccess();
  const saved = useAppSelector((state) => state.features.favorites.includes(pro.id));
  const seedReviews = useAppSelector((state) =>
    state.features.reviews.filter((item) => item.proId === pro.id)
  );
  const completions = useAppSelector((state) => state.marketplace.completions);
  const hiredByJob = useAppSelector((state) => state.marketplace.hiredByJob);
  const extraQuotes = useAppSelector((state) => state.marketplace.extraQuotes);

  const dynamicCompletedJobs = useMemo(() => {
    let extra = 0;
    for (const [jobId, comp] of Object.entries(completions)) {
      if (comp.homeownerConfirmedAt) {
        const quoteId = hiredByJob[jobId];
        const quote = extraQuotes.find((q) => q.id === quoteId);
        if (quote && quote.proId === pro.id) {
          extra++;
        } else if (pro.id === "pro-1") {
          extra++;
        }
      }
    }
    return (pro.jobsCompleted || 65) + extra;
  }, [completions, hiredByJob, extraQuotes, pro.id, pro.jobsCompleted]);

  const [activeTab, setActiveTab] = useState<"about" | "services" | "photos" | "reviews">("about");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [copied, setCopied] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  const proProfile = useAppSelector((state) => state.features.proProfile);
  const isDemoPro = pro.id === "pro-1";

  const defaultBio =
    pro.categorySlug === "house-cleaning"
      ? "We’re a full-time, professional cleaning team serving both residential and commercial clients. Our experience includes recurring home cleanings, Airbnb turnovers, apartment move-in/move-out services, and office or commercial property cleaning."
      : pro.bio && pro.bio.length > 50
      ? pro.bio
      : "We’re a full-time, professional team serving both residential and commercial clients across the Austin metro area. Our experience includes recurring property care, urgent service calls, certified diagnostics, and complete installation services with guaranteed workmanship.";

  const effectiveBio = isDemoPro && proProfile?.bio ? proProfile.bio : defaultBio;
  const isBioLong = effectiveBio.length > 420;
  const effectiveBusinessName = isDemoPro && proProfile?.contactName ? proProfile.contactName : pro.name;
  const effectiveYearsInBusiness = isDemoPro && proProfile?.yearsInBusiness ? proProfile.yearsInBusiness : pro.yearsInBusiness;
  const effectiveStartingPrice = isDemoPro && proProfile?.startingPrice ? proProfile.startingPrice : pro.startingPrice;

  const replyTime = useMemo(() => {
    if (pro.emergency) return "~15 mins";
    const lower = (pro.responseTime || "").toLowerCase();
    if (lower.includes("min")) {
      const match = lower.match(/\d+/);
      return match ? `~${match[0]} mins` : "~15 mins";
    }
    if (/\b1\s*hour/.test(lower) || lower.includes("under 1")) return "~15 mins";
    if (/\b2\s*hour/.test(lower)) return "~20 mins";
    if (/\b3\s*hour/.test(lower)) return "~25 mins";
    if (/\b4\s*hour/.test(lower)) return "~30 mins";
    const idNum = pro.id.replace(/\D/g, "");
    const num = idNum ? parseInt(idNum, 10) : 1;
    const mins = [15, 20, 15, 20, 25, 15][num % 6] || 15;
    return `~${mins} mins`;
  }, [pro.id, pro.responseTime, pro.emergency]);

  const categoryServices = tradeDefaultServices[pro.categorySlug] ?? tradeDefaultServices.plumbing ?? [];
  const displayServices = isDemoPro && proProfile?.services?.length ? proProfile.services : categoryServices;

  const businessHours = normalizeWeeklyHours(
    isDemoPro && proProfile?.businessHours ? proProfile.businessHours : defaultWeeklyHours(),
  );
  const hourGroups = groupWeeklyHours(businessHours);
  const todayHours = businessHours[todayWeekday()];
  const openToday = todayHours.status === "open";

  const similarJobsCount = Math.max(7, Math.round(pro.jobsCompleted * 0.12));

  const cover = photos.services[pro.categorySlug] ?? photos.banner;
  const specialties = serviceLines[pro.categorySlug] ?? [pro.trade, "Diagnostics", "Repairs", "Maintenance"];
  const profilePath = `/browse-pros/${pro.id}`;

  const galleryPhotos = useMemo(() => {
    return getProGallery(pro.id, pro.categorySlug);
  }, [pro.id, pro.categorySlug]);

  const photoCategories = useMemo(() => {
    const set = new Set<string>();
    galleryPhotos.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [galleryPhotos]);

  const filteredGalleryPhotos = useMemo(() => {
    if (selectedPhotoCategory === "all") return galleryPhotos;
    return galleryPhotos.filter((p) => p.category === selectedPhotoCategory);
  }, [galleryPhotos, selectedPhotoCategory]);

  useEffect(() => {
    if (activePhotoIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActivePhotoIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActivePhotoIndex((prev) =>
          prev !== null ? (prev - 1 + galleryPhotos.length) % galleryPhotos.length : null
        );
      } else if (e.key === "ArrowRight") {
        setActivePhotoIndex((prev) =>
          prev !== null ? (prev + 1) % galleryPhotos.length : null
        );
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoIndex, galleryPhotos.length]);

  const quoteHref = access.audience === "homeowner"
    ? `/account/post-job?invite=${pro.id}`
    : loginHref({ next: `/account/post-job?invite=${pro.id}` });
  const messageHref =
    access.audience === "homeowner"
      ? `/account/messages?dm=${pro.id}`
      : access.audience === "guest"
      ? loginHref({ next: `/account/messages?dm=${pro.id}` })
      : null;

  function onSave() {
    if (access.audience === "guest") {
      router.push(loginHref({ next: pathname || profilePath }));
      return;
    }
    if (!access.canSavePro) return;
    dispatch(toggleFavorite(pro.id));
  }

  function onShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Realistic trade-verified reviews
  const tradeReviewGen = tradeDefaultReviews[pro.categorySlug] ?? tradeDefaultReviews.plumbing;
  const defaultReviews = useMemo(
    () => tradeReviewGen(pro.name, pro.city),
    [tradeReviewGen, pro.name, pro.city]
  );

  const allReviews = useMemo(() => {
    type ReviewEntry = {
      id: string;
      author: string;
      avatar?: string;
      location: string;
      date: string;
      rating: number;
      tag: "punctual" | "fair-price" | "clean-work";
      project: string;
      text: string;
      reply?: string;
    };

    const userMapped: ReviewEntry[] = seedReviews.map((r, i) => ({
      id: r.id,
      author: r.author,
      avatar: r.avatar || getAvatar(r.author),
      location: `${pro.city}, ${pro.state}`,
      date: r.createdAt ? r.createdAt : `${i + 1} month ago`,
      rating: r.rating,
      tag: (i % 2 === 0 ? "clean-work" : "fair-price") as "clean-work" | "fair-price" | "punctual",
      project: `${pro.trade} Service`,
      text: r.body,
      reply: r.reply ?? undefined,
    }));

    // Merge so seedReviews (e.g. Elena Ruiz) are first, followed by verified default reviews
    const combined: ReviewEntry[] = [...userMapped];
    for (const def of defaultReviews) {
      if (!combined.some((item) => item.text.trim() === def.text.trim() || item.id === def.id)) {
        combined.push({
          ...def,
          avatar: def.avatar || getAvatar(def.author),
          location: def.location || `${pro.city}, ${pro.state}`,
        });
      }
    }
    return combined;
  }, [seedReviews, defaultReviews, pro.city, pro.state, pro.trade]);

  const dynamicRating = useMemo(() => {
    if (!allReviews.length) return pro.rating;
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / allReviews.length) * 10) / 10;
  }, [allReviews, pro.rating]);

  const dynamicReviewCount = allReviews.length;

  const reviewBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, low: 0 };
    allReviews.forEach((r) => {
      if (r.rating === 5) counts[5]++;
      else if (r.rating === 4) counts[4]++;
      else counts.low++;
    });
    const total = allReviews.length || 1;
    return {
      fivePct: Math.round((counts[5] / total) * 100),
      fourPct: Math.round((counts[4] / total) * 100),
      lowPct: Math.round((counts.low / total) * 100),
    };
  }, [allReviews]);

  const filteredReviews = useMemo(() => {
    if (selectedRating === "all") return allReviews;
    const star = Number(selectedRating);
    return allReviews.filter((r) => r.rating === star);
  }, [allReviews, selectedRating]);

  const ratingFilters = useMemo(() => {
    const counts = {
      5: allReviews.filter((r) => r.rating === 5).length,
      4: allReviews.filter((r) => r.rating === 4).length,
      3: allReviews.filter((r) => r.rating === 3).length,
      2: allReviews.filter((r) => r.rating === 2).length,
      1: allReviews.filter((r) => r.rating === 1).length,
    };

    return [
      { id: "all", label: "All", count: allReviews.length },
      { id: "5", label: "5 Stars", stars: 5, count: counts[5] },
      { id: "4", label: "4 Stars", stars: 4, count: counts[4] },
      { id: "3", label: "3 Stars", stars: 3, count: counts[3] },
      { id: "2", label: "2 Stars", stars: 2, count: counts[2] },
      { id: "1", label: "1 Star", stars: 1, count: counts[1] },
    ];
  }, [allReviews]);

  // Service list with category & specialty filter
  const servicesList = useMemo(() => {
    if (!displayServices || displayServices.length === 0) return [];
    if (selectedCategoryFilter === "all") return displayServices;
    const q = selectedCategoryFilter.toLowerCase();
    return displayServices.filter((s) => {
      const cat = ("category" in s && typeof s.category === "string" ? s.category : "").toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        cat.includes(q)
      );
    });
  }, [displayServices, selectedCategoryFilter]);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 1. REFINED COMPACT COVER HERO WITH EMBEDDED BREADCRUMB */}
      <section className="relative h-32 sm:h-40 md:h-44 w-full overflow-hidden bg-gradient-to-r from-title via-slate-900 to-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={pro.name}
          className="h-full w-full object-cover object-center opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/50" />

        {/* Embedded Breadcrumb inside cover */}
        <nav aria-label="Breadcrumb" className="absolute top-3 left-0 right-0 z-10">
          <div className="container-site flex items-center gap-2 text-xs text-white/80 font-medium">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <span className="text-white/40">/</span>
            <Link href="/browse-pros" className="transition hover:text-white">
              Find Pros
            </Link>
            <span className="text-white/40">/</span>
            <Link
              href={`/browse-pros?category=${pro.categorySlug}`}
              className="capitalize transition hover:text-white"
            >
              {pro.trade}
            </Link>
            <span className="text-white/40">/</span>
            <span className="truncate font-semibold text-white">{pro.name}</span>
          </div>
        </nav>
      </section>

      {/* 3. PROFILE IDENTITY HEADER */}
      <section className="border-b border-line/60 bg-white">
        <div className="container-site relative pb-6 pt-0">
          {isDemoPro && user?.role === "pro" && (applicationStatus !== "cleared" || !membershipActive || membershipCancelled || membershipPaused) && (
            <div className="mb-4 mt-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs sm:text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Your Storefront is Currently Unpublished to Homeowners</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {applicationStatus !== "cleared"
                      ? "Pass Checkr background screening to clear your account and activate your 30-Day Free Trial."
                      : "Activate your complimentary 30-Day Free Trial or Pro package to publish your profile and start receiving quotes."}
                  </p>
                </div>
              </div>
              <Link
                href={applicationStatus !== "cleared" ? "/pro/application" : "/pro/pricing"}
                className="shrink-0 rounded-xl bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition"
              >
                {applicationStatus !== "cleared" ? "View Clearance Status ↗" : "Activate 30-Day Trial ↗"}
              </Link>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            {/* Avatar & Profile Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              <div className="relative -mt-10 sm:-mt-12 shrink-0">
                {(() => {
                  const storefrontAvatar =
                    pro.avatar ||
                    (isDemoPro && proProfile?.avatar) ||
                    getAvatar(effectiveBusinessName, pro.id);
                  return (
                    <span
                      suppressHydrationWarning
                      className="relative block h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border-4 border-white bg-smoke shadow-md ring-1 ring-black/5"
                    >
                      {storefrontAvatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={storefrontAvatar}
                          alt={effectiveBusinessName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-gradient-to-br from-primary to-blue-700 font-display text-2xl sm:text-3xl font-bold text-white">
                          {initials(effectiveBusinessName)}
                        </span>
                      )}
                    </span>
                  );
                })()}
                <span
                  title="Screened & Verified Professional"
                  className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white shadow-xs ring-2 ring-white z-10"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="space-y-1 pt-1 sm:pt-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-title leading-tight">
                  {effectiveBusinessName}
                </h1>

                {/* Clean, Non-repetitive Meta Line */}
                <div className="font-sans text-xs sm:text-sm text-copy flex flex-wrap items-center gap-2">
                  <span className="font-medium text-primary">
                    {pro.trade} Specialist
                  </span>
                  <span className="text-muted/60">·</span>
                  <button
                    type="button"
                    onClick={() => scrollToSection("sec-reviews")}
                    className="inline-flex items-center font-bold text-title hover:text-primary transition"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 mr-1" />
                    {dynamicRating.toFixed(1)}
                    <span className="font-normal text-muted ml-1">({dynamicReviewCount} reviews)</span>
                  </button>
                  <span className="text-muted/60">·</span>
                  <span className="inline-flex items-center text-muted">
                    <MapPin className="h-3.5 w-3.5 mr-1 shrink-0 text-muted" />
                    {pro.city}, {pro.state}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Share & Save) */}
            <div className="flex items-center gap-2 self-start md:self-end">
              <button
                type="button"
                onClick={onShare}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-title shadow-xs hover:bg-smoke transition-colors"
                title="Share Pro Profile"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copied ? "Link Copied!" : "Share"}</span>
              </button>

              {access.audience !== "pro" ? (
                <button
                  type="button"
                  onClick={onSave}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-title shadow-xs hover:bg-smoke transition-colors",
                    saved && access.canSavePro && "text-error border-error/30 bg-red-50"
                  )}
                  title="Save to favorites"
                >
                  <Heart className={cn("h-3.5 w-3.5", saved && access.canSavePro && "fill-current text-error")} />
                  <span>{saved && access.canSavePro ? "Saved" : "Save"}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* 4. SUB-NAVIGATION TAB RIBBON */}
        <div className="relative sm:sticky sm:top-[74px] z-30 border-t border-line/70 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="container-site flex items-center justify-between gap-4">
            <div className="flex gap-2 sm:gap-6 overflow-x-auto py-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: "sec-about", tabId: "about", label: "About" },
                { id: "sec-services", tabId: "services", label: "Services" },
                { id: "sec-photos", tabId: "photos", label: `Photos (${galleryPhotos.length})` },
                { id: "sec-reviews", tabId: "reviews", label: `Reviews (${allReviews.length})` },
              ].map((tab) => (
                <button
                  key={tab.tabId}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.tabId as typeof activeTab);
                    scrollToSection(tab.id);
                  }}
                  className={cn(
                    "shrink-0 px-2 py-3.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer",
                    activeTab === tab.tabId
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-muted hover:text-title"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. MAIN CONTENT LAYOUT */}
      <div className="container-site mt-8 sm:mt-10 grid gap-10 lg:grid-cols-12 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-10 sm:space-y-12">
          {/* ============================================================ */}
          {/* SECTION 1: ABOUT & OVERVIEW                                  */}
          {/* ============================================================ */}
          <section id="sec-about" className="scroll-mt-[135px] border-b border-line/60 pb-10 sm:pb-12 space-y-6">
            <div>
              <h2 className="font-display text-xl sm:text-[22px] font-semibold text-title tracking-tight">
                About
              </h2>
              <div className="mt-2.5 max-w-3xl">
                <p
                  className={cn(
                    "font-sans text-sm sm:text-[15px] leading-relaxed text-copy transition-all duration-200 whitespace-pre-line",
                    isBioLong && !bioExpanded && "line-clamp-3 sm:line-clamp-4"
                  )}
                >
                  {effectiveBio}
                </p>
                {isBioLong && (
                  <button
                    type="button"
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
                  >
                    <span>{bioExpanded ? "Show less" : "Read more"}</span>
                    {bioExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Professional Highlights & Operations (Unboxed, Clean Senior Architecture) */}
            <div className="pt-6 border-t border-line/60 grid gap-8 md:grid-cols-12 md:items-start">
              {/* Left Column (7 cols): Verified Highlights */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted">
                  Contractor Highlights
                </h3>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-1">
                  {/* Hired Times */}
                  <div className="flex items-start gap-2.5">
                    <Award className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-display text-sm font-semibold text-title">
                        Hired {dynamicCompletedJobs} times
                      </p>
                      <p className="text-xs text-muted">Verified local bookings</p>
                    </div>
                  </div>

                  {/* Local Jobs */}
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-display text-sm font-semibold text-title">
                        {similarJobsCount} local jobs
                      </p>
                      <p className="text-xs text-muted">Completed near {pro.city}</p>
                    </div>
                  </div>

                  {/* Background Checked & License */}
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-display text-sm font-semibold text-title flex items-center gap-1.5">
                        Verified &amp; Licensed
                        <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                      </p>
                      <p className="text-xs text-muted">
                        {isDemoPro && proProfile?.licenseNumber
                          ? `Lic #${proProfile.licenseNumber} · ${proProfile.insuranceCoverage || "$1M"} coverage`
                          : "Identity, license & record verified"}
                      </p>
                    </div>
                  </div>

                  {/* Years in Business */}
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-display text-sm font-semibold text-title">
                        {effectiveYearsInBusiness
                          ? effectiveYearsInBusiness.includes("year")
                            ? effectiveYearsInBusiness
                            : `${effectiveYearsInBusiness} in business`
                          : "1+ years in business"}
                      </p>
                      <p className="text-xs text-muted">Trade experience</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Business Hours & Response */}
              <div className="md:col-span-5 md:pl-6 md:border-l md:border-line/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    Business Hours
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-medium",
                      openToday ? "text-emerald-700" : "text-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        openToday ? "bg-emerald-500" : "bg-zinc-400",
                      )}
                    />
                    {openToday ? "Open today" : "Closed today"}
                  </span>
                </div>

                <div className="space-y-0 text-xs">
                  {hourGroups.map((group) => (
                    <div
                      key={group.label}
                      className="flex justify-between gap-3 border-b border-line/30 py-1.5 last:border-0"
                    >
                      <span className="text-muted">{group.label}</span>
                      <span
                        className={cn(
                          "font-medium",
                          group.status === "closed" && "text-muted",
                          group.status === "open" && "text-title",
                        )}
                      >
                        {group.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 2: SERVICES OFFERED                                */}
          {/* ============================================================ */}
          <section id="sec-services" className="scroll-mt-[135px] border-b border-line/60 pb-10 sm:pb-12 space-y-6">
            <div>
              <h2 className="font-display text-xl sm:text-[22px] font-semibold text-title tracking-tight">
                Services offered
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-muted">
                All services backed by guaranteed upfront estimates · Zero hidden travel fees
              </p>
            </div>

            {/* Specialties / Service Categories Filter */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter("all")}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                  selectedCategoryFilter === "all"
                    ? "bg-title text-white font-semibold shadow-2xs"
                    : "bg-surface border border-line/70 text-copy hover:bg-smoke"
                )}
              >
                All Services
              </button>
              {specialties.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(item)}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                    selectedCategoryFilter === item
                      ? "bg-title text-white font-semibold shadow-2xs"
                      : "bg-surface border border-line/70 text-copy hover:bg-smoke"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Clean 2-column checklist clearly showing services offered */}
            {servicesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pt-1">
                {servicesList.map((srv) => (
                  <div key={srv.id} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0 stroke-[2.5]" />
                    <div className="min-w-0">
                      <span className="font-display text-sm font-semibold text-title leading-tight">
                        {srv.name}
                      </span>
                      {srv.description && (
                        <p className="mt-0.5 text-xs text-muted leading-relaxed">
                          {srv.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-line/60 bg-surface/30 p-6 text-center text-xs text-muted">
                No specific services match this filter. Select &ldquo;All Services&rdquo; to view full offerings.
              </div>
            )}
          </section>

          {/* ============================================================ */}
          {/* SECTION 3: MEDIA & PROJECT PHOTOS GALLERY                  */}
          {/* ============================================================ */}
          <section id="sec-photos" className="scroll-mt-[135px] border-b border-line/60 pb-10 sm:pb-12 space-y-6">
            <div>
              <h2 className="font-display text-xl sm:text-[22px] font-semibold text-title tracking-tight">
                Project Photos &amp; Past Work
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-muted">
                Real project completions and verified craftsmanship by {pro.name}
              </p>
            </div>

            {/* Photo Category Filter Chips */}
            {photoCategories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPhotoCategory("all")}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                    selectedPhotoCategory === "all"
                      ? "bg-title text-white font-semibold shadow-2xs"
                      : "bg-surface border border-line/70 text-copy hover:bg-smoke"
                  )}
                >
                  All Photos ({galleryPhotos.length})
                </button>
                {photoCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedPhotoCategory(cat)}
                    className={cn(
                      "rounded-full px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                      selectedPhotoCategory === cat
                        ? "bg-title text-white font-semibold shadow-2xs"
                        : "bg-surface border border-line/70 text-copy hover:bg-smoke"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Gallery Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
              {filteredGalleryPhotos.map((photo, idx) => {
                const globalIdx = galleryPhotos.findIndex((p) => p.id === photo.id);
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActivePhotoIndex(globalIdx >= 0 ? globalIdx : idx)}
                    className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 border border-line/80 shadow-2xs hover:shadow-md hover:border-primary/50 transition-all text-left focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.image}
                      alt={photo.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Bottom Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition-opacity opacity-85 group-hover:opacity-95" />

                    {/* Top Zoom Icon on Hover */}
                    <span className="absolute top-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs transition shadow-sm">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </span>

                    {/* Bottom Caption */}
                    <div className="absolute inset-x-0 bottom-0 p-3 space-y-1">
                      <span className="inline-block rounded-md bg-white/20 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white">
                        {photo.category}
                      </span>
                      <p className="font-display text-xs sm:text-[13px] font-semibold text-white leading-tight line-clamp-1 drop-shadow-xs">
                        {photo.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>


          {/* ============================================================ */}
          {/* SECTION 3: VERIFIED CUSTOMER REVIEWS                        */}
          {/* ============================================================ */}
          <section id="sec-reviews" className="scroll-mt-[135px] border-b border-line/60 pb-10 sm:pb-12 space-y-6">
            <div>
              <h2 className="font-display text-xl sm:text-[22px] font-semibold text-title tracking-tight">
                Customer Reviews
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-muted">
                Feedback from verified homeowners in {pro.city} &amp; surrounding areas
              </p>
            </div>

            {/* Modern Review Scorecard Banner */}
            <div className="grid gap-6 rounded-2xl border border-line/70 bg-surface/30 p-5 sm:p-6 sm:grid-cols-12 sm:items-center">
              {/* Score summary */}
              <div className="sm:col-span-5 flex items-center gap-4 border-b border-line/60 pb-5 sm:border-b-0 sm:pb-0 sm:border-r sm:pr-6">
                <div className="font-display text-4xl sm:text-5xl font-extrabold text-title tracking-tight">
                  {dynamicRating.toFixed(1)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-title">
                    Based on {dynamicReviewCount} verified ratings
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    100% of homeowners recommend
                  </p>
                </div>
              </div>

              {/* Progress bars (Clickable Star Filters) */}
              <div className="sm:col-span-7 space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRating(selectedRating === "5" ? "all" : "5")}
                  className="flex items-center gap-3 w-full text-left group cursor-pointer"
                  title="Filter by 5 stars"
                >
                  <span className={cn("w-14 text-[11px] font-medium transition-colors", selectedRating === "5" ? "text-primary font-bold" : "text-muted group-hover:text-primary")}>5 stars</span>
                  <div className="h-2 flex-1 rounded-full bg-line/80 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 group-hover:bg-amber-500 transition-colors" style={{ width: `${reviewBreakdown.fivePct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[11px] font-medium text-muted">{reviewBreakdown.fivePct}%</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRating(selectedRating === "4" ? "all" : "4")}
                  className="flex items-center gap-3 w-full text-left group cursor-pointer"
                  title="Filter by 4 stars"
                >
                  <span className={cn("w-14 text-[11px] font-medium transition-colors", selectedRating === "4" ? "text-primary font-bold" : "text-muted group-hover:text-primary")}>4 stars</span>
                  <div className="h-2 flex-1 rounded-full bg-line/80 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 group-hover:bg-amber-500 transition-colors" style={{ width: `${reviewBreakdown.fourPct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[11px] font-medium text-muted">{reviewBreakdown.fourPct}%</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRating(selectedRating === "3" ? "all" : "3")}
                  className="flex items-center gap-3 w-full text-left group cursor-pointer"
                  title="Filter by 3 stars"
                >
                  <span className={cn("w-14 text-[11px] font-medium transition-colors", selectedRating === "3" ? "text-primary font-bold" : "text-muted group-hover:text-primary")}>1-3 stars</span>
                  <div className="h-2 flex-1 rounded-full bg-line/80 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 group-hover:bg-amber-500 transition-colors" style={{ width: `${reviewBreakdown.lowPct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[11px] font-medium text-muted">{reviewBreakdown.lowPct}%</span>
                </button>
              </div>
            </div>

            {/* Rating Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {ratingFilters.map((filter) => {
                const isSelected = selectedRating === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedRating(filter.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-title text-white shadow-xs font-semibold ring-1 ring-title"
                        : "bg-surface/80 text-copy hover:bg-smoke border border-line/80 hover:border-line"
                    )}
                  >
                    {filter.stars && (
                      <Star className={cn("h-3 w-3 fill-amber-400 text-amber-500", isSelected && "fill-amber-300 text-amber-300")} />
                    )}
                    <span>{filter.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-smoke text-muted border border-line/50"
                      )}
                    >
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
              <div className="rounded-2xl border border-line/70 bg-white p-8 text-center space-y-2">
                <p className="font-display text-sm font-semibold text-title">
                  No {selectedRating}-star reviews yet
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedRating("all")}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Show all reviews
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 pt-2">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-line/70 bg-white p-5 space-y-3 shadow-2xs hover:border-line transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span suppressHydrationWarning className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full bg-smoke border border-line/60 shadow-2xs">
                        {rev.avatar || getAvatar(rev.author) ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={rev.avatar || getAvatar(rev.author)}
                            alt={rev.author}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center font-display text-xs font-bold text-title">
                            {initials(rev.author)}
                          </span>
                        )}
                      </span>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-title">
                          {rev.author}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">
                          {rev.location} · {rev.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      ))}
                    </div>
                  </div>

                  <p className="font-sans text-xs sm:text-sm leading-relaxed text-copy">
                    {rev.text}
                  </p>

                  {rev.reply && (
                    <div className="space-y-1 rounded-xl border border-line border-l-[3px] border-l-primary bg-white p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs font-bold text-title">
                          Response from {pro.name}
                        </span>
                        <span className="text-[10px] text-muted">· Verified Pro</span>
                      </div>
                      <p className="text-xs text-copy/90 leading-relaxed">
                        {rev.reply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </section>
        </div>

        {/* Right Column (4 cols): ELEVATED STICKY ACTION CARD */}
        <aside className="lg:col-span-4 lg:sticky lg:top-[135px] space-y-3.5">
          <div className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-md space-y-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[26px] font-semibold leading-none tracking-tight text-title">
                      ${effectiveStartingPrice}
                    </span>
                    <span className="font-sans text-sm text-muted">starting estimate</span>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 font-sans text-xs font-medium text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Replies in {replyTime}
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t border-line/60 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 font-sans text-sm text-muted">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  Service area
                </span>
                <span className="font-display text-sm font-medium text-title text-right">
                  {pro.city}, {pro.state}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 font-sans text-sm text-muted">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  Availability
                </span>
                <span className="font-display text-sm font-medium text-right text-emerald-700">
                  {pro.availableThisWeek ? "Available this week" : "Book 3–5 days"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {quoteHref ? (
                <Button
                  href={quoteHref}
                  size="sm"
                  className="w-full justify-center text-sm font-medium shadow-xs"
                >
                  Request a quote
                </Button>
              ) : null}

              {messageHref ? (
                <Button
                  href={messageHref}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-sm font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
              ) : null}
            </div>

            <div className="border-t border-line/50 pt-3 text-center">
              <p className="inline-flex items-center justify-center gap-1.5 font-sans text-xs text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                Zero booking fees · Pay pro directly
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Interactive Photo Lightbox Modal */}
      {activePhotoIndex !== null && galleryPhotos[activePhotoIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div
            className="relative flex flex-col max-w-4xl w-full max-h-[92vh] overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2.5 text-xs text-white/70">
                <span className="rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {galleryPhotos[activePhotoIndex].category}
                </span>
                <span>·</span>
                <span>
                  Photo {activePhotoIndex + 1} of {galleryPhotos.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25 transition cursor-pointer"
                aria-label="Close photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Main Image Container with Next/Prev Arrows */}
            <div className="relative flex-1 flex items-center justify-center bg-black/80 min-h-[320px] max-h-[62vh] p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryPhotos[activePhotoIndex].image}
                alt={galleryPhotos[activePhotoIndex].title}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-xl"
              />

              {galleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex(
                        (activePhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-xs transition border border-white/15 cursor-pointer shadow-md"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((activePhotoIndex + 1) % galleryPhotos.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-xs transition border border-white/15 cursor-pointer shadow-md"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Footer Bar with Details & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-zinc-900 border-t border-white/10">
              <div className="space-y-0.5">
                <h4 className="font-display text-sm sm:text-base font-bold text-white">
                  {galleryPhotos[activePhotoIndex].title}
                </h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  {galleryPhotos[activePhotoIndex].description}
                </p>
              </div>

              {quoteHref && (
                <Link
                  href={`${quoteHref}&service=${encodeURIComponent(galleryPhotos[activePhotoIndex].title)}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition shrink-0 shadow-sm"
                >
                  <span>Request quote for this work</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
