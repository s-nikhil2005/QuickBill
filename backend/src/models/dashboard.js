const db = require("../config/db");

class DashboardModel {

  // --------------------------------------------------------
  // 1. TOTAL SALES (Sum of all invoice totals)
  // --------------------------------------------------------
  static async getTotalSales() {
    const sql = `SELECT SUM(total) AS total_sales FROM invoices`;
    const [rows] = await db.query(sql);
    return rows[0].total_sales || 0;
  }

  // --------------------------------------------------------
  // 2. TOTAL INVOICES
  // --------------------------------------------------------
  static async getTotalInvoices() {
    const sql = `SELECT COUNT(*) AS total_invoices FROM invoices`;
    const [rows] = await db.query(sql);
    return rows[0].total_invoices || 0;
  }

  // --------------------------------------------------------
  // 3. TOTAL CUSTOMERS
  // --------------------------------------------------------
  static async getTotalCustomers() {
    const sql = `SELECT COUNT(*) AS total_customers FROM customers`;
    const [rows] = await db.query(sql);
    return rows[0].total_customers || 0;
  }

  // --------------------------------------------------------
  // 4. LOW STOCK PRODUCTS (stock < 10)
  // --------------------------------------------------------
  static async getLowStock() {
    const sql = `
      SELECT id, name, stock
      FROM products
      WHERE stock < 10
      ORDER BY stock ASC
    `;
    const [rows] = await db.query(sql);
    return rows;
  }

  // --------------------------------------------------------
  // 5. TOP SELLING PRODUCTS
  // --------------------------------------------------------
  static async getTopProducts() {
    const sql = `
      SELECT 
        p.id,
        p.name,
        SUM(ii.quantity) AS total_sold
      FROM invoice_items ii
      JOIN products p ON p.id = ii.product_id
      GROUP BY ii.product_id
      ORDER BY total_sold DESC
      LIMIT 5
    `;
    const [rows] = await db.query(sql);
    return rows;
  }

  // --------------------------------------------------------
  // 6. TODAY'S REVENUE (Daily Sales)
  // --------------------------------------------------------
  static async getDailyRevenue() {
    const sql = `
      SELECT SUM(total) AS today_sales
      FROM invoices
      WHERE DATE(created_at) = CURDATE()
    `;
    const [rows] = await db.query(sql);
    return rows[0].today_sales || 0;
  }

  // --------------------------------------------------------
  // 7. MONTHLY SALES REPORT (Graph)
  // --------------------------------------------------------
  static async getMonthlySales() {
    const sql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(total) AS sales
      FROM invoices
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    const [rows] = await db.query(sql);
    return rows;
  }

  // --------------------------------------------------------
  // 8. PAYMENT SUMMARY (Cash / Card / UPI)
  // --------------------------------------------------------
  static async getPaymentSummary() {
    const sql = `
      SELECT 
        payment_method,
        COUNT(*) AS count,
        SUM(total) AS amount
      FROM invoices
      GROUP BY payment_method
    `;
    const [rows] = await db.query(sql);
    return rows;
  }

  // --------------------------------------------------------
  // 9. STOCK SUMMARY (Total products, stock count, value)
  // --------------------------------------------------------
  static async getStockSummary() {
    const sql = `
      SELECT
        COUNT(*) AS total_products,
        SUM(stock) AS total_stock,
        SUM(stock * price) AS stock_value
      FROM products
    `;
    const [rows] = await db.query(sql);
    return rows[0];
  }

}

module.exports = DashboardModel;
