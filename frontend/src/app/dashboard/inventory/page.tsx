"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  Boxes,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  History,
  Loader2,
  X,
  Search,
  Filter
} from "lucide-react";

export default function InventoryPage() {
  const { currentBusiness, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"stocks" | "movements">("stocks");

  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<"RESTOCK" | "DAMAGE" | "ADJUSTMENT" | "PURCHASE">("RESTOCK");
  const [adjustQuantity, setAdjustQuantity] = useState("1");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsPagination, setMovementsPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1
  });

  const fetchInventory = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const pRes = await apiRequest("/products?limit=100", {}, currentBusiness.id);
      if (pRes.success && pRes.products) setProducts(pRes.products);

      const mRes = await apiRequest(`/inventory/movements?page=${movementsPage}&limit=25`, {}, currentBusiness.id);
      if (mRes.success) {
        setMovements(Array.isArray(mRes.data) ? mRes.data : mRes.movements || []);
        if (mRes.pagination) {
          setMovementsPagination(mRes.pagination);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [currentBusiness, movementsPage]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !currentBusiness) return;
    setSubmitting(true);

    try {
      await apiRequest("/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          product_id: selectedProduct.id,
          type: adjustType,
          quantity: parseInt(adjustQuantity, 10),
          is_deduction: adjustType === "DAMAGE",
          notes: adjustNotes.trim() || undefined
        })
      }, currentBusiness.id);

      setAdjustModalOpen(false);
      setAdjustNotes("");
      setAdjustQuantity("1");
      fetchInventory();
    } catch (err: any) {
      alert(err.message || "Failed to adjust inventory");
    } finally {
      setSubmitting(false);
    }
  };

  const openAdjust = (p: any) => {
    setSelectedProduct(p);
    setAdjustType("RESTOCK");
    setAdjustQuantity("5");
    setAdjustNotes("");
    setAdjustModalOpen(true);
  };

  const canManage = !["CASHIER", "STAFF"].includes(currentRole || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Inventory & Stock Control</h1>
          <p className="text-xs text-slate-500">
            Real-time stock levels, replenishment, shrinkage tracking, and movement audit trails.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              if (products.length > 0) openAdjust(products[0]);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Adjust Stock</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("stocks")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "stocks"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Stock Levels ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "movements"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Movement History ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: STOCKS */}
      {activeTab === "stocks" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Min Threshold</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Quick Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isOut = p.current_stock <= 0;
                    const isLow = p.current_stock <= p.min_stock_level;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku || p.barcode || "-"}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-800 text-sm">
                          {p.current_stock} {p.unit || "pcs"}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500">
                          {p.min_stock_level} {p.unit || "pcs"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-700">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-700">
                              Low Stock Warning
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-700">
                              Adequate Stock
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openAdjust(p)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold text-xs transition"
                            >
                              Adjust / Restock
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MOVEMENTS HISTORY */}
      {activeTab === "movements" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">Change</th>
                  <th className="py-3 px-4 text-center">Before → After</th>
                  <th className="py-3 px-4">Reference & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isPositive = m.quantity_change > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(m.created_at).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{m.product_name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              m.type === "SALE"
                                ? "bg-blue-50 text-blue-700"
                                : m.type === "RESTOCK" || m.type === "PURCHASE"
                                ? "bg-emerald-50 text-emerald-700"
                                : m.type === "RETURN"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-xs">
                          <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                            {isPositive ? `+${m.quantity_change}` : m.quantity_change}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">
                          {m.quantity_before} → {m.quantity_after}
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                          {m.notes || m.reference_id || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Movement Pagination Controls */}
          {movementsPagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <p className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-800">{(movementsPage - 1) * movementsPagination.limit + 1}</span> to{" "}
                <span className="font-semibold text-slate-800">{Math.min(movementsPage * movementsPagination.limit, movementsPagination.total)}</span> of{" "}
                <span className="font-semibold text-slate-800">{movementsPagination.total}</span> movements
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={movementsPage <= 1}
                  onClick={() => setMovementsPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-slate-600 px-2">
                  Page {movementsPage} of {movementsPagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={movementsPage >= movementsPagination.totalPages}
                  onClick={() => setMovementsPage(p => Math.min(movementsPagination.totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Adjust Inventory</h3>
                <p className="text-[11px] text-slate-500">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Reason</label>
                <select
                  value={adjustType}
                  onChange={(e: any) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold outline-none bg-white"
                >
                  <option value="RESTOCK">Restock / Fresh Shipment (+)</option>
                  <option value="PURCHASE">Purchase Order (+)</option>
                  <option value="ADJUSTMENT">Inventory Audit Adjustment (+)</option>
                  <option value="DAMAGE">Damaged / Broken / Expired (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold outline-none"
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  Current stock: <strong>{selectedProduct.current_stock}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Received shipment from distributor..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  {submitting ? "Updating..." : "Commit Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
