"use client";

import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Post Your Repair Request",
    text: "Share what needs fixing, select your preferred schedule, and upload photos. It takes under 2 minutes and is 100% free with zero obligation.",
  },
  {
    step: "02",
    title: "Compare Clear Quotes",
    text: "Receive itemized, transparent quotes from vetted local pros with labor, parts, and timelines clearly broken down. No surprise markups.",
  },
  {
    step: "03",
    title: "Schedule & Work Done",
    text: "Confirm your arrival window. Your licensed pro shows up equipped on time and completes the job with guaranteed workmanship.",
  },
  {
    step: "04",
    title: "Final Walkthrough & Direct Pay",
    text: "Inspect the completed repair in person with your contractor. Pay directly only when you're 100% satisfied — zero middleman fees.",
  },
];

export function HomeProcess() {
  return (
    <section className="bg-white py-[var(--section-sm)] md:py-[var(--section)] border-t border-line/60">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Left Column: Eyebrow, Two-Tone Heading, Subtitle & CTA (matches reference) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 font-geist text-[13px] sm:text-[13.5px] font-medium tracking-tight text-title">
              <span className="text-primary font-bold text-xs">◆</span>
              <span className="capitalize">How it works</span>
            </div>

            {/* Headline with primary accent */}
            <h2 className="mt-4 font-geist text-[34px] sm:text-[42px] lg:text-[46px] font-semibold leading-[1.12] tracking-[-1.5px] sm:tracking-[-2px] text-title">
              Simple steps <span className="text-primary">zero stress.</span>
            </h2>

            {/* Description */}
            <p className="mt-4 font-sans text-[15px] sm:text-[16px] leading-relaxed text-[#666] max-w-md">
              From posting your repair request to final in-person inspection, we keep the entire process transparent, fast, and 100% fee-free.
            </p>

            {/* CTA Button matching reference pill button with round circle arrow */}
            <div className="mt-8 sm:mt-9">
              <Link
                href="/post-job"
                className="group inline-flex items-center gap-3 rounded-full border border-line bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-title shadow-2xs hover:border-primary/40 hover:bg-smoke/70 transition-all duration-200"
              >
                <span>GET STARTED TODAY</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-white transition-transform duration-200 group-hover:scale-110">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>

          {/* Right Column: Clean Vertical Timeline Steps */}
          <div className="lg:col-span-7">
            <div className="space-y-8 sm:space-y-10">
              {steps.map((item, index) => {
                const isActive = index === 0;
                return (
                  <div key={item.step} className="relative flex items-start gap-4 sm:gap-5">
                    {/* Vertical Connector Line */}
                    {index < steps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[15px] sm:left-[17px] top-9 sm:top-10 bottom-[-24px] sm:bottom-[-28px] w-[2px] bg-line/80"
                      />
                    )}

                    {/* Step Icon Badge (Active = Primary filled checkmark, Others = Soft subtle checkmark) */}
                    <div
                      className={`relative z-10 grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full transition-colors ${
                        isActive
                          ? "bg-primary text-white shadow-xs"
                          : "border border-line/90 bg-smoke/80 text-muted-foreground/60"
                      }`}
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </div>

                    {/* Step Content */}
                    <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
                      <h3 className="font-geist text-[18px] sm:text-[20px] font-semibold text-title tracking-tight flex items-baseline gap-2">
                        <span className={isActive ? "text-primary" : "text-title"}>
                          {item.step} —
                        </span>
                        <span>{item.title}</span>
                      </h3>
                      <p className="mt-2 font-sans text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#666] max-w-xl">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
