"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  FileUp,
  Image as ImageIcon,
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
  defaultInsuranceDoc,
  defaultLicenseDoc,
  fileFromUpload,
  validateCredentialFile,
  type CredentialFile,
} from "@/lib/credential-file";

const steps = ["Account", "Trade & Area", "Trade License", "Background Check"];

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

  // Step 2: Trade License & Optional Insurance (NO Government ID stored!)
  licenseNumber: string;
  licenseState: string;
  licenseDoc: CredentialFile | null;

  insuranceCarrier: string;
  insuranceCoverage: string;
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
  licenseNumber: "",
  licenseState: "TX",
  licenseDoc: null,
  insuranceCarrier: "",
  insuranceCoverage: "$1,000,000",
  insuranceDoc: null,
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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white min-h-[46px] sm:min-h-[48px] px-3 py-2 text-xs sm:text-sm shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              {file.kind === "pdf" ? (
                <FileText className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-title text-xs sm:text-[13px] leading-tight">
                {file.name}
              </p>
              <p className="text-[10px] text-muted leading-tight mt-0.5">
                {file.sizeLabel} · <span className="text-emerald-700 font-medium">Attached</span>
              </p>
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg p-1.5 text-muted hover:text-red-600 hover:bg-red-50 transition"
              title="Delete file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong/70 bg-white hover:bg-smoke/60 hover:border-primary/60 min-h-[46px] sm:min-h-[48px] px-3 py-2.5 text-xs sm:text-sm font-medium text-title transition-all duration-200 shadow-2xs group"
        >
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <FileUp className="h-3.5 w-3.5" />
          </div>
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
  }>({});
  const [checkrOpened, setCheckrOpened] = useState(false);
  const [consent, setConsent] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  function patch(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function handleCredentialUpload(kind: "license" | "insurance", file: File) {
    const message = validateCredentialFile(file);
    setDocErrors((prev) => ({ ...prev, [kind]: message ?? undefined }));
    if (message) return;

    const next = fileFromUpload(file);
    if (kind === "license") {
      patch({ licenseDoc: next });
    } else {
      patch({ insuranceDoc: next });
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
    });
  }

  function next() {
    setError("");

    // Step 0 validation: Account
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

    // Step 2 validation: Trade License (No personal photo ID required!)
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
      setStep(3);
      return;
    }

    // Step 3: Background Check authorization
    if (!consent) {
      setError(
        "Please acknowledge the third-party screening requirement to submit your application.",
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
        insuranceFile: form.insuranceDoc?.name || "",
        savedAt: new Date().toISOString(),
        thirdPartyScreening: "checkr_initiated",
        backgroundCheck: "submitted",
        trialDaysLeft: "30",
      }),
    );

    // 2. Update Pro Profile
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
        {step === 0 && "Create your pro account to connect with local homeowners."}
        {step === 1 && "Select your trade and service coverage area."}
        {step === 2 && "Add your trade license and insurance details."}
        {step === 3 && "Verify your background via Checkr to start receiving jobs."}
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

        {/* Step 2: Trade License & Optional Insurance (NO Government Photo ID!) */}
        {step === 2 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-0.5">
              <span className="text-xs font-bold text-title">
                Trade Credentials
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

            {/* 1. Trade license card */}
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

            {/* 2. Liability insurance card (Optional) */}
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

        {/* Step 3: Third-Party Screening (Checkr Network) */}
        {step === 3 ? (
          <div className="rounded-xl border border-line bg-smoke/30 p-3.5 sm:p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-bold text-title">
                    Background Verification
                  </h2>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-semibold">
                    Via Checkr
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  All pros complete a quick check through Checkr. Your SSN and ID stay with Checkr—Local Fix never collects or stores them. Both you and Local Fix will receive confirmation once submitted.
                </p>
              </div>
            </div>

            {/* Checkr Portal Action Row */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-title">Checkr Portal</p>
                <p className="text-[11px] text-muted">Takes ~2–3 minutes</p>
              </div>
              <a
                href="https://checkr.com"
                target="_blank"
                rel="noreferrer"
                onClick={() => setCheckrOpened(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition shadow-2xs shrink-0"
              >
                <span>Open Checkr</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {checkrOpened && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 p-2.5 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Portal opened in a new tab. Check your inbox for confirmation.</span>
              </div>
            )}

            {/* Acknowledgment Consent Checkbox */}
            <label className="flex items-start gap-2.5 text-xs text-copy cursor-pointer pt-0.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-line text-primary focus:ring-primary"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="leading-snug">
                I agree to complete my background check on Checkr.
              </span>
            </label>
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
        <Button type="button" onClick={next}>
          {step < 3 ? "Next ↗" : "Submit Application & Finish ↗"}
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
