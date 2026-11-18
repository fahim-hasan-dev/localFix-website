"use client";

import { useMemo } from "react";
import { getPro } from "@/Mockdata";
import { mapProfessional, type ApiProfessional } from "@/lib/api-mappers";
import { useGetProfessionalQuery } from "@/services/client/catalog-api";
import type { Professional } from "@/types";

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/**
 * Resolve a pro from the live API first (for Mongo ObjectIds), then fall back to
 * local demo records (e.g. `pro-1`) when the API fails or the id is a demo id.
 */
export function useResolvedPro(proId?: string | null): Professional | null {
  const id = proId || "";
  const isLiveId = OBJECT_ID_PATTERN.test(id);
  const local = id ? getPro(id) : null;
  // Live ids always hit the API; demo ids only hit it when no local record exists.
  const query = useGetProfessionalQuery(id, { skip: !id || (!isLiveId && Boolean(local)) });

  return useMemo(() => {
    const raw = query.data?.data as ApiProfessional | undefined;
    if (raw?._id) return mapProfessional(raw);
    return local ?? null;
  }, [local, query.data]);
}
