"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  FileText,
  RotateCcw,
  BarChart3,
  UserCheck,
  Wallet,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Building2,
  Store,
  Menu,
  X,
  Plus
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, businesses, currentBusiness, currentRole, setCurrentBusiness, logout, isLoading } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Fetch low stock alerts count periodically
  useEffect(() => {
    if (currentBusiness) {
      apiRequest("/inventory/low-stock", {}, currentBusiness.id)
        .then((res) => {
          if (res.success && res.data) {
            setLowStockCount(res.data.length);
          }
        })
        .catch(() => {});
    }
  }, [currentBusiness, pathname]);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (!isLoading && user && (!businesses || businesses.length === 0)) {
      router.push("/onboarding");
    }
  }, [user, businesses, isLoading, router]);

  if (isLoading || !user || !currentBusiness) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading QuickBill workspace...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/billing", label: "POS / Billing", icon: ShoppingCart, highlight: true },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/inventory", label: "Inventory", icon: Boxes, badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/orders", label: "Orders & Invoices", icon: FileText },
    { href: "/dashboard/returns", label: "Returns & Refunds", icon: RotateCcw },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3, roleRestricted: ["CASHIER"] },
    { href: "/dashboard/employees", label: "Employees", icon: UserCheck, roleRestricted: ["CASHIER", "STAFF"] },
    { href: "/dashboard/expenses", label: "Expenses", icon: Wallet, roleRestricted: ["CASHIER"] },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, roleRestricted: ["CASHIER", "STAFF"] },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Nav */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">Q</div>
          <span className="font-bold text-slate-900">{currentBusiness.name}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand & Business Switcher */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <button
                type="button"
                onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 transition text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {currentBusiness.name}
                    </div>
                    <div className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                      <span>{currentBusiness.role}</span>
                      <span>•</span>
                      <span>{currentBusiness.currency}</span>
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {bizDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                    Switch Business
                  </div>
                  {businesses.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => {
                        setCurrentBusiness(biz);
                        setBizDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                        biz.id === currentBusiness.id ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700"
                      }`}
                    >
                      <span className="truncate">{biz.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">
                        {biz.role}
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <Link
                      href="/onboarding"
                      onClick={() => setBizDropdownOpen(false)}
                      className="w-full text-left px-3 py-1.5 text-xs text-blue-600 font-semibold flex items-center gap-1.5 hover:bg-blue-50 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Store</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-1">
            {navLinks.map((item) => {
              if (item.roleRestricted && item.roleRestricted.includes(currentRole || "")) {
                return null;
              }

              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : item.highlight
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`w-4 h-4 ${isActive ? "text-white" : item.highlight ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {currentBusiness.name}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800 capitalize">
              {pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {lowStockCount > 0 && (
              <Link
                href="/dashboard/inventory"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
              >
                <Bell className="w-3.5 h-3.5 text-rose-600" />
                <span>{lowStockCount} Products Low Stock</span>
              </Link>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 font-medium">POS Terminal Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
