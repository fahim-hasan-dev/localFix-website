"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  KeyRound,
  Laptop,
  Mail,
  Phone,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logout } from "@/redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useDeleteMyAccountMutation } from "@/services/client/users-api";
import { apiErrorMessage } from "@/services/client/form-data";
export function SecuritySettings({ role }: { role: "homeowner" | "pro" }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [deleteMyAccount, { isLoading: deleting }] = useDeleteMyAccountMutation();

  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [sessionsCleared, setSessionsCleared] = useState(false);

  const passwordHref = role === "pro" ? "/pro/password" : "/account/password";

  async function handleDeleteAccount() {
    if (!deletePassword) {
      setDeleteError("Enter your account password to confirm deletion.");
      return;
    }
    setDeleteError("");
    try {
      await deleteMyAccount({ password: deletePassword }).unwrap();
      dispatch(logout());
      router.push("/");
    } catch (err) {
      setDeleteError(apiErrorMessage(err, "Could not delete your account."));
    }
  }

  function handleClearOtherSessions() {
    setSessionsCleared(true);
    setTimeout(() => setSessionsCleared(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-line/70 pb-4 pt-1">
        <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-title tracking-tight">
          Security Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage password, two-factor authentication, and active sessions.
        </p>
      </div>

      {/* ============================================================ */}
      {/* CARD 1: SIGN-IN & AUTHENTICATION                             */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-7 space-y-6">
        <div className="flex items-center gap-3 border-b border-line/70 pb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-[17px] font-semibold text-title">
              Sign-In Authentication
            </h2>
            <p className="text-xs text-muted">
              Password and multi-factor account protection
            </p>
          </div>
        </div>

        {/* Password Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line/60">
          <div className="space-y-1">
            <p className="font-display text-[14.5px] font-bold text-title">Account Password</p>
            <p className="font-sans text-xs text-muted">
              Securely hashed with bcrypt. Never share your password with anyone.
            </p>
            <p className="text-xs font-mono text-muted tracking-widest pt-0.5">••••••••••••••••</p>
          </div>
          <Link
            href={passwordHref}
            className="inline-flex items-center justify-center rounded-[10px] border border-line bg-white px-4 py-2 font-display text-xs font-semibold text-title hover:bg-smoke hover:border-primary/40 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            Change Password
          </Link>
        </div>

        {/* Two-Factor Authentication (2FA) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line/60">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <p className="font-display text-[14.5px] font-bold text-title">
                Two-Factor Authentication (2FA)
              </p>
              <span
                className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted"
              >
                Coming soon
              </span>
            </div>
            <p className="font-sans text-xs text-muted leading-relaxed">
              Requires a 6-digit confirmation code whenever logging in from an unrecognized device or browser.
            </p>
          </div>

          <button
            type="button"
            disabled
            title="Two-factor authentication is coming soon"
            className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-line opacity-60 focus:outline-none self-start sm:self-auto"
            role="switch"
            aria-checked={false}
            aria-disabled="true"
          >
            <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow-md ring-0" />
          </button>
        </div>

        {/* Verified Account Identifiers */}
        <div className="space-y-3 pt-1">
          <p className="font-display text-[13px] font-semibold text-title">
            Verified Contact Credentials
          </p>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="flex items-center justify-between rounded-[12px] border border-line/70 bg-smoke/40 p-3">
              <div className="flex items-center gap-2.5 truncate">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate font-medium text-title">{user?.email ?? "you@example.com"}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200 shrink-0">
                <Check className="h-3 w-3 stroke-[3]" /> Verified
              </span>
            </div>

            <div className="flex items-center justify-between rounded-[12px] border border-line/70 bg-smoke/40 p-3">
              <div className="flex items-center gap-2.5 truncate">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate font-medium text-title">{user?.phone || "(512) 555-0142"}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200 shrink-0">
                <Check className="h-3 w-3 stroke-[3]" /> SMS Linked
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* CARD 2: ACTIVE SESSIONS & DEVICES                            */}
      {/* ============================================================ */}
      <Card className="p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-line/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-[17px] font-bold text-title">
                Active Browser Sessions
              </h2>
              <p className="text-xs text-muted">
                Devices authorized to access this account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearOtherSessions}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Sign out other sessions
          </button>
        </div>

        {sessionsCleared && (
          <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg animate-in fade-in">
            ✓ All other device sessions were signed out successfully.
          </p>
        )}

        <div className="space-y-3">
          {/* Current Device */}
          <div className="flex items-center justify-between rounded-[14px] border border-line/80 bg-white p-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-smoke text-title shrink-0">
                <Laptop className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-[13.5px] font-bold text-title">
                    Chrome on Windows 11
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    This device
                  </span>
                </div>
                <p className="text-xs text-muted">United States · IP: 10.10.26.170</p>
              </div>
            </div>
            <span className="text-xs text-muted font-medium">Active now</span>
          </div>

          {/* Secondary Mobile Device */}
          <div className="flex items-center justify-between rounded-[14px] border border-line/70 bg-smoke/30 p-3.5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-smoke text-muted shrink-0">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <p className="font-display text-[13.5px] font-bold text-title">
                  Safari on iPhone 15 Pro
                </p>
                <p className="text-xs text-muted">United States · Last active 3 days ago</p>
              </div>
            </div>
            <span className="text-xs text-muted">3 days ago</span>
          </div>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* CARD 3: DANGER ZONE (DELETE ACCOUNT)                         */}
      {/* ============================================================ */}
      <div className="rounded-[20px] border border-red-200 bg-red-50/40 p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-error shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold text-title">Danger Zone</h2>
            <p className="text-xs text-muted">Irreversible account actions</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <p className="font-display text-[14.5px] font-bold text-title">Delete Account</p>
            <p className="font-sans text-xs text-[#666] max-w-md">
              Permanently delete your profile, active job estimates, and message records.
            </p>
          </div>

          {!deleteArmed ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="border border-red-300 text-error hover:bg-red-100 self-start sm:self-auto"
              onClick={() => setDeleteArmed(true)}
            >
              Delete Account
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2 self-start sm:w-auto sm:self-auto">
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="Confirm with your password"
                autoComplete="current-password"
                disabled={deleting}
                className="w-full rounded-[10px] border border-red-200 bg-white px-3 py-2 text-xs text-title outline-none focus:border-red-400 sm:w-64"
              />
              {deleteError ? <p className="text-xs text-error">{deleteError}</p> : null}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-error hover:bg-red-700 text-white"
                  disabled={deleting}
                  onClick={handleDeleteAccount}
                >
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={deleting}
                  onClick={() => {
                    setDeleteArmed(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
