"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

const SalesTrendWidget = dynamic(() => import("@/components/dashboard/SalesTrendWidget"), {
  loading: () => <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />,
  ssr: false
});
import {
  IndianRupee,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowRight,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Boxes
} from "lucide-react";

export default function DashboardPage() {
  const { currentBusiness } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const res = await apiRequest("/dashboard/overview", {}, currentBusiness.id);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [currentBusiness]);

  const currency = currentBusiness?.currency === "INR" ? "₹" : currentBusiness?.currency || "₹";

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-4 animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: `${currency}${data.today.revenue.toLocaleString()}`,
      sub: `${data.today.orders} orders completed today`,
      icon: IndianRupee,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Total Customers",
      value: data.summary.total_customers,
      sub: "Active retail customer base",
      icon: Users,
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Low Stock Alert",
      value: data.summary.low_stock_count,
      sub: data.summary.low_stock_count > 0 ? "Requires reordering" : "Inventory levels healthy",
      icon: AlertTriangle,
      color: data.summary.low_stock_count > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50",
      highlight: data.summary.low_stock_count > 0,
    },
    {
      title: "Total Products",
      value: data.summary.total_products,
      sub: "Active SKUs in catalog",
      icon: Package,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-700 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">Welcome back, {currentBusiness?.name || "Store"}</h1>
          <p className="text-xs text-blue-100 mt-1">
            Real-time multi-tenant retail telemetry and POS sales tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/billing"
            className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition shadow-md flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-white border ${
              card.highlight ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200/80"
            } shadow-xs space-y-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{card.title}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                {card.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Analytics: Sales Trend + Payment Summary */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Trend (7 Days - Dynamically Loaded) */}
        <SalesTrendWidget salesTrend={data.sales_trend} currency={currency} />

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Breakdown</h2>
            <p className="text-xs text-slate-500">Revenue split across channels</p>
          </div>

          <div className="space-y-3 pt-2">
            {data.payment_summary && data.payment_summary.length > 0 ? (
              data.payment_summary.map((pm: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center text-blue-600 shadow-xs">
                      {pm.payment_method === "UPI" ? (
                        <QrCode className="w-4 h-4" />
                      ) : pm.payment_method === "CARD" ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Banknote className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{pm.payment_method}</div>
                      <div className="text-[10px] text-slate-500">{pm.count} transactions</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      {currency}{parseFloat(pm.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">No payment data yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column: Recent Invoices + Top Selling Products & Low Stock Alerts */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Latest completed customer invoices</p>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5">Invoice #</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5 text-center">Channel</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_invoices && data.recent_invoices.length > 0 ? (
                  data.recent_invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 font-bold text-blue-600">{inv.invoice_number}</td>
                      <td className="py-3 text-slate-800 font-medium">
                        {inv.customer_name || "Walk-in Customer"}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {currency}{parseFloat(inv.grand_total).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {inv.payment_method}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {inv.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No invoices recorded yet. Start billing at POS!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products & Low Stock Widget */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Selling Products */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Top Selling Products</h2>
                <p className="text-xs text-slate-500">Highest volume retail items</p>
              </div>
              <Package className="w-4 h-4 text-blue-600" />
            </div>

            <div className="space-y-3">
              {data.top_products && data.top_products.length > 0 ? (
                data.top_products.map((tp: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{tp.product_name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900">{tp.units_sold} sold</span>
                      <span className="text-[10px] text-slate-500 block">
                        ({currency}{parseFloat(tp.revenue).toLocaleString()})
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">No sales data yet.</div>
              )}
            </div>
          </div>

          {/* Low Stock Alert Box */}
          {data.low_stock_products && data.low_stock_products.length > 0 && (
            <div className="bg-rose-50/60 rounded-2xl border border-rose-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-800">Critical Stock Warnings</span>
                </div>
                <Link
                  href="/dashboard/inventory"
                  className="text-[11px] font-bold text-rose-700 hover:underline"
                >
                  Restock All
                </Link>
              </div>

              <div className="space-y-2">
                {data.low_stock_products.map((lp: any) => (
                  <div
                    key={lp.id}
                    className="p-2.5 rounded-xl bg-white border border-rose-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{lp.name}</div>
                      <div className="text-[10px] text-slate-500">Min Threshold: {lp.min_stock_level} {lp.unit}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-100 text-rose-700">
                      {lp.current_stock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
