import db from "../config/db";

export class ReportService {
  static async getSalesReport(businessId: number, options: {
    startDate?: string;
    endDate?: string;
  } = {}) {
    let sql = `
      SELECT 
        DATE(i.created_at) AS report_date,
        COUNT(i.id) AS total_orders,
        COALESCE(SUM(i.subtotal), 0) AS subtotal,
        COALESCE(SUM(i.tax_total), 0) AS tax_collected,
        COALESCE(SUM(i.discount_total), 0) AS discount_given,
        COALESCE(SUM(i.grand_total), 0) AS net_revenue
      FROM invoices i
      WHERE i.business_id = ?
    `;
    const params: any[] = [businessId];

    if (options.startDate) {
      sql += " AND DATE(i.created_at) >= ?";
      params.push(options.startDate);
    }
    if (options.endDate) {
      sql += " AND DATE(i.created_at) <= ?";
      params.push(options.endDate);
    }

    sql += " GROUP BY DATE(i.created_at) ORDER BY report_date DESC";

    const [rows]: any = await db.query(sql, params);
    return rows;
  }

  static async getProfitReport(businessId: number, options: {
    startDate?: string;
    endDate?: string;
  } = {}) {
    let sql = `
      SELECT 
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) AS total_units_sold,
        SUM(oi.total_price) AS total_sales,
        SUM(oi.quantity * COALESCE(NULLIF(oi.cost_price, 0), p.cost_price, 0)) AS total_cost,
        SUM(oi.total_price) - SUM(oi.quantity * COALESCE(NULLIF(oi.cost_price, 0), p.cost_price, 0)) AS estimated_profit
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.business_id = ?
    `;
    const params: any[] = [businessId];

    if (options.startDate) {
      sql += " AND DATE(o.created_at) >= ?";
      params.push(options.startDate);
    }
    if (options.endDate) {
      sql += " AND DATE(o.created_at) <= ?";
      params.push(options.endDate);
    }

    sql += " GROUP BY oi.product_id, oi.product_name ORDER BY estimated_profit DESC";

    const [rows]: any = await db.query(sql, params);
    return rows;
  }

  static async getTaxReport(businessId: number) {
    const [rows]: any = await db.query(
      `SELECT 
         tax_rate,
         COUNT(id) AS item_count,
         SUM(tax_amount) AS total_tax_collected,
         SUM(total_price) AS total_sales_amount
       FROM order_items
       WHERE business_id = ?
       GROUP BY tax_rate
       ORDER BY tax_rate ASC`,
      [businessId]
    );
    return rows;
  }

  static generateCsv(data: any[]): string {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }
}
