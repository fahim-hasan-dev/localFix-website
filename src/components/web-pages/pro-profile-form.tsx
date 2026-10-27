"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Field, NativeSelect, TextArea, TextField } from "@/components/ui/field";
import { updateUser } from "@/redux/slices/authSlice";
import {
  updateProProfile,
  type ProServiceItem,
} from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/cn";
import {
  TIME_OPTIONS,
  WEEK_DAYS,
  allDaysMatch,
  applyHoursToDays,
  normalizeWeeklyHours,
  type DaySchedule,
  type Weekday,
} from "@/lib/business-hours";
import { CredentialAttachment } from "@/components/shared/credential-attachment";
import {
  defaultInsuranceDoc,
  defaultLicenseDoc,
  fileFromUpload,
  validateCredentialFile,
} from "@/lib/credential-file";

const PAYMENT_METHODS = [
  "Cash",
  "Check",
  "Credit or debit",
  "Zelle",
  "Venmo",
  "Apple Pay",
  "Google Pay",
  "Bank transfer",
  "PayPal",
] as const;

const PAYMENT_ALIASES: Record<string, (typeof PAYMENT_METHODS)[number]> = {
  "Credit/Debit Card": "Credit or debit",
  "Bank Transfer (ACH)": "Bank transfer",
  Stripe: "Credit or debit",
};

function normalizeAcceptedPayments(raw: string[]) {
  const next = new Set<(typeof PAYMENT_METHODS)[number]>();
  raw.forEach((value) => {
    const mapped = PAYMENT_ALIASES[value] ?? (PAYMENT_METHODS.includes(value as (typeof PAYMENT_METHODS)[number])
      ? (value as (typeof PAYMENT_METHODS)[number])
      : undefined);
    if (mapped) next.add(mapped);
  });
  return [...next];
}

export function ProProfileForm() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const proProfile = useAppSelector((state) => state.features.proProfile);

  const [activeTab, setActiveTab] = useState<
    "overview" | "hours" | "credentials" | "portfolio"
  >("overview");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    ...proProfile,
    businessHours: normalizeWeeklyHours(proProfile.businessHours),
    licenseDoc: proProfile.licenseDoc ?? defaultLicenseDoc(),
    insuranceDoc: proProfile.insuranceDoc ?? defaultInsuranceDoc(),
    insuranceExpires: proProfile.insuranceExpires ?? "2027-09",
    insuranceCoverage: ["$500,000", "$1,000,000", "$2,000,000"].includes(proProfile.insuranceCoverage)
      ? proProfile.insuranceCoverage
      : "$1,000,000",
    acceptedPayments: normalizeAcceptedPayments(proProfile.acceptedPayments),
  });
  const [docErrors, setDocErrors] = useState<{ license?: string; insurance?: string }>({});
  const [hoursMode, setHoursMode] = useState<"all" | "custom">(() =>
    allDaysMatch(normalizeWeeklyHours(proProfile.businessHours)) ? "all" : "custom",
  );

  // Modal "Add Photo" state
  const [newPhoto, setNewPhoto] = useState({
    title: "",
    image: "",
  });
  const [photoPreview, setPhotoPreview] = useState("");
  const [showAddPhoto, setShowAddPhoto] = useState(false);

  if (!user) return null;

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function handleSaveAll() {
    const startingFromServices = formData.services.length
      ? Math.min(...formData.services.map((service) => service.price))
      : formData.startingPrice;
    const proName = formData.contactName || formData.businessName || "Luis Ortega";
    dispatch(
      updateProProfile({
        ...formData,
        contactName: proName,
        businessName: proName,
        startingPrice: startingFromServices,
        responseTime: proProfile.responseTime,
      }),
    );
    dispatch(
      updateUser({
        name: proName,
        phone: formData.phone,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
      })
    );
    showToast("Profile updated.");
  }



  function cloneDay(day: DaySchedule): DaySchedule {
    return { status: day.status, slots: day.slots.map((slot) => ({ ...slot })) };
  }

  function writeDayHours(days: Weekday[], nextDay: DaySchedule) {
    setFormData((prev) => ({
      ...prev,
      businessHours: applyHoursToDays(nextDay, days, prev.businessHours),
    }));
  }

  function targetDays(day: Weekday): Weekday[] {
    return hoursMode === "all" ? WEEK_DAYS.map((item) => item.key) : [day];
  }

  function updateDayHours(day: Weekday, next: DaySchedule) {
    writeDayHours(targetDays(day), next);
  }

  function changeHoursMode(mode: "all" | "custom") {
    setHoursMode(mode);
    if (mode === "all") {
      writeDayHours(
        WEEK_DAYS.map((item) => item.key),
        cloneDay(formData.businessHours.monday),
      );
    }
  }

  function addBreak(day: Weekday) {
    const current = formData.businessHours[day];
    if (current.slots.length >= 2) return;
    const first = current.slots[0] ?? { open: "8:00 AM", close: "6:00 PM" };
    updateDayHours(day, {
      ...current,
      slots: [
        { open: first.open, close: "12:00 PM" },
        { open: "1:00 PM", close: first.close },
      ],
    });
  }

  function removeSlot(day: Weekday, index: number) {
    const current = formData.businessHours[day];
    if (current.slots.length <= 1) return;
    updateDayHours(day, {
      ...current,
      slots: current.slots.filter((_, slotIndex) => slotIndex !== index),
    });
  }

  function updateSlot(day: Weekday, index: number, field: "open" | "close", value: string) {
    const current = formData.businessHours[day];
    updateDayHours(day, {
      ...current,
      slots: current.slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot,
      ),
    });
  }

  function handleCredentialUpload(kind: "license" | "insurance", file: File) {
    const message = validateCredentialFile(file);
    setDocErrors((prev) => ({ ...prev, [kind]: message ?? undefined }));
    if (message) return;

    const next = fileFromUpload(file);
    setFormData((prev) => {
      const key = kind === "license" ? "licenseDoc" : "insuranceDoc";
      const current = prev[key];
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return { ...prev, [key]: next };
    });
    showToast(kind === "license" ? "License file sent for review" : "Insurance file sent for review");
  }


  // Payment methods toggle
  function togglePayment(payment: (typeof PAYMENT_METHODS)[number]) {
    setFormData((prev) => {
      const exists = prev.acceptedPayments.includes(payment);
      const next = exists
        ? prev.acceptedPayments.filter((item) => item !== payment)
        : [...prev.acceptedPayments, payment];
      return { ...prev, acceptedPayments: next };
    });
  }

  // Photo helpers
  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    if (!newPhoto.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setNewPhoto((prev) => ({ ...prev, title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1) }));
    }
  }

  function handleAddPhoto() {
    const imgSrc = photoPreview || newPhoto.image || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80";
    const caption = newPhoto.title.trim() || "Completed project";
    setFormData((prev) => ({
      ...prev,
      portfolio: [
        ...prev.portfolio,
        {
          title: caption,
          image: imgSrc,
        },
      ],
    }));
    setNewPhoto({ title: "", image: "" });
    setPhotoPreview("");
    setShowAddPhoto(false);
    showToast("Photo uploaded to portfolio!");
  }

  function handleRemovePhoto(index: number) {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-title px-5 py-3 text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner & Live Profile Shortcut */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line/70 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-title tracking-tight leading-tight">
            Professional Profile
          </h1>
          <p className="mt-1 text-sm text-muted">What homeowners see on your listing.</p>
        </div>

        <Button
          type="button"
          onClick={handleSaveAll}
          className="shadow-xs text-sm font-semibold px-5 shrink-0"
        >
          Save Changes
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "overview", label: "Profile Info", icon: User },
          { key: "hours", label: "Hours & Payments", icon: Clock },
          { key: "credentials", label: "Licenses & Verification", icon: ShieldCheck },
          { key: "portfolio", label: "Project Photos", icon: ImageIcon, count: formData.portfolio.length },
        ]}
      />

      {/* ============================================================ */}
      {/* TAB 1: PROFILE INFO                                          */}
      {/* ============================================================ */}
      {activeTab === "overview" && (
        <Card className="rounded-2xl border border-line/80 bg-white p-6 shadow-2xs space-y-5">
          <div>
            <h3 className="font-display text-base sm:text-[17px] font-bold text-title">Profile Information</h3>
            <p className="text-xs text-muted">Your name, contact, and where you work.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name">
              <TextField
                value={formData.contactName || formData.businessName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    contactName: e.target.value,
                    businessName: e.target.value,
                  })
                }
                placeholder="Luis Ortega"
                required
              />
            </Field>

            <Field label="Trade">
              <p className="flex min-h-[50px] items-center rounded-[10px] border border-line bg-smoke px-4 text-[16px] text-title">
                {formData.trade}
              </p>
            </Field>

            <Field label="Phone Number">
              <TextField
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(512) 555-0198"
              />
            </Field>

            <Field label="Street Address">
              <TextField
                value={formData.street}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                placeholder="2201 South Lamar Blvd"
              />
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <Field label="City">
                <TextField
                  value={formData.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Austin"
                />
              </Field>
              <Field label="State">
                <TextField
                  value={formData.state}
                  maxLength={2}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="TX"
                />
              </Field>
              <Field label="ZIP">
                <TextField
                  value={formData.zip}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, zip: e.target.value })
                  }
                  placeholder="78704"
                />
              </Field>
            </div>

            <Field label="Service Radius (Miles)">
              <TextField
                type="number"
                value={formData.radiusMiles}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, radiusMiles: Number(e.target.value) || 25 })
                }
                placeholder="25"
              />
            </Field>

            <Field label="Years of Experience">
              <TextField
                value={formData.yearsInBusiness}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, yearsInBusiness: e.target.value })
                }
                placeholder="10+ years"
              />
            </Field>

            <Field label="About" className="sm:col-span-2">
              <TextArea
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="min-h-[85px]"
                rows={3}
                placeholder="What you do and the area you cover."
              />
            </Field>
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB 3: OPERATING HOURS & DIRECT PAYMENTS                     */}
      {/* ============================================================ */}
      {activeTab === "hours" && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-line/80 bg-white p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-title">Business hours</h3>
              <p className="text-xs text-muted">
                Same hours every day, or customize each day. Closed days stay available to reopen.
              </p>
            </div>

            <Tabs
              size="sm"
              value={hoursMode}
              onChange={changeHoursMode}
              items={[
                { key: "all", label: "All days" },
                { key: "custom", label: "Customize" },
              ]}
            />

            <div className="rounded-xl border border-line divide-y divide-line/70">
              {(hoursMode === "all" ? WEEK_DAYS.slice(0, 1) : WEEK_DAYS).map((day) => {
                const hours = formData.businessHours[day.key];
                const isOpen = hours.status === "open";
                return (
                  <div key={day.key} className="px-3 py-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-title">
                        {hoursMode === "all" ? "Every day" : day.label}
                      </p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isOpen}
                        onClick={() =>
                          updateDayHours(day.key, {
                            ...hours,
                            status: isOpen ? "closed" : "open",
                          })
                        }
                        className="inline-flex items-center gap-2"
                      >
                        <span
                          className={cn(
                            "relative h-6 w-10 rounded-full transition-colors",
                            isOpen ? "bg-emerald-600" : "bg-slate-300",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                              isOpen && "translate-x-4",
                            )}
                          />
                        </span>
                        <span className={cn("text-xs font-semibold", isOpen ? "text-title" : "text-muted")}>
                          {isOpen ? "Open" : "Closed"}
                        </span>
                      </button>
                    </div>

                    {isOpen ? (
                      <div className="space-y-2">
                        {hours.slots.map((slot, index) => (
                          <div key={`${day.key}-${index}`} className="flex flex-wrap items-center gap-2">
                            <select
                              value={TIME_OPTIONS.includes(slot.open) ? slot.open : TIME_OPTIONS[0]}
                              onChange={(event) => updateSlot(day.key, index, "open", event.target.value)}
                              className="min-h-10 rounded-[10px] border border-line bg-white px-3 text-sm text-title outline-none focus:border-primary"
                            >
                              {TIME_OPTIONS.map((time) => (
                                <option key={`${day.key}-${index}-open-${time}`} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                            <span className="text-sm text-muted">to</span>
                            <select
                              value={
                                TIME_OPTIONS.includes(slot.close)
                                  ? slot.close
                                  : TIME_OPTIONS[TIME_OPTIONS.length - 1]
                              }
                              onChange={(event) => updateSlot(day.key, index, "close", event.target.value)}
                              className="min-h-10 rounded-[10px] border border-line bg-white px-3 text-sm text-title outline-none focus:border-primary"
                            >
                              {TIME_OPTIONS.map((time) => (
                                <option key={`${day.key}-${index}-close-${time}`} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                            {index > 0 ? (
                              <button
                                type="button"
                                onClick={() => removeSlot(day.key, index)}
                                className="text-xs font-semibold text-muted hover:text-title"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        ))}
                        {hours.slots.length < 2 ? (
                          <button
                            type="button"
                            onClick={() => addBreak(day.key)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add break
                          </button>
                        ) : (
                          <p className="text-[11px] text-muted">Closed between these hours.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Emergency Toggle */}
            <div className="pt-3 border-t border-line/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emergency}
                  onChange={(e) =>
                    setFormData({ ...formData, emergency: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
                <div>
                  <p className="text-sm font-semibold text-title">
                    24/7 Emergency Dispatch Available
                  </p>
                  <p className="text-xs text-muted">
                    Show an emergency badge to receive high-urgency water leak or electrical requests.
                  </p>
                </div>
              </label>
            </div>
          </Card>

          <Card className="rounded-2xl border border-line/80 bg-white p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-title">Accepted payments</h3>
              <p className="text-xs text-muted">What homeowners can pay you with.</p>
            </div>

            <div className="grid gap-1 sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => {
                const selected = formData.acceptedPayments.includes(method);
                return (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePayment(method)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-sm text-title">{method}</span>
                  </label>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: LICENSES & VERIFICATION                               */}
      {/* ============================================================ */}
      {activeTab === "credentials" && (
        <div className="space-y-4">
          <Card className="space-y-4 rounded-2xl border border-line/80 bg-white p-6 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold text-title">Trade license</h3>
                <p className="text-xs text-muted">Number on the certificate. Attach the same file.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="License number">
                <TextField
                  value={formData.licenseNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, licenseNumber: e.target.value })
                  }
                  placeholder="TX-M-42981"
                />
              </Field>
              <Field label="State">
                <TextField
                  value={formData.licenseState}
                  maxLength={2}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, licenseState: e.target.value.toUpperCase() })
                  }
                  placeholder="TX"
                />
              </Field>
            </div>
            <CredentialAttachment
              label="Certificate"
              file={formData.licenseDoc}
              error={docErrors.license}
              onUpload={(file) => handleCredentialUpload("license", file)}
            />
          </Card>

          <Card className="space-y-4 rounded-2xl border border-line/80 bg-white p-6 shadow-2xs">
            <div>
              <h3 className="font-display text-base font-bold text-title">Liability insurance</h3>
              <p className="text-xs text-muted">Current COI. Replace before it expires.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Carrier">
                <TextField
                  value={formData.insuranceCarrier}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, insuranceCarrier: e.target.value })
                  }
                  placeholder="Next Insurance"
                />
              </Field>
              <Field label="Coverage">
                <NativeSelect
                  value={formData.insuranceCoverage}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, insuranceCoverage: e.target.value })
                  }
                >
                  <option value="$500,000">$500,000</option>
                  <option value="$1,000,000">$1,000,000</option>
                  <option value="$2,000,000">$2,000,000</option>
                </NativeSelect>
              </Field>
              <Field label="Expires">
                <TextField
                  type="month"
                  value={formData.insuranceExpires}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, insuranceExpires: e.target.value })
                  }
                />
              </Field>
            </div>
            <CredentialAttachment
              label="Certificate of insurance"
              file={formData.insuranceDoc}
              error={docErrors.insurance}
              onUpload={(file) => handleCredentialUpload("insurance", file)}
            />
          </Card>

          <Card className="flex items-center justify-between gap-3 rounded-2xl border border-line/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-title">Background check</p>
                <p className="text-xs text-muted">Done at signup. No file to attach.</p>
              </div>
            </div>
            <Link href="/pro/application" className="text-xs font-semibold text-primary hover:underline">
              Verified
            </Link>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: PORTFOLIO PHOTOS                                      */}
      {/* ============================================================ */}
      {activeTab === "portfolio" && (
        <Card className="rounded-2xl border border-line/80 bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base sm:text-[17px] font-bold text-title">
                Project Photos ({formData.portfolio.length})
              </h3>
              <p className="text-xs text-muted">
                Completed project photos displayed on your public storefront portfolio.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setPhotoPreview("");
                setNewPhoto({ title: "", image: "" });
                setShowAddPhoto(true);
              }}
              className="text-xs font-semibold"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload Photo
            </Button>
          </div>

          {/* Upload Photo Modal */}
          {showAddPhoto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-line space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-title">
                      Upload Project Photo
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Showcase past jobs to build trust with prospective clients.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddPhoto(false)}
                    className="p-1.5 rounded-lg text-muted hover:text-title hover:bg-smoke transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* File Dropzone / Preview */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-title block">
                    Project Image
                  </label>
                  {photoPreview ? (
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-line bg-smoke group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <label
                        htmlFor="photo-file-input"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-medium gap-1.5"
                      >
                        <Upload className="h-4 w-4" /> Change Photo
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="photo-file-input"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line/80 hover:border-primary/60 bg-smoke/40 hover:bg-smoke/70 p-6 cursor-pointer transition text-center"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                        <Upload className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-title">
                        Click to browse or drop an image
                      </span>
                      <span className="text-[11px] text-muted mt-0.5">
                        PNG, JPG, or WEBP up to 5MB
                      </span>
                    </label>
                  )}
                  <input
                    id="photo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />

                  {/* Sample presets if testing locally */}
                  <div className="pt-1">
                    <span className="text-[11px] text-muted block mb-1.5">
                      Or select sample project image:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        {
                          name: "Plumbing Installation",
                          url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
                        },
                        {
                          name: "Kitchen Tile & Backsplash",
                          url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
                        },
                        {
                          name: "HVAC & Thermostat Setup",
                          url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setPhotoPreview(preset.url);
                            setNewPhoto((prev) => ({
                              ...prev,
                              image: preset.url,
                              title: prev.title || preset.name,
                            }));
                          }}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-line bg-smoke/50 hover:bg-smoke hover:border-primary/40 text-body transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Field label="Project Caption / Description">
                  <TextField
                    value={newPhoto.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewPhoto({ ...newPhoto, title: e.target.value })
                    }
                    placeholder="e.g. Tankless water heater installation"
                  />
                </Field>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddPhoto(false);
                      setPhotoPreview("");
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!photoPreview && !newPhoto.image}
                    onClick={handleAddPhoto}
                    className="text-xs font-semibold px-4"
                  >
                    Upload Photo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Photos Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {formData.portfolio.map((item, idx) => (
              <div
                key={idx}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-smoke border border-line shadow-2xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3 text-white">
                  <span className="text-xs font-medium truncate pr-2">{item.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="p-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white shrink-0 transition"
                    title="Remove Photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
