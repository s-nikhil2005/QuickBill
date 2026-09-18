"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  Receipt,
  Eye,
  X
} from "lucide-react";

interface ReturnItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity_ordered: number;
  quantity_to_return: number;
}

interface ReturnRecord {
  id: number;
  return_number: string;
  invoice_id: number;
  invoice_number: string;
  total_refund: number;
  reason: string;
  created_at: string;
  processed_by_name?: string;
  items?: any[];
}

export default function ReturnsPage() {
  const { currentBusiness, currentRole } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [returnsList, setReturnsList] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // New return modal / wizard state
  const [showNewReturnModal, setShowNewReturnModal] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [searchingInvoice, setSearchingInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState("Defective or Damaged");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // View return details modal
  const [viewReturn, setViewReturn] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchReturns = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const res = await apiRequest("/returns", {}, currentBusiness.id);
      if (res.success && res.data) {
        setReturnsList(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load returns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [currentBusiness]);

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceSearch.trim() || !currentBusiness) return;

    setSearchingInvoice(true);
    setErrorMessage("");
    setSelectedInvoice(null);
    setReturnItems([]);

    try {
      // First search in invoices list
      const res = await apiRequest(`/invoices?search=${encodeURIComponent(invoiceSearch.trim())}&limit=5`, {}, currentBusiness.id);
      if (res.success && res.data?.invoices?.length > 0) {
        const found = res.data.invoices[0];
        // Now fetch full invoice details with items
        const detailRes = await apiRequest(`/invoices/${found.id}`, {}, currentBusiness.id);
        if (detailRes.success && detailRes.data) {
          setSelectedInvoice(detailRes.data);
          const items: ReturnItem[] = (detailRes.data.items || []).map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.product_sku || "N/A",
            unit_price: parseFloat(item.unit_price) || 0,
            quantity_ordered: item.quantity,
            quantity_to_return: 0
          }));
          setReturnItems(items);
        } else {
          setErrorMessage("Could not load invoice line items.");
        }
      } else {
        setErrorMessage(`No invoice found matching "${invoiceSearch}". Verify invoice number.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to find invoice.");
    } finally {
      setSearchingInvoice(false);
    }
  };

  const handleQuantityChange = (productId: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const clamped = Math.max(0, Math.min(qty, item.quantity_ordered));
          return { ...item, quantity_to_return: clamped };
        }
        return item;
      })
    );
  };

  const totalRefundAmount = returnItems.reduce(
    (sum, item) => sum + item.quantity_to_return * item.unit_price,
    0
  );

  const totalItemsToReturn = returnItems.reduce((sum, item) => sum + item.quantity_to_return, 0);

  const handleProcessReturn = async () => {
    if (!selectedInvoice || !currentBusiness) return;
    const itemsToSubmit = returnItems
      .filter((it) => it.quantity_to_return > 0)
      .map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity_to_return
      }));

    if (itemsToSubmit.length === 0) {
      setErrorMessage("Please select at least 1 item to return.");
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    try {
      const res = await apiRequest(
        "/returns/process",
        {
          method: "POST",
          body: JSON.stringify({
            invoice_id: selectedInvoice.id,
            items: itemsToSubmit,
            reason: returnReason
          })
        },
        currentBusiness.id
      );

      if (res.success) {
        setSuccessMessage(`Return #${res.return_number} processed successfully! Stock has been restored.`);
        setShowNewReturnModal(false);
        setSelectedInvoice(null);
        setReturnItems([]);
        fetchReturns();
      } else {
        setErrorMessage(res.message || "Failed to process return.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during return processing.");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = async (returnRecord: ReturnRecord) => {
    if (!currentBusiness) return;
    setLoadingDetails(true);
    setViewReturn(returnRecord);
    try {
      const res = await apiRequest(`/returns/${returnRecord.id}`, {}, currentBusiness.id);
      if (res.success && res.data) {
        setViewReturn(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredReturns = returnsList.filter(
    (r) =>
      r.return_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reason && r.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const canProcessReturn = currentRole !== "CASHIER" && currentRole !== "STAFF";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Returns & Refunds</h1>
          <p className="text-sm text-slate-500">
            Process customer returns, issue refunds, and automatically restore inventory stocks.
          </p>
        </div>
        {canProcessReturn ? (
          <button
            onClick={() => {
              setShowNewReturnModal(true);
              setErrorMessage("");
              setSuccessMessage("");
              setSelectedInvoice(null);
              setReturnItems([]);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Process New Return
          </button>
        ) : (
          <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            Manager or Admin role required to process refunds.
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="ml-auto text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by return number, invoice number, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchReturns}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium text-xs uppercase tracking-wider">
                <th className="px-5 py-3">Return #</th>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Processed By</th>
                <th className="px-5 py-3 text-right">Refund Amount</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading returns...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RotateCcw className="w-10 h-10 text-slate-300" />
                      <p className="font-medium text-slate-600">No returns found</p>
                      <p className="text-xs text-slate-400">
                        {searchQuery ? "Try refining your search query" : "Processed customer refunds will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                      {item.return_number}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{item.invoice_number}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {new Date(item.created_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {item.reason || "Return"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {item.processed_by_name || "Admin"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                      -₹{parseFloat(String(item.total_refund)).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROCESS RETURN MODAL */}
      {showNewReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Process Return & Restock</h3>
                  <p className="text-xs text-slate-500">Lookup original invoice, pick items, and issue refund.</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewReturnModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Invoice Lookup */}
            {!selectedInvoice ? (
              <form onSubmit={handleSearchInvoice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Step 1: Enter Invoice Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-1001"
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      required
                      className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={searchingInvoice}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl inline-flex items-center gap-2"
                    >
                      {searchingInvoice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Find
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Tip: You can find invoice numbers in the Orders & Invoices tab.
                  </p>
                </div>
              </form>
            ) : (
              /* Step 2: Select Items to Return */
              <div className="space-y-5">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Invoice: </span>
                    <strong className="text-slate-800 font-mono text-sm">{selectedInvoice.invoice_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Customer: </span>
                    <strong className="text-slate-800">{selectedInvoice.customer_name || "Walk-in Customer"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Paid: </span>
                    <strong className="text-emerald-700 font-bold">₹{parseFloat(selectedInvoice.grand_total).toFixed(2)}</strong>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedInvoice(null);
                      setReturnItems([]);
                    }}
                    className="text-blue-600 hover:underline font-semibold ml-auto"
                  >
                    Change Invoice
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Step 2: Choose Items & Quantity to Refund
                  </label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {returnItems.map((item) => (
                      <div key={item.product_id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{item.product_name}</p>
                          <p className="text-slate-400">
                            Unit Price: ₹{item.unit_price.toFixed(2)} | Ordered: {item.quantity_ordered}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-slate-500 font-medium">Return Qty:</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity_ordered}
                            value={item.quantity_to_return}
                            onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value, 10) || 0)}
                            className="w-16 px-2 py-1 text-center font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Return Reason
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Defective or Damaged">Defective or Damaged</option>
                    <option value="Customer Changed Mind">Customer Changed Mind</option>
                    <option value="Wrong Item Purchased">Wrong Item Purchased</option>
                    <option value="Expired Product">Expired Product</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Refund Summary Box */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Items to Restock: <strong>{totalItemsToReturn} units</strong></p>
                    <p className="text-xs text-slate-500">Inventory will automatically be credited back.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Refund</p>
                    <p className="text-xl font-bold text-rose-600">₹{totalRefundAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewReturnModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessReturn}
                    disabled={processing || totalItemsToReturn === 0}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 shadow-sm"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Restocking & Refunding...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Refund & Restock
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RETURN DETAILS MODAL */}
      {viewReturn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{viewReturn.return_number}</h3>
                <p className="text-xs text-slate-500">Invoice: {viewReturn.invoice_number}</p>
              </div>
              <button
                onClick={() => setViewReturn(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400">Date:</span>
                  <p className="font-semibold text-slate-800">
                    {new Date(viewReturn.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Processed By:</span>
                  <p className="font-semibold text-slate-800">{viewReturn.processed_by_name || "Admin"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Reason:</span>
                  <p className="font-semibold text-slate-800">{viewReturn.reason || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  Returned Items
                </p>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {loadingDetails ? (
                    <div className="p-4 text-center text-slate-400">Loading item breakdown...</div>
                  ) : viewReturn.items && viewReturn.items.length > 0 ? (
                    viewReturn.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{item.product_name}</p>
                          <p className="text-[10px] text-slate-400">Restocked: {item.quantity} units</p>
                        </div>
                        <p className="font-bold text-rose-600">₹{parseFloat(item.refund_amount).toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400">No items available</div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl flex items-center justify-between text-sm">
                <span className="font-semibold text-rose-800">Total Refunded</span>
                <span className="font-bold text-rose-700 text-base">
                  ₹{parseFloat(String(viewReturn.total_refund)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewReturn(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
