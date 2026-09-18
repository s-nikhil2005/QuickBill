"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  Settings,
  Building2,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Zap,
  HardDrive
} from "lucide-react";

export default function SettingsPage() {
  const { currentBusiness, currentRole, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "invoice" | "subscription">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Business Profile Form
  const [bizName, setBizName] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizCity, setBizCity] = useState("");
  const [bizState, setBizState] = useState("");
  const [bizGstin, setBizGstin] = useState("");
  const [currency, setCurrency] = useState("INR");

  // Invoicing Settings Form
  const [invoicePrefix, setInvoicePrefix] = useState("QB");
  const [invoiceStartNumber, setInvoiceStartNumber] = useState(1001);
  const [taxPercentage, setTaxPercentage] = useState(18.0);
  const [footerText, setFooterText] = useState("Thank you for shopping with us!");
  const [terms, setTerms] = useState("1. Goods once sold can only be returned within 7 days with original bill.\n2. Warranty handled by manufacturer.");

  // Subscription Details
  const [subscriptionData, setSubscriptionData] = useState<any | null>(null);

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    setErrorMessage("");
    try {
      // 1. Load Business Details
      const bizRes = await apiRequest("/businesses/current", {}, currentBusiness.id);
      if (bizRes.success && bizRes.data) {
        const b = bizRes.data;
        setBizName(b.name || "");
        setBizPhone(b.phone || "");
        setBizEmail(b.email || "");
        setBizAddress(b.address || "");
        setBizCity(b.city || "");
        setBizState(b.state || "");
        setBizGstin(b.gstin || "");
        setCurrency(b.currency || "INR");
      }

      // 2. Load Invoice Settings
      const setRes = await apiRequest("/settings", {}, currentBusiness.id);
      if (setRes.success && setRes.data) {
        const s = setRes.data;
        setInvoicePrefix(s.invoice_prefix || "QB");
        setInvoiceStartNumber(s.invoice_start_number || 1001);
        setTaxPercentage(parseFloat(s.tax_percentage) || 18.0);
        setFooterText(s.footer_text || "Thank you for shopping with us!");
        setTerms(s.terms || "");
      }

      // 3. Load Subscription Usage
      const subRes = await apiRequest("/settings/subscription", {}, currentBusiness.id);
      if (subRes.success && subRes.data) {
        setSubscriptionData(subRes.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await apiRequest(
        "/businesses/current",
        {
          method: "PUT",
          body: JSON.stringify({
            name: bizName,
            phone: bizPhone,
            email: bizEmail,
            address: bizAddress,
            city: bizCity,
            state: bizState,
            gstin: bizGstin,
            currency
          })
        },
        currentBusiness.id
      );

      if (res.success) {
        setSuccessMessage("Business profile updated successfully!");
        refreshUser();
      } else {
        setErrorMessage(res.message || "Failed to update profile.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvoiceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await apiRequest(
        "/settings",
        {
          method: "PUT",
          body: JSON.stringify({
            invoice_prefix: invoicePrefix,
            invoice_start_number: invoiceStartNumber,
            tax_percentage: taxPercentage,
            currency,
            footer_text: footerText,
            terms
          })
        },
        currentBusiness.id
      );

      if (res.success) {
        setSuccessMessage("Billing & invoice configurations saved!");
      } else {
        setErrorMessage(res.message || "Failed to update settings.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  const canEdit = currentRole === "OWNER" || currentRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Settings</h1>
        <p className="text-sm text-slate-500">
          Configure business metadata, receipt formatting, GST tax rates, and manage subscriptions.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "profile"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Business Profile
        </button>
        <button
          onClick={() => setActiveTab("invoice")}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "invoice"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Invoicing & Taxes
        </button>
        <button
          onClick={() => setActiveTab("subscription")}
          className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "subscription"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Plan & Quotas
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading configurations...</span>
          </div>
        </div>
      ) : (
        <>
          {/* BUSINESS PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Name</label>
                    <input
                      type="text"
                      required
                      value={bizName}
                      disabled={!canEdit}
                      onChange={(e) => setBizName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 29AAAAA0000A1Z5"
                      value={bizGstin}
                      disabled={!canEdit}
                      onChange={(e) => setBizGstin(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Currency</label>
                    <select
                      value={currency}
                      disabled={!canEdit}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 font-medium"
                    >
                      <option value="INR">INR (₹) — Indian Rupee</option>
                      <option value="USD">USD ($) — US Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="AED">AED (د.إ) — UAE Dirham</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Store Support Email</label>
                    <input
                      type="email"
                      value={bizEmail}
                      disabled={!canEdit}
                      onChange={(e) => setBizEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Store Phone</label>
                    <input
                      type="tel"
                      value={bizPhone}
                      disabled={!canEdit}
                      onChange={(e) => setBizPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={bizAddress}
                      disabled={!canEdit}
                      onChange={(e) => setBizAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                    <input
                      type="text"
                      value={bizCity}
                      disabled={!canEdit}
                      onChange={(e) => setBizCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">State / Province</label>
                    <input
                      type="text"
                      value={bizState}
                      disabled={!canEdit}
                      onChange={(e) => setBizState(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm inline-flex items-center gap-2"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Business Info
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* INVOICING & TAXES TAB */}
          {activeTab === "invoice" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl">
              <form onSubmit={handleSaveInvoiceSettings} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Invoice Prefix</label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      disabled={!canEdit}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">e.g. QB-{new Date().getFullYear()}-001</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Sequence Number</label>
                    <input
                      type="number"
                      value={invoiceStartNumber}
                      disabled={!canEdit}
                      onChange={(e) => setInvoiceStartNumber(parseInt(e.target.value, 10) || 1001)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Tax (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxPercentage}
                      disabled={!canEdit}
                      onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Receipt Footer Message</label>
                    <input
                      type="text"
                      value={footerText}
                      disabled={!canEdit}
                      onChange={(e) => setFooterText(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Terms & Conditions (Printed on PDF invoices)
                    </label>
                    <textarea
                      rows={4}
                      value={terms}
                      disabled={!canEdit}
                      onChange={(e) => setTerms(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm inline-flex items-center gap-2"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Invoicing Rules
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* SUBSCRIPTION & QUOTAS TAB */}
          {activeTab === "subscription" && subscriptionData && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Current Plan: {subscriptionData.subscription.plan}
                    </div>
                    <h3 className="text-2xl font-bold">QuickBill {subscriptionData.subscription.plan} Tier</h3>
                    <p className="text-white/80 text-xs mt-1">
                      Multi-tenant retail POS, inventory control, and GSTR reporting included.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-400/20 border border-emerald-400/30 text-emerald-100 rounded-xl text-xs font-bold">
                      STATUS: {subscriptionData.subscription.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Quotas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Products in Catalog</span>
                    <span>
                      {subscriptionData.usage.products_count} / {subscriptionData.subscription.product_limit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (subscriptionData.usage.products_count / subscriptionData.subscription.product_limit) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {Math.max(
                      0,
                      subscriptionData.subscription.product_limit - subscriptionData.usage.products_count
                    )}{" "}
                    slots available
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Monthly Invoices</span>
                    <span>
                      {subscriptionData.usage.month_invoices_count} /{" "}
                      {subscriptionData.subscription.invoice_limit_per_month}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (subscriptionData.usage.month_invoices_count /
                            subscriptionData.subscription.invoice_limit_per_month) *
                            100
                        )}%`
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Resets on 1st of every calendar month</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Active Cashier Seats</span>
                    <span>
                      {subscriptionData.usage.staff_count} / {subscriptionData.subscription.staff_limit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (subscriptionData.usage.staff_count / subscriptionData.subscription.staff_limit) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Simultaneous cashiers allowed</p>
                </div>
              </div>

              {/* Upgrade Tiers Comparison */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-1">Available Plan Upgrades</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Scale seamlessly as your retail business expands into multiple locations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900">PRO STORE</h5>
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          POPULAR
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-900 mt-2">₹1,999 <span className="text-xs font-normal text-slate-500">/ mo</span></p>
                      <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                        <li>✓ Unlimited Products & SKUs</li>
                        <li>✓ 2,500 Invoices / month</li>
                        <li>✓ 5 Cashier & Staff Seats</li>
                        <li>✓ Automated WhatsApp Receipt delivery</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => alert("Contact support@quickbill.com to upgrade billing tier.")}
                      className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                    >
                      Upgrade to Pro
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900">ENTERPRISE CHAIN</h5>
                      <p className="text-2xl font-black text-slate-900 mt-2">₹4,999 <span className="text-xs font-normal text-slate-500">/ mo</span></p>
                      <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                        <li>✓ Multi-Branch Store Warehouse Sync</li>
                        <li>✓ Unlimited Invoices & Products</li>
                        <li>✓ Unlimited Staff & Role Privileges</li>
                        <li>✓ Dedicated Account Manager & 24/7 SLA</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => alert("Contact sales@quickbill.com for enterprise retail contracts.")}
                      className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl"
                    >
                      Contact Enterprise Sales
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
