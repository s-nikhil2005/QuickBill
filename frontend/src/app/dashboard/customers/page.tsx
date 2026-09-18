"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Receipt,
  Loader2,
  X,
  IndianRupee,
  ShoppingBag
} from "lucide-react";

export default function CustomersPage() {
  const { currentBusiness } = useAuth();
  const currency = currentBusiness?.currency === "INR" ? "₹" : currentBusiness?.currency || "₹";

  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);

  // Add Customer Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newCust, setNewCust] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // View Customer Profile Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchCustomers = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      let query = `/customers?page=${page}&limit=20`;
      if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
      const res = await apiRequest(query, {}, currentBusiness.id);
      if (res.success && res.customers) {
        setCustomers(res.customers);
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
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [currentBusiness, debouncedSearch, page]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name.trim() || !currentBusiness) return;
    setSubmitting(true);

    try {
      await apiRequest("/customers", {
        method: "POST",
        body: JSON.stringify(newCust)
      }, currentBusiness.id);

      setModalOpen(false);
      setNewCust({ name: "", phone: "", email: "", address: "", gstin: "" });
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || "Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  };

  const openProfile = async (customer: any) => {
    if (!currentBusiness) return;
    setSelectedProfile(customer);
    setProfileModalOpen(true);
    setProfileLoading(true);

    try {
      const res = await apiRequest(`/customers/${customer.id}`, {}, currentBusiness.id);
      if (res.success && res.data) {
        setSelectedProfile(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Customer Management</h1>
          <p className="text-xs text-slate-500">
            Track walk-in and registered customer relationships, purchase totals, and order history.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mb-2 mx-auto stroke-[1.5]" />
                    <p className="font-semibold text-sm">No customers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Customers are created automatically during checkout or manually.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      {c.address && <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.phone || "No phone"}</div>
                      {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {c.order_count}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-blue-600">
                      {currency}{parseFloat(c.total_purchases).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {c.last_purchase_date
                        ? new Date(c.last_purchase_date).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openProfile(c)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold text-xs transition"
                      >
                        View History
                      </button>
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
              <span className="font-semibold text-slate-800">{pagination.total}</span> customers
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

      {/* ADD CUSTOMER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Add Customer</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="Street / Colony"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  {submitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE & INVOICES MODAL */}
      {profileModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedProfile.name}</h3>
                <p className="text-xs text-slate-500">{selectedProfile.phone || "No phone registered"}</p>
              </div>
              <button onClick={() => setProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
                <div className="text-[10px] font-semibold uppercase">Total Purchases</div>
                <div className="text-lg font-extrabold mt-0.5">
                  {currency}{parseFloat(selectedProfile.total_purchases || 0).toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 text-slate-800">
                <div className="text-[10px] font-semibold uppercase">Total Orders</div>
                <div className="text-lg font-extrabold mt-0.5">{selectedProfile.order_count || 0} Bills</div>
              </div>
            </div>

            {/* Invoice History */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Past Invoices</div>
              {profileLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : selectedProfile.recent_invoices && selectedProfile.recent_invoices.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedProfile.recent_invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-blue-600">{inv.invoice_number}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(inv.created_at).toLocaleDateString()} • {inv.payment_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{currency}{parseFloat(inv.grand_total).toFixed(2)}</div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                          {inv.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No past invoices found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
