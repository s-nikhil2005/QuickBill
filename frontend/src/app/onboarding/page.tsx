"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Store, ArrowRight, Loader2, AlertCircle, Building2, Receipt, MapPin } from "lucide-react";

const BUSINESS_CATEGORIES = [
  "Grocery & Supermarket",
  "Clothing & Apparel",
  "Electronics & Mobile",
  "Hardware & Sanitary",
  "Stationery & Books",
  "Bakery & Sweets",
  "Restaurant & Cafe",
  "Pharmacy & Medical",
  "General Retail Store",
  "Other"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser, setCurrentBusiness } = useAuth();

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("Grocery & Supermarket");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [gstin, setGstin] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [taxPercentage, setTaxPercentage] = useState("18");
  const [invoicePrefix, setInvoicePrefix] = useState("QB");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Business Name is required.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest("/businesses", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          business_type: businessType,
          phone,
          email,
          address,
          city,
          state,
          country,
          gstin: gstin.trim() || null,
          currency,
          tax_percentage: parseFloat(taxPercentage) || 0,
          invoice_prefix: invoicePrefix.trim().toUpperCase() || "QB"
        }),
      });

      if (res.success && res.data) {
        await refreshUser();
        setCurrentBusiness({
          id: res.data.id,
          name: res.data.name,
          slug: res.data.slug,
          business_type: res.data.business_type,
          currency: res.data.currency,
          invoice_prefix: res.data.invoice_prefix,
          role: "OWNER",
          status: "ACTIVE"
        });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create business workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-2xl shadow-md">
            Q
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Set Up Your Store Workspace</h1>
          <p className="text-xs text-slate-500">
            Tell us about your business so QuickBill can customize your POS, taxes, and receipt templates.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Business Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 text-sm font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>1. Business Details</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business / Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Metro Supermarket"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store Category
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 text-sm font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>2. Address & Location</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store Street Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop #4, Market Complex"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New Delhi"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Delhi"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Billing & Taxes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 text-sm font-bold text-slate-800">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>3. Tax & Invoicing Configuration</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                    placeholder="QB"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                  />
                  <span className="text-[10px] text-slate-400">e.g. QB-1001</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Tax Rate (%)
                  </label>
                  <select
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Essential)</option>
                    <option value="12">12% (Standard)</option>
                    <option value="18">18% (Goods/Services)</option>
                    <option value="28">28% (Luxury)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Workspace & Seeding Categories...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup & Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
