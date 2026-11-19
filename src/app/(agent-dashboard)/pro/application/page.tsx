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
import { useGetProfessionalApplicationQuery } from "@/services/client/marketplace-api";
import { useInitiateCheckrScreeningMutation } from "@/services/client/checkr-api";
import { apiErrorMessage } from "@/services/client/form-data";
import { unwrapRecord, str, type ApiRecord } from "@/lib/api-profile";
import { mediaUrl } from "@/utils/mediaUrl";
import { toast } from "sonner";

function toRecord(value: unknown): ApiRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as ApiRecord;
}

function fileNameFromUrl(url: string) {
  const clean = url.split("?")[0].split("#")[0];
  const last = clean.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

type ApplicationStatusKey = "draft" | "submitted" | "needs_info" | "rejected" | "cleared";

function mapApiStatus(value: unknown): ApplicationStatusKey | null {
  const v = str(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (!v) return null;
  if (["approved", "cleared", "verified", "active", "accepted"].includes(v)) return "cleared";
  if (["pending", "submitted", "in_review", "under_review", "review", "processing"].includes(v)) return "submitted";
  if (["rejected", "declined", "denied"].includes(v)) return "rejected";
  if (["needs_info", "more_info", "info_required", "incomplete"].includes(v)) return "needs_info";
  if (v === "draft") return "draft";
  return null;
}

const statusConfig = {
  draft: { label: "Draft", icon: FileText, className: "text-muted" },
  submitted: { label: "In review", icon: Clock, className: "text-primary" },
  needs_info: { label: "Needs info", icon: AlertTriangle, className: "text-amber-800" },
  rejected: { label: "Rejected", icon: XCircle, className: "text-red-700" },
  cleared: { label: "Approved", icon: CheckCircle2, className: "text-emerald-700" },
} as const;

export default function ProApplicationPage() {
  const dispatch = useAppDispatch();
  const localStatus = useAppSelector((state) => state.features.applicationStatus);
  const localReason = useAppSelector((state) => state.features.rejectionReason);
  const localDraft = useAppSelector((state) => state.features.applicationDraft);

  // Live application status from the API (falls back to local state until it loads).
  const { data: applicationResponse, refetch: refetchApplication } =
    useGetProfessionalApplicationQuery();
  const [initiateCheckr, { isLoading: checkrStarting }] = useInitiateCheckrScreeningMutation();
  const application = unwrapRecord(applicationResponse?.data);
  const status: ApplicationStatusKey =
    mapApiStatus(application?.approvalStatus ?? application?.applicationStatus ?? application?.status) ??
    localStatus;
  const reason =
    str(application?.rejectionReason ?? application?.reason ?? application?.adminNote) || localReason;
  const backgroundCheck = toRecord(application?.backgroundCheck);
  const backgroundStatus = str(
    backgroundCheck?.status ?? application?.backgroundCheckStatus,
  ).toLowerCase();
  const backgroundLabel =
    str(backgroundCheck?.statusLabel) ||
    (["verified", "clear", "cleared", "passed", "approved", "completed"].includes(backgroundStatus)
      ? "Cleared"
      : backgroundStatus
        ? backgroundStatus.replace(/_/g, " ")
        : "Pending Verification");
  const savedInvitationUrl = str(
    backgroundCheck?.checkrInvitationUrl ?? backgroundCheck?.viewUrl ?? application?.checkrInvitationUrl,
  );
  const tradeLicense = toRecord(application?.tradeLicense);
  const liabilityInsurance = toRecord(application?.liabilityInsurance ?? application?.insurance);
  const draft: Record<string, string> = {
    ...localDraft,
    licenseNumber: str(tradeLicense?.licenseNumber) || str(application?.licenseNumber) || localDraft.licenseNumber,
    licenseState: str(tradeLicense?.licenseState ?? tradeLicense?.state) || str(application?.licenseState) || localDraft.licenseState,
    insuranceCarrier:
      str(liabilityInsurance?.insuranceCarrier ?? liabilityInsurance?.carrier) ||
      str(application?.insuranceCarrier) ||
      localDraft.insuranceCarrier,
    insuranceCoverage:
      str(liabilityInsurance?.insuranceCoverage ?? liabilityInsurance?.coverage) ||
      str(application?.insuranceCoverage) ||
      localDraft.insuranceCoverage,
    backgroundCheck: (
      backgroundCheck?.isCleared === true ||
      backgroundCheck?.passed === true ||
      ["verified", "clear", "cleared", "passed", "approved", "completed"].includes(backgroundStatus)
    )
      ? ("clear" as const)
      : localDraft.backgroundCheck,
  };
  const proProfile = {
    contactName: str(application?.name),
    businessName: str(application?.companyName),
    licenseNumber: draft.licenseNumber,
    licenseState: draft.licenseState,
    insuranceCarrier: draft.insuranceCarrier,
    insuranceCoverage: draft.insuranceCoverage,
  };

  // Certificate files come from the API only (relative upload paths resolved via mediaUrl).
  const apiLicenseUrl = mediaUrl(
    str(tradeLicense?.certificateUrl) || str(application?.tradeLicenseCertificate),
  );
  const apiInsuranceUrl = mediaUrl(
    str(liabilityInsurance?.certificateUrl) || str(application?.coiCertificate ?? application?.insuranceCertificate),
  );
  const [licenseFileOverride, setLicenseFileOverride] = useState<string | null>(null);
  const [insuranceFileOverride, setInsuranceFileOverride] = useState<string | null>(null);
  const licenseFile = licenseFileOverride ?? (apiLicenseUrl ? fileNameFromUrl(apiLicenseUrl) : "");
  const insuranceFile = insuranceFileOverride ?? (apiInsuranceUrl ? fileNameFromUrl(apiInsuranceUrl) : "");
  const [fileUrls, setFileUrls] = useState<{ license?: string; insurance?: string }>({});
  const [previewModal, setPreviewModal] = useState<{
    type: "license" | "insurance";
    filename: string;
    url?: string;
  } | null>(null);

  const [, startTransition] = useTransition();
  const verifiedLabel = status === "cleared" ? "Verified & Active" : status === "submitted" ? "In review" : "Not verified";

  const current = statusConfig[status] || statusConfig.draft;
  const canSubmit = status === "draft" || status === "needs_info" || status === "rejected";
  const backgroundClear =
    draft.backgroundCheck === "clear" ||
    backgroundCheck?.isCleared === true ||
    backgroundCheck?.passed === true;

  async function openCheckrPortal() {
    try {
      if (backgroundClear && savedInvitationUrl) {
        window.open(savedInvitationUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const res = await initiateCheckr({ consentAccepted: true }).unwrap();
      const url = str(res.data?.invitationUrl) || savedInvitationUrl;
      if (!url) {
        toast.error("Checkr screening link is not available right now. Please try again.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success(
        res.data?.alreadyVerified
          ? "Background check already cleared."
          : "Checkr screening opened in a new tab.",
      );
      void refetchApplication();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not start Checkr screening. Please try again."));
    }
  }

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
      if (type === "license") setLicenseFileOverride(file.name);
      else setInsuranceFileOverride(file.name);
      dispatch(
        saveApplicationDraft({
          savedAt: new Date().toISOString(),
          [type === "license" ? "licenseFile" : "insuranceFile"]: file.name,
        }),
      );
    });
  }

  function handleOpenPreview(type: "license" | "insurance") {
    const url = fileUrls[type] || (type === "license" ? apiLicenseUrl : apiInsuranceUrl);
    if (!url) return;
    setPreviewModal({
      type,
      filename: type === "license" ? licenseFile : insuranceFile,
      url,
    });
  }

  function handleDownload(type: "license" | "insurance") {
    const urlToUse = fileUrls[type] || (type === "license" ? apiLicenseUrl : apiInsuranceUrl);
    if (!urlToUse) return;
    const a = document.createElement("a");
    a.href = urlToUse;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.download = type === "license" ? licenseFile : insuranceFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
                    {backgroundClear ? "Cleared" : backgroundLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {backgroundClear
                    ? "Verified via Checkr screening."
                    : "Complete background screening through Checkr to get verified."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCheckrPortal}
              disabled={checkrStarting}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-smoke shadow-2xs transition shrink-0 self-start sm:self-auto cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {checkrStarting
                  ? "Opening…"
                  : backgroundClear
                    ? "View on Checkr ↗"
                    : savedInvitationUrl
                      ? "Continue on Checkr ↗"
                      : "Start on Checkr ↗"}
              </span>
            </button>
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
                    <span className="font-semibold text-title">{proProfile?.licenseNumber || draft.licenseNumber || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Issuing State: </span>
                    <span className="font-semibold text-title">{proProfile?.licenseState || draft.licenseState || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Status: </span>
                    <span className={`font-semibold ${status === "cleared" ? "text-emerald-700" : "text-amber-700"}`}>{verifiedLabel}</span>
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
                      {licenseFile || "Not uploaded"}
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
                disabled={!(fileUrls.license || apiLicenseUrl)}
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
                    <span className="font-semibold text-title">{proProfile?.insuranceCarrier || draft.insuranceCarrier || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Coverage Limit: </span>
                    <span className="font-semibold text-title">{proProfile?.insuranceCoverage || draft.insuranceCoverage ? `${proProfile?.insuranceCoverage || draft.insuranceCoverage} General Aggregate` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted font-medium">Policy Status: </span>
                    <span className={`font-semibold ${status === "cleared" ? "text-emerald-700" : "text-amber-700"}`}>{verifiedLabel}</span>
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
                      {insuranceFile || "Not uploaded"}
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
                disabled={!(fileUrls.insurance || apiInsuranceUrl)}
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
                      {verifiedLabel}
                    </span>
                  </div>

                  {previewModal.type === "license" ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted uppercase">Contractor / Licensee</p>
                          <p className="font-semibold text-title">{proProfile?.contactName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Business Name</p>
                          <p className="font-semibold text-title">{proProfile?.businessName || "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted uppercase">License Number</p>
                          <p className="font-mono font-bold text-title">{proProfile?.licenseNumber || draft.licenseNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Issuing State</p>
                          <p className="font-semibold text-title">{proProfile?.licenseState || draft.licenseState || "—"}</p>
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
                          <p className="font-semibold text-title">{proProfile?.businessName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted uppercase">Carrier</p>
                          <p className="font-semibold text-title">{proProfile?.insuranceCarrier || draft.insuranceCarrier || "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted uppercase">Coverage Amount</p>
                          <p className="font-semibold text-title">{proProfile?.insuranceCoverage || draft.insuranceCoverage ? `${proProfile?.insuranceCoverage || draft.insuranceCoverage} General Aggregate` : "—"}</p>
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
              <span className="text-[11px] text-muted">{previewModal.filename}</span>
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
