"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Repeat,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/cn";
import { loginAs, logout } from "@/redux/slices/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { User } from "@/types";

function roleLabel(role: User["role"]) {
  if (role === "pro") return "Verified Pro";
  return "Homeowner";
}

export function AccountMenu({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }
  const rootRef = useRef<HTMLDivElement>(null);

  const isPro = user.role === "pro";
  const profileHref = isPro ? "/pro/profile" : "/account/profile";

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function handleRoleSwitch(targetRole: User["role"]) {
    dispatch(loginAs(targetRole));
    setOpen(false);
    router.push(targetRole === "pro" ? "/pro" : "/account");
  }

  return (
    <div className="relative" ref={rootRef}>
      {/* Minimal, Sleek Executive Profile Pill */}
      <button
        type="button"
        className={cn(
          "group flex items-center gap-2 rounded-full border border-line/80 bg-white p-1 pr-3 text-left shadow-2xs transition-all duration-200 hover:border-primary/40 hover:bg-stone-50/70 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer select-none",
          open && "border-primary/60 bg-stone-50/80 ring-2 ring-primary/15 shadow-xs",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <UserAvatar
          user={user}
          size="sm"
          className="ring-1 ring-black/5 group-hover:ring-primary/30 transition-all"
        />

        <span className="hidden sm:inline-block font-display text-[13px] font-semibold text-title group-hover:text-primary transition-colors max-w-[130px] truncate">
          {user.name}
        </span>

        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-stone-400 group-hover:text-stone-700 transition-all duration-200 shrink-0",
            open && "rotate-180 text-primary",
          )}
        />
      </button>

      {/* Modern Clean Popover Dropdown Menu */}
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 sm:w-76 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_36px_-6px_rgba(0,0,0,0.14),0_4px_12px_-2px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Identity Header Card */}
          <div className="flex items-center gap-3 border-b border-line/70 bg-stone-50/70 px-4 py-3">
            <UserAvatar user={user} size="md" className="ring-2 ring-white shadow-2xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-title">{user.name}</p>
              <p className="truncate text-xs text-muted mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Core Profile Item */}
          <div className="p-2 space-y-0.5 bg-white">
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-title hover:bg-smoke hover:text-primary transition-colors"
            >
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-stone-100 text-stone-600 shrink-0">
                {isPro ? <Store className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
              </div>
              <span>{isPro ? "Storefront Profile" : "Profile & Settings"}</span>
            </Link>
          </div>

          {/* Demo Role Switcher Slab */}
          <div className="border-t border-line/70 bg-stone-50/70 p-2">
            {user.role !== "homeowner" ? (
              <button
                type="button"
                onClick={() => handleRoleSwitch("homeowner")}
                className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-white px-3 py-2 text-left font-display text-xs font-semibold text-primary hover:border-primary/40 hover:bg-white hover:shadow-xs transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Repeat className="h-3.5 w-3.5 text-primary" />
                  Switch to Homeowner View
                </span>
                <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-muted font-normal">
                  Demo
                </span>
              </button>
            ) : null}
            {user.role !== "pro" ? (
              <button
                type="button"
                onClick={() => handleRoleSwitch("pro")}
                className="flex w-full items-center justify-between rounded-xl border border-line/60 bg-white px-3 py-2 text-left font-display text-xs font-semibold text-primary hover:border-primary/40 hover:bg-white hover:shadow-xs transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Repeat className="h-3.5 w-3.5 text-primary" />
                  Switch to Pro View
                </span>
                <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-muted font-normal">
                  Demo
                </span>
              </button>
            ) : null}
          </div>

          {/* Log Out */}
          <div className="border-t border-line/70 p-2 bg-white">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-display text-xs sm:text-sm font-medium text-error hover:bg-red-50 transition-colors cursor-pointer"
              onClick={() => {
                dispatch(logout());
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
