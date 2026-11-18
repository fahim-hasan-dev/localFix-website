"use client";

import {
  ArrowUpRight,
  Wrench,
  Zap,
  Wind,
  Hammer,
  Trees,
  Paintbrush,
  Bug,
  Droplets,
  Home,
} from "lucide-react";
import { photos } from "@/lib/media";
import type { Category } from "@/types";

const icons: Record<string, typeof Wrench> = {
  "appliance-repair": Wrench,
  electrical: Zap,
  hvac: Wind,
  handyman: Hammer,
  landscaping: Trees,
  painting: Paintbrush,
  "pest-control": Bug,
  plumbing: Droplets,
  roofing: Home,
};

export function ServiceTile({
  category,
  onSelect,
}: {
  category: Category;
  onSelect?: (slug: string) => void;
}) {
  const Icon = icons[category.slug] ?? Wrench;
  const image = category.image || photos.services[category.slug];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(category.slug)}
      className="group relative flex h-[225px] sm:h-[235px] w-full flex-col justify-between overflow-hidden rounded-[20px] border border-line/80 bg-white p-4 sm:p-5 text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.22)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      {/* Background Image with Zoom */}
      <span
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-108"
        style={{ backgroundImage: `url(${image})` }}
      />
      {/* High-end gradient wash: soft top, rich dark bottom for readability */}
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20 transition-opacity group-hover:from-black/95" />

      {/* Top Bar: Service Icon */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-md transition-colors group-hover:bg-primary group-hover:text-white border border-white/10">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      {/* Bottom Content: Title & Animated Action Button */}
      <div className="relative z-10">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[19px] sm:text-[20px] font-bold leading-tight text-white group-hover:text-white">
              {category.name}
            </h3>
          </div>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-title transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white shadow-xs">
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}