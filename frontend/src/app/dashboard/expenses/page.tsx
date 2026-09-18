"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building,
  Zap,
  Users,
  Package,
  Truck,
  Megaphone,
  HelpCircle,
  X
} from "lucide-react";

interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  notes?: string;
  created_by_name?: string;
}

export default function ExpensesPage() {
  const { currentBusiness, currentRole } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Add Expense Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("RENT");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchExpenses = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      let query = "";
      if (selectedCategory !== "ALL") {
        query = `?category=${selectedCategory}`;
      }
      const res = await apiRequest(`/expenses${query}`, {}, currentBusiness.id);
      if (res.success) {
        setExpenses(res.expenses || []);
        setTotalExpense(res.total_expense || 0);
      }
    } catch (err: any) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentBusiness, selectedCategory]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await apiRequest(
        "/expenses",
        {
          method: "POST",
          body: JSON.stringify({
            title,
            category,
            amount: parseFloat(amount),
            expense_date: expenseDate,
            notes
          })
        },
        currentBusiness.id
      );

      if (res.success) {
        setSuccessMessage(`Expense "${title}" recorded successfully!`);
        setShowAddModal(false);
        setTitle("");
        setAmount("");
        setNotes("");
        setExpenseDate(new Date().toISOString().split("T")[0]);
        fetchExpenses();
      } else {
        setErrorMessage(res.message || "Failed to record expense.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number, expenseTitle: string) => {
    if (!currentBusiness) return;
    if (!confirm(`Delete expense "${expenseTitle}"?`)) return;

    try {
      const res = await apiRequest(`/expenses/${id}`, { method: "DELETE" }, currentBusiness.id);
      if (res.success) {
        setSuccessMessage("Expense deleted.");
        fetchExpenses();
      }
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "RENT":
        return <Building className="w-4 h-4 text-blue-500" />;
      case "UTILITIES":
      case "ELECTRICITY":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "SALARY":
        return <Users className="w-4 h-4 text-purple-500" />;
      case "INVENTORY":
        return <Package className="w-4 h-4 text-emerald-500" />;
      case "TRANSPORT":
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case "MARKETING":
        return <Megaphone className="w-4 h-4 text-rose-500" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  const canManageExpenses = currentRole !== "CASHIER" && currentRole !== "STAFF";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expenses & Outflow</h1>
          <p className="text-sm text-slate-500">
            Track store overheads, supplier purchases, utility bills, and operating costs.
          </p>
        </div>
        {canManageExpenses && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setErrorMessage("");
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recorded Expense</span>
          <p className="text-2xl font-bold text-rose-600 mt-2">₹{parseFloat(String(totalExpense)).toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">{expenses.length} expense entries</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Filter</span>
          <p className="text-2xl font-bold text-slate-900 mt-2 capitalize">
            {selectedCategory === "ALL" ? "All Categories" : selectedCategory.toLowerCase()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Filtering expense records</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Entry</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₹{(expenses.length > 0 ? totalExpense / expenses.length : 0).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Per logged invoice</p>
        </div>
      </div>

      {/* Controls: Search & Category Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by title or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            {["ALL", "RENT", "UTILITIES", "SALARY", "INVENTORY", "TRANSPORT", "MARKETING", "OTHER"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={fetchExpenses}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg ml-1"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium text-xs uppercase tracking-wider">
                <th className="px-5 py-3">Expense Title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3 text-right">Amount</th>
                {canManageExpenses && <th className="px-5 py-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading expenses...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="w-10 h-10 text-slate-300" />
                      <p className="font-medium text-slate-600">No expenses found</p>
                      <p className="text-xs text-slate-400">Record recurring utility bills, supplier invoices, or staff wages.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(exp.category)}
                        <span>{exp.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(exp.expense_date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                      {exp.notes || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                      ₹{parseFloat(String(exp.amount)).toFixed(2)}
                    </td>
                    {canManageExpenses && (
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Record Store Expense</h3>
                  <p className="text-xs text-slate-500">Add operational costs to your cash flow ledger.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Store Rent or Electricity Bill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RENT">Rent</option>
                    <option value="UTILITIES">Utilities / Power</option>
                    <option value="SALARY">Staff Wages</option>
                    <option value="INVENTORY">Inventory Purchase</option>
                    <option value="TRANSPORT">Logistics / Transport</option>
                    <option value="MARKETING">Marketing & Ads</option>
                    <option value="OTHER">Other Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date Incurred</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid via UPI, invoice ref #4892"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm inline-flex items-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
