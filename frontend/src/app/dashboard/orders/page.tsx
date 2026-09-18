"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import {
  FileText,
  Search,
  Printer,
  RotateCcw,
  Loader2,
  X,
  Eye,
  Calendar
} from "lucide-react";

export default function OrdersPage() {
  const { currentBusiness } = useAuth();
  const currency = currentBusiness?.currency === "INR" ? "₹" : currentBusiness?.currency || "₹";

  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);

  // View Order Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchOrders = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      let query = `/billing/orders?page=${page}&limit=20`;
      if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (paymentStatus) query += `&payment_status=${paymentStatus}`;

      const res = await apiRequest(query, {}, currentBusiness.id);
      if (res.success && res.orders) {
        setOrders(res.orders);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, paymentStatus]);

  useEffect(() => {
    fetchOrders();
  }, [currentBusiness, debouncedSearch, paymentStatus, page]);

  const openOrderDetails = async (orderId: number) => {
    if (!currentBusiness) return;
    setDetailsModalOpen(true);
    setLoadingDetails(true);

    try {
      const res = await apiRequest(`/billing/orders/${orderId}`, {}, currentBusiness.id);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrint = (invoiceId: number) => {
    if (!currentBusiness) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    window.open(`/api/invoices/${invoiceId}/print?token=${encodeURIComponent(token)}&businessId=${currentBusiness.id}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Orders & Invoices</h1>
          <p className="text-xs text-slate-500">
            View completed sales, customer invoices, payment statuses, and tax breakdown.
          </p>
        </div>

        <Link
          href="/dashboard/billing"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition"
        >
          New Sale (POS)
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order or invoice #..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white outline-none"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mb-2 mx-auto stroke-[1.5]" />
                    <p className="font-semibold text-sm">No orders found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Complete a checkout at the POS terminal to record sales.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{o.order_number}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{o.invoice_number || "-"}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(o.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {currency}{parseFloat(o.grand_total).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {o.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          o.payment_status === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : o.payment_status === "REFUNDED"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openOrderDetails(o.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{(page - 1) * pagination.limit + 1}</span> to{" "}
              <span className="font-semibold text-slate-800">{Math.min(page * pagination.limit, pagination.total)}</span> of{" "}
              <span className="font-semibold text-slate-800">{pagination.total}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-slate-600 px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ORDER DETAILS MODAL */}
      {detailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedOrder ? `Invoice #${selectedOrder.invoice_number}` : "Loading..."}
                </h3>
                {selectedOrder && (
                  <p className="text-[11px] text-slate-500">
                    Order: {selectedOrder.order_number} • Billed to: {selectedOrder.customer_name || "Walk-in"}
                  </p>
                )}
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetails || !selectedOrder ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((it: any) => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{it.product_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{it.sku || ""}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500">{currency}{parseFloat(it.unit_price).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">{currency}{parseFloat(it.total_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{currency}{parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  {parseFloat(selectedOrder.discount_total) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount Total:</span>
                      <span>-{currency}{parseFloat(selectedOrder.discount_total).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax Total:</span>
                    <span>{currency}{parseFloat(selectedOrder.tax_total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t pt-1.5">
                    <span>Grand Total:</span>
                    <span className="text-blue-600">{currency}{parseFloat(selectedOrder.grand_total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 flex gap-2">
                  {selectedOrder.invoice_id && (
                    <button
                      type="button"
                      onClick={() => handlePrint(selectedOrder.invoice_id)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF Invoice</span>
                    </button>
                  )}

                  <Link
                    href={`/dashboard/returns?invoice=${selectedOrder.invoice_id}`}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Return Items</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
