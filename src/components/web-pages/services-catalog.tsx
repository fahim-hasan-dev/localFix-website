"use client";

import { useRouter } from "next/navigation";
import { ServiceTile } from "@/components/shared/service-tile";
import { mapCategory } from "@/lib/api-mappers";
import { useGetCategoriesQuery } from "@/services/client/catalog-api";

export function ServicesCatalog() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetCategoriesQuery();
  const categories = (data?.data || []).map(mapCategory);

  return (
    <section className="bg-surface py-[var(--section-sm)] md:py-[var(--section)]">
      <div className="container-site">
        {isLoading ? <p className="text-sm text-muted">Loading services...</p> : null}
        {isError ? <p className="text-sm text-error">Services could not be loaded.</p> : null}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <ServiceTile
              key={category.id}
              category={category}
              onSelect={(slug) => router.push(`/browse-pros?category=${slug}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
