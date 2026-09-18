"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  // Step 1: Request OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMessage("");
    setDevOtpHint(null);

    try {
      const res = await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "RESET_PASSWORD" })
      });

      if (res.success) {
        if (res.otp) {
          setDevOtpHint(res.otp);
        }
        setStep(2);
      } else {
        setErrorMessage(res.message || "Failed to send OTP.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, purpose: "RESET_PASSWORD" })
      });

      if (res.success) {
        setStep(3);
      } else {
        setErrorMessage(res.message || "Invalid OTP entered.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, newPassword, confirmPassword })
      });

      if (res.success) {
        setResetDone(true);
      } else {
        setErrorMessage(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            Q
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Quick<span className="text-blue-600">Bill</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          {step === 1 && "We'll send a 6-digit verification code to your email."}
          {step === 2 && `Enter the 6-digit code sent to ${email}.`}
          {step === 3 && "Create a secure new password for your account."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {devOtpHint && step === 2 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <strong>Demo OTP Hint: </strong> {devOtpHint}
            </div>
          )}

          {resetDone ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Password Reset Complete!</h3>
              <p className="text-xs text-slate-500">
                Your password has been securely updated. You can now login with your new credentials.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                Sign In to QuickBill
              </Link>
            </div>
          ) : (
            <>
              {/* STEP 1: Enter Email */}
              {step === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="owner@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Send Verification OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter OTP */}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      6-Digit Security Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-center tracking-widest text-lg font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify Code</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Change email address
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Enter New Password */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Save & Set New Password</span>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 border-t border-slate-100 pt-4 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
