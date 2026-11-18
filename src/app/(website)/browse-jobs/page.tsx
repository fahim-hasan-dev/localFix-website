"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { photos } from "@/lib/media";
import { loginHref } from "@/lib/role-access";
import { useAppSelector } from "@/redux/hooks";

/** Public gate & preview — private job bidding and client contact live on /pro/jobs after clearance + membership. */
export default function BrowseJobsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "pro") router.replace("/pro/jobs");
  }, [router, user]);

  return (
    <>
      <PageBanner
        eyebrow="For professionals"
        title="Austin Job Board"
        description="Direct repair requests from verified Austin homeowners. Join as an approved pro to submit quotes with 0% commission."
        image={photos.banners.jobs}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Austin Job Board" },
        ]}
      />

      <section className="bg-surface py-10 md:py-14">
        <div className="container-site space-y-10">
          {/* Top Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/70 pb-6">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-title sm:text-2xl">
                Pro job board access
              </h2>
              <p className="mt-1 text-sm text-muted">
                Open and direct requests are available inside the pro dashboard after clearance.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {user?.role === "pro" ? (
                <Button href="/pro/jobs">Open available jobs ↗</Button>
              ) : (
                <>
                  <Button href={loginHref({ role: "pro", next: "/pro/jobs" })}>
                    Pro sign in ↗
                  </Button>
                  <Button href="/pro-register" variant="ghost">
                    Apply as a pro ↗
                  </Button>
                </>
              )}
              <Button href="/browse-pros" variant="ghost">
                Browse pros ↗
              </Button>
            </div>
          </div>

          {/* Live requests are private to approved pros — no public job listing (no mock teasers). */}
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </span>
            <h3 className="font-display text-base font-semibold text-title sm:text-lg">
              Live requests are visible to approved pros
            </h3>
            <p className="max-w-md text-sm text-muted">
              Sign in with your pro account to see open and direct requests in your trade territory and send quotes.
            </p>
            <Button href={loginHref({ role: "pro", next: "/pro/jobs" })} size="sm">
              Sign in to view requests ↗
            </Button>
          </Card>

          {/* Pro Value Banner */}
          <div className="rounded-2xl border border-line/80 bg-white p-6 shadow-2xs sm:p-8">
            <div className="grid items-center gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  0% Commission • Flat Monthly Membership
                </span>
                <h3 className="mt-3 font-display text-xl font-bold tracking-tight text-title sm:text-2xl">
                  Are you a licensed contractor or handyman in Austin?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Join Local Fix to receive real-time repair requests in your trade territory. Communicate directly with homeowners, set your own prices, and keep 100% of your earnings.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Button href="/pro-register" size="lg" className="w-full sm:w-auto">
                  Apply for Pro Clearance ↗
                </Button>
                <Button
                  href={loginHref({ role: "pro", next: "/pro/jobs" })}
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Existing Pro Sign In ↗
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
