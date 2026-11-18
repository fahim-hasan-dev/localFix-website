"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Store, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/cn";
import { logout } from "@/redux/slices/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useLogoutUserMutation } from "@/services/client/auth-api";
import type { User } from "@/types";

export function AccountMenu({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutUser, { isLoading: loggingOut }] = useLogoutUserMutation();
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

  return (
    <div className="relative" ref={rootRef}>
      {/* Avatar only button: no name, no pill border */}
      <button
        type="button"
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-full transition-all duration-200 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none",
          open && "ring-2 ring-primary ring-offset-2",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
      >
        <UserAvatar
          user={user}
          className="h-10 w-10 ring-0 shadow-none"
        />
      </button>

      {/* Popover Dropdown Menu */}
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

          {/* Log Out */}
          <div className="border-t border-line/70 p-2 bg-white">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-display text-xs sm:text-sm font-medium text-error hover:bg-red-50 transition-colors cursor-pointer"
              disabled={loggingOut}
              onClick={async () => {
                setOpen(false);
                try {
                  await logoutUser().unwrap();
                } catch {
                  // Server logout failed; still clear the local session below.
                } finally {
                  dispatch(logout());
                  router.push("/");
                }
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
