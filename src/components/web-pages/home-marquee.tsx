"use client";

import { useMemo } from "react";
import Link from "next/link";
import { mapCategory, slugify } from "@/lib/api-mappers";
import { useGetCategoriesQuery, useGetMarqueesQuery } from "@/services/client/catalog-api";

export interface MarqueeItemData {
  label: string;
  href: string;
}

export function HomeMarquee() {
  const marquees = useGetMarqueesQuery();
  const categories = useGetCategoriesQuery();

  const items = useMemo<MarqueeItemData[]>(() => {
    const fromMarquees = (marquees.data?.data ?? [])
      .filter((item) => item?.keyword && item.isEnabled !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item) => ({
        label: item.keyword,
        href: `/browse-pros?category=${slugify(item.keyword)}`,
      }));

    if (fromMarquees.length > 0) return fromMarquees;

    return (categories.data?.data ?? [])
      .filter((category) => category?.name)
      .map((category) => {
        const mapped = mapCategory(category);
        return {
          label: mapped.name,
          href: `/browse-pros?category=${mapped.slug}`,
        };
      });
  }, [marquees.data, categories.data]);

  if (items.length === 0) return null;

  return (
    <div
      aria-label="Popular home repair services ticker"
      className="relative flex h-14 sm:h-16 w-full items-center overflow-hidden border-y border-white/20 bg-gradient-to-r from-[#0a42aa] via-[#0d56d6] via-45% to-[#0178be] text-white shadow-xs"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0a42aa] to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0178be] to-transparent sm:w-28" />

      <div className="flex animate-marquee select-none items-center" style={{ animationDuration: "28s" }}>
        {[1, 2].map((set) =>
          items.map((item, index) => (
            <div key={`set-${set}-${index}`} className="flex shrink-0 items-center">
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
          )),
        )}
      </div>
    </div>
  );
}
