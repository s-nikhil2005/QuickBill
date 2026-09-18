import db from "../config/db";

export class DashboardService {
  static async getOverview(businessId: number) {
    // 1. Today's metrics
    const [todayRows]: any = await db.query(
      `SELECT 
         COALESCE(SUM(grand_total), 0) AS today_revenue,
         COUNT(id) AS today_orders
       FROM invoices
       WHERE business_id = ? AND DATE(created_at) = CURDATE()`,
      [businessId]
    );

    // 2. Total metrics
    const [totalsRows]: any = await db.query(
      `SELECT 
         (SELECT COUNT(*) FROM customers WHERE business_id = ?) AS total_customers,
         (SELECT COUNT(*) FROM products WHERE business_id = ? AND is_active = 1) AS total_products,
         (SELECT COUNT(*) FROM products WHERE business_id = ? AND is_active = 1 AND current_stock <= min_stock_level) AS low_stock_count,
         (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE business_id = ?) AS total_revenue,
         (SELECT COUNT(*) FROM invoices WHERE business_id = ?) AS total_orders`,
      [businessId, businessId, businessId, businessId, businessId]
    );

    // 3. Sales trend (Last 7 days)
    const [trendRows]: any = await db.query(
      `SELECT 
         DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
         COALESCE(SUM(grand_total), 0) AS revenue,
         COUNT(id) AS orders
       FROM invoices
       WHERE business_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY date ASC`,
      [businessId]
    );

    // 4. Recent Transactions
    const [recentInvoices]: any = await db.query(
      `SELECT id, invoice_number, customer_name, grand_total, payment_method, payment_status, created_at
       FROM invoices
       WHERE business_id = ?
       ORDER BY id DESC LIMIT 6`,
      [businessId]
    );

    // 5. Top Selling Products
    const [topProducts]: any = await db.query(
      `SELECT 
         oi.product_id,
         oi.product_name,
         SUM(oi.quantity) AS units_sold,
         SUM(oi.total_price) AS revenue
       FROM order_items oi
       WHERE oi.business_id = ?
       GROUP BY oi.product_id, oi.product_name
       ORDER BY units_sold DESC LIMIT 5`,
      [businessId]
    );

    // 6. Low stock list
    const [lowStockProducts]: any = await db.query(
      `SELECT id, name, sku, current_stock, min_stock_level, unit
       FROM products
       WHERE business_id = ? AND is_active = 1 AND current_stock <= min_stock_level
       ORDER BY current_stock ASC LIMIT 5`,
      [businessId]
    );

    // 7. Payment method summary
    const [paymentSummary]: any = await db.query(
      `SELECT 
         payment_method,
         COUNT(*) AS count,
         COALESCE(SUM(grand_total), 0) AS amount
       FROM invoices
       WHERE business_id = ?
       GROUP BY payment_method`,
      [businessId]
    );

    return {
      today: {
        revenue: parseFloat(todayRows[0].today_revenue || 0),
        orders: parseInt(todayRows[0].today_orders || 0, 10)
      },
      summary: {
        total_customers: parseInt(totalsRows[0].total_customers || 0, 10),
        total_products: parseInt(totalsRows[0].total_products || 0, 10),
        low_stock_count: parseInt(totalsRows[0].low_stock_count || 0, 10),
        total_revenue: parseFloat(totalsRows[0].total_revenue || 0),
        total_orders: parseInt(totalsRows[0].total_orders || 0, 10)
      },
      sales_trend: trendRows,
      recent_invoices: recentInvoices,
      top_products: topProducts,
      low_stock_products: lowStockProducts,
      payment_summary: paymentSummary
    };
  }
}
