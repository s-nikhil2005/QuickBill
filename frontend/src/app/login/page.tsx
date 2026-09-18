"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, AlertCircle, Loader2, Store, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        login(res.data.user, res.data.businesses || []);
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password@123");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            Q
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">QuickBill</span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900">Sign in to your business workspace</h2>
        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
            Create one free
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Credentials */}
          <div className="border-t border-slate-200 pt-5 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Quick Demo Logins
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("demo@quickbill.com")}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition text-xs"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  Store Owner
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">demo@quickbill.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("cashier@quickbill.com")}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-left transition text-xs"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Cashier
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">cashier@quickbill.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
