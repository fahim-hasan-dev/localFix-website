"use client";

import { Search } from "lucide-react";
import { ProCard } from "@/components/shared/pro-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { mapProfessional, unwrapProfessionals } from "@/lib/api-mappers";
import { useGetFavoritesQuery } from "@/services/client/engagement-api";

export default function SavedProsPage() {
  const { data, isLoading, isError } = useGetFavoritesQuery();
  const list = unwrapProfessionals(data?.data).map(mapProfessional);

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-title tracking-tight">
            Saved Pros
          </h1>
          <span className="inline-flex items-center rounded-full bg-smoke px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            {list.length}
          </span>
        </div>

        {list.length > 0 ? (
          <Button
            href="/browse-pros"
            variant="ghost"
            size="sm"
            className="rounded-full self-start sm:self-auto text-xs"
          >
            <Search className="h-3.5 w-3.5" />
            Browse Pros
          </Button>
        ) : null}
      </div>

      {isLoading ? <p className="text-sm text-muted">Loading saved professionals...</p> : null}
      {isError ? <p className="text-sm text-error">Saved professionals could not be loaded.</p> : null}

      {!isLoading && !isError && list.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No saved pros yet"
            description="Explore local specialists and tap the heart icon on any card to shortlist them."
            actionLabel="Browse Verified Pros"
            href="/browse-pros"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((pro) => (
            <div key={pro.id} className="min-w-0 flex h-full">
              <ProCard pro={pro} className="w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
