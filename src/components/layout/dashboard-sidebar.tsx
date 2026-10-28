"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  Briefcase,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileCheck,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  ShieldCheck,
  Star,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type SidebarItem = {
  href: string;
  label: string;
  badge?: string | number;
  icon?: LucideIcon;
};

export type SidebarSection = {
  title?: string;
  items: SidebarItem[];
};

function getSidebarIcon(label: string): LucideIcon {
  const norm = label.toLowerCase();
  if (norm.includes("booking")) return CalendarCheck;
  if (norm.includes("pricing") || (norm.includes("service") && !norm.includes("request"))) return Wrench;
  if (norm.includes("dashboard") || norm.includes("overview")) return LayoutDashboard;
  if (norm.includes("post")) return PlusCircle;
  if (norm.includes("request") || norm.includes("job") || norm.includes("lead")) return ClipboardList;
  if (norm.includes("message") || norm.includes("inbox")) return MessageSquare;
  if (norm.includes("saved") || norm.includes("favorite")) return Bookmark;
  if (norm.includes("notification")) return Bell;
  if (norm.includes("review") || norm.includes("rating")) return Star;
  if (norm.includes("application") || norm.includes("verif") || norm.includes("credential")) return FileCheck;
  if (norm.includes("dispute")) return ShieldCheck;
  if (norm.includes("profile")) return UserRound;
  if (norm.includes("security") || norm.includes("password")) return KeyRound;
  if (
    norm.includes("subscription") ||
    norm.includes("membership") ||
    norm.includes("transaction") ||
    norm.includes("billing")
  ) {
    return CreditCard;
  }
  return Briefcase;
}

function isRouteActive(itemHref: string, pathname: string): boolean {
  if (pathname === itemHref) return true;
  if (itemHref === "/account") {
    return pathname === "/account" || pathname.startsWith("/account/jobs");
  }
  if (itemHref === "/pro") {
    return pathname === "/pro";
  }
  if (itemHref === "/pro/pricing") {
    return pathname.startsWith("/pro/pricing") || pathname.startsWith("/pro/transactions");
  }
  if (itemHref === "/pro/application") {
    return pathname.startsWith("/pro/application") || pathname.startsWith("/pro/verification");
  }
  if (itemHref === "/pro/password") {
    return pathname.startsWith("/pro/password") || pathname.startsWith("/pro/security");
  }
  if (itemHref === "/account/password") {
    return pathname.startsWith("/account/password") || pathname.startsWith("/account/security");
  }
  return pathname.startsWith(itemHref);
}

export function DashboardSidebar({
  items,
  sections,
}: {
  items?: SidebarItem[];
  sections?: SidebarSection[];
}) {
  const pathname = usePathname();

  // Normalize into standard sections
  const resolvedSections: SidebarSection[] = sections
    ? sections
    : items
    ? [{ items }]
    : [];

  return (
    <aside className="w-full shrink-0 self-start md:w-64 lg:w-72">
      <nav
        className="-mx-1 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-1 pb-1 md:flex-col md:overflow-visible md:rounded-[22px] md:border md:border-line/70 md:bg-white md:p-3 md:shadow-xs"
        aria-label="Account Navigation"
      >
        {resolvedSections.map((section, sIndex) => (
          <div
            key={sIndex}
            className="flex shrink-0 items-center gap-1.5 md:flex-col md:items-stretch md:gap-1"
          >
            {sIndex > 0 && <div className="hidden md:block my-2 border-t border-line/60" />}

            {section.items.map((item) => {
              const active = isRouteActive(item.href, pathname);
              const Icon = item.icon || getSidebarIcon(item.label);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex shrink-0 items-center justify-between gap-3 rounded-[12px] px-3.5 py-2.5 font-display text-[14px] font-medium transition-all duration-200 whitespace-nowrap md:whitespace-normal",
                    active
                      ? "bg-primary text-white shadow-xs font-semibold"
                      : "border border-line/70 bg-white text-title hover:bg-smoke hover:text-primary md:border-transparent",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-white" : "text-muted group-hover:text-primary",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge != null && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors",
                          active
                            ? "bg-white/20 text-white"
                            : "bg-stone-100 text-title group-hover:bg-primary/10 group-hover:text-primary",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={cn(
                        "hidden h-3.5 w-3.5 shrink-0 transition-transform md:block",
                        active
                          ? "text-white/80"
                          : "text-muted/40 group-hover:translate-x-0.5 group-hover:text-primary",
                      )}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
