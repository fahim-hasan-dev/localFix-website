"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { AuthLinks } from "@/components/web-pages/auth-links";
import { cn } from "@/lib/cn";
import {
  useForgetPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
  useResendOtpMutation,
} from "@/services/client/auth-api";

const OTP_LEN = 6;
const RESEND_COOLDOWN = 30;

type Step = "email" | "otp" | "password" | "done";

function maskEmail(value: string) {
  const [local, domain] = value.split("@");
  if (!local || !domain) return value;
  const keep = local.slice(0, 1);
  return `${keep}${"•".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const [forgetPasswordApi, { isLoading: isRequestingCode }] = useForgetPasswordMutation();
  const [verifyResetOtpApi, { isLoading: isVerifyingOtp }] = useVerifyResetOtpMutation();
  const [resetPasswordApi, { isLoading: isResettingPassword }] = useResetPasswordMutation();
  const [resendOtpApi, { isLoading: isResendingOtp }] = useResendOtpMutation();

  useEffect(() => {
    if (step === "otp") inputs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== "otp") return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function requestCode(isResend = false) {
    if (isResend && timer > 0) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      toast.error("Enter a valid email address.");
      return;
    }
    setError("");

    try {
      if (isResend) {
        await resendOtpApi({ email: email.trim().toLowerCase() }).unwrap();
        setTimer(RESEND_COOLDOWN);
        toast.success("New verification code sent to your email.");
      } else {
        await forgetPasswordApi({ email: email.trim().toLowerCase() }).unwrap();
        setOtp(Array(OTP_LEN).fill(""));
        setTimer(RESEND_COOLDOWN);
        setStep("otp");
        toast.success("Verification code sent to your email.");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; error?: string };
      const msg = apiErr?.data?.message || apiErr?.error || "We could not send a code. Try again.";
      setError(msg);
      toast.error(msg);
    }
  }

  function sendCode(event: React.FormEvent) {
    event.preventDefault();
    void requestCode(false);
  }

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

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LEN) {
      setError("Enter the 6-digit code from your email.");
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setError("");

    try {
      const res = await verifyResetOtpApi({
        email: email.trim().toLowerCase(),
        oneTimeCode: Number(code),
      }).unwrap();

      const token = res.resetToken?.trim() || "";
      if (!token) {
        setError("Code verified, but no reset token was returned. Request a new code.");
        toast.error("Code verified, but no reset token was returned. Request a new code.");
        return;
      }
      setResetToken(token);
      setStep("password");
      toast.success("Code verified! Please set your new password.");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; error?: string };
      const msg = apiErr?.data?.message || apiErr?.error || "That code is incorrect or expired.";
      setError(msg);
      toast.error(msg);
    }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
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
    if (!resetToken) {
      setError("Your reset session expired. Verify the code again.");
      toast.error("Your reset session expired. Verify the code again.");
      setStep("otp");
      return;
    }
    setError("");

    try {
      await resetPasswordApi({
        data: { newPassword: password, confirmPassword: confirm },
        resetToken,
      }).unwrap();
      setStep("done");
      toast.success("Password reset successfully! You can now sign in.");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; error?: string };
      const msg = apiErr?.data?.message || apiErr?.error || "Could not reset password. Try again.";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        {step === "done" ? "Account Recovery" : `Step ${step === "email" ? 1 : step === "otp" ? 2 : 3} of 3`}
      </span>

      {step === "email" ? (
        <>
          <h1 className="mt-3 font-display text-[22px] sm:text-[26px] font-semibold leading-snug tracking-tight text-title">
            Forgot password
          </h1>
          <p className="mt-2 text-sm leading-6 text-copy">
            Enter the email on the account. We will send a 6-digit code to reset your password.
          </p>
          <form className="mt-6 space-y-5" onSubmit={sendCode}>
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
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isRequestingCode}>
              {isRequestingCode ? "Sending code..." : "Send code ↗"}
            </Button>
          </form>
          <AuthLinks prompt="Remembered your password?" href="/login" label="Back to sign in" />
        </>
      ) : null}

      {step === "otp" ? (
        <>
          <h1 className="mt-3 font-display text-[22px] sm:text-[26px] font-semibold leading-snug tracking-tight text-title">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-6 text-copy">
            We sent a 6-digit code to <span className="font-semibold text-title">{maskEmail(email)}</span>.
          </p>
          <form className="mt-6 space-y-5" onSubmit={verifyOtp}>
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
                    "h-12 w-10 rounded-[10px] border border-line bg-white text-center font-display text-lg font-bold text-title outline-none focus:border-primary sm:h-14 sm:w-12",
                  )}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
              {isVerifyingOtp ? "Verifying..." : "Verify code ↗"}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="font-semibold text-muted hover:text-title cursor-pointer"
                onClick={() => {
                  setStep("email");
                  setError("");
                }}
              >
                ← Change email
              </button>
              <button
                type="button"
                className="font-semibold text-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isResendingOtp || timer > 0}
                onClick={() => void requestCode(true)}
              >
                {isResendingOtp
                  ? "Resending..."
                  : timer > 0
                    ? `Resend code (${timer}s)`
                    : "Resend code"}
              </button>
            </div>
          </form>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <h1 className="mt-3 font-display text-[22px] sm:text-[26px] font-semibold leading-snug tracking-tight text-title">
            Set new password
          </h1>
          <p className="mt-2 text-sm leading-6 text-copy">
            Create a password with at least 6 characters.
          </p>
          <form className="mt-6 space-y-5" onSubmit={updatePassword}>
            <Field label="New password">
              <PasswordField
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <PasswordField
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="••••••••••••"
                autoComplete="new-password"
              />
            </Field>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isResettingPassword}>
              {isResettingPassword ? "Updating password..." : "Update password ↗"}
            </Button>
          </form>
        </>
      ) : null}

      {step === "done" ? (
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            ✓
          </div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold leading-snug tracking-tight text-title">
            Password updated
          </h1>
          <p className="mt-2 text-sm leading-6 text-copy">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <div className="mt-6">
            <Link href="/login" className="inline-block w-full">
              <Button type="button" className="w-full">
                Sign in now ↗
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
