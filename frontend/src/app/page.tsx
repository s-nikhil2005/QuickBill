"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Receipt,
  Boxes,
  Users,
  BarChart3,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Store,
  Printer
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Accent Gradient Bar */}
      <div className="w-full h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-500" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm text-white font-bold text-lg">
                Q
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-lg text-slate-900 tracking-tight">QuickBill</span>
                <span className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold">Retail SaaS</span>
              </div>
            </Link>

            {/* Nav Menu */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-blue-600 transition">Features</a>
              <a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
              <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
              <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
            </nav>

            {/* Auth CTAs */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cloud Billing & Multi-Tenant Retail Operating System</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                  Run your business. <br />
                  <span className="text-blue-600">Bill 3x faster.</span>
                </h1>

                <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
                  QuickBill replaces paper bills, spreadsheets, and manual ledgers with a lightning-fast POS, real-time inventory movements, customer CRM, and automated GST invoices.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition text-base"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition text-base shadow-sm"
                  >
                    <Store className="w-4 h-4 text-blue-600" />
                    <span>View Live Demo</span>
                  </Link>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-tenant data isolation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Thermal & A4 print ready
                  </span>
                </div>
              </div>

              {/* Hero Visual Mockup */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80 space-y-5">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="text-xs text-slate-500">Live Workspace</div>
                      <div className="font-bold text-slate-900 text-lg">QuickBill Supermarket</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      ● Active POS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500">Today&apos;s Revenue</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">₹42,850</div>
                      <div className="text-[11px] text-emerald-600 font-medium mt-0.5">↑ 18% vs yesterday</div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500">Orders Processed</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">128 bills</div>
                      <div className="text-[11px] text-blue-600 font-medium mt-0.5">Avg speed: 18s/bill</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Fast Checkout Cart</div>
                    <div className="p-2.5 bg-blue-50/50 rounded-lg flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800">2x Amul Gold Milk 500ml</span>
                      <span className="font-bold text-slate-900">₹68.00</span>
                    </div>
                    <div className="p-2.5 bg-blue-50/50 rounded-lg flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-800">1x Nescafe Coffee Jar 100g</span>
                      <span className="font-bold text-slate-900">₹320.00</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center">
                    <div>
                      <div className="text-[11px] text-slate-500">Total (Tax Incl.)</div>
                      <div className="text-xl font-extrabold text-blue-600">₹388.00</div>
                    </div>
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                      <Printer className="w-3.5 h-3.5" />
                      Print Receipt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Built for Speed & Precision</h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Everything retail stores need to operate at scale.
              </p>
              <p className="text-slate-600 text-base">
                From grocery shops and bakeries to electronics and fashion stores, QuickBill gives your staff the tools to complete sales in seconds.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Rapid POS Billing</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Instant product lookup, USB/Bluetooth barcode scanning, keyboard navigation, and automatic tax calculation designed for zero queue buildup.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Atomic Stock Control</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Every bill automatically deducts inventory with ACID transaction safety. Track restocks, damages, returns, and low stock thresholds with full audit history.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">GST Invoices & Thermal Prints</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Print 80mm thermal receipts or standard A4 tax invoices with custom business logos, GSTIN, terms, and direct PDF download.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Customer CRM</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Store phone numbers, purchase histories, and outstanding dues. Fast auto-fill for repeat walk-in customers.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Real-Time Financial Reports</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Genuine database analytics: Today&apos;s revenue, gross profit, tax collected, top products, payment channel share, and one-click CSV export.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Multi-Role RBAC</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Enforce role separation: Owner, Admin, Manager, Cashier, and Staff. Keep sensitive financial margins and employee logs hidden from cashiers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Simple 4-Step Onboarding</h2>
              <p className="text-3xl font-extrabold text-slate-900">Start billing in under 2 minutes.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg">1</div>
                <h4 className="font-bold text-slate-900">Register & Setup</h4>
                <p className="text-xs text-slate-600">Sign up and configure your store name, currency, GSTIN, and receipt format.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg">2</div>
                <h4 className="font-bold text-slate-900">Add Inventory</h4>
                <p className="text-xs text-slate-600">Add products with barcodes, cost prices, selling rates, and minimum stock alerts.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg">3</div>
                <h4 className="font-bold text-slate-900">Fast POS Checkout</h4>
                <p className="text-xs text-slate-600">Scan items, collect payment via Cash, UPI or Card, and print thermal receipt.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg">4</div>
                <h4 className="font-bold text-slate-900">Track & Grow</h4>
                <p className="text-xs text-slate-600">View real-time revenues, profit margins, top-selling items, and export tax summaries.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">SaaS Subscription Plans</h2>
              <p className="text-3xl font-extrabold text-slate-900">Simple, transparent pricing for any business stage.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {/* Free */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-slate-900">Free</h4>
                  <div className="text-3xl font-extrabold text-slate-900">₹0 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                  <p className="text-xs text-slate-600">For new single-store retail counters.</p>
                  <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 100 invoices/month</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 500 products</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 employee login</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Thermal receipt printing</li>
                  </ul>
                </div>
                <Link href="/register" className="mt-6 w-full py-2 px-4 rounded-lg text-center text-xs font-bold border border-slate-300 hover:bg-slate-100 transition">
                  Get Started
                </Link>
              </div>

              {/* Starter */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-slate-900">Starter</h4>
                  <div className="text-3xl font-extrabold text-slate-900">₹799 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                  <p className="text-xs text-slate-600">For growing retail shops.</p>
                  <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1,000 invoices/month</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5,000 products</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5 employee logins</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Low stock alerts & CRM</li>
                  </ul>
                </div>
                <Link href="/register" className="mt-6 w-full py-2 px-4 rounded-lg text-center text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition">
                  Upgrade to Starter
                </Link>
              </div>

              {/* Business (Popular) */}
              <div className="p-6 rounded-2xl border-2 border-blue-600 bg-white shadow-xl relative flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-slate-900">Business</h4>
                  <div className="text-3xl font-extrabold text-blue-600">₹1,999 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                  <p className="text-xs text-slate-600">For busy stores with multiple cashiers.</p>
                  <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited invoices</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited products</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 20 staff accounts</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Advanced Profit & Tax reports</li>
                  </ul>
                </div>
                <Link href="/register" className="mt-6 w-full py-2 px-4 rounded-lg text-center text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md">
                  Choose Business
                </Link>
              </div>

              {/* Pro */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-slate-900">Pro Enterprise</h4>
                  <div className="text-3xl font-extrabold text-slate-900">₹4,999 <span className="text-xs font-normal text-slate-500">/mo</span></div>
                  <p className="text-xs text-slate-600">For multi-branch retail networks.</p>
                  <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-store support</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dedicated priority support</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom API integration</li>
                  </ul>
                </div>
                <Link href="/register" className="mt-6 w-full py-2 px-4 rounded-lg text-center text-xs font-bold border border-slate-300 hover:bg-slate-100 transition">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
              <p className="text-slate-600 text-sm">Have questions about QuickBill? Find answers here.</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "Does QuickBill support barcode scanners and thermal receipt printers?",
                  a: "Yes! QuickBill is compatible with standard USB and Bluetooth 1D/2D barcode scanners, 80mm/58mm thermal printers (ESC/POS style), and standard A4 laser/inkjet printers."
                },
                {
                  q: "Can my cashiers see product profit margins or store expenses?",
                  a: "No. QuickBill has built-in Role-Based Access Control (RBAC). Cashiers only have access to the POS checkout screen and invoice generation, while profit reports and store expenses are restricted to Owners and Managers."
                },
                {
                  q: "Is data from different businesses kept separate?",
                  a: "Yes, QuickBill is built on strict multi-tenant architecture. Every product, customer, order, and invoice is isolated by business ID and protected by backend middleware guards."
                },
                {
                  q: "Can I manage multiple shops under one account?",
                  a: "Yes, QuickBill's data model supports multi-store operations with consolidated business reporting and store-specific inventory."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-5 py-4 font-semibold text-slate-900 flex justify-between items-center text-sm"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">Q</div>
            <span className="text-white font-bold text-base">QuickBill</span>
            <span className="text-slate-500">© 2026 QuickBill SaaS. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
