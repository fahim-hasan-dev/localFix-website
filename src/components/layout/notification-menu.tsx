"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AppNotification } from "@/redux/slices/featuresSlice";
import {
  useLiveNotifications,
  useReadAllNotificationsMutation,
  useReadNotificationMutation,
} from "@/services/client/engagement-api";
import type { User } from "@/types";

export function NotificationMenu({ user }: { user: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(5);
  const loadingMoreRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const {
    items: notifications,
    unreadCount,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useLiveNotifications(Boolean(user));
  const [readAll] = useReadAllNotificationsMutation();
  const [readOne] = useReadNotificationMutation();

  const recentNotifications = notifications.slice(0, visibleCount);

  const isPro = user.role === "pro";
  const viewAllHref = isPro ? "/pro/notifications" : "/account/notifications";

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  function showFirstPage() {
    visibleRef.current = 5;
    setVisibleCount(5);
  }

  function loadMore() {
    const node = listRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
    if (!nearBottom) return;

    if (visibleRef.current < notifications.length) {
      if (loadingMoreRef.current) return;
      const next = Math.min(visibleRef.current + 5, notifications.length);
      if (next === visibleRef.current) return;
      loadingMoreRef.current = true;
      visibleRef.current = next;
      setVisibleCount(next);
      requestAnimationFrame(() => {
        loadingMoreRef.current = false;
      });
      return;
    }

    if (!hasNextPage || isFetchingNextPage || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    visibleRef.current += 5;
    setVisibleCount(visibleRef.current);
    void fetchNextPage().finally(() => {
      loadingMoreRef.current = false;
    });
  }

  function handleSelectNotification(notif: AppNotification) {
    if (!notif.read) {
      void readOne(notif.id);
    }
    setOpen(false);
    router.push(notif.href);
  }

  function handleMarkAllRead(e: React.MouseEvent) {
    e.stopPropagation();
    void readAll();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          showFirstPage();
        }}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-full border border-line/80 bg-white/95 text-title shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-primary/40 hover:bg-stone-50/80 hover:text-primary hover:shadow-xs active:scale-95 cursor-pointer select-none",
          open && "border-primary/60 text-primary bg-white ring-2 ring-primary/15 shadow-xs",
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        aria-haspopup="true"
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-error px-1 font-display text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(340px,calc(100vw-24px))] sm:w-96 overflow-hidden rounded-2xl border border-line bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line/70 bg-surface/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-title">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-primary transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            ref={listRef}
            onScroll={loadMore}
            className="max-h-[380px] divide-y divide-line/40 overflow-y-auto"
          >
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                <Check className="mx-auto mb-2 h-6 w-6 text-muted/60" />
                All caught up! No new notifications.
              </div>
            ) : (
              recentNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleSelectNotification(n)}
                  className={cn(
                    "w-full text-left p-3.5 transition-colors hover:bg-smoke flex items-start gap-3",
                    !n.read ? "bg-primary/[0.03]" : "opacity-80 hover:opacity-100",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      !n.read ? "bg-primary" : "bg-transparent",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-semibold text-title", !n.read && "font-bold")}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-muted/80">
                      <Clock className="h-2.5 w-2.5" />
                      {n.createdAt}
                    </span>
                  </div>
                </button>
              ))
            )}
            {isFetchingNextPage ? (
              <div className="p-3 text-center text-[11px] text-muted">Loading more...</div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-line/70 bg-surface/30 p-2.5 text-center">
            <Link
              href={viewAllHref}
              onClick={() => setOpen(false)}
              className="inline-block text-xs font-semibold text-primary hover:underline"
            >
              View all notifications ↗
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
