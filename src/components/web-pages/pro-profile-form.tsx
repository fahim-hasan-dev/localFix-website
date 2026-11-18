"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  Image as ImageIcon,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Field, NativeSelect, TextArea, TextField } from "@/components/ui/field";
import { updateUser } from "@/redux/slices/authSlice";
import {
  updateProProfile,
  type ProPortfolioItem,
} from "@/redux/slices/featuresSlice";
import { useUrlTab } from "@/hooks/use-url-tab";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/cn";
import {
  useDeleteProjectPhotoMutation,
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useUpdateProjectPhotoMutation,
  useUploadProjectPhotoMutation,
} from "@/services/client/users-api";
import { useGetCategoriesQuery } from "@/services/client/catalog-api";
import { apiErrorMessage } from "@/services/client/form-data";
import { num, refId, str, unwrapRecord } from "@/lib/api-profile";
import type { ApiProjectPhoto } from "@/lib/api-mappers";
import { mediaUrl } from "@/utils/mediaUrl";
import {
  TIME_OPTIONS,
  WEEK_DAYS,
  allDaysMatch,
  applyHoursToDays,
  hoursPayload,
  normalizeWeeklyHours,
  weeklyHoursFromApi,
  type DaySchedule,
  type Weekday,
} from "@/lib/business-hours";
import { CredentialAttachment } from "@/components/shared/credential-attachment";
import {
  type CredentialFile,
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
  const next: string[] = [];
  raw.forEach((value) => {
    const mapped = PAYMENT_ALIASES[value] ?? value;
    if (mapped && !next.includes(mapped)) next.push(mapped);
  });
  return next;
}

function toMonthValue(value: string) {
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const COVERAGE_OPTIONS = ["$500,000", "$1,000,000", "$2,000,000"];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Builds a credential record from a certificate URL returned by the API (no invented metadata). */
function apiCredentialFile(url: string, status: CredentialFile["status"]): CredentialFile {
  const clean = url.split("?")[0].split("#")[0];
  const last = clean.split("/").filter(Boolean).pop() ?? "Certificate";
  let name = last;
  try {
    name = decodeURIComponent(last);
  } catch {
    /* keep raw name */
  }
  return {
    name,
    sizeLabel: "",
    kind: /\.pdf$/i.test(clean) ? "pdf" : "image",
    uploadedAt: "",
    status,
    previewUrl: url,
  };
}

export function ProProfileForm() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const proProfile = useAppSelector((state) => state.features.proProfile);

  const { data: profileResponse, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } =
    useGetMyProfileQuery();
  const { data: categoryResponse } = useGetCategoriesQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [uploadProjectPhoto, { isLoading: uploadingPhoto }] = useUploadProjectPhotoMutation();
  const [updateProjectPhoto, { isLoading: updatingPhoto }] = useUpdateProjectPhotoMutation();
  const [deleteProjectPhoto] = useDeleteProjectPhotoMutation();
  const profile = unwrapRecord(profileResponse?.data);
  const categories = categoryResponse?.data ?? [];
  const apiPhotos = Array.isArray(profile?.projectPhotos)
    ? (profile.projectPhotos as ApiProjectPhoto[])
    : null;

  const [activeTab, setActiveTab] = useUrlTab(
    ["overview", "hours", "credentials", "portfolio"] as const,
    "overview",
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    ...proProfile,
    businessHours: normalizeWeeklyHours(proProfile.businessHours),
    licenseDoc: (proProfile.licenseDoc?.name ? proProfile.licenseDoc : null) as CredentialFile | null,
    insuranceDoc: (proProfile.insuranceDoc?.name ? proProfile.insuranceDoc : null) as CredentialFile | null,
    insuranceExpires: proProfile.insuranceExpires || "",
    insuranceCoverage: ["$500,000", "$1,000,000", "$2,000,000"].includes(proProfile.insuranceCoverage)
      ? proProfile.insuranceCoverage
      : "",
    acceptedPayments: normalizeAcceptedPayments(proProfile.acceptedPayments),
  });
  const [docErrors, setDocErrors] = useState<{ license?: string; insurance?: string; id?: string }>({});
  const [hoursMode, setHoursMode] = useState<"all" | "custom">(() =>
    allDaysMatch(normalizeWeeklyHours(proProfile.businessHours)) ? "all" : "custom",
  );

  // Avatar / Profile Headshot state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    formData.avatar || user?.avatar || "",
  );
  const [avatarError, setAvatarError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [syncedFrom, setSyncedFrom] = useState<string | null>(null);
  // True once the form has been populated from the live API profile; until then the static seed must not render.
  const hydratedFromApi = syncedFrom !== null;

  // Hydrate the form once from the live profile (render-time sync, runs once per profile id).
  const profileId = profile ? str(profile._id) || "profile" : null;
  if (profile && profileId && syncedFrom !== profileId) {
    setSyncedFrom(profileId);
    const liveCategory = profile.category;
    const liveCategoryName =
      liveCategory && typeof liveCategory === "object" ? str((liveCategory as { name?: unknown }).name) : "";
    const rawCoverage = profile.insuranceCoverage;
    const coverage =
      typeof rawCoverage === "number" ? `$${rawCoverage.toLocaleString("en-US")}` : str(rawCoverage);
    const image = mediaUrl(str(profile.profileImage));
    const hours = weeklyHoursFromApi(profile.businessHours) ?? normalizeWeeklyHours(null);
    const hoursRecord = asRecord(profile.businessHours);
    const paymentValues = Array.isArray(profile.acceptedPayments)
      ? profile.acceptedPayments.map((item) => str(item)).filter(Boolean)
      : [];
    setCategoryId(refId(liveCategory));
    setAvatarPreview(image || user?.avatar || "");
    setHoursMode(hoursRecord?.mode === "customize" || !allDaysMatch(hours) ? "custom" : "all");
    const tradeLicense = asRecord(profile.tradeLicense);
    const liabilityInsurance = asRecord(profile.liabilityInsurance ?? profile.insurance);
    const licenseCert = mediaUrl(
      str(tradeLicense?.certificateUrl) || str(profile.tradeLicenseCertificate),
    );
    const insuranceCert = mediaUrl(
      str(liabilityInsurance?.certificateUrl) || str(profile.coiCertificate ?? profile.insuranceCertificate),
    );
    // API wins: every API-backed field is overwritten (no static seed fallbacks), so a pro who logs in
    // after a different pro never sees the seeded demo profile.
    setFormData((prev) => ({
      ...prev,
      contactName: str(profile.name),
      businessName: str(profile.companyName),
      email: str(profile.email),
      phone: str(profile.phone),
      street: str(profile.streetAddress),
      city: str(profile.city),
      state: str(profile.state),
      zip: str(profile.zipCode),
      radiusMiles: num(profile.serviceRadiusInMiles, 0),
      yearsInBusiness: str(profile.yearsOfExperience),
      bio: str(profile.about),
      trade: liveCategoryName,
      licenseNumber: str(tradeLicense?.licenseNumber) || str(profile.licenseNumber),
      licenseState: str(tradeLicense?.licenseState ?? tradeLicense?.state) || str(profile.licenseState),
      insuranceCarrier:
        str(liabilityInsurance?.insuranceCarrier ?? liabilityInsurance?.carrier) || str(profile.insuranceCarrier),
      insuranceCoverage: coverage,
      insuranceExpires: toMonthValue(
        str(liabilityInsurance?.expires ?? liabilityInsurance?.expiresAt) || str(profile.insuranceExpires),
      ),
      licenseDoc: licenseCert
        ? apiCredentialFile(licenseCert, tradeLicense?.isVerified ? "verified" : "review")
        : null,
      insuranceDoc: insuranceCert
        ? apiCredentialFile(insuranceCert, liabilityInsurance?.isVerified ? "verified" : "review")
        : null,
      avatar: image,
      businessHours: hours,
      emergency: Boolean(hoursRecord?.emergencyDispatchAvailable),
      acceptedPayments: normalizeAcceptedPayments(paymentValues),
    }));
  }
  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("File size must be under 5 MB.");
      return;
    }
    setAvatarError("");
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }


  // Modal "Add / Edit Photo" state
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [photoForm, setPhotoForm] = useState({
    title: "",
    category: "",
    image: "",
    description: "",
  });
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Live project photos from the API (fall back to local portfolio until the profile loads).
  const portfolio: ProPortfolioItem[] = apiPhotos
    ? apiPhotos.map((photo, index) => {
        const categoryName =
          photo.category && typeof photo.category === "object"
            ? photo.category.name || ""
            : categories.find((c) => c._id === photo.category)?.name || "";
        return {
          id: photo._id || `photo-${index}`,
          title: photo.title || categoryName || "Project",
          category: categoryName,
          image: mediaUrl(photo.image),
          description: photo.title || categoryName,
        };
      })
    : formData.portfolio;

  if (!user) return null;

  if (!hydratedFromApi) {
    return profileError ? (
      <Card className="rounded-2xl border border-line/80 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-title">We couldn&apos;t load your profile</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 rounded-full border border-line"
          onClick={() => refetchProfile()}
        >
          Try again
        </Button>
      </Card>
    ) : (
      <Card className="rounded-2xl border border-line/80 bg-white p-8 text-center">
        <p className="text-sm text-muted">{profileLoading ? "Loading your profile…" : "Loading…"}</p>
      </Card>
    );
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleSaveAll() {
    const proName = formData.contactName || formData.businessName || user?.name || "";

    let res;
    try {
      res = await updateProfile({
        data: {
          name: proName,
          phone: formData.phone,
          streetAddress: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip,
          companyName: formData.businessName || proName,
          ...(categoryId ? { category: categoryId } : {}),
          about: formData.bio,
          serviceRadiusInMiles: formData.radiusMiles,
          yearsOfExperience: formData.yearsInBusiness,
          licenseNumber: formData.licenseNumber,
          licenseState: formData.licenseState,
          insuranceCarrier: formData.insuranceCarrier,
          insuranceCoverage: formData.insuranceCoverage,
          insuranceExpires: formData.insuranceExpires,
          acceptedPayments: formData.acceptedPayments,
          businessHours: hoursPayload(formData.businessHours, hoursMode, formData.emergency),
          emergencyDispatchAvailable: formData.emergency,
        },
        profileImage: avatarFile,
        tradeLicenseCertificate: licenseFile,
        coiCertificate: insuranceFile,
      }).unwrap();
    } catch (err) {
      showToast(apiErrorMessage(err, "Could not save your profile. Please try again."));
      return;
    }
    setAvatarFile(null);
    setLicenseFile(null);
    setInsuranceFile(null);
    const savedImage = mediaUrl(str(unwrapRecord(res?.data)?.profileImage));
    const proAvatar = savedImage || avatarPreview || formData.avatar || "";

    dispatch(
      updateProProfile({
        ...formData,
        contactName: proName,
        businessName: formData.businessName || proName,
        avatar: proAvatar,
        email: formData.email || user?.email || "",
        startingPrice: formData.startingPrice,
      }),
    );
    dispatch(
      updateUser({
        name: proName,
        email: formData.email || user?.email || "",
        avatar: proAvatar,
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

  function handleCredentialUpload(kind: "license" | "insurance" | "id", file: File) {
    const message = validateCredentialFile(file);
    setDocErrors((prev) => ({ ...prev, [kind]: message ?? undefined }));
    if (message) return;

    if (kind === "license") setLicenseFile(file);
    else if (kind === "insurance") setInsuranceFile(file);

    const next = fileFromUpload(file);
    setFormData((prev) => {
      const key = kind === "license" ? "licenseDoc" : kind === "insurance" ? "insuranceDoc" : "idDoc";
      const current = prev[key];
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return { ...prev, [key]: next };
    });
    showToast(
      kind === "license"
        ? "License file sent for review"
        : kind === "insurance"
          ? "Insurance file sent for review"
          : "Photo ID sent for review",
    );
  }


  // Photo helpers
  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setPhotoFile(file);
    if (!photoForm.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setPhotoForm((prev) => ({ ...prev, title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1) }));
    }
  }

  function handleOpenAddPhoto() {
    setEditingPhotoIndex(null);
    setPhotoForm({
      title: "",
      category: categoryId,
      image: "",
      description: "",
    });
    setPhotoPreview("");
    setPhotoFile(null);
    setShowPhotoModal(true);
  }

  function handleOpenEditPhoto(idx: number) {
    const item = portfolio[idx];
    if (!item) return;
    setEditingPhotoIndex(idx);
    setPhotoForm({
      title: item.title,
      category: apiPhotos ? refId(apiPhotos[idx]?.category) : item.category || "",
      image: item.image,
      description: item.description || "",
    });
    setPhotoPreview(item.image);
    setPhotoFile(null);
    setShowPhotoModal(true);
  }

  async function handleSavePhoto() {
    const title = photoForm.title.trim() || "Completed project";
    const category = photoForm.category || categoryId;
    const editing = editingPhotoIndex !== null && editingPhotoIndex >= 0;
    const photoId = editing ? apiPhotos?.[editingPhotoIndex as number]?._id : undefined;

    try {
      if (editing && photoId) {
        await updateProjectPhoto({ photoId, title, category, image: photoFile }).unwrap();
        showToast("Project photo updated!");
      } else {
        if (!photoFile) {
          showToast("Choose an image to upload.");
          return;
        }
        await uploadProjectPhoto({ title, category, image: photoFile }).unwrap();
        showToast("Photo uploaded to portfolio!");
      }
    } catch (err) {
      showToast(apiErrorMessage(err, "Could not save the project photo. Please try again."));
      return;
    }

    setShowPhotoModal(false);
    setPhotoPreview("");
    setPhotoFile(null);
  }

  async function handleRemovePhoto(index: number) {
    const photoId = apiPhotos?.[index]?._id;
    if (!photoId) return;
    try {
      await deleteProjectPhoto(photoId).unwrap();
      showToast("Photo removed from portfolio.");
    } catch (err) {
      showToast(apiErrorMessage(err, "Could not remove the photo. Please try again."));
    }
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
          disabled={saving}
          className="shadow-xs text-sm font-semibold px-5 shrink-0"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "overview", label: "Profile Info", icon: User },
          { key: "hours", label: "Hours & Payments", icon: Clock },
          { key: "credentials", label: "Licenses & Verification", icon: ShieldCheck },
          { key: "portfolio", label: "Project Photos", icon: ImageIcon },
        ]}
      />

      {/* ============================================================ */}
      {/* TAB 1: PROFILE INFO                                          */}
      {/* ============================================================ */}
      {activeTab === "overview" && (
        <Card className="rounded-2xl border border-line/80 bg-white p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="font-display text-base sm:text-[17px] font-bold text-title">Profile Information</h3>
          </div>

          {/* Profile Photo Section (No duplicate button) */}
          <div className="flex items-center gap-4 pb-5 border-b border-line/60">
            <div
              className="relative group shrink-0 cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
              title="Click camera to change photo"
            >
              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full overflow-hidden border-2 border-line/80 shadow-xs bg-white group-hover:border-primary/50 transition">
                {avatarPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatarPreview} alt={formData.contactName || "Pro profile"} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-primary/10 text-primary font-bold text-lg font-display">
                    {(formData.contactName || user?.name || "Pro").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span
                className="absolute bottom-0 right-0 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-primary text-white shadow-md group-hover:bg-primary-hover transition ring-2 ring-white"
                aria-label="Change profile photo"
              >
                <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </span>
            </div>

            <div className="space-y-0.5">
              <h4 className="font-display text-sm font-semibold text-title">Profile Picture</h4>
              <p className="text-xs text-muted">JPG, PNG, or WebP · Up to 5 MB</p>
              {avatarError ? <p className="text-xs font-medium text-error mt-0.5">{avatarError}</p> : null}
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name">
              <TextField
                value={formData.contactName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                placeholder="Your full name"
                required
              />
            </Field>

            <Field label="Business Name">
              <TextField
                value={formData.businessName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                placeholder="Your business name"
              />
            </Field>

            <Field label="Email Address" hint="Email cannot be changed.">
              <TextField
                type="email"
                value={formData.email || user?.email || ""}
                disabled
                placeholder="you@email.com"
              />
            </Field>

            <Field label="Trade">
              {categories.length > 0 ? (
                <NativeSelect
                  value={categoryId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const next = categories.find((c) => c._id === e.target.value);
                    setCategoryId(e.target.value);
                    setFormData({ ...formData, trade: next?.name || formData.trade });
                  }}
                >
                  <option value="">Select a trade</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              ) : (
                <p className="flex min-h-[50px] items-center rounded-[10px] border border-line bg-smoke px-4 text-[16px] text-title">
                  {formData.trade}
                </p>
              )}
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
                  <option value="">Select coverage</option>
                  {(COVERAGE_OPTIONS.includes(formData.insuranceCoverage) || !formData.insuranceCoverage
                    ? COVERAGE_OPTIONS
                    : [formData.insuranceCoverage, ...COVERAGE_OPTIONS]
                  ).map((amount) => (
                    <option key={amount} value={amount}>
                      {amount}
                    </option>
                  ))}
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
                <p className="text-xs text-muted">Processed confidentially via Checkr. No PII stored on Local Fix.</p>
              </div>
            </div>
            <Link href="/pro/application" className="text-xs font-semibold text-primary hover:underline">
              Check Status
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
                Project Photos
              </h3>
              <p className="text-xs text-muted">
                Completed project photos displayed on your public storefront portfolio.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleOpenAddPhoto}
              className="text-xs font-semibold"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload Photo
            </Button>
          </div>

          {/* Upload / Edit Photo Modal */}
          {showPhotoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-title">
                      {editingPhotoIndex !== null ? "Edit Project Photo" : "Upload Project Photo"}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {editingPhotoIndex !== null
                        ? "Update title, category, or photo for this project."
                        : "Showcase completed work to build homeowner trust."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(false)}
                    className="p-1.5 rounded-lg text-muted hover:text-title hover:bg-smoke transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* File Dropzone / Preview */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-title block">
                    Project Image
                  </label>
                  {photoPreview ? (
                    <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-line bg-smoke group">
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
                </div>

                <div className="space-y-3 pt-1">
                  <Field label="Project Title">
                    <TextField
                      value={photoForm.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPhotoForm({ ...photoForm, title: e.target.value })
                      }
                      placeholder="e.g. Tankless water heater installation"
                    />
                  </Field>

                  <Field label="Category">
                    <NativeSelect
                      value={photoForm.category}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setPhotoForm({ ...photoForm, category: e.target.value })
                      }
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPhotoModal(false);
                      setPhotoPreview("");
                      setPhotoFile(null);
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      (!photoPreview && !photoForm.image) ||
                      !photoForm.title.trim() ||
                      uploadingPhoto ||
                      updatingPhoto
                    }
                    onClick={handleSavePhoto}
                    className="text-xs font-semibold px-4"
                  >
                    {uploadingPhoto || updatingPhoto
                      ? "Saving..."
                      : editingPhotoIndex !== null
                        ? "Save Changes"
                        : "Upload Photo"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Photos Grid */}
          {portfolio.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line/80 p-8 text-center bg-smoke/30">
              <ImageIcon className="mx-auto h-8 w-8 text-muted mb-2" />
              <p className="text-sm font-semibold text-title">No project photos yet</p>
              <p className="text-xs text-muted mt-0.5">Upload photos of past work to showcase your craftsmanship.</p>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddPhoto}
                className="mt-3 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add First Photo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {portfolio.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-smoke border border-line shadow-2xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {/* Top Bar with Category Badge and Action Buttons */}
                  <div className="absolute inset-x-0 top-0 p-2.5 flex items-start justify-between gap-2 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
                    {item.category ? (
                      <span className="rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white">
                        {item.category}
                      </span>
                    ) : <span />}
                    <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPhoto(idx)}
                        className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white transition cursor-pointer"
                        title="Edit Photo"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition cursor-pointer"
                        title="Remove Photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Caption Overlay (Only Title & Category) */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-6 text-white">
                    <p className="text-xs font-semibold truncate leading-tight drop-shadow-xs">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

    </div>
  );
}
