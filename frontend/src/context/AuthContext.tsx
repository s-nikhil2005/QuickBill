"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface BusinessSummary {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  currency: string;
  invoice_prefix: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "CASHIER" | "STAFF";
  status: string;
}

interface AuthContextType {
  user: User | null;
  businesses: BusinessSummary[];
  currentBusiness: BusinessSummary | null;
  currentRole: string | null;
  isLoading: boolean;
  setCurrentBusiness: (biz: BusinessSummary) => void;
  login: (userData: User, bizList: BusinessSummary[], token?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [currentBusiness, setCurrentBusinessState] = useState<BusinessSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const res = await apiRequest<{ user: User; businesses: BusinessSummary[] }>("/auth/me");
      if (res.success && res.data) {
        setUser(res.data.user);
        setBusinesses(res.data.businesses || []);

        // Restore or pick active business
        const savedBizId = localStorage.getItem("qb_active_business_id");
        let active = res.data.businesses.find(b => b.id.toString() === savedBizId);
        if (!active && res.data.businesses.length > 0) {
          active = res.data.businesses[0];
        }

        if (active) {
          setCurrentBusinessState(active);
          localStorage.setItem("qb_active_business_id", active.id.toString());
        }
      } else {
        setUser(null);
        setBusinesses([]);
        setCurrentBusinessState(null);
      }
    } catch {
      setUser(null);
      setBusinesses([]);
      setCurrentBusinessState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const setCurrentBusiness = (biz: BusinessSummary) => {
    setCurrentBusinessState(biz);
    localStorage.setItem("qb_active_business_id", biz.id.toString());
  };

  const login = (userData: User, bizList: BusinessSummary[]) => {
    setUser(userData);
    setBusinesses(bizList);
    if (bizList.length > 0) {
      setCurrentBusinessState(bizList[0]);
      localStorage.setItem("qb_active_business_id", bizList[0].id.toString());
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setBusinesses([]);
    setCurrentBusinessState(null);
    localStorage.removeItem("qb_active_business_id");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businesses,
        currentBusiness,
        currentRole: currentBusiness?.role || null,
        isLoading,
        setCurrentBusiness,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
