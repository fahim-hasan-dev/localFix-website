"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface MarqueeItemData {
  label: string;
  href: string;
}

export const defaultTickerItems: MarqueeItemData[] = [
  { label: "Plumbing", href: "/browse-pros?category=plumbing" },
  { label: "Electrical Work", href: "/browse-pros?category=electrical" },
  { label: "AC & Heating", href: "/browse-pros?category=hvac" },
  { label: "Roof Repair", href: "/browse-pros?category=roofing" },
  { label: "Appliance Repair", href: "/browse-pros?category=appliance-repair" },
  { label: "Water Heaters", href: "/browse-pros?category=plumbing" },
  { label: "Painting & Drywall", href: "/browse-pros?category=painting" },
  { label: "Handyman Help", href: "/browse-pros?category=handyman" },
  { label: "Drain Cleaning", href: "/browse-pros?category=plumbing" },
  { label: "Pressure Washing", href: "/browse-pros?category=landscaping" },
  { label: "Gutter Cleaning", href: "/browse-pros?category=roofing" },
  { label: "Lawn & Yard Care", href: "/browse-pros?category=landscaping" },
];

const STORAGE_KEY = "homefix_marquee_cms";

function getCmsConfig() {
  if (typeof window === "undefined") {
    return { isEnabled: true, items: defaultTickerItems, speed: "normal" as const };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.isEnabled === false) {
        return { isEnabled: false, items: [], speed: "normal" as const };
      }
      let items = defaultTickerItems;
      if (Array.isArray(parsed.items)) {
        const active = parsed.items.filter((item: { isActive?: boolean }) => item.isActive !== false);
        if (active.length > 0) {
          items = active.map((item: { label: string; href: string }) => ({ label: item.label, href: item.href }));
        }
      }
      const speed =
        parsed.speed === "slow" || parsed.speed === "normal" || parsed.speed === "fast"
          ? parsed.speed
          : ("normal" as const);
      return { isEnabled: true, items, speed };
    }
  } catch {
    // fallback to default
  }
  return { isEnabled: true, items: defaultTickerItems, speed: "normal" as const };
}

export function HomeMarquee() {
  const [items, setItems] = useState<MarqueeItemData[]>(() => getCmsConfig().items);
  const [isEnabled, setIsEnabled] = useState(() => getCmsConfig().isEnabled);
  const [speed, setSpeed] = useState<"slow" | "normal" | "fast">(() => getCmsConfig().speed);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const config = getCmsConfig();
        setIsEnabled(config.isEnabled);
        setItems(config.items);
        setSpeed(config.speed);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (!isEnabled || items.length === 0) {
    return null;
  }

  const animationDuration = speed === "slow" ? "48s" : speed === "fast" ? "18s" : "28s";

  return (
    <div
      aria-label="Popular home repair services ticker"
      className="relative flex h-14 sm:h-16 w-full items-center overflow-hidden border-y border-white/20 bg-gradient-to-r from-[#0a42aa] via-[#0d56d6] via-45% to-[#0178be] text-white shadow-xs"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0a42aa] to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0178be] to-transparent sm:w-28" />

      <div className="flex animate-marquee select-none items-center" style={{ animationDuration }}>
        {items.map((item, index) => (
          <div key={`set-1-${index}`} className="flex shrink-0 items-center">
            <Link
              href={item.href}
              className="inline-flex items-center px-5 font-display text-[16px] font-semibold tracking-tight text-white/95 transition-all hover:scale-105 hover:text-white sm:px-7 sm:text-[17px]"
            >
              {item.label}
            </Link>
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              aria-hidden
            />
          </div>
        ))}

        {items.map((item, index) => (
          <div key={`set-2-${index}`} className="flex shrink-0 items-center">
            <Link
              href={item.href}
              className="inline-flex items-center px-5 font-display text-[16px] font-semibold tracking-tight text-white/95 transition-all hover:scale-105 hover:text-white sm:px-7 sm:text-[17px]"
            >
              {item.label}
            </Link>
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              aria-hidden
            />
          </div>
        ))}
      </div>
    </div>
  );
}
