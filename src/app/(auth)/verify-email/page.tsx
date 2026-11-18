"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import {
  useVerifyEmailMutation,
  useResendOtpMutation,
} from "@/services/client/auth-api";
import { authToken, normalizeRole } from "@/utils/authToken";
import { useAppDispatch } from "@/redux/hooks";
import { login, logout } from "@/redux/slices/authSlice";
import { setEmailVerified, setPhoneVerified } from "@/redux/slices/featuresSlice";

const OTP_LEN = 6;
const RESEND_COOLDOWN = 30;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const initialEmail = searchParams.get("email") || "";
  const roleParam = searchParams.get("role") || "homeowner";
  const nextPath = searchParams.get("next");

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const [verifyEmailApi, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendOtpApi, { isLoading: isResending }] = useResendOtpMutation();

  useEffect(() => {
    // Ensure tokens and session remain clean while on the verification step
    authToken.clearTokens();
    dispatch(logout());
    inputs.current[0]?.focus();
  }, [dispatch]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  function onOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < OTP_LEN - 1) inputs.current[index + 1]?.focus();
  }

  function onOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function onOtpPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;
    const next = Array(OTP_LEN).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    inputs.current[Math.min(pasted.length, OTP_LEN) - 1]?.focus();
  }

  async function submitOtp(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setError("Please enter your email address.");
      toast.error("Please enter your email address.");
      return;
    }

    const code = otp.join("");
    if (code.length < OTP_LEN) {
      setError("Please enter the complete 6-digit code.");
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    try {
      const verifyRes = await verifyEmailApi({
        email: targetEmail,
        oneTimeCode: Number(code),
      }).unwrap();

      dispatch(setEmailVerified(true));
      dispatch(setPhoneVerified(true));

      toast.success("Email verified successfully! Welcome to Local Fix.");

      const authData = verifyRes.data;
      const token = authData?.token || authData?.accessToken;
      const refreshToken = authData?.refreshToken;
      // Live API nests the user under `data`, not `user`.
      const backendUser = authData?.user || authData?.data;

      if (token) {
        const userRole = normalizeRole(backendUser?.role || roleParam);
        authToken.setTokens({
          accessToken: token,
          refreshToken,
          role: userRole,
        });

        if (backendUser) {
          dispatch(
            login({
              id: backendUser._id || backendUser.id || "",
              name: backendUser.name || (userRole === "pro" ? "Professional" : "Homeowner"),
              email: backendUser.email,
              role: userRole,
              phone: backendUser.phone,
              zip: backendUser.zipCode,
              avatar: backendUser.profileImage,
              city: backendUser.city,
              state: backendUser.state,
              street: backendUser.streetAddress,
            }),
          );
        }

        if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
          router.push(nextPath);
          return;
        }
        router.push(userRole === "pro" ? "/pro/application?applied=1" : "/account");
      } else {
        // If the backend verify-email does not return a token, direct user to login
        router.push(`/login?verified=true&email=${encodeURIComponent(targetEmail)}`);
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; error?: string };
      const msg = apiErr?.data?.message || apiErr?.error || "That code is incorrect or expired.";
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleResendCode() {
    if (timer > 0) return;

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setError("Please enter an email address to resend the code.");
      toast.error("Please enter an email address to resend the code.");
      return;
    }

    setError("");
    try {
      await resendOtpApi({ email: targetEmail }).unwrap();
      setTimer(RESEND_COOLDOWN);
      toast.success("A new verification code has been sent to your email.");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; error?: string };
      const msg = apiErr?.data?.message || apiErr?.error || "Could not resend code. Try again.";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        Email Verification
      </span>
      <h1 className="mt-3 font-display text-[22px] sm:text-[26px] font-semibold leading-snug tracking-tight text-title">
        Verify your email
      </h1>
      <p className="mt-1.5 font-sans text-sm leading-relaxed text-[#757575]">
        We sent a 6-digit confirmation code to{" "}
        <span className="font-semibold text-title">{email || "your email"}</span>.
      </p>

      {isEditingEmail ? (
        <div className="mt-4">
          <Field label="Email Address">
            <TextField
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </Field>
          <button
            type="button"
            onClick={() => setIsEditingEmail(false)}
            className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Save email
          </button>
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={submitOtp}>
        <div className="flex justify-between gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(event) => onOtpChange(index, event.target.value)}
              onKeyDown={(event) => onOtpKeyDown(index, event)}
              onPaste={onOtpPaste}
              className={cn(
                "h-12 w-10 sm:h-14 sm:w-12 rounded-[10px] border border-line bg-white text-center font-display text-lg font-bold text-title outline-none focus:border-primary",
              )}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isVerifying}>
          {isVerifying ? "Verifying..." : "Verify & Continue ↗"}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm pt-2">
          <button
            type="button"
            className="font-semibold text-muted hover:text-title cursor-pointer"
            onClick={() => setIsEditingEmail(true)}
          >
            Change email
          </button>
          <button
            type="button"
            className="font-semibold text-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isResending || timer > 0}
            onClick={handleResendCode}
          >
            {isResending
              ? "Resending..."
              : timer > 0
                ? `Resend code (${timer}s)`
                : "Resend code"}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-line/70 pt-4 text-center">
        <Link href="/login" className="text-xs font-semibold text-muted hover:text-title">
          ← Back to Sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
