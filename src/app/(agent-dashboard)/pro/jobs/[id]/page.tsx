"use client";

import { useParams } from "next/navigation";
import { ProLiveJobDetail } from "@/components/web-pages/pro-live-job";

export default function ProJobDetailPage() {
  const params = useParams<{ id: string }>();
  return <ProLiveJobDetail jobId={params.id} />;
}
