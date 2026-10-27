"use client";

import { useRouter } from "next/navigation";
import { ServiceTile } from "@/components/shared/service-tile";
import { categories } from "@/Mockdata";

export function ServicesCatalog() {
  const router = useRouter();

  return (
    <section className="bg-surface py-[var(--section-sm)] md:py-[var(--section)]">
      <div className="container-site">
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
