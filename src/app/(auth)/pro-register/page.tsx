"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  FileUp,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Field, NativeSelect, TextField } from "@/components/ui/field";
import { AuthLinks } from "@/components/web-pages/auth-links";
import { PasswordField } from "@/components/ui/password-field";
import { categories } from "@/Mockdata";
import { loginAs } from "@/redux/slices/authSlice";
import {
  saveApplicationDraft,
  submitApplication,
  updateProProfile,
} from "@/redux/slices/featuresSlice";
import { useAppDispatch } from "@/redux/hooks";
import {
  formatFileSize,
  validateCredentialFile,
  type CredentialFile,
} from "@/lib/credential-file";

const steps = ["Account", "Trade & Area", "Documents & ID", "Verification"];
type CheckStatus = "idle" | "running" | "clear";

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  trade: string;
  serviceZip: string;
  radius: string;
  // Attachments
  licenseDoc: CredentialFile | null;
  idDoc: CredentialFile | null;
  insuranceDoc: CredentialFile | null;
};

const empty: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  businessName: "",
  trade: "",
  serviceZip: "",
  radius: "25",
  licenseDoc: null,
  idDoc: null,
  insuranceDoc: null,
};

export default function ProRegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");
  const [screeningStage, setScreeningStage] = useState<string>("");
  const dispatch = useAppDispatch();
  const router = useRouter();

  function patch(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function handleFileUpload(
    kind: "licenseDoc" | "idDoc" | "insuranceDoc",
    file: File | null,
  ) {
    if (!file) return;
    const validationError = validateCredentialFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    const cred: CredentialFile = {
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      kind: file.type.includes("pdf") ? "pdf" : "image",
      uploadedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: "review",
      previewUrl: URL.createObjectURL(file),
    };
    patch({ [kind]: cred });
  }

  function handleAttachSample(kind: "licenseDoc" | "idDoc" | "insuranceDoc") {
    setError("");
    const samples: Record<string, CredentialFile> = {
      licenseDoc: {
        name: "TX-M-42981-Master-Plumber-Certificate.pdf",
        sizeLabel: "1.2 MB",
        kind: "pdf",
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: "verified",
      },
      idDoc: {
        name: "TX-DL-Luis-Ortega-Front.jpg",
        sizeLabel: "2.4 MB",
        kind: "image",
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: "verified",
      },
      insuranceDoc: {
        name: "Next-General-Liability-COI-2026.pdf",
        sizeLabel: "840 KB",
        kind: "pdf",
        uploadedAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: "verified",
      },
    };
    patch({ [kind]: samples[kind] });
  }

  function handleAttachAllSamples() {
    setError("");
    handleAttachSample("licenseDoc");
    handleAttachSample("idDoc");
    handleAttachSample("insuranceDoc");
  }

  function runBackgroundCheck() {
    setError("");
    if (!consent) {
      setError("Authorization consent is required to run automated screening.");
      return;
    }
    setCheckStatus("running");
    setScreeningStage("1/3 Verifying Government Photo ID & face match…");

    window.setTimeout(() => {
      setScreeningStage("2/3 Validating Trade License with state registrar…");
    }, 800);

    window.setTimeout(() => {
      setScreeningStage("3/3 Screening national safety & criminal registries…");
    }, 1500);

    window.setTimeout(() => {
      setCheckStatus("clear");
      setScreeningStage("All identity and background checks cleared");
    }, 2200);
  }

  function next() {
    setError("");

    // Step 0 validation
    if (step === 0) {
      if (!form.name.trim() || !form.email.trim() || !form.password) {
        setError("Please enter your name, email, and password to continue.");
        return;
      }
      setStep(1);
      return;
    }

    // Step 1 validation: Business Trade & Service Area
    if (step === 1) {
      if (!form.businessName.trim()) {
        setError("Please enter your business or trading name.");
        return;
      }
      if (!form.trade) {
        setError("Please select your primary trade specialty.");
        return;
      }
      if (!form.serviceZip.trim()) {
        setError("Please enter your primary service territory ZIP code.");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 validation: Documents & ID Upload
    if (step === 2) {
      if (!form.licenseDoc) {
        setError("Please upload your Trade License or Certification document.");
        return;
      }
      if (!form.idDoc) {
        setError(
          "Please upload your Government-issued Photo ID for identity verification.",
        );
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Verification
    if (checkStatus !== "clear") {
      setError(
        "Please authorize and run the identity screening to complete your registration.",
      );
      return;
    }

    const tradeObj = categories.find((c) => c.slug === form.trade);
    const tradeTitle = tradeObj ? tradeObj.name : form.trade || "Plumbing";

    dispatch(
      saveApplicationDraft({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        trade: form.trade,
        serviceZip: form.serviceZip.trim(),
        radius: form.radius,
        licenseFile: form.licenseDoc?.name || "Trade-License.pdf",
        idFile: form.idDoc?.name || "Gov-Photo-ID.jpg",
        insuranceFile:
          form.insuranceDoc?.name || "Liability-Insurance-COI.pdf",
        savedAt: new Date().toISOString(),
        backgroundCheck: "clear",
        idVerification: "verified",
      }),
    );

    dispatch(
      updateProProfile({
        businessName: form.businessName.trim() || "Pro Services",
        contactName: form.name.trim() || "Professional",
        trade: tradeTitle,
        categorySlug: form.trade,
        email: form.email.trim(),
        phone: form.phone.trim(),
        zip: form.serviceZip.trim() || "78701",
        radiusMiles: Number(form.radius) || 25,
        licenseDoc: form.licenseDoc,
        idDoc: form.idDoc,
        insuranceDoc: form.insuranceDoc,
      }),
    );

    dispatch(submitApplication());
    dispatch(
      loginAs({
        role: "pro",
        profile: {
          name: form.name.trim() || "Luis Ortega",
          email: form.email.trim() || "pro@localfix.com",
          phone: form.phone.trim() || "(512) 555-0144",
          zip: form.serviceZip.trim() || "78701",
          city: "Austin",
          state: "TX",
        },
      }),
    );
    router.push("/pro/application?applied=1");
  }

  return (
    <div>
      <h1 className="font-display text-[22px] sm:text-[24px] font-semibold leading-snug tracking-tight text-title">
        Join as a professional
      </h1>
      <p className="mt-1.5 font-sans text-sm leading-relaxed text-[#666]">
        {step === 0 &&
          "Create your professional account to connect directly with Austin homeowners."}
        {step === 1 &&
          "Set your primary trade specialty and local service territory radius."}
        {step === 2 &&
          "Upload your trade license and government photo ID for identity verification."}
        {step === 3 &&
          "Authorize automated identity and safety screening before going live."}
      </p>

      {/* Stepper */}
      <ol className="relative mt-6 grid grid-cols-4">
        <span
          className="absolute top-3 right-[12.5%] left-[12.5%] h-px bg-line"
          aria-hidden
        />
        {steps.map((title, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <li
              key={title}
              className="relative flex flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "relative z-10 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold transition-colors",
                  done || current
                    ? "bg-primary text-white"
                    : "bg-white text-muted ring-1 ring-line",
                )}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-center font-display text-[11px] sm:text-[12px] font-semibold",
                  current ? "text-title" : "text-muted",
                )}
              >
                {title}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-7 space-y-5">
        {/* Step 0: Account */}
        {step === 0 ? (
          <>
            <Field label="Full name *">
              <TextField
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Joe Smith"
              />
            </Field>
            <Field label="Email *">
              <TextField
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="joe@example.com"
              />
            </Field>
            <Field label="Phone *">
              <TextField
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="(555) 000-0000"
              />
            </Field>
            <Field label="Password *">
              <PasswordField
                value={form.password}
                onChange={(e) => patch({ password: e.target.value })}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </Field>
          </>
        ) : null}

        {/* Step 1: Trade & Service Area combined */}
        {step === 1 ? (
          <>
            <Field label="Business name *">
              <TextField
                value={form.businessName}
                onChange={(e) => patch({ businessName: e.target.value })}
                placeholder="Joe's Plumbing LLC"
              />
            </Field>

            <Field label="Primary trade specialty *">
              <NativeSelect
                value={form.trade}
                onChange={(e) => patch({ trade: e.target.value })}
              >
                <option value="" disabled>
                  Select your primary trade
                </option>
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Primary service ZIP *">
                <TextField
                  value={form.serviceZip}
                  onChange={(e) => patch({ serviceZip: e.target.value })}
                  placeholder="78704"
                />
              </Field>

              <Field label="Service radius *">
                <NativeSelect
                  value={form.radius}
                  onChange={(e) => patch({ radius: e.target.value })}
                >
                  <option value="10">Within 10 miles</option>
                  <option value="25">Within 25 miles</option>
                  <option value="50">Within 50 miles</option>
                  <option value="75">Within 75 miles</option>
                  <option value="100">Within 100 miles</option>
                </NativeSelect>
              </Field>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5">
              <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-[#555] leading-relaxed">
                <strong className="text-title font-medium">Quick Note:</strong>{" "}
                Detailed company bio, work portfolio photos, and customized
                service pricing can be added anytime in your{" "}
                <span className="font-semibold text-primary">Edit Profile</span>{" "}
                dashboard after registration.
              </p>
            </div>
          </>
        ) : null}

        {/* Step 2: Credential Attachments & ID Upload */}
        {step === 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
              <div>
                <h3 className="font-display text-sm font-bold text-title">
                  Upload Required Credentials
                </h3>
                <p className="text-xs text-muted">
                  Required to verify your trade license and photo ID.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAttachAllSamples}
                className="text-xs font-semibold text-primary hover:underline hover:text-primary/80"
              >
                + Attach Demo Documents
              </button>
            </div>

            {/* Document 1: Trade License */}
            <div className="rounded-xl border border-line bg-surface/50 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-title">
                      State Trade License / Certification *
                    </h4>
                    <p className="text-[11px] text-muted">
                      Master, Journeyman, or Contractor certificate (PDF or image).
                    </p>
                  </div>
                </div>
                {form.licenseDoc ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Attached
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-red-600">
                    Required
                  </span>
                )}
              </div>

              {form.licenseDoc ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium text-title">
                      {form.licenseDoc.name}
                    </span>
                    <span className="text-muted text-[10px] shrink-0">
                      ({form.licenseDoc.sizeLabel})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => patch({ licenseDoc: null })}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-white px-3 py-2.5 text-xs font-medium text-copy hover:border-primary/50 hover:bg-smoke transition">
                    <FileUp className="h-3.5 w-3.5 text-primary" />
                    <span>Upload License (PDF / Image)</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="sr-only"
                      onChange={(e) =>
                        handleFileUpload("licenseDoc", e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAttachSample("licenseDoc")}
                    className="rounded-lg border border-line bg-smoke px-2.5 py-2.5 text-[11px] font-medium text-title hover:bg-slate-200 transition"
                  >
                    Sample
                  </button>
                </div>
              )}
            </div>

            {/* Document 2: Government-issued Photo ID */}
            <div className="rounded-xl border border-line bg-surface/50 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-title">
                      Government-Issued Photo ID *
                    </h4>
                    <p className="text-[11px] text-muted">
                      Driver&apos;s License, State ID, or Passport for identity screening.
                    </p>
                  </div>
                </div>
                {form.idDoc ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Attached
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-red-600">
                    Required for ID check
                  </span>
                )}
              </div>

              {form.idDoc ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium text-title">
                      {form.idDoc.name}
                    </span>
                    <span className="text-muted text-[10px] shrink-0">
                      ({form.idDoc.sizeLabel})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => patch({ idDoc: null })}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-white px-3 py-2.5 text-xs font-medium text-copy hover:border-primary/50 hover:bg-smoke transition">
                    <FileUp className="h-3.5 w-3.5 text-primary" />
                    <span>Upload Photo ID (JPG / PNG / PDF)</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(e) =>
                        handleFileUpload("idDoc", e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAttachSample("idDoc")}
                    className="rounded-lg border border-line bg-smoke px-2.5 py-2.5 text-[11px] font-medium text-title hover:bg-slate-200 transition"
                  >
                    Sample
                  </button>
                </div>
              )}
            </div>

            {/* Document 3: General Liability Insurance (Optional) */}
            <div className="rounded-xl border border-line bg-surface/50 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-title">
                      Commercial Liability Insurance (COI)
                    </h4>
                    <p className="text-[11px] text-muted">
                      Optional during signup — can also be uploaded later in profile.
                    </p>
                  </div>
                </div>
                {form.insuranceDoc ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Attached
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-muted">
                    Optional
                  </span>
                )}
              </div>

              {form.insuranceDoc ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium text-title">
                      {form.insuranceDoc.name}
                    </span>
                    <span className="text-muted text-[10px] shrink-0">
                      ({form.insuranceDoc.sizeLabel})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => patch({ insuranceDoc: null })}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-white px-3 py-2.5 text-xs font-medium text-copy hover:border-primary/50 hover:bg-smoke transition">
                    <FileUp className="h-3.5 w-3.5 text-primary" />
                    <span>Upload Insurance COI (PDF / Image)</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="sr-only"
                      onChange={(e) =>
                        handleFileUpload("insuranceDoc", e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAttachSample("insuranceDoc")}
                    className="rounded-lg border border-line bg-smoke px-2.5 py-2.5 text-[11px] font-medium text-title hover:bg-slate-200 transition"
                  >
                    Sample
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Step 3: Identity Verification & Background Check */}
        {step === 3 ? (
          <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-title">
                  Identity &amp; Background Screening
                </h2>
                <p className="mt-1 text-xs text-copy leading-relaxed">
                  Screening is conducted using your uploaded Government Photo ID,
                  Trade License, and personal details before your profile goes live.
                </p>
              </div>
            </div>

            {/* Attached Verification Documents Pill Summary */}
            <div className="rounded-xl border border-line/80 bg-white p-3 space-y-2">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
                Submitted Documents for Screening:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Photo ID: {form.idDoc?.name || "Verified ID"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  License: {form.licenseDoc?.name || "Verified License"}
                </span>
                {form.insuranceDoc && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 font-medium text-blue-800 border border-blue-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    Insurance: {form.insuranceDoc.name}
                  </span>
                )}
              </div>
            </div>

            {/* Screening Steps Description */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-copy">
              <div className="rounded-lg border border-line bg-white p-2.5">
                <p className="font-semibold text-title">1. ID Match</p>
                <p className="text-[11px] text-muted mt-0.5">
                  Facial &amp; data match with uploaded government ID.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-white p-2.5">
                <p className="font-semibold text-title">2. Trade Registry</p>
                <p className="text-[11px] text-muted mt-0.5">
                  State licensing board status validation.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-white p-2.5">
                <p className="font-semibold text-title">3. Safety Check</p>
                <p className="text-[11px] text-muted mt-0.5">
                  Checkr national criminal &amp; sex offender search.
                </p>
              </div>
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-copy cursor-pointer pt-1">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-line"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={checkStatus === "running"}
              />
              <span>
                I authorize LocalHomeFix and its verified screening partners to
                verify my uploaded government ID and perform a background screening.
              </span>
            </label>

            {/* Screening Action & Status */}
            <div>
              {checkStatus === "idle" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={runBackgroundCheck}
                  className="text-xs sm:text-sm"
                >
                  Run identity &amp; background check
                </Button>
              ) : null}

              {checkStatus === "running" ? (
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running screening…
                  </p>
                  <p className="text-xs text-muted font-medium pl-6">
                    {screeningStage}
                  </p>
                </div>
              ) : null}

              {checkStatus === "clear" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p>Screening Cleared — Identity &amp; License Verified</p>
                    <p className="text-xs font-normal text-emerald-700 mt-0.5">
                      Your documents match records. You are eligible to submit your application.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-error bg-red-50 border border-red-200 p-2.5 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setError("");
              setStep((value) => value - 1);
            }}
          >
            ← Back
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={next}
          disabled={step === 3 && checkStatus === "running"}
        >
          {step < 3 ? "Next ↗" : "Submit application ↗"}
        </Button>
      </div>

      <AuthLinks
        prompt="Already have an account?"
        href="/login?role=pro"
        label="Sign in ↗"
      />
    </div>
  );
}
