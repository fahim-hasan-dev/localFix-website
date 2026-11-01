"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  FileUp,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
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
  defaultIdDoc,
  defaultInsuranceDoc,
  defaultLicenseDoc,
  fileFromUpload,
  validateCredentialFile,
  type CredentialFile,
} from "@/lib/credential-file";

const steps = ["Account", "Trade & Area", "Credentials & ID", "Verification"];
type CheckStatus = "idle" | "running" | "clear";

type FormState = {
  // Step 0: Account
  name: string;
  email: string;
  phone: string;
  password: string;

  // Step 1: Trade & Territory
  businessName: string;
  trade: string;
  serviceZip: string;
  radius: string;

  // Step 2: Credentials & Attachments (Identical to Profile Edit)
  licenseNumber: string;
  licenseState: string;
  licenseDoc: CredentialFile | null;

  insuranceCarrier: string;
  insuranceCoverage: string;
  insuranceDoc: CredentialFile | null;

  idDoc: CredentialFile | null;
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
  licenseNumber: "",
  licenseState: "TX",
  licenseDoc: null,
  insuranceCarrier: "",
  insuranceCoverage: "$1,000,000",
  insuranceDoc: null,
  idDoc: null,
};

function CompactAttachment({
  file,
  label,
  error,
  onUpload,
  onRemove,
}: {
  file: CredentialFile | null;
  label: string;
  error?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1">
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {file.kind === "pdf" ? (
              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            <span className="truncate font-medium text-title text-[11px] sm:text-xs">
              {file.name}
            </span>
            <span className="text-[10px] text-muted shrink-0">
              ({file.sizeLabel})
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-2.5 w-2.5" /> Ready
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[10px] font-semibold text-primary hover:underline px-1"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="text-muted hover:text-red-600 p-0.5"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-smoke/40 hover:bg-smoke hover:border-primary/50 px-2.5 py-2 text-xs font-medium text-copy transition"
        >
          <FileUp className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      {error && <p className="text-[10px] text-error">{error}</p>}
    </div>
  );
}

export default function ProRegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState("");
  const [docErrors, setDocErrors] = useState<{
    license?: string;
    insurance?: string;
    id?: string;
  }>({});
  const [consent, setConsent] = useState(false);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");
  const [screeningStage, setScreeningStage] = useState<string>("");
  const dispatch = useAppDispatch();
  const router = useRouter();

  function patch(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function handleCredentialUpload(
    kind: "license" | "insurance" | "id",
    file: File,
  ) {
    const message = validateCredentialFile(file);
    setDocErrors((prev) => ({ ...prev, [kind]: message ?? undefined }));
    if (message) return;

    const next = fileFromUpload(file);
    if (kind === "license") {
      patch({ licenseDoc: next });
    } else if (kind === "insurance") {
      patch({ insuranceDoc: next });
    } else {
      patch({ idDoc: next });
    }
  }

  function handleAutofillDemo() {
    setError("");
    setDocErrors({});
    patch({
      licenseNumber: "TX-M-42981",
      licenseState: "TX",
      licenseDoc: defaultLicenseDoc(),
      insuranceCarrier: "Next Insurance",
      insuranceCoverage: "$1,000,000",
      insuranceDoc: defaultInsuranceDoc(),
      idDoc: defaultIdDoc(),
    });
  }

  function runBackgroundCheck() {
    setError("");
    if (!consent) {
      setError("Authorization consent is required to run automated screening.");
      return;
    }
    setCheckStatus("running");
    setScreeningStage("1/3 Verifying Government Photo ID & facial match…");

    window.setTimeout(() => {
      setScreeningStage(
        `2/3 Validating Trade License #${form.licenseNumber || "TX-M-42981"} with state registrar…`,
      );
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

    // Step 1 validation: Trade & Service Area
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

    // Step 2 validation: Credentials (same as profile edit)
    if (step === 2) {
      if (!form.licenseNumber.trim()) {
        setError("Please enter your state trade license number.");
        return;
      }
      if (!form.licenseState.trim()) {
        setError("Please enter the issuing state for your trade license.");
        return;
      }
      if (!form.licenseDoc) {
        setError("Please attach your Trade License certificate document.");
        return;
      }
      if (!form.idDoc) {
        setError(
          "Please attach your Government Photo ID document for identity verification.",
        );
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Verification Check
    if (checkStatus !== "clear") {
      setError(
        "Please authorize and run the identity screening to complete your registration.",
      );
      return;
    }

    const tradeObj = categories.find((c) => c.slug === form.trade);
    const tradeTitle = tradeObj ? tradeObj.name : form.trade || "Plumbing";

    // 1. Save to application draft
    dispatch(
      saveApplicationDraft({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        trade: form.trade,
        serviceZip: form.serviceZip.trim(),
        radius: form.radius,
        licenseNumber: form.licenseNumber.trim(),
        licenseState: form.licenseState.trim(),
        licenseFile: form.licenseDoc?.name || "Trade-License.pdf",
        insuranceCarrier: form.insuranceCarrier.trim(),
        insuranceCoverage: form.insuranceCoverage,
        insuranceExpires: "2027-09",
        insuranceFile:
          form.insuranceDoc?.name || "Liability-Insurance-COI.pdf",
        idFile: form.idDoc?.name || "Gov-Photo-ID.jpg",
        savedAt: new Date().toISOString(),
        backgroundCheck: "clear",
        idVerification: "verified",
      }),
    );

    // 2. Update Pro Profile (exact 1:1 match with profile edit fields)
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
        licenseNumber: form.licenseNumber.trim() || "TX-M-42981",
        licenseState: form.licenseState.trim().toUpperCase() || "TX",
        licenseDoc: form.licenseDoc,
        insuranceCarrier: form.insuranceCarrier.trim() || "Next Insurance",
        insuranceCoverage: form.insuranceCoverage || "$1,000,000",
        insuranceExpires: "2027-09",
        insuranceDoc: form.insuranceDoc,
        idDoc: form.idDoc,
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
      <h1 className="font-display text-[20px] sm:text-[22px] font-semibold leading-snug tracking-tight text-title">
        Join as a professional
      </h1>
      <p className="mt-1 font-sans text-xs sm:text-sm text-[#666]">
        {step === 0 &&
          "Create your professional account to connect directly with Austin homeowners."}
        {step === 1 &&
          "Set your primary trade specialty and local service territory radius."}
        {step === 2 &&
          "Provide trade credentials and government photo ID for identity screening."}
        {step === 3 &&
          "Authorize automated identity and safety screening before going live."}
      </p>

      {/* Stepper with centered ticks and numbers */}
      <ol className="relative mt-4 mb-5 grid grid-cols-4">
        <span
          className="absolute top-3 -translate-y-1/2 right-[12.5%] left-[12.5%] h-px bg-line"
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
                  "relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors select-none",
                  done || current
                    ? "bg-primary text-white"
                    : "bg-white text-muted ring-1 ring-line",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                ) : (
                  <span className="leading-none">{index + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-center font-display text-[11px] font-semibold leading-none",
                  current ? "text-title" : "text-muted",
                )}
              >
                {title}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 space-y-3.5">
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

        {/* Step 1: Trade & Service Area */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
          </>
        ) : null}

        {/* Step 2: Compact Credentials & Attachments */}
        {step === 2 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-0.5">
              <span className="text-xs font-bold text-title">
                Required Credentials
              </span>
              <button
                type="button"
                onClick={handleAutofillDemo}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline hover:text-primary/80"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                Autofill Demo
              </button>
            </div>

            {/* 1. Trade license card (compact, no bloated height) */}
            <div className="rounded-xl border border-line bg-smoke/30 p-3 space-y-2.5">
              <h3 className="text-xs font-bold text-title">
                Trade License *
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label="License number *">
                  <TextField
                    value={form.licenseNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      patch({ licenseNumber: e.target.value })
                    }
                    placeholder="TX-M-42981"
                  />
                </Field>
                <Field label="State *">
                  <TextField
                    value={form.licenseState}
                    maxLength={2}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      patch({ licenseState: e.target.value.toUpperCase() })
                    }
                    placeholder="TX"
                  />
                </Field>
              </div>
              <CompactAttachment
                label="Upload License Certificate (PDF or photo)"
                file={form.licenseDoc}
                error={docErrors.license}
                onUpload={(file) => handleCredentialUpload("license", file)}
                onRemove={() => patch({ licenseDoc: null })}
              />
            </div>

            {/* 2. Government photo ID card (compact) */}
            <div className="rounded-xl border border-line bg-smoke/30 p-3 space-y-2">
              <h3 className="text-xs font-bold text-title">
                Government Photo ID *
              </h3>
              <CompactAttachment
                label="Upload Driver's License or Passport (Photo/PDF)"
                file={form.idDoc}
                error={docErrors.id}
                onUpload={(file) => handleCredentialUpload("id", file)}
                onRemove={() => patch({ idDoc: null })}
              />
            </div>

            {/* 3. Liability insurance card (2 columns, NO overlapping!) */}
            <div className="rounded-xl border border-line bg-smoke/30 p-3 space-y-2.5">
              <h3 className="text-xs font-bold text-title">
                Liability Insurance <span className="font-normal text-muted text-[11px]">(Optional)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label="Carrier">
                  <TextField
                    value={form.insuranceCarrier}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      patch({ insuranceCarrier: e.target.value })
                    }
                    placeholder="Next Insurance"
                  />
                </Field>
                <Field label="Coverage">
                  <NativeSelect
                    value={form.insuranceCoverage}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      patch({ insuranceCoverage: e.target.value })
                    }
                  >
                    <option value="$500,000">$500,000</option>
                    <option value="$1,000,000">$1,000,000</option>
                    <option value="$2,000,000">$2,000,000</option>
                  </NativeSelect>
                </Field>
              </div>
              <CompactAttachment
                label="Upload Certificate of Insurance (COI)"
                file={form.insuranceDoc}
                error={docErrors.insurance}
                onUpload={(file) => handleCredentialUpload("insurance", file)}
                onRemove={() => patch({ insuranceDoc: null })}
              />
            </div>
          </div>
        ) : null}

        {/* Step 3: Identity Verification & Background Check */}
        {step === 3 ? (
          <div className="rounded-xl border border-line bg-surface/50 p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-sm sm:text-base font-semibold text-title">
                  Identity &amp; Background Screening
                </h2>
                <p className="mt-0.5 text-xs text-copy">
                  Verification runs against your uploaded Government ID and License #{form.licenseNumber || "TX-M-42981"}.
                </p>
              </div>
            </div>

            {/* Attached Verification Documents Summary */}
            <div className="rounded-lg border border-line/80 bg-white p-2.5 space-y-1.5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Submitted Credentials for Screening:
              </p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  ID: {form.idDoc?.name || "Verified ID"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  License #{form.licenseNumber || "TX-M-42981"} ({form.licenseState || "TX"})
                </span>
                {form.insuranceDoc && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 border border-blue-200">
                    <CheckCircle2 className="h-3 w-3 text-blue-600" />
                    Insurance: {form.insuranceCarrier || "Commercial"} ({form.insuranceCoverage})
                  </span>
                )}
              </div>
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-2 text-xs text-copy cursor-pointer pt-0.5">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 rounded border-line"
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
                  className="text-xs h-9 px-3"
                >
                  Run identity &amp; background check
                </Button>
              ) : null}

              {checkStatus === "running" ? (
                <div className="space-y-1">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Running screening…
                  </p>
                  <p className="text-[11px] text-muted font-medium pl-5">
                    {screeningStage}
                  </p>
                </div>
              ) : null}

              {checkStatus === "clear" ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p>Screening Cleared — Identity &amp; License Verified</p>
                    <p className="text-[11px] font-normal text-emerald-700">
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
        <div className="mt-3 flex items-center gap-2 text-xs text-error bg-red-50 border border-red-200 p-2 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
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
