"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";
import { DashboardSidebar, type SidebarSection } from "@/components/layout/dashboard-sidebar";
import { selectProBookingsGrouped, selectProJobsGrouped } from "@/lib/marketplace";
import { useAppSelector } from "@/redux/hooks";

export default function AgentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const state = useAppSelector((s) => s);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    if (user?.role === "homeowner") router.replace("/account");
  }, [hydrated, router, user]);

  const sections: SidebarSection[] = useMemo(() => {
    const myProId = user?.role === "pro" && user?.id ? user.id : "pro-1";
    const proJobs = selectProJobsGrouped(state, myProId);
    const proBookings = selectProBookingsGrouped(state, myProId);
    const pendingQuotes = proJobs.totalDirect + proJobs.totalLeads;
    const activeBookings = proBookings.upcoming.length + proBookings.inProgress.length;
    const reviewsCount = state.features.reviews.length;

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
          {
            href: "/pro/bookings",
            label: "My Bookings",
            badge: activeBookings > 0 ? activeBookings : undefined,
          },
          { href: "/pro/messages", label: "Messages" },
        ],
      },
      {
        title: "Storefront",
        items: [
          { href: "/pro/profile", label: "Profile" },
          { href: "/pro/services", label: "Services" },
          {
            href: "/pro/reviews",
            label: "Reviews",
            badge: reviewsCount > 0 ? reviewsCount : undefined,
          },
        ],
      },
      {
        title: "Account",
        items: [
          { href: "/pro/pricing", label: "Subscription" },
          { href: "/pro/application", label: "Application" },
          { href: "/pro/password", label: "Password" },
        ],
      },
    ];
  }, [state, user?.id, user?.role]);

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
