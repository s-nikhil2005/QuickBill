import { Request } from "express";

export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "CASHIER" | "STAFF";

export interface IUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface IBusiness {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  owner_id: number;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  gstin?: string | null;
  currency: string;
  invoice_prefix: string;
  tax_percentage: number;
  logo_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IBusinessMember {
  id: number;
  business_id: number;
  user_id: number;
  store_id?: number | null;
  role: UserRole;
  status: "ACTIVE" | "INVITED" | "DEACTIVATED";
  created_at?: Date;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

export interface IStore {
  id: number;
  business_id: number;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  is_main: boolean;
  created_at?: Date;
}

export interface IProduct {
  id: number;
  business_id: number;
  store_id?: number | null;
  category_id?: number | null;
  category_name?: string | null;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  brand?: string | null;
  description?: string | null;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  discount: number;
  current_stock: number;
  min_stock_level: number;
  unit: string;
  image_url?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ICustomer {
  id: number;
  business_id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  total_purchases: number;
  order_count: number;
  outstanding_balance: number;
  last_purchase_date?: Date | null;
  created_at?: Date;
}

export interface IOrderItemInput {
  product_id: number;
  quantity: number;
  discount_amount?: number;
}

export interface ICheckoutInput {
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  items: IOrderItemInput[];
  cart_discount?: number;
  payment_method: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "OTHER";
  payment_status?: "PAID" | "PENDING" | "PARTIALLY_PAID";
  notes?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  businessId?: number;
  membership?: IBusinessMember;
  storeId?: number | null;
}
