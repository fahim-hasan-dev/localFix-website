"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          {/* Left Column: Eyebrow, Heading, Description & Primary CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            {/* Design System Eyebrow with blue ring indicator */}
            <div className="inline-flex items-center gap-2 font-geist text-[13.5px] sm:text-[14px] font-medium tracking-tight text-title">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-[1.75px] border-primary"
              />
              <span>How it works</span>
            </div>

            {/* Design System Headline with two-tone primary accent */}
            <h2 className="mt-3.5 font-geist text-[32px] sm:text-[40px] md:text-[48px] font-medium leading-[1.125] tracking-[-0.05em] sm:tracking-[-0.06em] text-title">
              Simple steps <br className="hidden sm:inline" />
              <span className="text-primary">zero stress.</span>
            </h2>

            {/* Design System Description */}
            <p className="mt-3.5 sm:mt-4 max-w-md font-['Inter_Display',Inter,sans-serif] text-[16px] sm:text-[18px] font-normal leading-[26px] tracking-[-0.18px] text-[#757575]">
              From posting your repair request to final in-person inspection, we keep the entire process transparent, fast, and 100% fee-free.
            </p>

            {/* Design System Standard Button */}
            <div className="mt-8 sm:mt-9">
              <Button href="/post-job" size="lg">
                Get started today ↗
              </Button>
            </div>
          </div>

          {/* Right Column: Clean Vertical Timeline Steps */}
          <div className="lg:col-span-7">
            <div className="space-y-8 sm:space-y-10">
              {steps.map((item, index) => {
                const isActive = index === 0;
                return (
                  <div key={item.step} className="flex items-start gap-4 sm:gap-5">
                    {/* Step Icon Badge (Active = Primary filled checkmark, Others = Subtle circle) */}
                    <div
                      className={`grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full transition-colors ${
                        isActive
                          ? "bg-primary text-white shadow-xs"
                          : "border border-line bg-surface/50 text-muted"
                      }`}
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </div>

                    {/* Step Content */}
                    <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
                      <h3 className="font-geist text-[18px] sm:text-[20px] font-medium text-title tracking-tight flex items-baseline gap-2">
                        <span className="text-primary font-medium">
                          {item.step} —
                        </span>
                        <span>{item.title}</span>
                      </h3>
                      <p className="mt-1.5 font-['Inter_Display',Inter,sans-serif] text-[14.5px] sm:text-[15.5px] font-normal leading-[24px] tracking-[-0.15px] text-[#757575] max-w-xl">
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
