const db = require("../config/db");

class BillingModel {

  static async createInvoice(data) {
    const sql = `
      INSERT INTO invoices 
      (customer_name, customer_phone, subtotal, tax, discount, total, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      data.customer_name,
      data.customer_phone,
      data.subtotal,
      data.tax,
      data.discount,
      data.total,
      data.payment_method
    ]);
    return result.insertId;
  }

  static async addItem(data) {
    const sql = `
      INSERT INTO invoice_items (invoice_id, product_id, quantity, price, total)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      data.invoice_id,
      data.product_id,
      data.quantity,
      data.price,
      data.total
    ]);
  }

  static async getInvoiceItems(invoiceId) {
    const [rows] = await db.query(
      "SELECT * FROM invoice_items WHERE invoice_id = ?",
      [invoiceId]
    );
    return rows;
  }

  static async updateInvoiceTotals(id, totals) {
    const sql = `
      UPDATE invoices 
      SET subtotal = ?, tax = ?, discount = ?, total = ?
      WHERE id = ?
    `;
    await db.query(sql, [
      totals.subtotal,
      totals.tax,
      totals.discount,
      totals.total,
      id
    ]);
  }

  static async getInvoice(id) {
    const [rows] = await db.query("SELECT * FROM invoices WHERE id = ?", [id]);
    return rows[0];
  }
}

module.exports = BillingModel;
