"use client";

import { useEffect, useMemo, useRef } from "react";
import { notFound } from "next/navigation";
import { ProJobLead } from "@/components/web-pages/pro-job-lead";
import { selectJob } from "@/lib/marketplace";
import { liveJobKey, mapLiveJob, unwrapJobRecord } from "@/lib/marketplace-mappers";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setLeadAction } from "@/redux/slices/featuresSlice";
import { upsertLiveJob } from "@/redux/slices/marketplaceSlice";
import {
  useGetDirectRequestQuery,
  useGetJobQuery,
  useGetMarketplaceLeadQuery,
} from "@/services/client/jobs-api";

/** Hydrates a live job (quotes + booking) and renders the shared request detail. */
export function ProLiveJobDetail({
  jobId,
  backHref,
  backLabel,
}: {
  jobId: string;
  backHref?: string;
  backLabel?: string;
}) {
  const dispatch = useAppDispatch();

  const job = useGetJobQuery(jobId);
  const jobPending = job.isLoading || job.isFetching;
  const lead = useGetMarketplaceLeadQuery(jobId, { skip: job.isSuccess || jobPending });
  const direct = useGetDirectRequestQuery(jobId, { skip: job.isSuccess || jobPending || !lead.isError });

  const live = job.data ?? direct.data ?? lead.data;
  const mapped = useMemo(() => {
    const raw = unwrapJobRecord(live?.data);
    return raw ? mapLiveJob(raw) : null;
  }, [live]);

  const rejectedByMe = Boolean(
    live?.data &&
      typeof live.data === "object" &&
      (live.data as { isRejectedByMe?: boolean }).isRejectedByMe,
  );

  const hydratedKey = useRef("");
  useEffect(() => {
    if (!mapped) return;
    const key = liveJobKey(mapped);
    if (hydratedKey.current === key) return;
    hydratedKey.current = key;
    dispatch(upsertLiveJob(mapped));
  }, [dispatch, mapped]);

  useEffect(() => {
    if (!rejectedByMe) return;
    dispatch(setLeadAction({ jobId, action: "declined" }));
  }, [dispatch, jobId, rejectedByMe]);

  const storeJob = useAppSelector((state) => selectJob(state, jobId));
  const settled = !jobPending && !lead.isFetching && !direct.isFetching;
  const allFailed = job.isError && lead.isError && direct.isError;

  if (storeJob) return <ProJobLead jobId={jobId} backHref={backHref} backLabel={backLabel} />;
  if (!settled || (!live && !allFailed) || mapped) {
    return <p className="text-sm text-muted">Loading request…</p>;
  }
  notFound();
}
