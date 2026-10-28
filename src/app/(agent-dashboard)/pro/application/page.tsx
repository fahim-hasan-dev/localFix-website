"use client";

import { Suspense, useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  FileUp,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppliedBanner } from "@/components/web-pages/applied-banner";
import { saveApplicationDraft, submitApplication } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const statusConfig = {
  draft: { label: "Draft", icon: FileText, className: "text-muted" },
  submitted: { label: "In review", icon: Clock, className: "text-primary" },
  needs_info: { label: "Needs info", icon: AlertTriangle, className: "text-amber-800" },
  rejected: { label: "Rejected", icon: XCircle, className: "text-red-700" },
  cleared: { label: "Approved", icon: CheckCircle2, className: "text-emerald-700" },
} as const;

export default function ProApplicationPage() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.features.applicationStatus);
  const reason = useAppSelector((state) => state.features.rejectionReason);
  const draft = useAppSelector((state) => state.features.applicationDraft);
  const proProfile = useAppSelector((state) => state.features.proProfile);

  const [licenseFile, setLicenseFile] = useState(
    draft.licenseFile || "TX-M-42981-Master-Plumber-Certificate.pdf",
  );
  const [insuranceFile, setInsuranceFile] = useState(
    draft.insuranceFile || "Next-General-Liability-COI-2026.pdf",
  );
  const [, startTransition] = useTransition();

  const current = statusConfig[status] || statusConfig.draft;
  const canSubmit = status === "draft" || status === "needs_info" || status === "rejected";
  const backgroundClear =
    draft.backgroundCheck === "clear" || status === "cleared" || status === "submitted";

  function handleSubmit() {
    dispatch(
      saveApplicationDraft({
        savedAt: new Date().toISOString(),
        licenseFile,
        insuranceFile,
      }),
    );
    dispatch(submitApplication());
  }

  function handleFileUpload(
    type: "license" | "insurance",
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    startTransition(() => {
      if (type === "license") setLicenseFile(file.name);
      else setInsuranceFile(file.name);
      dispatch(
        saveApplicationDraft({
          savedAt: new Date().toISOString(),
          [type === "license" ? "licenseFile" : "insuranceFile"]: file.name,
        }),
      );
    });
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-4 pt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-tight text-title">
              Professional Verification &amp; Application
            </h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5 bg-smoke border border-line ${current.className}`}>
              <current.icon className="h-3.5 w-3.5" />
              {current.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            State licensing, insurance verification, and background clearance documents.
          </p>
        </div>

        {canSubmit ? (
          <Button type="button" size="sm" onClick={handleSubmit} className="rounded-full text-xs font-semibold">
            {status === "draft" ? "Submit Application" : "Resubmit Application"}
          </Button>
        ) : null}
      </div>

      <Suspense fallback={null}>
        <AppliedBanner />
      </Suspense>

      {reason && canSubmit ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p>{reason}</p>
        </div>
      ) : null}

      {/* Verification Items with Strong Visual Hierarchy */}
      <div className="space-y-4">
        {/* Background Check Item */}
        <Card className="rounded-2xl border border-line/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-smoke/80 text-primary border border-line/70 shadow-2xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm sm:text-base font-bold text-title">
                    Identity &amp; Background Screening
                  </h3>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-semibold">
                    {backgroundClear ? "Verified Clear" : "Pending"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted max-w-xl leading-relaxed">
                  Third-party criminal history records and national identity check for safe in-home contractor dispatch.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-copy font-medium">
                  <span className="text-muted">Status:</span>
                  <span>{backgroundClear ? "Cleared through Checkr Partner Network" : "In review"}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Trade License Item */}
        <Card className="rounded-2xl border border-line/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-smoke/80 text-primary border border-line/70 shadow-2xs">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm sm:text-base font-bold text-title">
                    State Trade License
                  </h3>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-semibold">
                    Active
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted max-w-xl leading-relaxed">
                  Verified state occupational license authorizing residential plumbing and home repair operations.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-copy font-medium truncate">
                  <span className="text-muted">Document:</span>
                  <span className="truncate font-mono text-[11px] text-title bg-smoke px-2 py-0.5 rounded-md border border-line/60">
                    {licenseFile || proProfile?.licenseNumber || "TX-M-42981-Certificate.pdf"}
                  </span>
                </div>
              </div>
            </div>

            {canSubmit && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-smoke shadow-2xs transition shrink-0 self-start sm:self-auto">
                <FileUp className="h-3.5 w-3.5" />
                <span>Replace file</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => handleFileUpload("license", e)}
                />
              </label>
            )}
          </div>
        </Card>

        {/* Liability Insurance Item */}
        <Card className="rounded-2xl border border-line/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-smoke/80 text-primary border border-line/70 shadow-2xs">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm sm:text-base font-bold text-title">
                    General Commercial Liability Insurance
                  </h3>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-semibold">
                    $1,000,000 Policy
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted max-w-xl leading-relaxed">
                  Proof of active commercial liability certificate of insurance covering property damage and client protection.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-copy font-medium truncate">
                  <span className="text-muted">Certificate:</span>
                  <span className="truncate font-mono text-[11px] text-title bg-smoke px-2 py-0.5 rounded-md border border-line/60">
                    {insuranceFile || proProfile?.insuranceCarrier || "Next-Liability-COI-2026.pdf"}
                  </span>
                </div>
              </div>
            </div>

            {canSubmit && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-smoke shadow-2xs transition shrink-0 self-start sm:self-auto">
                <FileUp className="h-3.5 w-3.5" />
                <span>Replace file</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => handleFileUpload("insurance", e)}
                />
              </label>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
