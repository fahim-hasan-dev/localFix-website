"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { GoogleIcon } from "@/components/ui/google-icon";
import { AuthLinks } from "@/components/web-pages/auth-links";
import { useLoginMutation } from "@/services/client/auth-api";
import { useAppSelector } from "@/redux/hooks";
import { normalizeRole } from "@/utils/authToken";

export function LoginForm() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get("next");
  const roleParam = search.get("role");
  const isPostJob = Boolean(nextPath?.includes("post-job"));
  const signupHrefWithNext = nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup";
  const [role, setRole] = useState<"homeowner" | "pro">(roleParam === "pro" ? "pro" : "homeowner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [loginApi, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (user) {
      if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
        router.replace(nextPath);
      } else {
        router.replace(user.role === "pro" ? "/pro" : "/account");
      }
    }
  }, [user, nextPath, router]);

  const [prevRoleParam, setPrevRoleParam] = useState(roleParam);
  if (roleParam && (roleParam === "pro" || roleParam === "homeowner") && roleParam !== prevRoleParam) {
    setPrevRoleParam(roleParam);
    setRole(roleParam);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter both email and password.");
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      const res = await loginApi({ email: trimmedEmail, password }).unwrap();
      // Live API nests the user under data.data (not data.user).
      const backendRole = res.data?.user?.role || res.data?.data?.role;
      const mappedRole = normalizeRole(backendRole);
      const isPro = mappedRole === "pro";

      toast.success("Signed in successfully!");

      if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
        // Never send a pro into a homeowner-only next path (and vice versa).
        if (isPro && nextPath.startsWith("/account")) {
          router.push("/pro");
          return;
        }
        if (!isPro && nextPath.startsWith("/pro")) {
          router.push("/account");
          return;
        }
        router.push(nextPath);
        return;
      }
      router.push(isPro ? "/pro" : "/account");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; error?: string };
      const msg = apiErr?.data?.message || apiErr?.error || "Invalid email or password. Please try again.";
      setError(msg);
      toast.error(msg);
      if (msg.toLowerCase().includes("verify your account") || msg.toLowerCase().includes("verify your email")) {
        // If unverified account, redirect directly to verify-email after a short prompt
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(trimmedEmail)}&role=${role}`);
        }, 1200);
      }
    }
  }

  function handleGoogleSignIn() {
    setError("Google Sign-in is not configured on this server yet. Please use email and password.");
  }

  return (
    <div>
      <h1 className="font-display text-[22px] sm:text-[26px] font-semibold leading-snug tracking-tight text-title">
        {isPostJob ? "Sign in to post your request" : "Sign in to Local Fix"}
      </h1>
      <p className="mt-2 font-sans text-sm leading-relaxed text-[#757575]">
        {isPostJob ? (
          <>
            Please sign in to continue posting your request. Don&apos;t have an account yet?{" "}
            <Link href={signupHrefWithNext} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          "Sign in to your account or get started with quotes and requests."
        )}
      </p>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <Field label="Email">
          <TextField
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password">
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            required
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="font-display text-sm font-bold text-primary">
            Forgot password
          </Link>
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in ↗"}
        </Button>
      </form>

      {/* Or Divider */}
      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line/80" />
        </div>
        <span className="relative bg-white px-3 font-display text-xs font-medium uppercase tracking-wider text-muted">
          Or
        </span>
      </div>

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-white px-5 py-3 font-display text-sm font-semibold text-title shadow-2xs transition-all duration-200 hover:bg-smoke/70 hover:border-line hover:shadow-xs active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
      >
        <GoogleIcon className="h-4.5 w-4.5" />
        <span>Continue with Google ↗</span>
      </button>

      <AuthLinks prompt="Don't have an account?" href={signupHrefWithNext} label="Sign up free ↗" />
    </div>
  );
}
