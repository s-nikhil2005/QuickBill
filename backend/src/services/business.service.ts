import db from "../config/db";
import { IBusiness } from "../types";

export class BusinessService {
  static async createBusiness(userId: number, data: {
    name: string;
    business_type?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    gstin?: string;
    currency?: string;
    invoice_prefix?: string;
    tax_percentage?: number;
    logo_url?: string;
  }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const name = data.name.trim();
      const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

      // 1. Insert Business
      const [bizResult]: any = await connection.query(
        `INSERT INTO businesses 
         (name, slug, business_type, owner_id, phone, email, address, city, state, country, gstin, currency, invoice_prefix, tax_percentage, logo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          slug,
          data.business_type || "General Store",
          userId,
          data.phone || null,
          data.email || null,
          data.address || null,
          data.city || null,
          data.state || null,
          data.country || "India",
          data.gstin || null,
          data.currency || "INR",
          data.invoice_prefix || "QB",
          data.tax_percentage !== undefined ? data.tax_percentage : 18.00,
          data.logo_url || null
        ]
      );

      const businessId = bizResult.insertId;

      // 2. Insert Main Store
      const [storeResult]: any = await connection.query(
        `INSERT INTO stores (business_id, name, code, address, phone, is_main)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
          businessId,
          `${name} - Main Branch`,
          "MAIN",
          data.address || null,
          data.phone || null
        ]
      );

      const storeId = storeResult.insertId;

      // 3. Add User as OWNER in business_members
      await connection.query(
        `INSERT INTO business_members (business_id, user_id, store_id, role, status)
         VALUES (?, ?, ?, 'OWNER', 'ACTIVE')`,
        [businessId, userId, storeId]
      );

      // 4. Create default settings
      await connection.query(
        `INSERT INTO settings 
         (business_id, invoice_prefix, invoice_start_number, tax_percentage, currency, footer_text, terms, logo_url)
         VALUES (?, ?, 1001, ?, ?, 'Thank you for your business!', 'Goods once sold cannot be returned without original receipt.', ?)`,
        [
          businessId,
          data.invoice_prefix || "QB",
          data.tax_percentage !== undefined ? data.tax_percentage : 18.00,
          data.currency || "INR",
          data.logo_url || null
        ]
      );

      // 5. Create default subscription
      await connection.query(
        `INSERT INTO subscriptions (business_id, plan, status, invoice_limit_per_month, product_limit, staff_limit)
         VALUES (?, 'FREE', 'ACTIVE', 100, 500, 2)`,
        [businessId]
      );

      // 6. Seed sample default categories
      const defaultCategories = ["General", "Groceries", "Beverages", "Snacks", "Electronics", "Stationery"];
      for (const cat of defaultCategories) {
        await connection.query(
          "INSERT INTO categories (business_id, name) VALUES (?, ?)",
          [businessId, cat]
        );
      }

      await connection.commit();

      const [bizRows]: any = await db.query("SELECT * FROM businesses WHERE id = ?", [businessId]);
      return bizRows[0];
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getBusiness(businessId: number): Promise<IBusiness> {
    const [rows]: any = await db.query("SELECT * FROM businesses WHERE id = ? LIMIT 1", [businessId]);
    if (!rows || rows.length === 0) {
      throw { statusCode: 404, message: "Business not found", code: "BUSINESS_NOT_FOUND" };
    }
    return rows[0];
  }

  static async updateBusiness(businessId: number, data: Partial<IBusiness>) {
    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      "name", "business_type", "phone", "email", "address", "city",
      "state", "country", "gstin", "currency", "invoice_prefix", "tax_percentage", "logo_url"
    ];

    for (const key of allowed) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push((data as any)[key]);
      }
    }

    if (fields.length === 0) return await this.getBusiness(businessId);

    values.push(businessId);
    await db.query(`UPDATE businesses SET ${fields.join(", ")} WHERE id = ?`, values);

    // Sync invoice prefix and tax in settings if provided
    if (data.invoice_prefix || data.tax_percentage !== undefined || data.currency || data.logo_url) {
      const setFields: string[] = [];
      const setValues: any[] = [];
      if (data.invoice_prefix) { setFields.push("invoice_prefix = ?"); setValues.push(data.invoice_prefix); }
      if (data.tax_percentage !== undefined) { setFields.push("tax_percentage = ?"); setValues.push(data.tax_percentage); }
      if (data.currency) { setFields.push("currency = ?"); setValues.push(data.currency); }
      if (data.logo_url) { setFields.push("logo_url = ?"); setValues.push(data.logo_url); }
      if (setFields.length > 0) {
        setValues.push(businessId);
        await db.query(`UPDATE settings SET ${setFields.join(", ")} WHERE business_id = ?`, setValues);
      }
    }

    return await this.getBusiness(businessId);
  }

  static async getStores(businessId: number) {
    const [rows]: any = await db.query(
      "SELECT * FROM stores WHERE business_id = ? ORDER BY is_main DESC, id ASC",
      [businessId]
    );
    return rows;
  }
}
