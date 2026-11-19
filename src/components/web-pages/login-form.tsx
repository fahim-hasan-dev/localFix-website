"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { AuthLinks } from "@/components/web-pages/auth-links";
import { useLoginMutation } from "@/services/client/auth-api";
import { useAppSelector } from "@/redux/hooks";
import { authToken, normalizeRole } from "@/utils/authToken";

function safeInternalPath(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

function destinationForRole(isPro: boolean, nextPath: string | null): string {
  const next = safeInternalPath(nextPath);
  if (next) {
    if (isPro && next.startsWith("/account")) return "/pro";
    if (!isPro && next.startsWith("/pro")) return "/";
    return next;
  }
  return isPro ? "/pro" : "/";
}

/** Full navigation so middleware always sees freshly written auth cookies. */
function hardRedirect(path: string) {
  if (typeof window === "undefined") return;
  window.location.assign(path);
}

export function LoginForm() {
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
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
  const submittingRef = useRef(false);

  const [loginApi, { isLoading }] = useLoginMutation();

  // Only auto-bounce users who already have a session (e.g. opened /login while logged in).
  // Do not race with an in-flight submit — that caused login → /pro → /login loops.
  useEffect(() => {
    if (!hydrated || !user || submittingRef.current) return;
    if (!authToken.getAccessToken()) return;
    hardRedirect(destinationForRole(user.role === "pro", nextPath));
  }, [hydrated, user, nextPath]);

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

    submittingRef.current = true;
    try {
      const res = await loginApi({ email: trimmedEmail, password }).unwrap();
      const backendRole = res.data?.user?.role || res.data?.data?.role;
      const mappedRole = normalizeRole(backendRole);
      const isPro = mappedRole === "pro";
      const target = destinationForRole(isPro, nextPath);

      // Ensure cookies from persistSession are visible before leaving the page.
      if (!authToken.getAccessToken()) {
        const token = res.data?.token || res.data?.accessToken;
        if (token) {
          authToken.setTokens({
            accessToken: token,
            refreshToken: res.data?.refreshToken,
            role: mappedRole,
          });
        }
      }

      toast.success("Signed in successfully!");
      hardRedirect(target);
    } catch (err: unknown) {
      submittingRef.current = false;
      const apiErr = err as { data?: { message?: string }; error?: string };
      const msg = apiErr?.data?.message || apiErr?.error || "Invalid email or password. Please try again.";
      setError(msg);
      toast.error(msg);
      if (msg.toLowerCase().includes("verify your account") || msg.toLowerCase().includes("verify your email")) {
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(trimmedEmail)}&role=${role}`);
        }, 1200);
      }
    }
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

      <AuthLinks prompt="Don't have an account?" href={signupHrefWithNext} label="Sign up free ↗" />
    </div>
  );
}
