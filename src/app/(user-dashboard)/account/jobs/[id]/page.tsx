"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { PostedBanner } from "@/components/web-pages/posted-banner";
import { RequestDetail } from "@/components/web-pages/request-detail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { selectJob } from "@/lib/marketplace";
import { liveJobKey, mapLiveJob, unwrapJobRecord } from "@/lib/marketplace-mappers";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { upsertLiveJob } from "@/redux/slices/marketplaceSlice";
import { useGetJobQuery } from "@/services/client/jobs-api";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetJobQuery(id, { skip: !id });

  const mapped = useMemo(() => {
    const raw = unwrapJobRecord(data?.data);
    return raw ? mapLiveJob(raw) : null;
  }, [data]);

  const hydratedKey = useRef("");
  useEffect(() => {
    if (!mapped) return;
    const key = liveJobKey(mapped);
    if (hydratedKey.current === key) return;
    hydratedKey.current = key;
    dispatch(upsertLiveJob(mapped));
  }, [dispatch, mapped]);

  const storeJob = useAppSelector((state) => selectJob(state, id));

  if (storeJob) {
    return (
      <div className="space-y-4">
        <Suspense fallback={null}>
          <PostedBanner />
        </Suspense>
        <RequestDetail
          id={storeJob.id}
          backHref="/account"
          backLabel="Your requests"
          inboxHref="/account/messages"
          canHire
          viewer="homeowner"
        />
      </div>
    );
  }

  if (isLoading || mapped) {
    // `mapped` here means the store upsert is still landing.
    return (
      <Card className="rounded-[20px] border border-line/80 bg-white p-8 text-center">
        <p className="text-sm text-muted">Loading request…</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px] border border-line/80 bg-white p-8 text-center">
      <p className="font-display text-sm font-semibold text-title">Request not found.</p>
      <p className="mt-1 text-xs text-muted">
        It may have been deleted, or you may not have access to it.
      </p>
      <Button
        href="/account"
        variant="ghost"
        size="sm"
        className="mt-4 rounded-full border border-line text-xs font-semibold"
      >
        Back to your requests
      </Button>
    </Card>
  );
}
