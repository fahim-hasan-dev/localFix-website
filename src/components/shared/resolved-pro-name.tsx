"use client";

import { useResolvedPro } from "@/hooks/use-resolved-pro";

export function ResolvedProName({
  proId,
  fallback = "Professional",
}: {
  proId?: string;
  fallback?: string;
}) {
  const pro = useResolvedPro(proId);
  return <>{pro?.name || fallback}</>;
}

export function useResolvedProFields(proId?: string) {
  return useResolvedPro(proId);
}
