"use client";

import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";

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
        {/* Left: 2 Staggered Portrait Photos (matches reference design) */}
        <div className="order-2 lg:order-1 grid grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Photo 1: Skilled craftsman / contractor on roof inspecting */}
          <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-slate-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div
              className="h-[340px] sm:h-[420px] md:h-[470px] w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80)`,
              }}
              role="img"
              aria-label="Professional contractor inspecting on site"
            />
          </div>

          {/* Photo 2: Finished modern architectural craftsmanship */}
          <div className="relative mt-6 sm:mt-10 overflow-hidden rounded-[24px] sm:rounded-[28px] bg-slate-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div
              className="h-[300px] sm:h-[370px] md:h-[420px] w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=900&q=80)`,
              }}
              role="img"
              aria-label="Finished modern home craftsmanship"
            />
          </div>
        </div>

        {/* Right: Content & Checklist */}
        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 font-geist text-[13px] sm:text-[13.5px] font-medium tracking-tight text-title">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary"
            />
            <span>Our Approach</span>
          </div>

          <h2 className="mt-3.5 font-geist text-[32px] font-semibold leading-[1.15] tracking-[-1.5px] sm:text-[40px] sm:leading-[46px] sm:tracking-[-2px] md:text-[46px] md:leading-[52px] md:tracking-[-2.5px] text-title">
            Quality Home Repairs, Without Extra Fees
          </h2>

          <p className="mt-4 max-w-xl font-sans text-[16px] sm:text-[17px] font-normal leading-relaxed text-[#666]">
            Find trusted local professionals, compare clear quotes, and pay contractors directly. No pushy sales calls, no hidden markups, and zero platform commission.
          </p>

          {/* Clean checklist */}
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-[14px] font-medium text-title">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 sm:mt-9">
            <Link
              href="/about"
              className="group inline-flex items-center gap-3 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-title shadow-2xs hover:border-primary/40 hover:bg-smoke/70 transition-all duration-200"
            >
              <span>Learn More</span>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white transition-transform duration-200 group-hover:scale-110">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
