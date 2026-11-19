"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { DashboardSidebar, type SidebarSection } from "@/components/layout/dashboard-sidebar";
import { loginHref } from "@/lib/role-access";
import { selectHomeownerRequests } from "@/lib/marketplace";
import { useAppSelector } from "@/redux/hooks";
import { useUnreadChatCount } from "@/services/client/engagement-api";
import { authToken } from "@/utils/authToken";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const state = useAppSelector((s) => s);
  const unreadChats = useUnreadChatCount(hydrated && user?.role === "homeowner");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      // Token exists but Redux not ready yet (hard redirect right after login).
      if (authToken.getAccessToken()) return;
      const next = pathname?.startsWith("/account") ? pathname : "/account/post-job";
      router.replace(loginHref({ next }));
      return;
    }
    if (user.role === "pro") router.replace("/pro");
  }, [hydrated, pathname, router, user]);

  const sections: SidebarSection[] = useMemo(() => {
    const homeownerName = user?.name || "Maya Chen";
    const requests = selectHomeownerRequests(state, homeownerName);
    const activeRequests = requests.length;

    return [
      {
        title: "Projects & Activity",
        items: [
          {
            href: "/account",
            label: "Service Requests",
            badge: activeRequests > 0 ? activeRequests : undefined,
          },
          {
            href: "/account/bookings",
            label: "My Bookings",
          },
          {
            href: "/account/messages",
            label: "Messages",
            badge: unreadChats > 0 ? unreadChats : undefined,
          },
          { href: "/account/post-job", label: "Post a Request" },
        ],
      },
      {
        items: [
          { href: "/account/profile", label: "Profile" },
          { href: "/account/password", label: "Password" },
          { href: "/account/support", label: "Support" },
        ],
      },
    ];
  }, [state, unreadChats, user?.name]);

  if (!hydrated || !user || user.role !== "homeowner") return null;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <div className="container-site flex flex-1 flex-col items-stretch gap-6 pt-6 pb-12 md:flex-row md:items-start md:gap-8 md:pt-8 md:pb-16">
        <DashboardSidebar sections={sections} />
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
