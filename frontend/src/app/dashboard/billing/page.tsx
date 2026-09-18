"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  UserPlus,
  ShoppingCart
} from "lucide-react";

interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  quantity: number;
  max_stock: number;
  tax_rate: number;
  discount: number;
}

export default function BillingPOSPage() {
  const { currentBusiness } = useAuth();
  const currency = currentBusiness?.currency === "INR" ? "₹" : currentBusiness?.currency || "₹";

  // Product Search & Scan State
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<string>("0");

  // Customer State
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "BANK_TRANSFER">("CASH");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Completed Order / Receipt Modal
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Status & Feedback
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products & categories & customers
  useEffect(() => {
    if (!currentBusiness) return;

    // Fetch Products
    setLoadingProducts(true);
    apiRequest("/products?limit=100", {}, currentBusiness.id)
      .then((res) => {
        if (res.success && res.products) setProducts(res.products);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingProducts(false));

    // Fetch Categories
    apiRequest("/products/categories/all", {}, currentBusiness.id)
      .then((res) => {
        if (res.success && res.data) setCategories(res.data);
      })
      .catch(() => {});

    // Fetch Customers
    apiRequest("/customers?limit=100", {}, currentBusiness.id)
      .then((res) => {
        if (res.success && res.customers) setCustomers(res.customers);
      })
      .catch(() => {});
  }, [currentBusiness]);

  // Focus barcode on load
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Handle barcode submission
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code || !currentBusiness) return;

    setErrorMsg(null);
    try {
      const res = await apiRequest(`/products/barcode/${encodeURIComponent(code)}`, {}, currentBusiness.id);
      if (res.success && res.data) {
        addToCart(res.data);
        setBarcodeInput("");
      }
    } catch {
      // Local fallback: search existing loaded products
      const found = products.find((p) => p.barcode === code || p.sku === code);
      if (found) {
        addToCart(found);
        setBarcodeInput("");
      } else {
        setErrorMsg(`Product with barcode "${code}" not found.`);
      }
    }
  };

  // Add product to cart
  const addToCart = (p: any) => {
    setErrorMsg(null);
    if (p.current_stock <= 0) {
      setErrorMsg(`"${p.name}" is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product_id === p.id);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        if (item.quantity >= p.current_stock) {
          setErrorMsg(`Cannot add more than available stock (${p.current_stock}) for "${p.name}".`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...item, quantity: item.quantity + 1 };
        return updated;
      } else {
        return [
          ...prev,
          {
            product_id: p.id,
            name: p.name,
            sku: p.sku || "",
            barcode: p.barcode || "",
            price: parseFloat(p.selling_price) || 0,
            quantity: 1,
            max_stock: p.current_stock,
            tax_rate: parseFloat(p.tax_rate) || 0,
            discount: parseFloat(p.discount) || 0,
          },
        ];
      }
    });
  };

  // Adjust Quantity
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.max_stock) {
              setErrorMsg(`Maximum stock available for "${item.name}" is ${item.max_stock}.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove Item
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Direct Quantity Setting
  const setDirectQuantity = (productId: number, qty: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            if (qty <= 0) return null;
            if (qty > item.max_stock) {
              setErrorMsg(`Maximum stock available for "${item.name}" is ${item.max_stock}.`);
            }
            const clamped = Math.min(qty, item.max_stock);
            return { ...item, quantity: clamped };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Calculations (real-time mirror of server logic)
  const subtotal = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const itemsDiscountTotal = cart.reduce((sum, it) => sum + (it.discount || 0) * it.quantity, 0);
  const parsedCartDiscount = Math.max(0, parseFloat(cartDiscount) || 0);
  const totalDiscount = itemsDiscountTotal + parsedCartDiscount;

  const taxTotal = cart.reduce((sum, it) => {
    const itemSub = it.price * it.quantity;
    const taxable = Math.max(0, itemSub - (it.discount || 0) * it.quantity);
    return sum + (taxable * it.tax_rate) / 100;
  }, 0);

  const grandTotal = Math.max(0, Math.round((subtotal + taxTotal - totalDiscount) * 100) / 100);

  // Cash Change Calculation
  const tendered = parseFloat(amountTendered) || 0;
  const changeDue = paymentMethod === "CASH" && tendered >= grandTotal ? tendered - grandTotal : 0;

  // Checkout Execution
  const handleCheckout = async () => {
    if (cart.length === 0 || !currentBusiness) return;
    setErrorMsg(null);
    setCheckoutLoading(true);

    try {
      const payload = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || "Walk-in Customer",
        customer_phone: selectedCustomer?.phone || null,
        items: cart.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          discount_amount: it.discount * it.quantity,
        })),
        cart_discount: parsedCartDiscount,
        payment_method: paymentMethod,
        payment_status: "PAID",
        notes: notes.trim() || undefined,
      };

      const res = await apiRequest("/billing/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      }, currentBusiness.id);

      if (res.success && res.data) {
        setCompletedOrder(res.data);
        setReceiptModalOpen(true);
        // Reset Cart
        setCart([]);
        setCartDiscount("0");
        setAmountTendered("");
        setNotes("");
        setSelectedCustomer(null);

        // Refresh product stock in background
        apiRequest("/products?limit=100", {}, currentBusiness.id)
          .then((pRes) => {
            if (pRes.success && pRes.products) setProducts(pRes.products);
          });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Checkout failed. Please check stock levels.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Keyboard Shortcuts (F2 = Scan, F4 = Checkout, Escape = Dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0 && !checkoutLoading) {
          handleCheckout();
        }
      } else if (e.key === "Escape") {
        setCustomerModalOpen(false);
        setReceiptModalOpen(false);
        setErrorMsg(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, checkoutLoading, currentBusiness, selectedCustomer, parsedCartDiscount, paymentMethod, amountTendered, notes]);

  // Quick Customer Creation
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !currentBusiness) return;

    try {
      const res = await apiRequest("/customers", {
        method: "POST",
        body: JSON.stringify({ name: newCustName, phone: newCustPhone }),
      }, currentBusiness.id);

      if (res.success && res.data) {
        setCustomers((prev) => [res.data, ...prev]);
        setSelectedCustomer(res.data);
        setCustomerModalOpen(false);
        setNewCustName("");
        setNewCustPhone("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add customer");
    }
  };

  // Filtered Products for Display
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchQuery));

    const matchesCategory =
      selectedCategory === null || p.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* LEFT SECTION: PRODUCT SEARCH & GRID */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 overflow-hidden">
        {/* Top Search & Barcode Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
          {/* Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} className="sm:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Barcode className="w-4 h-4 text-blue-600" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode (Enter)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </form>

          {/* Text Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by name, brand, SKU..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 shrink-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === null
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loadingProducts ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Search className="w-8 h-8 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold">No products match your search</p>
              <p className="text-xs text-slate-400 mt-1">Try scanning a barcode or clearing filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.current_stock <= 0;
                const inCart = cart.find((it) => it.product_id === p.id);

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between relative group ${
                      isOutOfStock
                        ? "opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed"
                        : inCart
                        ? "bg-blue-50/50 border-blue-300 shadow-xs"
                        : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs"
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}

                    <div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {p.sku || p.barcode || "NO-SKU"}
                      </div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5">
                        {p.name}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-blue-600">
                        {currency}{parseFloat(p.selling_price).toFixed(2)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-700"
                            : p.current_stock <= p.min_stock_level
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isOutOfStock ? "Out" : `${p.current_stock} ${p.unit || ""}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: CART & CHECKOUT PANEL */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between shrink-0">
        {/* Customer Select Header */}
        <div className="border-b border-slate-100 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</span>
            <button
              type="button"
              onClick={() => setCustomerModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ New Customer</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                const cust = customers.find((c) => c.id === id);
                setSelectedCustomer(cust || null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
            >
              <option value="">Walk-in Customer (Default)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto my-3 space-y-2.5 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-8 h-8 mb-2 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-700">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan barcode or click items to start billing.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-bold text-slate-900 truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {currency}{item.price.toFixed(2)} each {item.tax_rate > 0 ? `(+${item.tax_rate}% tax)` : ""}
                  </div>
                </div>

                {/* Quantity triggers */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
                  >
                    <Minus className="w-3 h-3 text-slate-600" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.max_stock}
                    value={item.quantity}
                    onChange={(e) => setDirectQuantity(item.product_id, parseInt(e.target.value, 10) || 1)}
                    className="w-10 text-center font-bold text-slate-800 text-xs border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
                  >
                    <Plus className="w-3 h-3 text-slate-600" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 flex items-center justify-center ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Payment Methods */}
        <div className="border-t border-slate-200 pt-3 space-y-3">
          {/* Discount & Totals */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-800">{currency}{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Cart Discount:</span>
              <div className="flex items-center gap-1">
                <span>- {currency}</span>
                <input
                  type="number"
                  min="0"
                  value={cartDiscount}
                  onChange={(e) => setCartDiscount(e.target.value)}
                  className="w-16 px-1.5 py-0.5 rounded border border-slate-200 text-right font-bold text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <span>Tax Total:</span>
              <span>{currency}{taxTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t pt-2">
              <span>Total Payable:</span>
              <span className="text-blue-600">{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {(["CASH", "UPI", "CARD", "BANK_TRANSFER"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase transition flex flex-col items-center gap-1 border ${
                  paymentMethod === method
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {method === "CASH" && <Banknote className="w-3.5 h-3.5" />}
                {method === "UPI" && <QrCode className="w-3.5 h-3.5" />}
                {method === "CARD" && <CreditCard className="w-3.5 h-3.5" />}
                {method === "BANK_TRANSFER" && <FileText className="w-3.5 h-3.5" />}
                <span>{method === "BANK_TRANSFER" ? "Bank" : method}</span>
              </button>
            ))}
          </div>

          {/* Cash Tendered & Change Due */}
          {paymentMethod === "CASH" && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              {/* Quick Cash Denomination Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase shrink-0">Quick:</span>
                <button
                  type="button"
                  onClick={() => setAmountTendered(grandTotal.toString())}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 font-bold text-[10px] text-blue-600 shrink-0"
                >
                  Exact
                </button>
                {[100, 200, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountTendered(amt.toString())}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 font-bold text-[10px] text-slate-700 shrink-0"
                  >
                    +{currency}{amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Cash Received</span>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={`${grandTotal}`}
                    className="w-24 px-2 py-1 rounded border border-slate-300 font-bold text-xs"
                  />
                </div>
                {changeDue > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-emerald-600 block">Change Due</span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {currency}{changeDue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Sale (F4) — {currency}{grandTotal.toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL: ADD CUSTOMER */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Add New Customer</h3>
              <button onClick={() => setCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETED ORDER / RECEIPT PRINT */}
      {receiptModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Sale Completed Successfully!</h3>
              <p className="text-xs text-slate-500">Invoice #{completedOrder.invoice_number}</p>
            </div>

            {/* Printable Thermal Receipt Container */}
            <div id="printable-invoice" className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs space-y-3 font-mono">
              <div className="text-center border-b pb-2">
                <div className="font-bold text-sm text-slate-900 uppercase">{currentBusiness?.name || "QuickBill Store"}</div>
                <div className="text-[10px] text-slate-500">{new Date().toLocaleString()}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">Inv: {completedOrder.invoice_number}</div>
              </div>

              <div className="divide-y divide-slate-200 text-[11px]">
                {completedOrder.items.map((it: any, i: number) => (
                  <div key={i} className="py-1.5 flex justify-between">
                    <div>
                      <span className="font-bold">{it.product_name}</span>
                      <div className="text-[10px] text-slate-500">{it.quantity} x {currency}{it.unit_price}</div>
                    </div>
                    <span className="font-bold">{currency}{it.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currency}{completedOrder.subtotal.toFixed(2)}</span>
                </div>
                {completedOrder.discount_total > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{currency}{completedOrder.discount_total.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{currency}{completedOrder.tax_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t pt-1">
                  <span>Grand Total:</span>
                  <span>{currency}{completedOrder.grand_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Payment:</span>
                  <span>{completedOrder.payment_method}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 border-t pt-2">
                Thank you for shopping with us!
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
              >
                Next Customer (New Sale)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
