"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  size = "md",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const isSm = size === "sm";

  return (
    <div
      className={cn(
        "flex items-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5",
        className,
      )}
    >
      <div className="inline-flex items-center gap-1 rounded-2xl bg-stone-100/90 p-1 border border-line/60">
        {items.map((item) => {
          const active = value === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-xl font-semibold transition-all whitespace-nowrap",
                isSm ? "px-3 py-1.5 text-xs" : "px-3.5 sm:px-4 py-2 text-xs sm:text-sm",
                active
                  ? "bg-white text-title shadow-xs font-bold"
                  : "text-muted hover:text-title font-medium",
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    isSm ? "h-3 w-3" : "h-3.5 w-3.5",
                    active ? "text-primary" : "text-muted",
                  )}
                />
              ) : null}
              <span>{item.label}</span>
              {item.count != null ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors",
                    active ? "bg-stone-100 text-title" : "bg-white/80 text-muted",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
