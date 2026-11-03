"use client";

import { Check } from "lucide-react";

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

            {/* Design System Headline (100% Solid Black matching platform typography) */}
            <h2 className="mt-3.5 font-geist text-[32px] sm:text-[40px] md:text-[48px] font-medium leading-[1.125] tracking-[-0.05em] sm:tracking-[-0.06em] !text-black">
              Simple steps <br className="hidden sm:inline" />
              zero stress.
            </h2>

            {/* Design System Description */}
            <p className="mt-3.5 sm:mt-4 max-w-md font-['Inter_Display',Inter,sans-serif] text-[16px] sm:text-[18px] font-normal leading-[26px] tracking-[-0.18px] text-[#757575]">
              From posting your repair request to final in-person inspection, we keep the entire process transparent, fast, and 100% fee-free.
            </p>
          </div>

          {/* Right Column: Clean Vertical Timeline Steps with mathematically centered connector line */}
          <div className="lg:col-span-7">
            <div>
              {steps.map((item, index) => {
                const isLast = index === steps.length - 1;
                return (
                  <div
                    key={item.step}
                    className="group flex gap-4 sm:gap-5 cursor-pointer"
                  >
                    {/* Step Icon Badge & 100% Centered Connector Line Column */}
                    <div className="flex flex-col items-center shrink-0">
                      {/* Step Icon Badge with Vibrant Blue Tick Mark */}
                      <div className="relative z-10 grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full border border-primary/30 bg-blue-50 text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all duration-200 shadow-2xs ring-4 ring-white">
                        <Check className="h-4 w-4 stroke-[2.5]" />
                      </div>

                      {/* Vertical line connecting ONLY to the next step, mathematically centered with zero overflow */}
                      {!isLast && (
                        <div
                          aria-hidden="true"
                          className="w-[2px] flex-1 bg-line/80 my-1"
                        />
                      )}
                    </div>

                    {/* Step Content: Aligned with the step badge with clean spacing */}
                    <div className={`min-w-0 flex-1 pt-0.5 sm:pt-1 ${isLast ? "pb-0" : "pb-8 sm:pb-10"}`}>
                      <h3 className="font-geist text-[18px] sm:text-[20px] font-medium tracking-tight text-title transition-colors group-hover:text-primary">
                        <span>{item.step} — {item.title}</span>
                      </h3>
                      <p className="mt-1.5 font-['Inter_Display',Inter,sans-serif] text-[14.5px] sm:text-[15.5px] font-normal leading-[24px] tracking-[-0.15px] text-[#757575] max-w-xl group-hover:text-[#475569] transition-colors">
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
