"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { DashboardSidebar, type SidebarSection } from "@/components/layout/dashboard-sidebar";
import { useAppSelector } from "@/redux/hooks";
import { useUnreadChatCount } from "@/services/client/engagement-api";
import { useGetJobTabsCountQuery } from "@/services/client/jobs-api";

export default function AgentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    if (user?.role === "homeowner") router.replace("/account");
  }, [hydrated, router, user]);

  const isPro = user?.role === "pro";
  const unreadChats = useUnreadChatCount(hydrated && isPro);
  const { data: tabsCountData } = useGetJobTabsCountQuery(undefined, { skip: !hydrated || !isPro });
  const tabCounts = (tabsCountData?.data ?? {}) as { directRequests?: number; marketplaceLeads?: number };
  const pendingQuotes = (tabCounts.directRequests || 0) + (tabCounts.marketplaceLeads || 0);

  const sections: SidebarSection[] = useMemo(() => {
    return [
      {
        title: "Workspace",
        items: [
          { href: "/pro", label: "Overview" },
          {
            href: "/pro/jobs",
            label: "Quote Requests",
            badge: pendingQuotes > 0 ? pendingQuotes : undefined,
          },
          { href: "/pro/bookings", label: "My Bookings" },
          {
            href: "/pro/messages",
            label: "Messages",
            badge: unreadChats > 0 ? unreadChats : undefined,
          },
        ],
      },
      {
        title: "Storefront",
        items: [
          { href: "/pro/profile", label: "Profile" },
          { href: "/pro/services", label: "Services" },
          { href: "/pro/reviews", label: "Reviews" },
        ],
      },
      {
        title: "Account",
        items: [
          { href: "/pro/pricing", label: "Subscription" },
          { href: "/pro/application", label: "Application" },
          { href: "/pro/password", label: "Password" },
          { href: "/pro/support", label: "Support" },
        ],
      },
    ];
  }, [pendingQuotes, unreadChats]);

  if (!hydrated || !user || user.role !== "pro") return null;

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
