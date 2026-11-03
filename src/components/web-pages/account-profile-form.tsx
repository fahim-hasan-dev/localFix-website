"use client";

import { useRef, useState } from "react";
import { Camera, Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextField } from "@/components/ui/field";
import { UserAvatar } from "@/components/shared/user-avatar";
import { updateUser } from "@/redux/slices/authSlice";
import { updateAddress } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export function AccountProfileForm() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const fileInput = useRef<HTMLInputElement>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const avatar = customAvatar ?? user?.avatar ?? "";
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState("");

  if (!user) return null;
  const current = user;

  function onPhotoPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Use a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Keep the photo under 5 MB.");
      return;
    }
    setPhotoError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCustomAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const street = String(data.get("street") ?? current.street ?? "").trim();
    const city = String(data.get("city") ?? current.city ?? "").trim();
    const state = String(data.get("state") ?? current.state ?? "").trim();
    const zip = String(data.get("zip") ?? current.zip ?? "").trim();

    dispatch(
      updateUser({
        name: String(data.get("name") ?? current.name).trim(),
        phone: String(data.get("phone") ?? "").trim(),
        avatar: avatar || current.avatar,
        street,
        city,
        state,
        zip,
      }),
    );

    // Keep features address in sync for any components referencing it
    dispatch(
      updateAddress({
        id: "addr-1",
        label: "Home",
        street: street || "418 West 5th Street",
        city: city || "Austin",
        state: state || "TX",
        zip: zip || "78701",
      }),
    );

    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-title tracking-tight">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Your personal photo, contact details, and primary service address.
        </p>
      </div>

      <Card className="rounded-[16px] border border-line/80 bg-white p-4 sm:p-6 shadow-xs hover:shadow-xs">
        <div className="mb-5 border-b border-line/60 pb-3">
          <h2 className="font-display text-base font-semibold text-title">Personal information</h2>
        </div>

        <form id="profile-form" className="space-y-6" onSubmit={submitProfile}>
          {/* Avatar and Photo Upload */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 sm:p-5 rounded-2xl border border-line/70 bg-smoke/40">
            <div className="relative group shrink-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm bg-white">
                {avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatar} alt={current.name} className="h-full w-full object-cover" />
                ) : (
                  <UserAvatar user={{ name: current.name, avatar: "" }} size="lg" className="h-full w-full text-xl" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-white shadow-md hover:bg-primary-hover transition ring-2 ring-white cursor-pointer"
                title="Change profile photo"
                aria-label="Change profile photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h3 className="font-display text-sm sm:text-base font-bold text-title">Profile Picture</h3>
              <p className="text-xs text-muted max-w-md leading-relaxed">
                Add a recognizable headshot so local service pros and technicians know who they are working with.
              </p>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onPhotoPick}
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-full text-xs font-semibold"
                >
                  <Camera className="h-3.5 w-3.5 mr-1" />
                  Choose New Photo
                </Button>
                {avatar && avatar !== current.avatar ? (
                  <button
                    type="button"
                    onClick={() => setCustomAvatar(null)}
                    className="text-xs font-medium text-stone-500 hover:text-red-600 transition px-2 py-1"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-muted">JPG, PNG, or WebP · Up to 5 MB</p>
              {photoError ? <p className="text-xs font-medium text-error">{photoError}</p> : null}
            </div>
          </div>

          {/* Form Fields Grid: Contact Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2">
              <TextField
                name="name"
                defaultValue={current.name}
                required
                autoComplete="name"
                placeholder="e.g. Maya Chen"
              />
            </Field>

            <Field label="Email address">
              <div className="relative">
                <TextField
                  type="email"
                  defaultValue={current.email}
                  disabled
                  autoComplete="email"
                  className="bg-smoke/60 text-muted cursor-not-allowed pr-24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  <Check className="h-3 w-3" />
                  Verified
                </span>
              </div>
            </Field>

            <Field label="Phone number">
              <TextField
                name="phone"
                type="tel"
                defaultValue={current.phone}
                placeholder="(512) 555-0142"
                autoComplete="tel"
              />
            </Field>
          </div>

          {/* Single Service Address Section (One clean location for all requests) */}
          <div className="pt-5 border-t border-line/60">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold text-title">Service Address</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Street address" className="sm:col-span-2">
                <TextField
                  name="street"
                  defaultValue={current.street || "418 West 5th Street"}
                  autoComplete="street-address"
                  placeholder="e.g. 418 West 5th Street"
                  required
                />
              </Field>

              <Field label="City">
                <TextField
                  name="city"
                  defaultValue={current.city || "Austin"}
                  autoComplete="address-level2"
                  placeholder="e.g. Austin"
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="State">
                  <TextField
                    name="state"
                    defaultValue={current.state || "TX"}
                    autoComplete="address-level1"
                    placeholder="TX"
                    required
                  />
                </Field>
                <Field label="ZIP Code">
                  <TextField
                    name="zip"
                    defaultValue={current.zip || "78701"}
                    autoComplete="postal-code"
                    placeholder="78701"
                    required
                  />
                </Field>
              </div>
            </div>
          </div>
        </form>

        {/* Bottom Save Action Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
          <Button type="submit" form="profile-form" size="sm" className="rounded-full">
            Save personal details
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success animate-in fade-in">
              <Check className="h-4 w-4" />
              Profile changes saved.
            </span>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
