"use client";

import { mapProfessional } from "@/lib/api-mappers";
import { useGetProfessionalQuery } from "@/services/client/catalog-api";
import { ProProfileContent } from "@/components/web-pages/pro-profile-content";

export function ProPublicProfile({ id }: { id: string }) {
  const { data, isLoading, isError } = useGetProfessionalQuery(id);
  const pro = data?.data ? mapProfessional(data.data) : null;

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-muted">Loading professional...</p>;
  }

  if (isError || !pro) {
    return <p className="py-16 text-center text-sm text-muted">This professional profile is not available.</p>;
  }

  return <ProProfileContent pro={pro} />;
}
