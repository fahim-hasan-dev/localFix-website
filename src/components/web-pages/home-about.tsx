"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const points = [
  "Verified Professionals",
  "Clear, Itemized Quotes",
  "100% Free for Homeowners",
  "Pay Contractors Directly",
  "No Middleman Fees",
  "Your Privacy Protected",
];

export function HomeAbout() {
  return (
    <section className="relative overflow-x-clip bg-surface py-[var(--section-sm)] md:py-[var(--section)]">
      <div className="container-site relative z-[1] grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left: 2 Asymmetric Photos aligned at bottom baseline (Large Left + Compact Right) */}
        <div className="order-2 lg:order-1 grid grid-cols-2 gap-4 sm:gap-6 items-end">
          {/* Photo 1 (Left): Large Tall Anchor - Skilled craftsman on residential building */}
          <div className="relative overflow-hidden rounded-[26px] sm:rounded-[32px] bg-slate-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-[370px] sm:h-[450px] md:h-[500px] w-full">
              <Image
                src="/images/about/craftsman-blue-shirt.jpg"
                alt="Professional skilled craftsman working on residential home exterior"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 30vw"
                className="object-cover object-top"
                priority
              />
            </div>
          </div>

          {/* Photo 2 (Right): Compact Smaller Frame - Aligned at exact bottom baseline */}
          <div className="relative overflow-hidden rounded-[22px] sm:rounded-[28px] bg-slate-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-[240px] sm:h-[300px] md:h-[340px] w-full">
              <Image
                src="/images/about/Contrcutor.png"
                alt="Professional licensed contractor on site"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 30vw"
                className="object-cover object-top"
              />
            </div>
          </div>
        </div>

        {/* Right: Content & Checklist matching Design System */}
        <div className="order-1 lg:order-2">
          {/* Design System Eyebrow */}
          <div className="inline-flex items-center gap-2 font-geist text-[13.5px] sm:text-[14px] font-medium tracking-tight text-title">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-[1.75px] border-primary"
            />
            <span>Our Approach</span>
          </div>

          {/* Design System Heading */}
          <h2 className="mt-3.5 font-geist text-[32px] sm:text-[40px] md:text-[48px] font-medium leading-[1.125] tracking-[-0.05em] sm:tracking-[-0.06em] text-title">
            Quality Home Repairs, Without Extra Fees
          </h2>

          {/* Design System Subtitle */}
          <p className="mt-3.5 sm:mt-4 max-w-xl font-['Inter_Display',Inter,sans-serif] text-[16px] sm:text-[18px] font-normal leading-[26px] tracking-[-0.18px] text-[#757575]">
            Find trusted local professionals, compare clear quotes, and pay contractors directly. No pushy sales calls, no hidden markups, and zero platform commission.
          </p>

          {/* Clean checklist */}
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-[14.5px] font-medium text-title">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {/* Design System Standard Button */}
          <div className="mt-8 sm:mt-9">
            <Button href="/about" size="lg">
              Learn more ↗
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
