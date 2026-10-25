"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, MapPin, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { categories, getPro, professionals } from "@/Mockdata";
import { labelForAnswer, questionsForCategory } from "@/lib/intake-questions";
import { loginAs } from "@/redux/slices/authSlice";
import { clearDraft } from "@/redux/slices/intakeSlice";
import { addJob } from "@/redux/slices/marketplaceSlice";
import { addNotification, invitePro } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { IntakeAnswer, Professional, Urgency } from "@/types";
import { cn } from "@/lib/cn";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function matchPros(slug: string) {
  return professionals
    .filter((pro) => pro.clearance === "cleared" && pro.categorySlug === slug)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
}

function urgencyFromWhen(value?: string): Urgency {
  if (value === "asap") return "asap";
  if (value === "flexible") return "flexible";
  return "this_week";
}

export function QuoteRequestFlow() {
  const searchParams = useSearchParams();
  const invitedPro = getPro(searchParams.get("invite") ?? "");
  const draft = useAppSelector((state) => state.intake.draft);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const startingSlug = invitedPro?.categorySlug || draft.categorySlug || "";
  const [categorySlug, setCategorySlug] = useState(startingSlug);
  const [answers, setAnswers] = useState<Record<string, string>>(draft.answers ?? {});
  const [index, setIndex] = useState(0);
  const [zip, setZip] = useState(draft.zip || user?.zip || "78701");
  const [phase, setPhase] = useState<"category" | "questions" | "zip" | "matches" | "sent">(
    startingSlug ? "questions" : "category",
  );
  const [requestedPro, setRequestedPro] = useState<Professional | null>(invitedPro ?? null);
  const [jobId, setJobId] = useState<string | null>(null);

  const questions = useMemo(() => questionsForCategory(categorySlug), [categorySlug]);
  const question = questions[index];
  const category = categories.find((item) => item.slug === categorySlug);
  const matches = useMemo(() => matchPros(categorySlug), [categorySlug]);

  const intakeAnswers: IntakeAnswer[] = questions
    .filter((item) => answers[item.id])
    .map((item) => ({
      id: item.id,
      label: item.prompt,
      value: labelForAnswer(categorySlug, item.id, answers[item.id]),
    }));

  function pickCategory(slug: string) {
    setCategorySlug(slug);
    setAnswers({});
    setIndex(0);
    setPhase("questions");
  }

  function pickAnswer(value: string) {
    if (!question) return;
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (index < questions.length - 1) {
      setIndex(index + 1);
      return;
    }
    setPhase(/^\d{5}$/.test(zip.trim()) ? "matches" : "zip");
  }

  function goBack() {
    if (phase === "matches") {
      if (zip.trim().length === 5 && questions.length) {
        setPhase("questions");
        setIndex(questions.length - 1);
        return;
      }
      setPhase("zip");
      return;
    }
    if (phase === "zip") {
      setPhase("questions");
      setIndex(Math.max(questions.length - 1, 0));
      return;
    }
    if (phase === "questions" && index > 0) {
      setIndex(index - 1);
      return;
    }
    if (phase === "questions" && !invitedPro) {
      setPhase("category");
    }
  }

  function continueFromZip() {
    if (!/^\d{5}$/.test(zip.trim())) return;
    setPhase("matches");
  }

  function sendRequest(pro: Professional) {
    const title = [category?.name, intakeAnswers[0]?.value].filter(Boolean).join(" · ");
    const description = [
      draft.problem,
      ...intakeAnswers.map((item) => `${item.label} ${item.value}`),
    ]
      .filter(Boolean)
      .join(". ");
    const createdId = `job-local-${Date.now()}`;

    if (!user) {
      dispatch(loginAs("homeowner"));
    }

    dispatch(
      addJob({
        id: createdId,
        title: title || category?.name || "Service request",
        categorySlug,
        description,
        zip: zip.trim(),
        city: user?.city || "Austin",
        state: user?.state || "TX",
        urgency: urgencyFromWhen(answers.when),
        homeownerName: user?.name ?? "Maya Chen",
        intakeAnswers,
        requestedProId: pro.id,
      }),
    );
    dispatch(invitePro({ jobId: createdId, proId: pro.id }));
    dispatch(
      addNotification({
        title: "Quote request",
        body: `${user?.name ?? "A homeowner"} asked you to quote ${title || "a job"} in ${zip.trim()}.`,
        href: `/pro/jobs/${createdId}`,
        createdAt: "Just now",
        role: "pro",
      }),
    );
    dispatch(
      addNotification({
        title: "Request sent",
        body: `${pro.name} has your details and can send a quote.`,
        href: `/account/jobs/${createdId}`,
        createdAt: "Just now",
        role: "homeowner",
      }),
    );
    dispatch(clearDraft());
    setRequestedPro(pro);
    setJobId(createdId);
    setPhase("sent");
  }

  if (phase === "sent" && requestedPro && jobId) {
    return (
      <div className="mx-auto max-w-xl rounded-[22px] border border-line/80 bg-white p-6 sm:p-8">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-title">
          Quote requested
        </h1>
        <p className="mt-2 text-sm leading-6 text-copy">
          {requestedPro.name} has your answers and can send a price. You pay the pro
          directly if you hire.
        </p>
        <div className="mt-5 rounded-2xl border border-line/80 px-4 py-3">
          <p className="font-display text-sm font-semibold text-title">{requestedPro.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {category?.name} · {zip}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button href={`/account/jobs/${jobId}`} size="md">
            View request
          </Button>
          <Button href="/account" variant="ghost" size="md">
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {phase !== "category" ? (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-title"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-xs text-muted">{category?.name}</p>
        </div>
      ) : null}

      {phase === "questions" && question ? (
        <div className="h-1 overflow-hidden rounded-full bg-smoke">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      ) : null}

      <div className="rounded-[22px] border border-line/80 bg-white p-6 sm:p-8">
        {phase === "category" ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-title">
              What do you need help with?
            </h1>
            <p className="mt-1 text-sm text-muted">Pick a service. We’ll ask a few questions next.</p>
            <div className="mt-5 grid gap-2">
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pickCategory(item.slug)}
                  className="rounded-2xl border border-line px-4 py-3 text-left transition hover:border-primary/40"
                >
                  <span className="font-display text-sm font-semibold text-title">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{item.summary}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {phase === "questions" && question ? (
          <>
            <p className="text-xs font-medium text-muted">
              {index + 1} of {questions.length}
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-title">
              {question.prompt}
            </h1>
            <div className="mt-5 grid gap-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => pickAnswer(option.value)}
                    className={cn(
                      "rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition",
                      selected
                        ? "border-primary bg-primary/[0.04] text-title"
                        : "border-line text-copy hover:border-primary/40",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {phase === "zip" ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-title">
              Where should they come?
            </h1>
            <p className="mt-1 text-sm text-muted">We’ll match cleared pros near this ZIP.</p>
            <div className="relative mt-5">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <TextField
                value={zip}
                onChange={(event) => setZip(event.target.value)}
                placeholder="78701"
                maxLength={5}
                className="rounded-xl pl-10 font-mono"
              />
            </div>
            <Button
              type="button"
              size="md"
              className="mt-5"
              disabled={!/^\d{5}$/.test(zip.trim())}
              onClick={continueFromZip}
            >
              See matching pros
            </Button>
          </>
        ) : null}

        {phase === "matches" ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-title">
              {invitedPro ? `Request a quote from ${invitedPro.name}` : "Pros who can take this"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {invitedPro
                ? "They’ll see your answers and send a price."
                : "Pick one. They get your answers and can send a quote."}
            </p>

            {intakeAnswers.length ? (
              <ul className="mt-4 space-y-1.5 text-sm text-copy">
                {intakeAnswers.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4">
                    <span className="text-muted">{item.label}</span>
                    <span className="font-medium text-title">{item.value}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-5 space-y-2">
              {(invitedPro ? [invitedPro] : matches).map((pro) => (
                <div
                  key={pro.id}
                  className="flex items-center gap-3 rounded-2xl border border-line/80 p-3.5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-title text-sm font-semibold text-white">
                    {initials(pro.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 font-display text-sm font-semibold text-title">
                      {pro.name}
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1 text-title">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                        {pro.rating.toFixed(1)}
                      </span>
                      <span>({pro.reviewCount})</span>
                      <span>·</span>
                      <span>{pro.city}</span>
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={() => sendRequest(pro)}>
                    Request quote
                  </Button>
                </div>
              ))}
              {!invitedPro && matches.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No cleared pros in this trade yet.
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
