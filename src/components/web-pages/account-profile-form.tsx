"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Camera, Check, Loader2, Mail, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextField } from "@/components/ui/field";
import { UserAvatar } from "@/components/shared/user-avatar";
import { updateUser } from "@/redux/slices/authSlice";
import { updateAddress } from "@/redux/slices/featuresSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const OTP_LEN = 6;

export function AccountProfileForm() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const fileInput = useRef<HTMLInputElement>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const avatar = customAvatar ?? user?.avatar ?? "";
  const [saved, setSaved] = useState(false);
  const [savedMsg, setSavedMsg] = useState("Profile changes saved.");
  const [photoError, setPhotoError] = useState("");

  // Email Change with OTP state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState<"email" | "otp">("email");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (showEmailModal && emailStep === "otp") {
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    }
  }, [showEmailModal, emailStep]);

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

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setOtpError("Enter a valid email address.");
      return;
    }
    if (trimmed === (user?.email || "").toLowerCase()) {
      setOtpError("New email must be different from your current email.");
      return;
    }
    setOtpBusy(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setOtpError(data?.error || "Failed to send code. Try again.");
        return;
      }
      setEmailStep("otp");
      setOtp(Array(OTP_LEN).fill(""));
      setResendTimer(60);
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LEN) {
      setOtpError("Enter all 6 digits of the verification code.");
      return;
    }
    setOtpBusy(true);
    setOtpError("");
    const trimmed = newEmail.trim().toLowerCase();
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, code }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setOtpError(data?.error || "Incorrect or expired verification code.");
        return;
      }

      // Successfully verified new email
      dispatch(updateUser({ email: trimmed }));
      setShowEmailModal(false);
      setEmailStep("email");
      setNewEmail("");
      setOtp(Array(OTP_LEN).fill(""));
      setSavedMsg(`Email successfully updated to ${trimmed}!`);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  function onOtpChange(index: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError("");
    if (digit && index < OTP_LEN - 1) {
      otpInputs.current[index + 1]?.focus();
    }
  }

  function onOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  }

  function onOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;
    const next = Array(OTP_LEN).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    setOtpError("");
    otpInputs.current[Math.min(pasted.length, OTP_LEN) - 1]?.focus();
  }

  function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? current.name).trim();
    const phone = String(data.get("phone") ?? "").trim();
    const street = String(data.get("street") ?? current.street ?? "").trim();
    const city = String(data.get("city") ?? current.city ?? "").trim();
    const state = String(data.get("state") ?? current.state ?? "").trim();
    const zip = String(data.get("zip") ?? current.zip ?? "").trim();

    dispatch(
      updateUser({
        name: name || current.name,
        phone,
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

    setSavedMsg("Profile changes saved.");
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
          {/* Avatar and Photo Upload (No duplicate button) */}
          <div className="flex items-center gap-4 pb-5 border-b border-line/60">
            <div
              className="relative group shrink-0 cursor-pointer"
              onClick={() => fileInput.current?.click()}
              title="Click camera to change photo"
            >
              <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full overflow-hidden border-2 border-line/80 shadow-xs bg-white group-hover:border-primary/50 transition">
                {avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatar} alt={current.name} className="h-full w-full object-cover" />
                ) : (
                  <UserAvatar user={{ name: current.name, avatar: "" }} size="lg" className="h-full w-full text-xl" />
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-primary text-white shadow-md group-hover:bg-primary-hover transition ring-2 ring-white cursor-pointer"
                title="Change profile photo"
                aria-label="Change profile photo"
              >
                <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-display text-sm font-semibold text-title">Profile Picture</h3>
              <p className="text-xs text-muted">Click camera to change photo · JPG, PNG, or WebP (max 5 MB)</p>
              {photoError ? <p className="text-xs font-medium text-error mt-0.5">{photoError}</p> : null}
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onPhotoPick}
            />
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
              <div className="relative flex items-center">
                <TextField
                  type="email"
                  value={current.email}
                  readOnly
                  className="bg-smoke/40 text-title font-medium pr-28 cursor-default"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                    <Check className="h-3 w-3" />
                    Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(true);
                      setEmailStep("email");
                      setNewEmail("");
                      setOtp(Array(OTP_LEN).fill(""));
                      setOtpError("");
                    }}
                    className="rounded-lg px-2 py-0.5 text-xs font-semibold text-primary hover:bg-primary/10 transition cursor-pointer"
                  >
                    Change
                  </button>
                </div>
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
              {savedMsg}
            </span>
          ) : null}
        </div>
      </Card>

      {/* Change Email with OTP Modal */}
      {showEmailModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-line/80 bg-white p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-title">
                    {emailStep === "email" ? "Change Email Address" : "Verify New Email"}
                  </h3>
                  <p className="text-xs text-muted">
                    {emailStep === "email"
                      ? "A 6-digit OTP will be sent to verify your new email"
                      : `Enter the code sent to ${newEmail}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-smoke hover:text-title transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {otpError ? (
              <div className="rounded-xl border border-error/20 bg-error/5 p-3 text-xs text-error flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            ) : null}

            {emailStep === "email" ? (
              /* Step 1: Input New Email */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="rounded-xl bg-smoke/60 p-3 text-xs text-muted border border-line/60">
                  <span className="font-medium text-title">Current email:</span> {current.email}
                </div>

                <Field label="New email address">
                  <TextField
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setOtpError("");
                    }}
                    placeholder="Enter new email address..."
                    required
                    autoFocus
                  />
                </Field>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmailModal(false)}
                    className="rounded-full text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={otpBusy || !newEmail.trim()}
                    className="rounded-full text-xs font-semibold gap-1.5"
                  >
                    {otpBusy ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      "Send OTP Code"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* Step 2: Enter 6-digit OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-xl bg-primary/5 p-3 text-xs text-title border border-primary/20 space-y-1">
                  <p className="font-semibold text-primary">Verification code sent!</p>
                  <p className="text-muted">
                    We emailed a 6-digit code to <span className="font-semibold text-title">{newEmail}</span>.
                  </p>
                  <p className="text-[11px] text-muted/80">Demo code: 123456</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-title text-center">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => onOtpChange(index, e.target.value)}
                        onKeyDown={(e) => onOtpKeyDown(index, e)}
                        onPaste={onOtpPaste}
                        className="h-11 w-11 rounded-xl border border-line bg-smoke/40 text-center font-display text-lg font-bold text-title transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("email");
                      setOtpError("");
                    }}
                    className="flex items-center gap-1 text-muted hover:text-title font-medium transition cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Change email
                  </button>

                  {resendTimer > 0 ? (
                    <span className="text-muted text-[11px]">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      disabled={otpBusy}
                      onClick={() => handleSendOtp()}
                      className="text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmailModal(false)}
                    className="rounded-full text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={otpBusy || otp.join("").length < OTP_LEN}
                    className="rounded-full text-xs font-semibold gap-1.5"
                  >
                    {otpBusy ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Update Email"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
