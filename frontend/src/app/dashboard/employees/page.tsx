"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  UserCheck,
  UserPlus,
  Shield,
  Search,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Trash2,
  RefreshCw,
  X,
  Lock,
  UserX
} from "lucide-react";

interface Employee {
  member_id: number;
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "CASHIER" | "STAFF";
  status: "ACTIVE" | "DEACTIVATED";
  joined_at: string;
}

export default function EmployeesPage() {
  const { currentBusiness, currentRole, user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add employee modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "CASHIER" | "STAFF">("CASHIER");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchEmployees = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const res = await apiRequest("/employees", {}, currentBusiness.id);
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentBusiness]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await apiRequest(
        "/employees",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            phone,
            password: password || "Password@123",
            role
          })
        },
        currentBusiness.id
      );

      if (res.success) {
        setSuccessMessage(`Employee ${name} added with role ${role}!`);
        setShowAddModal(false);
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setRole("CASHIER");
        fetchEmployees();
      } else {
        setErrorMessage(res.message || "Failed to add employee.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: string) => {
    if (!currentBusiness) return;
    try {
      const res = await apiRequest(
        `/employees/${memberId}/role`,
        {
          method: "PUT",
          body: JSON.stringify({ role: newRole })
        },
        currentBusiness.id
      );
      if (res.success) {
        setSuccessMessage("Role updated successfully.");
        fetchEmployees();
      }
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    if (!currentBusiness) return;
    const newStatus = employee.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    if (
      !confirm(
        `Are you sure you want to ${newStatus === "DEACTIVATED" ? "deactivate" : "reactivate"} ${employee.name}?`
      )
    ) {
      return;
    }

    try {
      const res = await apiRequest(
        `/employees/${employee.member_id}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: newStatus })
        },
        currentBusiness.id
      );
      if (res.success) {
        setSuccessMessage(`Employee status changed to ${newStatus}.`);
        fetchEmployees();
      }
    } catch (err: any) {
      alert("Failed to change status: " + err.message);
    }
  };

  const handleRemoveEmployee = async (memberId: number, memberName: string) => {
    if (!currentBusiness) return;
    if (!confirm(`Are you sure you want to completely remove ${memberName} from this business?`)) {
      return;
    }

    try {
      const res = await apiRequest(
        `/employees/${memberId}`,
        { method: "DELETE" },
        currentBusiness.id
      );
      if (res.success) {
        setSuccessMessage(`${memberName} was removed from the business.`);
        fetchEmployees();
      }
    } catch (err: any) {
      alert("Failed to remove employee: " + err.message);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canManageEmployees = currentRole === "OWNER" || currentRole === "ADMIN";

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "OWNER":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "ADMIN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "MANAGER":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "CASHIER":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employees & Staff</h1>
          <p className="text-sm text-slate-500">
            Manage your store team, configure role-based access control, and track member activity.
          </p>
        </div>
        {canManageEmployees && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setErrorMessage("");
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
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

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search team members by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchEmployees}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium text-xs uppercase tracking-wider">
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Joined</th>
                {canManageEmployees && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading team members...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="w-10 h-10 text-slate-300" />
                      <p className="font-medium text-slate-600">No staff members found</p>
                      <p className="text-xs text-slate-400">Add cashiers, managers, or admins to collaborate.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelf = user?.id === emp.user_id;
                  const isOwner = emp.role === "OWNER";
                  return (
                    <tr key={emp.member_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {emp.name}
                              {isSelf && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {canManageEmployees && !isOwner && !isSelf ? (
                          <select
                            value={emp.role}
                            onChange={(e) => handleUpdateRole(emp.member_id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border ${getRoleBadge(
                              emp.role
                            )} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="CASHIER">CASHIER</option>
                            <option value="STAFF">STAFF</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getRoleBadge(
                              emp.role
                            )}`}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {emp.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            emp.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {emp.phone || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(emp.joined_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      {canManageEmployees && (
                        <td className="px-5 py-3.5 text-right">
                          {!isOwner && !isSelf ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleStatus(emp)}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                {emp.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                              </button>
                              <button
                                onClick={() => handleRemoveEmployee(emp.member_id, emp.name)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove Employee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Protected</span>
                          )}
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

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Staff Member</h3>
                  <p className="text-xs text-slate-500">Assign role and grant portal access.</p>
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

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@quickbill.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  placeholder="Password@123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave blank to default to Password@123</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role & Permissions</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="CASHIER">CASHIER — POS Billing, Receipts, Customer Search</option>
                  <option value="MANAGER">MANAGER — Billing, Inventory, Returns, Reports</option>
                  <option value="ADMIN">ADMIN — Full store management, Staff, Settings</option>
                  <option value="STAFF">STAFF — Read-only catalog, Stock viewer</option>
                </select>
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
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
