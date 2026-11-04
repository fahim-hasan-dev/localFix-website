"use client";

import { Suspense, useState, useTransition } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  FileUp,
  Shield,
  ShieldCheck,
  X,
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
  const [fileUrls, setFileUrls] = useState<{ license?: string; insurance?: string }>({});
  const [previewModal, setPreviewModal] = useState<{
    type: "license" | "insurance";
    filename: string;
    url?: string;
  } | null>(null);

  const [, startTransition] = useTransition();

  const current = statusConfig[status] || statusConfig.draft;
  const canSubmit = status === "draft" || status === "needs_info" || status === "rejected";
  const backgroundClear =
    draft.backgroundCheck === "clear" || status === "cleared";

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
    const url = URL.createObjectURL(file);
    setFileUrls((prev) => ({ ...prev, [type]: url }));
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

  function handleOpenPreview(type: "license" | "insurance") {
    const filename = type === "license" ? licenseFile : insuranceFile;
    const customUrl = fileUrls[type];
    const reduxUrl = type === "license" ? proProfile?.licenseDoc?.previewUrl : proProfile?.insuranceDoc?.previewUrl;
    setPreviewModal({
      type,
      filename,
      url: customUrl || reduxUrl,
    });
  }

  function handleDownload(type: "license" | "insurance") {
    const customUrl = fileUrls[type];
    const reduxUrl = type === "license" ? proProfile?.licenseDoc?.previewUrl : proProfile?.insuranceDoc?.previewUrl;
    const urlToUse = customUrl || reduxUrl;

    if (urlToUse) {
      const a = document.createElement("a");
      a.href = urlToUse;
      a.download = type === "license" ? licenseFile : insuranceFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Generate downloadable structured certificate file
    const isLic = type === "license";
    const filename = isLic ? licenseFile : insuranceFile;
    const proName = proProfile?.contactName || "Luis Ortega";
    const bizName = proProfile?.businessName || "Ortega Plumbing & Repair";
    const licNum = proProfile?.licenseNumber || draft.licenseNumber || "TX-M-42981";
    const licState = proProfile?.licenseState || draft.licenseState || "TX";
    const carrier = proProfile?.insuranceCarrier || draft.insuranceCarrier || "Next Insurance";
    const coverage = proProfile?.insuranceCoverage || draft.insuranceCoverage || "$1,000,000";

    const content = isLic
      ? `=======================================================
STATE OF ${licState} - OFFICIAL TRADE LICENSE CERTIFICATE
=======================================================

Licensee Name:    ${proName}
Business Name:    ${bizName}
Trade Specialty:  Master Plumbing & Repair
License Number:   ${licNum}
Issuing State:    ${licState}
Jurisdiction:     Texas State Board of Plumbing Examiners
Verification:     VERIFIED & ACTIVE ON LOCAL FIX
Effective Date:   2024-2027
Status:           CLEAR / STANDING GOOD

Verification Hash: LF-LIC-${Math.random().toString(36).substring(2, 9).toUpperCase()}
Verified by: Local Fix Trust & Safety Department
`
      : `=======================================================
CERTIFICATE OF COMMERCIAL LIABILITY INSURANCE (COI)
=======================================================

Policy Holder:    ${bizName}
Insured Contact:  ${proName}
Insurance Carrier:${carrier}
Policy Coverage:  ${coverage} General Aggregate
Policy Status:    ACTIVE / IN FORCE
Effective Period: 2026 - 2027
Certificate ID:   LF-COI-${Math.random().toString(36).substring(2, 9).toUpperCase()}

Verified by: Local Fix Platform Security & Insurance Verification Desk
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename.endsWith(".txt") || filename.endsWith(".pdf") ? filename : `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
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

      {/* Verification Items */}
      <div className="space-y-4">
        {/* Background Check Item */}
        <Card className="rounded-2xl border border-line/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm sm:text-base font-bold text-title">
                    Background Check
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                    backgroundClear
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      : "bg-amber-50 text-amber-700 border-amber-200/60"
                  }`}>
                    {backgroundClear ? "Cleared" : "Pending Verification"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {backgroundClear
                    ? "Verified via Checkr screening."
                    : "Complete background screening through Checkr to get verified."}
                </p>
              </div>
            </div>

            <a
              href="https://checkr.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-smoke shadow-2xs transition shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>{backgroundClear ? "View on Checkr ↗" : "Start on Checkr ↗"}</span>
            </a>
          </div>
        </Card>

        {/* Trade License Item */}
        <Card className="rounded-2xl border border-line/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-title">
                    State Trade License
                  </h3>
                </div>

                {/* Standard structured key-value display (niche niche, clean and readable, no badge box) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-stone-700 pt-0.5">
                  <div>
                    <span className="text-muted font-medium">License Number: </span>
                    <span className="font-semibold text-title">{proProfile?.licenseNumber || draft.licenseNumber || "TX-M-42981"}</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Issuing State: </span>
                    <span className="font-semibold text-title">{proProfile?.licenseState || draft.licenseState || "TX"}</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Status: </span>
                    <span className="font-semibold text-emerald-700">Verified &amp; Active</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Certificate: </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPreview("license")}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline cursor-pointer"
                      title="Preview document"
                    >
                      <FileText className="h-3 w-3" />
                      {licenseFile}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side actions: Download button & optional Replace button */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleDownload("license")}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-title hover:text-primary hover:border-primary/40 hover:bg-smoke shadow-2xs transition cursor-pointer"
                title="Download document"
              >
                <Download className="h-3.5 w-3.5 text-primary" />
                <span>Download</span>
              </button>
              {canSubmit && (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-title hover:bg-smoke shadow-2xs transition">
                  <FileUp className="h-3.5 w-3.5" />
                  <span>Replace</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={(e) => handleFileUpload("license", e)}
                  />
                </label>
              )}
            </div>
          </div>
        </Card>

        {/* Liability Insurance Item */}
        <Card className="rounded-2xl border border-line/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-title">
                    General Commercial Liability Insurance
                  </h3>
                </div>

                {/* Standard structured key-value display (niche niche, clean and readable, no badge box) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-stone-700 pt-0.5">
                  <div>
                    <span className="text-muted font-medium">Carrier: </span>
                    <span className="font-semibold text-title">{proProfile?.insuranceCarrier || draft.insuranceCarrier || "Next Insurance"}</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Coverage Limit: </span>
                    <span className="font-semibold text-title">{proProfile?.insuranceCoverage || draft.insuranceCoverage || "$1,000,000"} General Aggregate</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Policy Status: </span>
                    <span className="font-semibold text-emerald-700">Verified &amp; Active</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Certificate (COI): </span>
                    <button
                      type="button"
                      onClick={() => handleOpenPreview("insurance")}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline cursor-pointer"
                      title="Preview certificate"
                    >
                      <FileText className="h-3 w-3" />
                      {insuranceFile}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side actions: Download button & optional Replace button */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleDownload("insurance")}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-title hover:text-primary hover:border-primary/40 hover:bg-smoke shadow-2xs transition cursor-pointer"
                title="Download certificate"
              >
                <Download className="h-3.5 w-3.5 text-primary" />
                <span>Download</span>
              </button>
              {canSubmit && (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-title hover:bg-smoke shadow-2xs transition">
                  <FileUp className="h-3.5 w-3.5" />
                  <span>Replace</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={(e) => handleFileUpload("insurance", e)}
                  />
                </label>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Document Preview & Verification Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line/70 px-5 py-4 bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  {previewModal.type === "license" ? <FileCheck2 className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-title">
                    {previewModal.type === "license" ? "Trade License Certificate" : "Commercial Liability COI"}
                  </h3>
                  <p className="text-[11px] text-muted truncate max-w-xs">{previewModal.filename}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-smoke hover:text-title transition cursor-pointer"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - Visual Certificate Representation */}
            <div className="p-6">
              {previewModal.url ? (
                <div className="rounded-xl border border-line bg-smoke/30 p-2 text-center">
                  {previewModal.filename.endsWith(".pdf") ? (
                    <iframe src={previewModal.url} className="h-80 w-full rounded-lg" title="Document Preview" />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewModal.url} alt="Document" className="max-h-80 w-auto mx-auto rounded-lg object-contain" />
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-linear-to-b from-primary/[0.03] to-transparent p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-line/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">
                        Verified Credentials Record
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-bold">
                      Verified &amp; Active
                    </span>
                  </div>

                  {previewModal.type === "license" ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted uppercase">Contractor / Licensee</p>
                          <p className="font-semibold text-title">{proProfile?.contactName || "Luis Ortega"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Business Name</p>
                          <p className="font-semibold text-title">{proProfile?.businessName || "Ortega Plumbing & Repair"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted uppercase">License Number</p>
                          <p className="font-mono font-bold text-title">{proProfile?.licenseNumber || draft.licenseNumber || "TX-M-42981"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Issuing State</p>
                          <p className="font-semibold text-title">{proProfile?.licenseState || draft.licenseState || "TX"}</p>
                        </div>
                      </div>
                      <div className="border-t border-line/50 pt-2 text-[11px] text-muted">
                        Official trade license verified with the state licensing board for residential contracting.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted uppercase">Named Insured</p>
                          <p className="font-semibold text-title">{proProfile?.businessName || "Ortega Plumbing & Repair"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Carrier</p>
                          <p className="font-semibold text-title">{proProfile?.insuranceCarrier || draft.insuranceCarrier || "Next Insurance"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted uppercase">Coverage Amount</p>
                          <p className="font-semibold text-title">{proProfile?.insuranceCoverage || draft.insuranceCoverage || "$1,000,000"} General Aggregate</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Policy Status</p>
                          <p className="font-semibold text-emerald-700">Active &amp; In Force</p>
                        </div>
                      </div>
                      <div className="border-t border-line/50 pt-2 text-[11px] text-muted">
                        Certificate of Insurance verified to protect homeowners against property damage and liability.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-line/70 px-5 py-3.5 bg-stone-50/70">
              <span className="text-[11px] text-muted">Document ID: LF-DOC-VERIFIED</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewModal(null)}
                  className="rounded-full text-xs cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleDownload(previewModal.type)}
                  className="rounded-full text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Document</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
