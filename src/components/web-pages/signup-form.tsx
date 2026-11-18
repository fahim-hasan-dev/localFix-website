"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { GoogleIcon } from "@/components/ui/google-icon";
import { AuthLinks } from "@/components/web-pages/auth-links";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useSignupMutation } from "@/services/client/auth-api";
import { authToken } from "@/utils/authToken";
import { logout } from "@/redux/slices/authSlice";

export function SignupForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const search = useSearchParams();
  const nextPath = search.get("next");
  const needsAccountForRequest = Boolean(nextPath?.includes("/account/post-job"));
  const draft = useAppSelector((state) => state.intake.draft);

  const [signupApi, { isLoading: isSigningUp }] = useSignupMutation();

  const [role, setRole] = useState<"homeowner" | "pro">("homeowner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState(draft.zip || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "pro") router.push("/pro-register");
  }, [role, router]);

  async function submitDetails(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      toast.error("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      toast.error("Email is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      toast.error("Phone number is required.");
      return;
    }
    if (!zip.trim()) {
      setError("ZIP code is required.");
      toast.error("ZIP code is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    try {
      authToken.clearTokens();
      dispatch(logout());

      await signupApi({
        role: "home_owner",
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        zipCode: zip.trim(),
        password,
        confirmPassword: confirm,
        agreedToTerms: true,
      }).unwrap();

      authToken.clearTokens();
      dispatch(logout());

      toast.success("Account created successfully! Please check your email for the OTP code.");

      // Successfully registered — redirect directly to the OTP verification page
      const verifyUrl = `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&role=homeowner${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ""}`;
      router.push(verifyUrl);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; error?: string };
      const msg = apiErr?.data?.message || apiErr?.error || "Registration failed. Please check your details.";
      setError(msg);
      toast.error(msg);
    }
  }

  function handleGoogleSignUp() {
    setError("Google Sign-in is not configured on this server yet. Please use email registration.");
  }

  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        Step 1 of 2
      </span>
      <h1 className="mt-3 font-display text-[22px] sm:text-[26px] font-semibold leading-snug tracking-tight text-title">
        Create a free account
      </h1>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#757575]">
        {needsAccountForRequest
          ? "You need a homeowner account to create a request. Signup is free."
          : "Choose your role. Homeowners are free. Pros apply for review."}
      </p>

      <div
        role="tablist"
        aria-label="Account type"
        className="mt-6 grid grid-cols-2 rounded-full border border-line bg-smoke p-1"
      >
        {(
          [
            ["homeowner", "Homeowner"],
            ["pro", "Professional"],
          ] as const
        ).map(([value, label]) => {
          const active = role === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRole(value)}
              className={`min-h-[44px] rounded-full font-display text-sm font-bold transition-colors ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "bg-transparent text-title hover:text-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <form className="mt-7 space-y-5" onSubmit={submitDetails}>
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-[1.5fr_1fr]">
          <Field label="Full name">
            <TextField
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
            />
          </Field>
          <Field label="Home ZIP">
            <TextField
              required
              value={zip}
              onChange={(event) => setZip(event.target.value)}
              placeholder="78701"
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <Field label="Email">
            <TextField
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Mobile phone">
            <TextField
              required
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(512) 555-0100"
              autoComplete="tel"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <Field label="Password">
            <PasswordField
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password">
            <PasswordField
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <label className="flex items-start gap-2.5 pt-1 text-sm leading-6 text-copy">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded accent-primary" />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-primary hover:underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {error ? <p className="text-xs font-medium text-error">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={isSigningUp}>
          {isSigningUp ? "Submitting..." : "Continue to Verification ↗"}
        </Button>
      </form>

      {/* Or Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line/80" />
        </div>
        <span className="relative bg-white px-3 font-display text-xs font-medium uppercase tracking-wider text-muted">
          Or
        </span>
      </div>

      {/* Google Sign Up Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-white px-5 py-3 font-display text-sm font-semibold text-title shadow-2xs transition-all duration-200 hover:bg-smoke/70 hover:border-line hover:shadow-xs active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
      >
        <GoogleIcon className="h-4.5 w-4.5" />
        <span>Continue with Google ↗</span>
      </button>

      <AuthLinks
        prompt="Already have an account?"
        href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
        label="Sign in ↗"
      />
    </div>
  );
}
