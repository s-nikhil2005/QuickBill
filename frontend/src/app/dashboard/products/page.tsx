"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Filter,
  Check,
  Tag
} from "lucide-react";

export default function ProductsPage() {
  const { currentBusiness, currentRole } = useAuth();
  const currency = currentBusiness?.currency === "INR" ? "₹" : currentBusiness?.currency || "₹";

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    sku: "",
    barcode: "",
    brand: "",
    description: "",
    cost_price: "0",
    selling_price: "0",
    tax_rate: "0",
    discount: "0",
    current_stock: "0",
    min_stock_level: "5",
    unit: "pcs"
  });

  // Category Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      let query = `/products?page=${page}&limit=20`;
      if (debouncedSearch) query += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (selectedCat) query += `&category_id=${selectedCat}`;
      if (lowStockOnly) query += `&low_stock=true`;

      const res = await apiRequest(query, {}, currentBusiness.id);
      if (res.success && res.products) {
        setProducts(res.products);
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

  const fetchCategories = async () => {
    if (!currentBusiness) return;
    try {
      const res = await apiRequest("/products/categories/all", {}, currentBusiness.id);
      if (res.success && res.data) setCategories(res.data);
    } catch {}
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCat, lowStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [currentBusiness, debouncedSearch, selectedCat, lowStockOnly, page]);

  useEffect(() => {
    fetchCategories();
  }, [currentBusiness]);

  const openAddModal = () => {
    setEditProductId(null);
    setFormData({
      name: "",
      category_id: categories.length > 0 ? categories[0].id.toString() : "",
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: "",
      brand: "",
      description: "",
      cost_price: "0",
      selling_price: "0",
      tax_rate: "0",
      discount: "0",
      current_stock: "10",
      min_stock_level: "5",
      unit: "pcs"
    });
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditProductId(p.id);
    setFormData({
      name: p.name,
      category_id: p.category_id ? p.category_id.toString() : "",
      sku: p.sku || "",
      barcode: p.barcode || "",
      brand: p.brand || "",
      description: p.description || "",
      cost_price: String(p.cost_price),
      selling_price: String(p.selling_price),
      tax_rate: String(p.tax_rate),
      discount: String(p.discount),
      current_stock: String(p.current_stock),
      min_stock_level: String(p.min_stock_level),
      unit: p.unit || "pcs"
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !currentBusiness) return;
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        description: formData.description.trim() || undefined,
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        discount: parseFloat(formData.discount) || 0,
        current_stock: parseInt(formData.current_stock, 10) || 0,
        min_stock_level: parseInt(formData.min_stock_level, 10) || 5,
        unit: formData.unit
      };

      if (editProductId) {
        await apiRequest(`/products/${editProductId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        }, currentBusiness.id);
      } else {
        await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(payload)
        }, currentBusiness.id);
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate/delete this product?")) return;
    if (!currentBusiness) return;

    try {
      await apiRequest(`/products/${id}`, { method: "DELETE" }, currentBusiness.id);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !currentBusiness) return;

    try {
      const res = await apiRequest("/products/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCatName.trim() })
      }, currentBusiness.id);

      if (res.success) {
        setNewCatName("");
        setCategoryModalOpen(false);
        fetchCategories();
      }
    } catch (err: any) {
      alert(err.message || "Failed to create category");
    }
  };

  const canManage = !["CASHIER", "STAFF"].includes(currentRole || "");

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Product Catalog</h1>
          <p className="text-xs text-slate-500">
            Manage your store inventory, SKUs, barcode tracking, and retail pricing.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Categories</span>
            </button>

            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, barcode..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCat || ""}
            onChange={(e) => setSelectedCat(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              lowStockOnly
                ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {lowStockOnly ? "Low Stock (Filtered)" : "Show Low Stock"}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Tax Rate</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mb-2 mx-auto stroke-[1.5]" />
                    <p className="font-semibold text-sm">No products found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add Product&quot; to build your catalog.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.current_stock <= p.min_stock_level;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.brand && <div className="text-[10px] text-slate-400">{p.brand}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {p.category_name || "Uncategorized"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        <div>{p.sku || "-"}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400">{p.barcode}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {currency}{parseFloat(p.cost_price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {currency}{parseFloat(p.selling_price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            p.current_stock <= 0
                              ? "bg-rose-100 text-rose-700"
                              : isLow
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {p.current_stock} {p.unit || "pcs"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {parseFloat(p.tax_rate)}%
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
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
              <span className="font-semibold text-slate-800">{pagination.total}</span> products
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

      {/* MODAL: ADD / EDIT PRODUCT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editProductId ? "Edit Product" : "Add New Product"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Basmati Rice 1kg"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. India Gate"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. RICE-1KG"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock Warning Level</label>
                  <input
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
                  <select
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                  >
                    <option value="0">0% (GST Exempt)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. pcs, kg, litre, pack"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editProductId ? "Save Changes" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE CATEGORIES */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Manage Categories</h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New Category Name..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
              >
                Add
              </button>
            </form>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
              {categories.map((cat) => (
                <div key={cat.id} className="p-2 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
