import db from "../config/db";

export class SettingsService {
  static async getSettings(businessId: number) {
    const [rows]: any = await db.query(
      "SELECT * FROM settings WHERE business_id = ? LIMIT 1",
      [businessId]
    );

    if (!rows || rows.length === 0) {
      // Create default if missing
      await db.query(
        "INSERT INTO settings (business_id, invoice_prefix, invoice_start_number, tax_percentage, currency) VALUES (?, 'QB', 1001, 18.00, 'INR')",
        [businessId]
      );
      const [newRows]: any = await db.query("SELECT * FROM settings WHERE business_id = ? LIMIT 1", [businessId]);
      return newRows[0];
    }

    return rows[0];
  }

  static async updateSettings(businessId: number, data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = [
      "invoice_prefix", "invoice_start_number", "tax_percentage",
      "currency", "footer_text", "terms", "logo_url"
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(businessId);
      await db.query(`UPDATE settings SET ${fields.join(", ")} WHERE business_id = ?`, values);
    }

    return await this.getSettings(businessId);
  }

  static async getSubscription(businessId: number) {
    const [subRows]: any = await db.query(
      "SELECT * FROM subscriptions WHERE business_id = ? LIMIT 1",
      [businessId]
    );

    const subscription = subRows.length > 0 ? subRows[0] : {
      plan: "FREE",
      status: "ACTIVE",
      invoice_limit_per_month: 100,
      product_limit: 500,
      staff_limit: 2
    };

    // Current usage
    const [usage]: any = await db.query(
      `SELECT 
         (SELECT COUNT(*) FROM products WHERE business_id = ? AND is_active = 1) AS products_count,
         (SELECT COUNT(*) FROM invoices WHERE business_id = ? AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())) AS month_invoices_count,
         (SELECT COUNT(*) FROM business_members WHERE business_id = ? AND status = 'ACTIVE') AS staff_count`,
      [businessId, businessId, businessId]
    );

    return {
      subscription,
      usage: {
        products_count: usage[0].products_count,
        month_invoices_count: usage[0].month_invoices_count,
        staff_count: usage[0].staff_count
      }
    };
  }
}
