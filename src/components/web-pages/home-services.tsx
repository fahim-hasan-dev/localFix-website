"use client";

import { useRouter } from "next/navigation";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { ServiceTile } from "@/components/shared/service-tile";
import { mapCategory } from "@/lib/api-mappers";
import { useGetCategoriesQuery } from "@/services/client/catalog-api";

export function HomeServices() {
  const router = useRouter();
  const { data, isLoading } = useGetCategoriesQuery();
  const featured = (data?.data || []).map(mapCategory);

  return (
    <section className="bg-white py-[var(--section-sm)] md:py-[var(--section)]">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Specialties"
            title="Popular home repair services"
            description="Explore trusted local specialists, verified reviews, and screened pros in every category."
          />
          <Button href="/services" variant="ghost" className="hidden shrink-0 sm:inline-flex">
            View all services ↗
          </Button>
        </div>

        <div className="mt-14 sm:mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? <p className="text-sm text-muted">Loading services...</p> : null}
          {featured.map((category) => (
            <ServiceTile
              key={category.id}
              category={category}
              onSelect={(slug) => router.push(`/browse-pros?category=${slug}`)}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Button href="/services" variant="ghost" className="w-full justify-center">
            View all services ↗
          </Button>
        </div>
      </div>
    </section>
  );
}