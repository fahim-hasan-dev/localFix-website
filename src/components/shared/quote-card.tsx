"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, Clock, ShieldCheck, Star } from "lucide-react";
import { getPro, offerStatusLabels } from "@/Mockdata";
import { useAppSelector } from "@/redux/hooks";
import type { Quote } from "@/types";
import { cn } from "@/lib/cn";

function quotePrice(quote: Quote) {
  if (quote.priceMax != null) return `$${quote.amount}–$${quote.priceMax}`;
  return `$${quote.amount}${quote.priceType === "hourly" ? "/hr" : ""}`;
}

export function QuoteCard({
  quote,
  href,
}: {
  quote: Quote;
  href: string;
}) {
  const router = useRouter();
  const hiredId = useAppSelector((state) => state.marketplace.hiredByJob[quote.jobId]);
  const pro = getPro(quote.proId);
  const hired = hiredId === quote.id;
  const closed = quote.status === "rejected" || quote.status === "withdrawn" || quote.status === "expired";
  const status = hired
    ? "Hired"
    : quote.status === "rejected"
      ? "Declined"
      : offerStatusLabels[quote.status] ?? quote.status;
  const when = quote.proposedSchedule || quote.availability;
  const duration = quote.estimatedDuration;
  const proProfileHref = pro ? `/browse-pros/${pro.id}` : "#";

  return (
    <div
      onClick={() => router.push(href)}
      className={cn(
        "group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-line/80 bg-white p-3.5 sm:px-4 sm:py-3.5 transition hover:border-primary/40 hover:shadow-xs cursor-pointer",
        hired && "border-success/40 bg-success/[0.02]",
        closed && !hired && "opacity-75",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Pro Avatar with link to public profile */}
        <Link
          href={proProfileHref}
          onClick={(e) => e.stopPropagation()}
          title={`View ${pro?.name ?? "pro"}'s public profile`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-title text-sm font-semibold text-white transition hover:ring-2 hover:ring-primary/40"
        >
          {(pro?.name ?? "P").charAt(0)}
        </Link>

        <div className="min-w-0 flex-1">
          {/* Pro Name linking to profile */}
          <div className="flex items-center gap-1.5">
            <Link
              href={proProfileHref}
              onClick={(e) => e.stopPropagation()}
              className="truncate font-display text-sm font-bold text-title hover:text-primary transition-colors hover:underline"
            >
              {pro?.name ?? "Professional"}
            </Link>
            {pro?.clearance === "cleared" ? (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : null}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            {pro?.rating ? (
              <span className="inline-flex items-center gap-1 font-semibold text-title">
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                {pro.rating.toFixed(1)}
              </span>
            ) : null}
            {pro?.trade ? <span>{pro.trade}</span> : null}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                hired
                  ? "bg-success/10 text-success"
                  : closed
                    ? "bg-smoke text-muted"
                    : "bg-amber-50 text-amber-700",
              )}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Price, Schedule & Explicit "View Quotation" CTA Button */}
      <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t border-line/50 pt-2.5 sm:border-0 sm:pt-0 shrink-0">
        <div className="text-left sm:text-right">
          <p className="font-display text-base font-bold text-title">{quotePrice(quote)}</p>
          {when || duration ? (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted sm:justify-end">
              {when ? <Calendar className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              <span className="max-w-[10rem] truncate">{when || duration}</span>
            </p>
          ) : null}
        </div>

        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary font-semibold text-xs px-3.5 py-1.5 hover:bg-primary hover:text-white transition-all shadow-2xs"
        >
          <span>View Quotation</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
