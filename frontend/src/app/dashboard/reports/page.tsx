"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Receipt,
  Percent,
  RefreshCw,
  Layers,
  ArrowUpRight,
  Filter
} from "lucide-react";

export default function ReportsPage() {
  const { currentBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState<"sales" | "profit" | "tax">("sales");
  const [loading, setLoading] = useState(false);

  // Date filters
  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Data states
  const [salesData, setSalesData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [taxData, setTaxData] = useState<any[]>([]);

  const fetchReports = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      if (activeTab === "sales") {
        const query = `?startDate=${startDate}&endDate=${endDate}`;
        const res = await apiRequest(`/reports/sales${query}`, {}, currentBusiness.id);
        if (res.success && res.data) {
          setSalesData(res.data);
        }
      } else if (activeTab === "profit") {
        const query = `?startDate=${startDate}&endDate=${endDate}`;
        const res = await apiRequest(`/reports/profit${query}`, {}, currentBusiness.id);
        if (res.success && res.data) {
          setProfitData(res.data);
        }
      } else if (activeTab === "tax") {
        const res = await apiRequest("/reports/tax", {}, currentBusiness.id);
        if (res.success && res.data) {
          setTaxData(res.data);
        }
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentBusiness, activeTab, startDate, endDate]);

  const handlePreset = (days: number) => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    setStartDate(start);
    setEndDate(end);
  };

  const handleExportCsv = async () => {
    if (!currentBusiness) return;
    try {
      const endpoint = activeTab === "profit" ? "profit" : "sales";
      const token = localStorage.getItem("token");
      const url = `http://localhost:5000/api/reports/${endpoint}?format=csv&startDate=${startDate}&endDate=${endDate}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-business-id": currentBusiness.id.toString()
        }
      });

      if (!res.ok) throw new Error("CSV download failed");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `quickbill-${endpoint}-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert("Failed to export CSV: " + err.message);
    }
  };

  // Calculations for summary metrics
  const totalSalesRevenue = salesData.reduce((sum, row) => sum + parseFloat(row.net_revenue || 0), 0);
  const totalOrdersCount = salesData.reduce((sum, row) => sum + parseInt(row.total_orders || 0, 10), 0);
  const totalTaxCollected = salesData.reduce((sum, row) => sum + parseFloat(row.tax_collected || 0), 0);
  const totalDiscountsGiven = salesData.reduce((sum, row) => sum + parseFloat(row.discount_given || 0), 0);
  const averageOrderValue = totalOrdersCount > 0 ? totalSalesRevenue / totalOrdersCount : 0;

  const totalEstimatedProfit = profitData.reduce((sum, row) => sum + parseFloat(row.estimated_profit || 0), 0);
  const totalProductSales = profitData.reduce((sum, row) => sum + parseFloat(row.total_sales || 0), 0);
  const overallProfitMargin = totalProductSales > 0 ? (totalEstimatedProfit / totalProductSales) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics & Reports</h1>
          <p className="text-sm text-slate-500">
            Export audit-ready sales summaries, analyze product margins, and view tax breakdowns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== "tax" && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export CSV
            </button>
          )}
          <button
            onClick={fetchReports}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Date Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "sales"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daily Sales
            </button>
            <button
              onClick={() => setActiveTab("profit")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "profit"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              SKU Profitability
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "tax"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tax & GST Summary
            </button>
          </div>

          {/* Date Picker Controls */}
          {activeTab !== "tax" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePreset(0)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Today
                </button>
                <button
                  onClick={() => handlePreset(7)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  7 Days
                </button>
                <button
                  onClick={() => handlePreset(30)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  30 Days
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SALES TAB */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">₹{totalSalesRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">For selected date range</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{totalOrdersCount}</p>
              <p className="text-xs text-slate-500 mt-1">Invoices issued</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Order</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">₹{averageOrderValue.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Revenue / Order</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tax Collected</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">₹{totalTaxCollected.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Discounts given: ₹{totalDiscountsGiven.toFixed(2)}</p>
            </div>
          </div>

          {/* Sales by Date Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Daily Sales Breakdown</h3>
              <span className="text-xs text-slate-500">{salesData.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium text-xs uppercase tracking-wider">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-center">Orders</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                    <th className="px-5 py-3 text-right">Discounts</th>
                    <th className="px-5 py-3 text-right">Tax Collected</th>
                    <th className="px-5 py-3 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Generating report...</span>
                        </div>
                      </td>
                    </tr>
                  ) : salesData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                        No sales transactions found in the chosen date range.
                      </td>
                    </tr>
                  ) : (
                    salesData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {new Date(row.report_date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {row.total_orders}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          ₹{parseFloat(row.subtotal).toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right text-rose-500">
                          -₹{parseFloat(row.discount_given).toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          ₹{parseFloat(row.tax_collected).toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">
                          ₹{parseFloat(row.net_revenue).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROFITABILITY TAB */}
      {activeTab === "profit" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales</span>
              <p className="text-2xl font-bold text-slate-900 mt-2">₹{totalProductSales.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">From order line items</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Profit</span>
              <p className="text-2xl font-bold text-emerald-600 mt-2">₹{totalEstimatedProfit.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Based on product cost prices</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profit Margin</span>
              <p className="text-2xl font-bold text-blue-600 mt-2">{overallProfitMargin.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">Weighted average margin</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Product Margins & Performance</h3>
              <span className="text-xs text-slate-500">{profitData.length} products sold</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium text-xs uppercase tracking-wider">
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-5 py-3 text-center">Units Sold</th>
                    <th className="px-5 py-3 text-right">Total Sales</th>
                    <th className="px-5 py-3 text-right">Cost Basis</th>
                    <th className="px-5 py-3 text-right">Est. Profit</th>
                    <th className="px-5 py-3 text-right">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Computing SKU margins...</span>
                        </div>
                      </td>
                    </tr>
                  ) : profitData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                        No product sales recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    profitData.map((row, idx) => {
                      const sales = parseFloat(row.total_sales || 0);
                      const profit = parseFloat(row.estimated_profit || 0);
                      const margin = sales > 0 ? (profit / sales) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">
                            {row.product_name}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-bold text-slate-700">{row.total_units_sold}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-600">
                            ₹{sales.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-500">
                            ₹{parseFloat(row.total_cost || 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-600">
                            ₹{profit.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                margin >= 30
                                  ? "bg-emerald-50 text-emerald-700"
                                  : margin >= 15
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAX SUMMARY TAB */}
      {activeTab === "tax" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Tax Collected by GST Slab</h3>
              <p className="text-xs text-slate-500">
                Detailed GST aggregation for monthly GSTR-1 filings and accounting reconciliations.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium text-xs uppercase tracking-wider">
                    <th className="px-5 py-3">Tax Slab</th>
                    <th className="px-5 py-3 text-center">Invoiced Items</th>
                    <th className="px-5 py-3 text-right">Taxable Turnover</th>
                    <th className="px-5 py-3 text-right">Total Tax Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Aggregating tax liability...</span>
                        </div>
                      </td>
                    </tr>
                  ) : taxData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-sm">
                        No taxable transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    taxData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                            {parseFloat(row.tax_rate)}% GST
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                          {row.item_count} items
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                          ₹{parseFloat(row.total_sales_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                          ₹{parseFloat(row.total_tax_collected || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
