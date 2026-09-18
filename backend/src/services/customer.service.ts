import db from "../config/db";
import { ICustomer } from "../types";

export class CustomerService {
  static async createCustomer(businessId: number, data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    gstin?: string;
  }): Promise<ICustomer> {
    const cleanPhone = data.phone?.trim() || null;

    if (cleanPhone) {
      const [existing]: any = await db.query(
        "SELECT id FROM customers WHERE business_id = ? AND phone = ? LIMIT 1",
        [businessId, cleanPhone]
      );
      if (existing && existing.length > 0) {
        return await this.getCustomerById(businessId, existing[0].id);
      }
    }

    const [result]: any = await db.query(
      `INSERT INTO customers (business_id, name, phone, email, address, gstin)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        businessId,
        data.name.trim(),
        cleanPhone,
        data.email?.toLowerCase().trim() || null,
        data.address || null,
        data.gstin || null
      ]
    );

    return await this.getCustomerById(businessId, result.insertId);
  }

  static async getCustomers(businessId: number, options: {
    search?: string;
    limit?: number;
    page?: number;
  } = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 50;
    const offset = (page - 1) * limit;

    let sql = "SELECT * FROM customers WHERE business_id = ?";
    const params: any[] = [businessId];

    if (options.search) {
      sql += " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)";
      const term = `%${options.search.trim()}%`;
      params.push(term, term, term);
    }

    const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total");
    const [countRows]: any = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += " ORDER BY id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows]: any = await db.query(sql, params);

    return {
      customers: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getCustomerById(businessId: number, customerId: number): Promise<ICustomer> {
    const [rows]: any = await db.query(
      "SELECT * FROM customers WHERE business_id = ? AND id = ? LIMIT 1",
      [businessId, customerId]
    );

    if (!rows || rows.length === 0) {
      throw { statusCode: 404, message: "Customer not found", code: "CUSTOMER_NOT_FOUND" };
    }

    return rows[0];
  }

  static async getCustomerProfile(businessId: number, customerId: number) {
    const customer = await this.getCustomerById(businessId, customerId);

    const [invoices]: any = await db.query(
      `SELECT id, invoice_number, subtotal, tax_total, discount_total, grand_total, payment_method, payment_status, created_at
       FROM invoices
       WHERE business_id = ? AND customer_id = ?
       ORDER BY id DESC LIMIT 20`,
      [businessId, customerId]
    );

    return {
      ...customer,
      recent_invoices: invoices
    };
  }

  static async updateCustomer(businessId: number, customerId: number, data: Partial<ICustomer>) {
    await this.getCustomerById(businessId, customerId);

    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ["name", "phone", "email", "address", "gstin"];

    for (const key of allowed) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push((data as any)[key]);
      }
    }

    if (fields.length > 0) {
      values.push(businessId, customerId);
      await db.query(`UPDATE customers SET ${fields.join(", ")} WHERE business_id = ? AND id = ?`, values);
    }

    return await this.getCustomerById(businessId, customerId);
  }

  static async deleteCustomer(businessId: number, customerId: number) {
    await this.getCustomerById(businessId, customerId);
    await db.query("DELETE FROM customers WHERE business_id = ? AND id = ?", [businessId, customerId]);
    return { success: true, message: "Customer deleted successfully" };
  }
}
