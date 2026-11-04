import { createSelector } from "@reduxjs/toolkit";
import { jobs as seedJobs, quotes as seedQuotes } from "@/Mockdata";
import type { RootState } from "@/redux/store";
import type { Booking, Job, JobStatus, Quote } from "@/types";

export function normalizeProId(id?: string | null): string {
  if (!id) return "";
  if (id === "user-pro-1" || id === "pro-1") return "pro-1";
  if (id.startsWith("user-pro-")) return id.replace(/^user-/, "");
  return id;
}

export function isSamePro(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalizeProId(a) === normalizeProId(b);
}

export const selectAllJobs = createSelector(
  [
    (state: RootState) => state.marketplace.extraJobs,
    (state: RootState) => state.marketplace.hiredByJob,
    (state: RootState) => state.features.jobStatusOverride,
    (state: RootState) => state.marketplace.completions,
    (state: RootState) => state.marketplace.bookings,
  ],
  (extraJobs, hired, overrides, completions, bookings): Job[] => {
    const seenJobIds = new Set<string>();
    const uniqueJobs: Job[] = [];
    for (const j of extraJobs) {
      if (!seenJobIds.has(j.id)) {
        seenJobIds.add(j.id);
        uniqueJobs.push(j);
      }
    }
    for (const j of seedJobs) {
      if (!seenJobIds.has(j.id)) {
        seenJobIds.add(j.id);
        uniqueJobs.push(j);
      }
    }

    return uniqueJobs.map((job) => {
      let status: JobStatus = overrides[job.id] ?? job.status;

      if (status === "cancelled" || status === "disputed" || status === "completed") {
        return { ...job, status };
      }

      const completion = completions[job.id];
      if (completion?.homeownerConfirmedAt) {
        status = "completed";
      } else if (completion?.proMarkedAt) {
        status = "awaiting_confirm";
      } else if (bookings[job.id]?.status === "confirmed" && hired[job.id]) {
        if (status === "hired" || status === "getting_quotes" || status === "quotes_in" || status === "active") {
          status = "scheduled";
        }
      } else if (hired[job.id]) {
        if (status !== "scheduled" && status !== "in_progress" && status !== "awaiting_confirm") {
          status = "hired";
        }
      }

      return { ...job, status };
    });
  },
);

export function selectJob(state: RootState, id: string) {
  return selectAllJobs(state).find((job) => job.id === id);
}

export const selectAllQuotes = createSelector(
  [
    (state: RootState) => state.marketplace.extraQuotes,
    (state: RootState) => state.marketplace.quoteOverrides,
  ],
  (extraQuotes, overrides): Quote[] => {
    const merge = (quote: Quote): Quote => {
      const patch = overrides[quote.id] ?? {};
      return {
        ...quote,
        ...patch,
        status: patch.status ?? quote.status ?? "pending",
      };
    };

    const seenQuoteIds = new Set<string>();
    const seenProJob = new Set<string>();
    const result: Quote[] = [];

    // Prioritize extraQuotes, then seedQuotes
    for (const q of extraQuotes.map(merge)) {
      const proJobKey = `${q.jobId}-${q.proId}`;
      if (seenQuoteIds.has(q.id) || seenProJob.has(proJobKey)) continue;
      seenQuoteIds.add(q.id);
      seenProJob.add(proJobKey);
      result.push(q);
    }

    for (const q of seedQuotes.map(merge)) {
      const proJobKey = `${q.jobId}-${q.proId}`;
      if (seenQuoteIds.has(q.id) || seenProJob.has(proJobKey)) continue;
      seenQuoteIds.add(q.id);
      seenProJob.add(proJobKey);
      result.push(q);
    }

    return result;
  },
);

export function selectQuotesForJob(state: RootState, jobId: string) {
  const job = selectJob(state, jobId);
  const allForJob = selectAllQuotes(state).filter((quote) => quote.jobId === jobId);
  if (job?.requestedProId || job?.visibility === "direct") {
    const targetProId = job.requestedProId;
    if (targetProId) {
      return allForJob.filter((q) => q.proId === targetProId);
    }
  }
  return allForJob;
}

export function selectJobsForHomeowner(state: RootState, name: string) {
  const all = selectAllJobs(state);
  const userJobs = name ? all.filter((job) => job.homeownerName === name) : [];
  if (userJobs.length > 0) {
    return userJobs;
  }
  return all.filter(
    (job) => job.homeownerName === "Maya Chen" || job.homeownerName === "Homeowner"
  );
}

export function selectBooking(state: RootState, jobId: string): Booking | undefined {
  const direct = state.marketplace.bookings[jobId];
  if (direct) return direct;
  const hiredQuoteId = state.marketplace.hiredByJob[jobId];
  if (hiredQuoteId) {
    const quotes = selectAllQuotes(state);
    const quote = quotes.find((q) => q.id === hiredQuoteId);
    if (quote) {
      return {
        jobId,
        quoteId: quote.id,
        proId: quote.proId,
        agreedPrice: quote.amount,
        scheduledDate: quote.availability || "Flexible",
        scheduledTime: quote.proposedSchedule || "10:00 AM – 12:00 PM",
        arrivalWindow: quote.proposedSchedule || "10:00 AM – 12:00 PM",
        scopeSnapshot: quote.scope,
        status: "confirmed",
        paymentArrangement: "cash",
      };
    }
  }
  return undefined;
}

export function selectChangeRequests(state: RootState, jobId: string) {
  return state.marketplace.changeRequests.filter((cr) => cr.jobId === jobId);
}

export function selectCompletion(state: RootState, jobId: string) {
  return state.marketplace.completions[jobId];
}

export function selectHiredQuoteId(state: RootState, jobId: string) {
  return state.marketplace.hiredByJob[jobId];
}

const TIMING_TAG = /\[Preferred Timing:\s*([^\]]+)\]/gi;

export function splitJobDescription(description: string) {
  const timing = [...description.matchAll(TIMING_TAG)].at(-1)?.[1]?.trim();
  const text = description.replace(TIMING_TAG, "").replace(/\n{2,}/g, "\n").trim();
  return { text, timing };
}

export function jobCardSummary(job: Job) {
  const { text } = splitJobDescription(job.description);
  if (job.intakeAnswers && job.intakeAnswers.length > 0) {
    const answers = job.intakeAnswers
      .map((a) => a.value)
      .filter((v) => v && v.toLowerCase() !== "flexible" && v.toLowerCase() !== "asap" && v.toLowerCase() !== "pro_bring");
    if (answers.length > 0) {
      return answers.slice(0, 3).join(" · ");
    }
  }
  if (text.includes("?")) {
    const qaRegex = /(?:^|\.\s*)[^?]+\?\s*([^?.]+)/g;
    const matches = [...text.matchAll(qaRegex)].map((m) => m[1]?.trim()).filter(Boolean);
    if (matches.length > 0) {
      return matches.slice(0, 3).join(" · ");
    }
  }
  const firstLabel = job.intakeAnswers?.[0]?.label;
  if (firstLabel && text.includes(firstLabel)) {
    const before = text.split(firstLabel)[0].replace(/[. ]+$/, "").trim();
    if (before) return before;
  }
  return text;
}

export function cleanFactLabel(rawLabel: string): string {
  const clean = rawLabel.replace(/[?:.]+$/g, "").trim();
  const lower = clean.toLowerCase();

  const labelMap: Record<string, string> = {
    "what kind of clean do you need": "Clean type",
    "how many bedrooms": "Bedrooms",
    "how many bathrooms": "Bathrooms",
    "how often": "Frequency",
    "any pets": "Pets",
    "when do you need this done": "Timing",
    "what's the plumbing issue": "Issue",
    "what is the plumbing issue": "Issue",
    "where is it": "Location",
    "is water still running": "Water running",
    "what electrical work do you need": "Service needed",
    "how many spots": "Spot count",
    "is power still on in the rest of the home": "Power status",
    "what needs work": "Equipment",
    "what's happening": "Issue",
    "what are you painting": "Area",
    "how much space": "Space / Rooms",
    "do you have the paint": "Paint supplied",
    "what type of roof is it": "Roof type",
    "how steep is the roof": "Roof pitch",
    "what appliance is having issues": "Appliance",
    "what's the brand": "Brand",
    "what's the landscaping service": "Service type",
    "how big is the yard": "Yard size",
    "what handyman service do you need": "Task type",
  };

  if (labelMap[lower]) return labelMap[lower];

  if (lower.startsWith("how many ")) {
    const rest = clean.slice(9).trim();
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : clean;
  }
  if (lower.startsWith("what type of ")) {
    const rest = clean.slice(13).trim();
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : clean;
  }
  if (lower.startsWith("what kind of ")) {
    const rest = clean.slice(13).trim();
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : clean;
  }
  if (lower.startsWith("what is the ")) {
    const rest = clean.slice(12).trim();
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : clean;
  }
  if (lower.startsWith("what's the ")) {
    const rest = clean.slice(11).trim();
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : clean;
  }

  return clean;
}

export function cleanJobDescription(description?: string, intakeAnswers?: Job["intakeAnswers"]): string {
  if (!description) return "";
  const { text } = splitJobDescription(description);
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (intakeAnswers && intakeAnswers.length > 0) {
    const firstPrompt = intakeAnswers[0]?.label;
    if (firstPrompt && trimmed.includes(firstPrompt)) {
      const customPrefix = trimmed.split(firstPrompt)[0].replace(/[. :–-]+$/, "").trim();
      return customPrefix;
    }

    const allAnswerValuesFound = intakeAnswers
      .filter((a) => a.value && a.value.length > 1)
      .every((a) => trimmed.includes(a.value));
    if (allAnswerValuesFound && trimmed.includes("?")) {
      return "";
    }
  }

  if (/^([A-Z][^?]+\?\s*[^?.]+)+$/i.test(trimmed.replace(/\n/g, " "))) {
    return "";
  }

  return trimmed;
}

export function jobRequestFacts(job: Job) {
  const { timing: taggedTiming } = splitJobDescription(job.description);
  const byId = (id: string) => job.intakeAnswers?.find((item) => item.id === id)?.value;
  const byLabel = (pattern: RegExp) =>
    job.intakeAnswers?.find((item) => pattern.test(item.label))?.value;

  const facts: { label: string; value: string }[] = [];
  const timing = byId("timing") ?? byId("when") ?? byLabel(/timing|schedule|when/i) ?? taggedTiming;
  const materials = byId("materials") ?? byLabel(/part|material/i);
  if (timing) facts.push({ label: "Timing", value: timing });
  if (materials) facts.push({ label: "Materials", value: materials });
  if (job.propertyType) {
    const labels: Record<string, string> = {
      single_family: "Single-family",
      condo: "Condo",
      townhome: "Townhome",
      apartment: "Apartment",
      commercial: "Commercial",
      other: "Other",
    };
    facts.push({ label: "Property", value: labels[job.propertyType] ?? job.propertyType });
  }
  if (job.budget) {
    const raw = job.budget.trim();
    const formatted =
      raw.startsWith("$") ||
      raw.toLowerCase().startsWith("under") ||
      raw.toLowerCase().startsWith("open") ||
      raw.toLowerCase().startsWith("flex")
        ? raw
        : `$${raw}`;
    facts.push({ label: "Budget", value: formatted });
  }

  if (job.intakeAnswers && job.intakeAnswers.length > 0) {
    job.intakeAnswers.forEach((ans) => {
      if (
        ans.id !== "timing" &&
        ans.id !== "when" &&
        ans.id !== "materials" &&
        !/timing|schedule|when|part|material/i.test(ans.label) &&
        ans.value &&
        ans.label
      ) {
        facts.push({ label: cleanFactLabel(ans.label), value: ans.value });
      }
    });
  }

  const seen = new Set<string>();
  return facts.filter((f) => {
    const key = f.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  mobile_banking: "Mobile banking",
  zelle: "Zelle / instant transfer",
  card: "Card reader (paid to the pro)",
  check: "Check",
  other: "Other agreed method",
};

export function selectProJobsGrouped(state: RootState, proId: string = "pro-1") {
  const normalizedId = normalizeProId(proId);
  const allJobs = selectAllJobs(state);
  const hiredByJob = state.marketplace.hiredByJob;
  const bookings = state.marketplace.bookings;
  const quotes = selectAllQuotes(state);
  const invitedPros = state.features.invitedPros;
  const leadActions = state.features.leadActions;

  // 1. Direct 1-on-1 inquiries specifically directed to this pro
  const directInquiries = allJobs.filter((job) => {
    const isDirect =
      isSamePro(job.requestedProId, normalizedId) ||
      (job.visibility === "direct" &&
        (isSamePro(job.requestedProId, normalizedId) ||
          invitedPros[job.id]?.some((pId) => isSamePro(pId, normalizedId))));
    if (!isDirect) return false;
    const closed = ["completed", "cancelled", "disputed"].includes(job.status);
    if (closed) return false;
    const hiredId = hiredByJob[job.id];
    if (hiredId) {
      const q = quotes.find((item) => item.id === hiredId);
      if (isSamePro(q?.proId, normalizedId)) return false;
    }
    const alreadyQuoted = quotes.some((q) => q.jobId === job.id && isSamePro(q.proId, normalizedId));
    if (alreadyQuoted) return false;
    return leadActions[job.id] !== "declined";
  });

  // 2. Active & upcoming jobs where this pro is the contracted provider
  const activeJobs = allJobs.filter((job) => {
    const hiredId = hiredByJob[job.id];
    const booking = bookings[job.id];
    const isThisProHired =
      (hiredId && isSamePro(quotes.find((q) => q.id === hiredId)?.proId, normalizedId)) ||
      isSamePro(booking?.proId, normalizedId);
    if (!isThisProHired) return false;
    return ["hired", "scheduled", "en_route", "in_progress", "awaiting_confirm"].includes(job.status);
  });

  // 3. Completed jobs where this pro was the provider
  const completedJobs = allJobs.filter((job) => {
    const hiredId = hiredByJob[job.id];
    const booking = bookings[job.id];
    const isThisProHired =
      (hiredId && isSamePro(quotes.find((q) => q.id === hiredId)?.proId, normalizedId)) ||
      isSamePro(booking?.proId, normalizedId);
    return isThisProHired && job.status === "completed";
  });

  // 4. Open marketplace leads (not direct) open for proposal
  const marketplaceLeads = allJobs.filter((job) => {
    if (job.visibility === "direct" || job.requestedProId) return false;
    const closed = [
      "completed",
      "cancelled",
      "hired",
      "scheduled",
      "en_route",
      "in_progress",
      "awaiting_confirm",
      "disputed",
      "draft",
    ].includes(job.status);
    if (closed) return false;
    return leadActions[job.id] !== "declined";
  });

  // 5. Jobs where this pro has submitted a quote
  const quotedJobs = allJobs.filter((job) => {
    return quotes.some((q) => q.jobId === job.id && isSamePro(q.proId, normalizedId));
  });

  return {
    directInquiries,
    activeJobs,
    completedJobs,
    marketplaceLeads,
    quotedJobs,
    totalActive: activeJobs.length,
    totalDirect: directInquiries.length,
    totalLeads: marketplaceLeads.length,
    totalCompleted: completedJobs.length,
  };
}

export function selectHomeownerJobsGrouped(state: RootState, homeownerName: string) {
  const mine = selectJobsForHomeowner(state, homeownerName);
  const active = mine.filter((j) =>
    ["hired", "scheduled", "en_route", "in_progress", "awaiting_confirm"].includes(j.status)
  );
  const awaitingQuotes = mine.filter((j) =>
    ["draft", "active", "getting_quotes", "quotes_in"].includes(j.status)
  );
  const completed = mine.filter((j) => j.status === "completed");
  const cancelled = mine.filter((j) => j.status === "cancelled" || j.status === "disputed");

  return {
    all: mine,
    active,
    awaitingQuotes,
    completed,
    cancelled,
  };
}

export function selectHomeownerBookingsGrouped(state: RootState, homeownerName: string) {
  const mine = selectJobsForHomeowner(state, homeownerName);
  const booked = mine.filter((j) =>
    ["hired", "scheduled", "en_route", "in_progress", "awaiting_confirm", "completed", "cancelled", "disputed"].includes(j.status)
  );
  const upcoming = booked.filter((j) => ["hired", "scheduled"].includes(j.status));
  const inProgress = booked.filter((j) => ["en_route", "in_progress", "awaiting_confirm"].includes(j.status));
  const history = booked.filter((j) => ["completed", "cancelled", "disputed"].includes(j.status));

  return {
    all: booked,
    upcoming,
    inProgress,
    history,
    totalUpcoming: upcoming.length,
    totalInProgress: inProgress.length,
    totalHistory: history.length,
  };
}

export function selectHomeownerRequests(state: RootState, homeownerName: string) {
  const mine = selectJobsForHomeowner(state, homeownerName);
  return mine.filter((j) =>
    ["draft", "active", "getting_quotes", "quotes_in"].includes(j.status)
  );
}

export function selectProBookingsGrouped(state: RootState, proId: string = "pro-1") {
  const normalizedTargetId = normalizeProId(proId);
  const allJobs = selectAllJobs(state);
  const hiredByJob = state.marketplace.hiredByJob;
  const bookings = state.marketplace.bookings;
  const quotes = selectAllQuotes(state);

  const getBookedForPro = (targetId: string) => {
    return allJobs.filter((job: Job) => {
      const hiredId = hiredByJob[job.id];
      const booking = bookings[job.id];
      const assigned =
        (hiredId && isSamePro(quotes.find((q) => q.id === hiredId)?.proId, targetId)) ||
        isSamePro(booking?.proId, targetId);
      return (
        assigned &&
        [
          "hired",
          "scheduled",
          "en_route",
          "in_progress",
          "awaiting_confirm",
          "completed",
          "cancelled",
          "disputed",
        ].includes(job.status)
      );
    });
  };

  let booked = getBookedForPro(normalizedTargetId);
  if (booked.length === 0 && normalizedTargetId !== "pro-1") {
    booked = getBookedForPro("pro-1");
  }

  const upcoming = booked.filter((j: Job) => ["hired", "scheduled"].includes(j.status));
  const inProgress = booked.filter((j: Job) =>
    ["en_route", "in_progress", "awaiting_confirm"].includes(j.status)
  );
  const history = booked.filter((j: Job) =>
    ["completed", "cancelled", "disputed"].includes(j.status)
  );

  return {
    all: booked,
    upcoming,
    inProgress,
    history,
    totalUpcoming: upcoming.length,
    totalInProgress: inProgress.length,
    totalHistory: history.length,
  };
}


